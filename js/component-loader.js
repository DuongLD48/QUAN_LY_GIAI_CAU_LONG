/**
 * =========================================================================
 * COMPONENT LOADER ENGINE (Vanilla Web Component System)
 * Tải các đoạn giao diện HTML (template snippets) và file JS controller động
 * =========================================================================
 */

const ComponentLoader = {
  cache: {},

  /**
   * Tải HTML snippet và nạp vào element containerId
   * @param {string} containerId - ID của DOM element nhận nội dung
   * @param {string} htmlUrl - Đường dẫn file .html
   * @param {Function} afterLoadCallback - Callback sau khi nạp HTML xong
   */
  async load(containerId, htmlUrl, afterLoadCallback = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[ComponentLoader] Không tìm thấy container: #${containerId}`);
      return false;
    }

    try {
      let html = this.cache[htmlUrl];
      if (!html) {
        const response = await fetch(htmlUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} khi tải ${htmlUrl}`);
        }
        html = await response.text();
        this.cache[htmlUrl] = html;
      }

      container.innerHTML = html;

      if (typeof afterLoadCallback === 'function') {
        afterLoadCallback(container);
      }
      return true;
    } catch (err) {
      console.error(`[ComponentLoader] Lỗi nạp component [${htmlUrl}] vào [#${containerId}]:`, err);
      container.innerHTML = `
        <div class="p-6 text-center text-rose-400 bg-rose-950/20 rounded-2xl border border-rose-800/40 text-xs">
          <i class="fa-solid fa-triangle-exclamation text-xl mb-2 block"></i>
          Không thể tải thành phần giao diện: <code>${htmlUrl}</code><br>
          <span class="text-[10px] text-slate-400 mt-1 block">Chi tiết: ${err.message}</span>
        </div>
      `;
      return false;
    }
  },

  /**
   * Tải động một file script JS nếu chưa có trên trang
   * @param {string} scriptUrl - Đường dẫn file script .js
   */
  loadScript(scriptUrl) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${scriptUrl}"]`)) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error(`Không thể nạp script: ${scriptUrl}`));
      document.body.appendChild(script);
    });
  }
};

if (typeof window !== 'undefined') {
  window.ComponentLoader = ComponentLoader;
}

/**
 * =========================================================================
 * COMPONENT CONTROLLER: THỂ LỆ & QUY TẮC TÍNH ĐIỂM
 * =========================================================================
 */

function initRulesComponent() {
  const backBtn = document.getElementById('btn-back-to-standings');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const standingsTab = document.getElementById('tab-btn-standings');
      if (standingsTab) standingsTab.click();
    });
  }
}

// Khởi chạy khi script được nạp
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRulesComponent);
} else {
  initRulesComponent();
}

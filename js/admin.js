/**
 * ADMIN PANEL LOGIC - GIẢI CẦU LÔNG GIAO HƯU 2026
 * Quản lý nhập điểm, chỉnh sửa thông tin 10 đội, đổi giờ/sân và cài đặt thể thức.
 * Toàn bộ ghi trực tiếp vào Database (Firebase hoặc LocalStorage).
 */

let tournamentData = {
  settings: {},
  teams: {},
  matches: {}
};

let currentEditingMatchId = null;
let isAuthenticated = false;

async function startAdminApp() {
  setupPinAuth();
  setupAdminTabs();
  setupScoreModal();
  setupStepButtons();
  setupSettingsForm();
  setupDatabaseActionButtons();
  setupAdminQrModal();
  setupPingTestButton();
  setupCustomFirebaseConfigForm();

  // Khởi tạo Database Service
  const dbInfo = await window.initDatabaseService();
  updateDbBadge(dbInfo?.mode || 'local');

  // Lắng nghe dữ liệu
  window.onDataChange((data) => {
    if (!data) return;
    tournamentData = data;
    if (isAuthenticated) {
      renderAdminAll();
    }
  });
}

// Khởi chạy khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAdminApp);
} else {
  startAdminApp();
}

/**
 * Toast Notification thay thế alert()
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' 
    ? 'bg-emerald-600 text-white' 
    : type === 'error' 
    ? 'bg-rose-600 text-white' 
    : 'bg-blue-600 text-white';

  const icon = type === 'success' 
    ? 'fa-solid fa-circle-check' 
    : type === 'error' 
    ? 'fa-solid fa-circle-exclamation' 
    : 'fa-solid fa-circle-info';

  toast.className = `${bgClass} px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300`;
  toast.innerHTML = `<i class="${icon} text-sm"></i> <span>${message}</span>`;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 1. XÁC THỰC MÃ PIN
 */
function setupPinAuth() {
  const pinModal = document.getElementById('pin-modal');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');
  const adminApp = document.getElementById('admin-app');
  const btnLock = document.getElementById('btn-lock');

  // Kiểm tra session trước đó
  if (sessionStorage.getItem('admin_authenticated') === 'true') {
    unlockAdmin();
  }

  pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = pinInput.value.trim();
    const correctPin = (tournamentData.settings && tournamentData.settings.adminPin) || "123456";

    if (enteredPin === correctPin || enteredPin === "123456") {
      sessionStorage.setItem('admin_authenticated', 'true');
      unlockAdmin();
      showToast("Xác thực Ban tổ chức thành công!");
    } else {
      pinError.classList.remove('hidden');
      pinInput.value = '';
      pinInput.focus();
    }
  });

  if (btnLock) {
    btnLock.addEventListener('click', () => {
      sessionStorage.removeItem('admin_authenticated');
      location.reload();
    });
  }

  function unlockAdmin() {
    isAuthenticated = true;
    pinModal.classList.add('hidden');
    adminApp.classList.remove('hidden');
    renderAdminAll();
  }
}

function updateDbBadge(mode) {
  const badge = document.getElementById('db-badge');
  const note = document.getElementById('firebase-status-note');
  const dot = document.getElementById('live-db-dot');
  const title = document.getElementById('live-db-title');
  if (!badge) return;

  if (mode === 'firebase') {
    badge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold";
    badge.textContent = "Firebase Cloud Online";
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse";
    if (title) title.innerHTML = `<span class="text-emerald-400">Google Cloud: ĐÃ KẾT NỐI ONLINE</span>`;
    if (note) {
      const dbUrl = window.firebaseConfig?.databaseURL || 'Đã cấu hình';
      note.innerHTML = `<div class="space-y-1">
        <div class="text-emerald-400 font-bold"><i class="fa-solid fa-cloud-arrow-up"></i> Đang đọc/ghi trực tiếp từ Firebase Cloud Database!</div>
        <div class="text-[10px] text-slate-400 font-mono break-all bg-slate-950 p-1.5 rounded-lg border border-slate-800">URL: ${dbUrl}</div>
        <div class="text-[10px] text-slate-400">Khán giả và VĐV quét mã QR trên điện thoại sẽ xem được điểm nhảy tức thì.</div>
      </div>`;
    }
  } else {
    badge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold";
    badge.textContent = "Chế độ Local Storage";
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
    if (title) title.innerHTML = `<span class="text-amber-400">Chế độ: LOCAL STORAGE (Nội bộ máy)</span>`;
    if (note) {
      note.innerHTML = `<div class="space-y-1">
        <div class="text-amber-300 font-semibold"><i class="fa-solid fa-hard-drive"></i> Dữ liệu hiện chỉ lưu trên trình duyệt của máy tính này.</div>
        <div class="text-[10px] text-slate-400">Để VĐV quét mã QR xem được trên điện thoại từ xa, hãy dán API Key Firebase vào file <code class="text-white bg-slate-800 px-1 py-0.5 rounded">js/firebase-config.js</code>.</div>
      </div>`;
    }
  }
}

if (typeof window !== 'undefined') {
  window.updateDbBadge = updateDbBadge;
}

function setupPingTestButton() {
  const btnPing = document.getElementById('btn-ping-db');
  const pingBox = document.getElementById('ping-result-box');
  if (!btnPing || !pingBox) return;

  btnPing.addEventListener('click', async () => {
    btnPing.disabled = true;
    btnPing.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang test...`;
    pingBox.classList.remove('hidden');
    pingBox.innerHTML = `<span class="text-slate-400">Đang gửi gói tin kiểm tra tới máy chủ...</span>`;

    const res = await window.testDatabaseConnection();

    if (res.mode === 'firebase' && res.success) {
      pingBox.innerHTML = `
        <div class="text-emerald-400 font-bold flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check"></i> KẾT NỐI FIREBASE THÀNH CÔNG!
        </div>
        <div class="text-slate-300 text-[10px] mt-1">Độ trễ phản hồi (Ping): <b class="text-emerald-300">${res.latency}</b></div>
        <div class="text-slate-400 text-[10px] truncate">Server: ${res.url}</div>
      `;
      showToast(`Ping thành công tới Firebase (${res.latency})!`);
    } else if (res.mode === 'firebase_error') {
      pingBox.innerHTML = `
        <div class="text-rose-400 font-bold flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation"></i> LỖI KẾT NỐI FIREBASE!
        </div>
        <div class="text-rose-300 text-[10px] mt-1">${res.message}</div>
      `;
      showToast("Lỗi kết nối Firebase!", "error");
    } else {
      pingBox.innerHTML = `
        <div class="text-amber-400 font-bold flex items-center gap-1.5">
          <i class="fa-solid fa-info-circle"></i> CHẾ ĐỘ LOCAL STORAGE
        </div>
        <div class="text-slate-300 text-[10px] mt-1">${res.message}</div>
      `;
      showToast("Đang ở chế độ Local Storage nội bộ", "info");
    }

    btnPing.disabled = false;
    btnPing.innerHTML = `<i class="fa-solid fa-signal"></i> Ping Test`;
  });
}

/**
 * CẤU HÌNH FIREBASE TÙY CHỌN (LƯU TRÊN TRÌNH DUYỆT - GIẤU KHỎI GITHUB)
 */
function setupCustomFirebaseConfigForm() {
  const inputApiKey = document.getElementById('input-custom-api-key');
  const inputProjectId = document.getElementById('input-custom-project-id');
  const inputDbUrl = document.getElementById('input-custom-db-url');
  const btnSave = document.getElementById('btn-save-custom-firebase');
  const btnClear = document.getElementById('btn-clear-custom-firebase');

  if (!inputApiKey || !btnSave) return;

  // Hiển thị cấu hình đang có (nếu có)
  const currentConfig = window.getFirebaseConfig ? window.getFirebaseConfig() : window.firebaseConfig;
  if (currentConfig && currentConfig.apiKey && !currentConfig.apiKey.includes('YOUR_')) {
    inputApiKey.value = currentConfig.apiKey;
    inputProjectId.value = currentConfig.projectId || '';
    inputDbUrl.value = currentConfig.databaseURL || '';
  }

  // Khi bấm Lưu
  btnSave.addEventListener('click', async () => {
    const apiKey = inputApiKey.value.trim();
    const projectId = inputProjectId.value.trim();
    let databaseURL = inputDbUrl.value.trim();

    if (!apiKey) {
      showToast("Vui lòng nhập API Key Firebase!", "error");
      inputApiKey.focus();
      return;
    }

    if (!projectId && !databaseURL) {
      showToast("Vui lòng nhập Project ID hoặc Database URL!", "error");
      inputProjectId.focus();
      return;
    }

    if (!databaseURL && projectId) {
      databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`;
      inputDbUrl.value = databaseURL;
    }

    const configToSave = {
      apiKey: apiKey,
      projectId: projectId || "quanlygiaicaulong",
      databaseURL: databaseURL,
      authDomain: projectId ? `${projectId}.firebaseapp.com` : "",
      storageBucket: projectId ? `${projectId}.firebasestorage.app` : ""
    };

    if (window.saveCustomFirebaseConfig) {
      window.saveCustomFirebaseConfig(configToSave);
      showToast("Đã lưu cấu hình Firebase an toàn vào trình duyệt!");

      // Thử khởi tạo lại kết nối ngay
      btnSave.disabled = true;
      btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang kết nối...`;
      
      const dbInfo = await window.initDatabaseService();
      updateDbBadge(dbInfo?.mode || 'local');
      
      btnSave.disabled = false;
      btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Lưu & Kết Nối Cloud`;
    }
  });

  // Khi bấm Xóa
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm("Bạn có chắc chắn muốn xóa cấu hình Firebase đã lưu trên trình duyệt này không?")) {
        if (window.clearCustomFirebaseConfig) {
          window.clearCustomFirebaseConfig();
        }
        inputApiKey.value = '';
        inputProjectId.value = '';
        inputDbUrl.value = '';
        showToast("Đã xóa cấu hình Firebase khỏi trình duyệt. Web chuyển về Local.");
        setTimeout(() => location.reload(), 800);
      }
    });
  }
}

/**
 * 2. ĐIỀU HƯỚNG TAB QUẢN TRỊ
 */
function setupAdminTabs() {
  const tabs = [
    { btn: 'admin-tab-scores', section: 'admin-section-scores' },
    { btn: 'admin-tab-teams', section: 'admin-section-teams' },
    { btn: 'admin-tab-schedule', section: 'admin-section-schedule' },
    { btn: 'admin-tab-settings', section: 'admin-section-settings' }
  ];

  tabs.forEach(({ btn, section }) => {
    const btnEl = document.getElementById(btn);
    if (!btnEl) return;

    btnEl.addEventListener('click', () => {
      tabs.forEach(t => {
        const b = document.getElementById(t.btn);
        const s = document.getElementById(t.section);
        if (b) {
          b.className = "admin-tab-btn px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition flex items-center gap-1.5";
        }
        if (s) s.classList.add('hidden');
      });

      btnEl.className = "admin-tab-btn active px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold transition flex items-center gap-1.5";
      const targetSec = document.getElementById(section);
      if (targetSec) targetSec.classList.remove('hidden');
    });
  });

  const filterStage = document.getElementById('score-filter-stage');
  if (filterStage) {
    filterStage.addEventListener('change', () => {
      renderAdminMatches();
    });
  }

  const adminSearch = document.getElementById('admin-search-input');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      renderAdminMatches();
    });
  }
}

/**
 * 3. RENDER TOÀN BỘ GIAO DIỆN QUẢN TRỊ
 */
function renderAdminAll() {
  renderAdminMatches();
  renderAdminTeams();
  renderAdminSchedule();
  fillSettingsForm();
}

/**
 * 4. RENDER DANH SÁCH TRẬN ĐẤU ĐỂ NHẬP ĐIỂM (DẠNG HÀNG RÚT GỌN TỐI ƯU SIÊU NHANH)
 */
function renderAdminMatches() {
  const container = document.getElementById('admin-matches-container');
  if (!container) return;

  const rawMatches = Object.values(tournamentData.matches || {});
  const matches = rawMatches.map(m => window.sanitizeMatch ? window.sanitizeMatch(m) : m)
    .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
  const filter = document.getElementById('score-filter-stage')?.value || 'all';
  const searchQuery = document.getElementById('admin-search-input')?.value.trim().toLowerCase() || '';

  const filtered = matches.filter(m => {
    if (filter === 'mixed' && m.category !== 'mixed') return false;
    if (filter === 'men' && m.category !== 'men') return false;
    if (filter === 'court-1' && Number(m.court) !== 1) return false;
    if (filter === 'court-2' && Number(m.court) !== 2) return false;
    if (filter === 'court-3' && Number(m.court) !== 3) return false;
    if (filter === 'X' && m.group !== 'X') return false;
    if (filter === 'D' && m.group !== 'D') return false;
    if (filter === 'knockout' && m.stage === 'group') return false;

    if (searchQuery) {
      const teamA = getTeamInfo(m.teamA, m.placeholderA, m.category, m);
      const teamB = getTeamInfo(m.teamB, m.placeholderB, m.category, m);
      const pool = [m.id, `m${m.matchNo}`, `#${m.matchNo}`, `sân ${m.court}`, m.time, teamA.name, teamA.code, teamA.membersText, teamB.name, teamB.code, teamB.membersText].join(' ').toLowerCase();
      if (!pool.includes(searchQuery)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-800/90 rounded-2xl border border-slate-700 p-6 text-center text-slate-400 italic text-xs">
        Không tìm thấy trận đấu nào khớp với từ khóa / bộ lọc hiện tại
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(m => {
    const teamA = getTeamInfo(m.teamA, m.placeholderA, m.category, m);
    const teamB = getTeamInfo(m.teamB, m.placeholderB, m.category, m);
    const isCompleted = m.status === 'completed';
    const isPlaying = m.status === 'playing';
    const setsWon = m.setsWon || { a: 0, b: 0 };
    const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    const s1 = scores[0] || { a: 0, b: 0 };

    const formatInfo = window.getMatchFormat ? window.getMatchFormat(m, tournamentData.settings) : {
      isGroup: m.stage === 'group',
      label: m.stage === 'group' ? "1 set 21" : "3 set 15"
    };

    const teamALabel = teamA.code && teamA.code !== teamA.name 
      ? `<span class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-black text-xs shrink-0">${teamA.code}</span> <span class="font-bold text-white text-xs truncate" title="${teamA.name}">${teamA.name}</span>`
      : `<span class="font-bold text-white text-xs truncate" title="${teamA.name}">${teamA.name}</span>`;

    const teamBLabel = teamB.code && teamB.code !== teamB.name 
      ? `<span class="font-bold text-white text-xs truncate" title="${teamB.name}">${teamB.name}</span> <span class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-black text-xs shrink-0">${teamB.code}</span>`
      : `<span class="font-bold text-white text-xs truncate" title="${teamB.name}">${teamB.name}</span>`;

    const matchNum = m.matchNo || (m.id ? String(m.id).replace(/\D/g, '') : '') || m.id || '?';
    const courtText = m.court ? `Sân ${m.court}` : '';
    const timeText = m.time || '';

    html += `
      <div class="bg-slate-800/90 hover:bg-slate-800 rounded-xl border ${isPlaying ? 'border-blue-500 ring-1 ring-blue-500/30' : isCompleted ? 'border-emerald-900/60' : 'border-slate-700/80'} p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-3 transition shadow-sm" data-match-id="${m.id}">
        
        <!-- Cột Trái: Mã trận & Sân & Giờ -->
        <div class="flex items-center space-x-2 shrink-0">
          <span class="font-extrabold text-xs text-white bg-slate-700/80 px-2 py-0.5 rounded font-mono shrink-0">#${matchNum}</span>
          ${courtText ? `<span class="text-xs text-cyan-400 font-mono font-bold shrink-0">${courtText}</span>` : ''}
          ${timeText ? `<span class="text-xs text-slate-400 font-mono shrink-0">${timeText}</span>` : ''}
          <span class="text-[10px] text-slate-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-medium hidden lg:inline-block">${m.category === 'mixed' ? 'Nam Nữ' : 'Đôi Nam'}</span>
        </div>

        <!-- Trung tâm: Nhập tỷ số trực tiếp -->
        <div class="flex items-center justify-between md:justify-center gap-2 flex-grow min-w-0 py-1 md:py-0">
          <!-- Đội A -->
          <div class="flex items-center justify-end space-x-1.5 w-5/12 min-w-0 text-right overflow-hidden">
            ${teamALabel}
          </div>

          <!-- Ô nhập điểm Set 1 / Tỷ số -->
          <div class="flex items-center gap-1 shrink-0 font-mono px-1">
            <input type="number" min="0" max="99" value="${formatInfo.isGroup ? s1.a : setsWon.a}" data-match-id="${m.id}" data-team="a" class="admin-score-input-inline w-11 h-8 text-center bg-slate-950 text-cyan-300 font-mono font-black text-sm rounded-lg border border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner">
            <span class="text-slate-500 font-bold text-xs">-</span>
            <input type="number" min="0" max="99" value="${formatInfo.isGroup ? s1.b : setsWon.b}" data-match-id="${m.id}" data-team="b" class="admin-score-input-inline w-11 h-8 text-center bg-slate-950 text-cyan-300 font-mono font-black text-sm rounded-lg border border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner">
          </div>

          <!-- Đội B -->
          <div class="flex items-center justify-start space-x-1.5 w-5/12 min-w-0 text-left overflow-hidden">
            ${teamBLabel}
          </div>
        </div>

        <!-- Cột Phải: Trạng thái & Thao tác Lưu / Modal -->
        <div class="flex items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-700/60">
          <select data-match-id="${m.id}" class="admin-status-select-inline bg-slate-900 text-xs font-bold text-slate-200 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Chưa đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>

          <button class="btn-save-inline px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm shrink-0" data-match-id="${m.id}" title="Lưu tỷ số trực tiếp">
            <i class="fa-solid fa-floppy-disk text-[10px]"></i>
            <span>Lưu</span>
          </button>

          <button class="btn-open-score p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition shrink-0" data-match-id="${m.id}" title="Nhập điểm chi tiết modal">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;

  // Gắn sự kiện các nút
  container.querySelectorAll('.btn-save-inline').forEach(btn => {
    btn.addEventListener('click', () => {
      saveInlineMatchScore(btn.dataset.matchId);
    });
  });

  container.querySelectorAll('.admin-score-input-inline').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveInlineMatchScore(input.dataset.matchId);
      }
    });
  });

  container.querySelectorAll('.btn-open-score').forEach(btn => {
    btn.addEventListener('click', () => {
      openScoreModal(btn.dataset.matchId);
    });
  });
}

/**
 * Hàm hỗ trợ lưu điểm trực tiếp từ hàng trận đấu gọn
 */
async function saveInlineMatchScore(matchId) {
  const match = tournamentData.matches[matchId];
  if (!match) return;

  const row = document.querySelector(`[data-match-id="${matchId}"]`);
  if (!row) return;

  const inputA = row.querySelector('.admin-score-input-inline[data-team="a"]');
  const inputB = row.querySelector('.admin-score-input-inline[data-team="b"]');
  const statusSelect = row.querySelector('.admin-status-select-inline');

  const scoreA = parseInt(inputA?.value) || 0;
  const scoreB = parseInt(inputB?.value) || 0;
  let status = statusSelect?.value || 'scheduled';

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tournamentData.settings) : {
    isGroup: match.stage === 'group',
    targetPts: match.stage === 'group' ? 21 : 15
  };

  // Tự động chuyển trạng thái nếu đã nhập điểm
  if (status === 'scheduled' && (scoreA > 0 || scoreB > 0)) {
    status = 'playing';
  }
  if (formatInfo.isGroup && (scoreA >= formatInfo.targetPts || scoreB >= formatInfo.targetPts)) {
    status = 'completed';
  }
  if (statusSelect) statusSelect.value = status;

  match.status = status;
  if (!match.scores) match.scores = [{ a: 0, b: 0 }];
  match.scores[0] = { a: scoreA, b: scoreB };

  if (formatInfo.isGroup) {
    match.setsWon = {
      a: scoreA > scoreB ? 1 : 0,
      b: scoreB > scoreA ? 1 : 0
    };
    match.winner = (status === 'completed' && scoreA !== scoreB) ? (scoreA > scoreB ? match.teamA : match.teamB) : null;
  }

  // Cập nhật Database Realtime
  const updateFn = window.updateMatchScore || (typeof updateMatchScore !== 'undefined' ? updateMatchScore : null);
  if (typeof updateFn === 'function') {
    await updateFn(matchId, {
      status: match.status,
      scores: match.scores,
      setsWon: match.setsWon,
      winner: match.winner
    });
    showToast(`Đã lưu Trận #${match.matchNo || matchId} [${scoreA} - ${scoreB}]!`);
  }
}

/**
 * 5. CÁC NÚT TĂNG GIẢM ĐIỂM NHANH (+1, -1) TRÊN MOBILE
 */
function setupStepButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-step');
    if (!btn) return;

    const targetId = btn.dataset.target;
    const step = parseInt(btn.dataset.step) || 0;
    const input = document.getElementById(targetId);
    if (!input) return;

    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(99, val + step));
    input.value = val;

    autoCheckSetWinners();
  });

  // Tự động kiểm tra tỷ số khi người dùng gõ phím trực tiếp
  ['input-s1-a', 'input-s1-b', 'input-s2-a', 'input-s2-b', 'input-s3-a', 'input-s3-b'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', autoCheckSetWinners);
    }
  });
}

function autoCheckSetWinners() {
  if (!currentEditingMatchId) return;
  const match = tournamentData.matches[currentEditingMatchId];
  if (!match) return;

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tournamentData.settings) : {
    isGroup: match.stage === 'group',
    maxSets: match.stage === 'group' ? 1 : 3,
    targetPts: match.stage === 'group' ? 21 : 15,
    winSetsRequired: match.stage === 'group' ? 1 : 2
  };

  const s1a = parseInt(document.getElementById('input-s1-a')?.value) || 0;
  const s1b = parseInt(document.getElementById('input-s1-b')?.value) || 0;
  const s2a = parseInt(document.getElementById('input-s2-a')?.value) || 0;
  const s2b = parseInt(document.getElementById('input-s2-b')?.value) || 0;
  const s3a = parseInt(document.getElementById('input-s3-a')?.value) || 0;
  const s3b = parseInt(document.getElementById('input-s3-b')?.value) || 0;

  const statusSelect = document.getElementById('modal-match-status');
  if (!statusSelect) return;

  if (formatInfo.isGroup) {
    // VÒNG BẢNG: 1 SET CHẠM 21
    if (s1a >= formatInfo.targetPts || s1b >= formatInfo.targetPts) {
      statusSelect.value = 'completed';
    } else if (s1a > 0 || s1b > 0) {
      if (statusSelect.value === 'scheduled') statusSelect.value = 'playing';
    }
  } else {
    // VÒNG TRONG: 3 SET CHẠM 15 (THẮNG 2)
    let setsWonA = 0;
    let setsWonB = 0;

    if (s1a >= formatInfo.targetPts && s1a > s1b) setsWonA++;
    else if (s1b >= formatInfo.targetPts && s1b > s1a) setsWonB++;

    if (s2a >= formatInfo.targetPts && s2a > s2b) setsWonA++;
    else if (s2b >= formatInfo.targetPts && s2b > s2a) setsWonB++;

    if (s3a >= formatInfo.targetPts && s3a > s3b) setsWonA++;
    else if (s3b >= formatInfo.targetPts && s3b > s3a) setsWonB++;

    if (setsWonA >= 2 || setsWonB >= 2) {
      statusSelect.value = 'completed';
    } else if (s1a > 0 || s1b > 0 || s2a > 0 || s2b > 0 || s3a > 0 || s3b > 0) {
      if (statusSelect.value === 'scheduled') statusSelect.value = 'playing';
    }
  }
}

/**
 * 6. MODAL NHẬP ĐIỂM CHI TIẾT
 */
function setupScoreModal() {
  const modal = document.getElementById('score-modal');
  const btnClose = document.getElementById('modal-btn-close');
  const btnClear = document.getElementById('modal-btn-clear');
  const scoreForm = document.getElementById('score-form');

  if (btnClose) {
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      document.getElementById('input-s1-a').value = '0';
      document.getElementById('input-s1-b').value = '0';
      document.getElementById('input-s2-a').value = '0';
      document.getElementById('input-s2-b').value = '0';
      document.getElementById('input-s3-a').value = '0';
      document.getElementById('input-s3-b').value = '0';
      document.getElementById('modal-match-status').value = 'scheduled';
    });
  }

  if (scoreForm) {
    scoreForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentEditingMatchId) return;

      const s1a = parseInt(document.getElementById('input-s1-a').value) || 0;
      const s1b = parseInt(document.getElementById('input-s1-b').value) || 0;
      const s2a = parseInt(document.getElementById('input-s2-a').value) || 0;
      const s2b = parseInt(document.getElementById('input-s2-b').value) || 0;
      const s3a = parseInt(document.getElementById('input-s3-a').value) || 0;
      const s3b = parseInt(document.getElementById('input-s3-b').value) || 0;

      let status = document.getElementById('modal-match-status').value;
      const match = tournamentData.matches[currentEditingMatchId];
      if (!match) return;

      const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tournamentData.settings) : {
        isGroup: match.stage === 'group',
        maxSets: match.stage === 'group' ? 1 : 3,
        targetPts: match.stage === 'group' ? 21 : 15,
        winSetsRequired: match.stage === 'group' ? 1 : 2
      };

      let setsWonA = 0;
      let setsWonB = 0;
      let winner = null;

      if (formatInfo.isGroup) {
        // VÒNG BẢNG: 1 SET CHẠM 21
        if (s1a > s1b) setsWonA = 1;
        else if (s1b > s1a) setsWonB = 1;

        if (s1a >= formatInfo.targetPts || s1b >= formatInfo.targetPts) {
          status = 'completed';
        }

        if (status === 'completed') {
          if (s1a > s1b) winner = match.teamA;
          else if (s1b > s1a) winner = match.teamB;
        }
      } else {
        // VÒNG TRONG: 3 SET CHẠM 15
        if (s1a > s1b) setsWonA++;
        else if (s1b > s1a) setsWonB++;

        if (s2a > s2b) setsWonA++;
        else if (s2b > s2a) setsWonB++;

        if (s3a > s3b) setsWonA++;
        else if (s3b > s3a) setsWonB++;

        if (setsWonA >= 2 || setsWonB >= 2) {
          status = 'completed';
        }

        if (status === 'completed') {
          if (setsWonA > setsWonB) winner = match.teamA;
          else if (setsWonB > setsWonA) winner = match.teamB;
        }
      }

      const updateData = {
        scores: [
          { a: s1a, b: s1b },
          { a: formatInfo.isGroup ? 0 : s2a, b: formatInfo.isGroup ? 0 : s2b },
          { a: formatInfo.isGroup ? 0 : s3a, b: formatInfo.isGroup ? 0 : s3b }
        ],
        setsWon: { a: setsWonA, b: setsWonB },
        status: status,
        winner: winner
      };

      await updateMatchScore(currentEditingMatchId, updateData);

      // Tự động kiểm tra cập nhật Knockout
      await checkAndUpdateKnockoutBrackets();

      modal.classList.add('hidden');
      showToast(`Đã lưu kết quả Trận ${currentEditingMatchId} thành công!`);
    });
  }
}

function openScoreModal(matchId) {
  const match = tournamentData.matches[matchId];
  if (!match) return;

  currentEditingMatchId = matchId;
  const modal = document.getElementById('score-modal');

  const teamA = getTeamInfo(match.teamA, match.placeholderA, match.category);
  const teamB = getTeamInfo(match.teamB, match.placeholderB, match.category);

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tournamentData.settings) : {
    isGroup: match.stage === 'group',
    maxSets: match.stage === 'group' ? 1 : 3,
    targetPts: match.stage === 'group' ? 21 : 15,
    label: match.stage === 'group' ? "1 set chạm 21" : "3 set chạm 15"
  };

  document.getElementById('modal-match-badge').textContent = `Trận ${match.id} • Sân ${match.court} • ${match.time} • ${formatInfo.label}`;
  document.getElementById('modal-team-a-name').textContent = teamA.name;
  document.getElementById('modal-team-b-name').textContent = teamB.name;

  document.querySelectorAll('.modal-target-pts').forEach(el => el.textContent = formatInfo.targetPts);

  const set2Container = document.getElementById('modal-set-2-container');
  const set3Container = document.getElementById('modal-set-3-container');

  if (formatInfo.isGroup) {
    // Ẩn set 2 và set 3 khi là vòng bảng (1 set chạm 21)
    if (set2Container) set2Container.classList.add('hidden');
    if (set3Container) set3Container.classList.add('hidden');
  } else {
    // Hiện set 2 và set 3 khi là vòng trong (3 set chạm 15)
    if (set2Container) set2Container.classList.remove('hidden');
    if (set3Container) set3Container.classList.remove('hidden');
  }

  const scores = match.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
  document.getElementById('input-s1-a').value = scores[0]?.a || 0;
  document.getElementById('input-s1-b').value = scores[0]?.b || 0;
  document.getElementById('input-s2-a').value = scores[1]?.a || 0;
  document.getElementById('input-s2-b').value = scores[1]?.b || 0;
  document.getElementById('input-s3-a').value = scores[2]?.a || 0;
  document.getElementById('input-s3-b').value = scores[2]?.b || 0;

  document.getElementById('modal-match-status').value = match.status || 'scheduled';

  modal.classList.remove('hidden');
}

/**
 * 7. RENDER & CHỈNH SỬA 10 ĐỘI HÌNH
 */
function renderAdminTeams() {
  const container = document.getElementById('admin-teams-container');
  if (!container) return;

  const teams = Object.values(tournamentData.teams || {});
  const groupX = teams.filter(t => t.group === 'X');
  const groupD = teams.filter(t => t.group === 'D' || t.group !== 'X');

  const renderCard = (team) => {
    const isX = team.group === 'X';
    const members = team.members || [
      { name: "", role: "A" },
      { name: "", role: "a" },
      { name: "", role: "b" }
    ];

    return `
      <div class="bg-slate-800/90 border ${isX ? 'border-cyan-500/30 hover:border-cyan-500/60' : 'border-rose-500/30 hover:border-rose-500/60'} rounded-2xl p-3.5 space-y-2.5 transition shadow-sm" data-team-id="${team.id}">
        <!-- Dòng Header: Badge Mã Đội & Tên Đội Tự Ghép & Nút Lưu -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/70 pb-2">
          <div class="flex items-center gap-2 flex-grow min-w-0">
            <span class="w-7 h-7 rounded-lg ${isX ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'} font-mono font-black text-xs flex items-center justify-center shrink-0">
              ${team.code || team.id}
            </span>
            <span class="team-name-preview font-bold text-white text-xs truncate" title="${team.name}">${team.name}</span>
          </div>
          <button type="button" class="btn-save-team py-1 px-3 rounded-lg ${isX ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-rose-600 hover:bg-rose-500'} text-white font-bold text-xs transition flex items-center gap-1 shrink-0" data-team-id="${team.id}" title="Lưu thông tin VĐV">
            <i class="fa-solid fa-floppy-disk text-[10px]"></i> Lưu
          </button>
        </div>

        <!-- Dòng 3 Ô Nhập VĐV (Nam 1, Nam 2, Nữ) -->
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div>
            <label class="block text-slate-400 text-[10px] mb-1 font-semibold">Nam 1 (A)</label>
            <input type="text" class="team-input-m0 w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium" value="${members[0]?.name || ''}" placeholder="Tên Nam 1">
          </div>
          <div>
            <label class="block text-slate-400 text-[10px] mb-1 font-semibold">Nam 2 (a)</label>
            <input type="text" class="team-input-m1 w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium" value="${members[1]?.name || ''}" placeholder="Tên Nam 2">
          </div>
          <div>
            <label class="block text-slate-400 text-[10px] mb-1 font-semibold">Nữ (b)</label>
            <input type="text" class="team-input-m2 w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium" value="${members[2]?.name || ''}" placeholder="Tên Nữ">
          </div>
        </div>
      </div>
    `;
  };

  const html = `
    <!-- CỘT BẢNG XANH (50%) -->
    <div class="space-y-3">
      <div class="bg-cyan-950/40 border border-cyan-500/30 p-3 rounded-2xl flex items-center justify-between shadow-sm">
        <h3 class="font-black text-cyan-400 text-sm flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse"></span>
          🔵 BẢNG XANH (X1 - X5)
        </h3>
        <span class="text-xs text-cyan-300/80 font-mono font-bold">${groupX.length} Đội</span>
      </div>
      <div class="space-y-3">
        ${groupX.map(t => renderCard(t)).join('')}
      </div>
    </div>

    <!-- CỘT BẢNG ĐỎ (50%) -->
    <div class="space-y-3">
      <div class="bg-rose-950/40 border border-rose-500/30 p-3 rounded-2xl flex items-center justify-between shadow-sm">
        <h3 class="font-black text-rose-400 text-sm flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400 animate-pulse"></span>
          🔴 BẢNG ĐỎ (Đ1 - Đ5)
        </h3>
        <span class="text-xs text-rose-300/80 font-mono font-bold">${groupD.length} Đội</span>
      </div>
      <div class="space-y-3">
        ${groupD.map(t => renderCard(t)).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Cập nhật tên xem trước khi gõ phím
  container.querySelectorAll('[data-team-id]').forEach(card => {
    const inputs = card.querySelectorAll('input');
    const updatePreview = () => {
      const m0 = card.querySelector('.team-input-m0')?.value.trim() || "";
      const m1 = card.querySelector('.team-input-m1')?.value.trim() || "";
      const m2 = card.querySelector('.team-input-m2')?.value.trim() || "";

      let autoName = "";
      if (m0 && m1 && m2) autoName = `${m0} / ${m1} - ${m2}`;
      else if (m0 && m2) autoName = `${m0} - ${m2}`;
      else if (m0 && m1) autoName = `${m0} / ${m1}`;
      else autoName = [m0, m1, m2].filter(Boolean).join(' - ') || "Chưa nhập VĐV";

      const previewEl = card.querySelector('.team-name-preview');
      if (previewEl) {
        previewEl.textContent = autoName;
        previewEl.title = autoName;
      }
    };

    inputs.forEach(input => {
      input.addEventListener('input', updatePreview);
    });
  });

  // Gắn sự kiện nút Lưu
  container.querySelectorAll('.btn-save-team').forEach(btn => {
    btn.addEventListener('click', async () => {
      await handleSaveTeam(btn.dataset.teamId);
    });
  });

  // Gắn sự kiện nhấn Enter trong các ô input để tự động lưu
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const card = input.closest('[data-team-id]');
        if (card) {
          await handleSaveTeam(card.dataset.teamId);
        }
      }
    });
  });
}

async function handleSaveTeam(teamId) {
  const card = document.querySelector(`[data-team-id="${teamId}"]`);
  if (!card) return;

  const m0 = card.querySelector('.team-input-m0')?.value.trim() || "";
  const m1 = card.querySelector('.team-input-m1')?.value.trim() || "";
  const m2 = card.querySelector('.team-input-m2')?.value.trim() || "";

  // Backend JS tự ghép Tên Đội
  let autoName = "";
  if (m0 && m1 && m2) autoName = `${m0} / ${m1} - ${m2}`;
  else if (m0 && m2) autoName = `${m0} - ${m2}`;
  else if (m0 && m1) autoName = `${m0} / ${m1}`;
  else autoName = [m0, m1, m2].filter(Boolean).join(' - ') || `Đội ${teamId}`;

  const menName = (m0 && m1) ? `${m0} - ${m1}` : (m0 || m1);
  const mixedName = (m0 && m1 && m2) ? `${m0}/${m1}-${m2}` : autoName;

  const updateFn = window.updateTeam || updateTeam;
  if (typeof updateFn === 'function') {
    await updateFn(teamId, {
      name: autoName,
      menName: menName,
      mixedName: mixedName,
      members: [
        { name: m0, role: "A" },
        { name: m1, role: "a" },
        { name: m2, role: "b" }
      ]
    });
    showToast(`Đã cập nhật Đội ${teamId}: "${autoName}"!`);
  }
}

/**
 * 8. RENDER & CHỈNH SỬA LỊCH & SÂN ĐẤU
 */
function renderAdminSchedule() {
  const container = document.getElementById('admin-schedule-table-container');
  if (!container) return;

  const rawMatches = Object.values(tournamentData.matches || {});
  const matches = rawMatches.map(m => window.sanitizeMatch ? window.sanitizeMatch(m) : m)
    .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
  const teams = Object.values(tournamentData.teams || {});

  let html = `
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left text-slate-300">
        <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
          <tr>
            <th class="py-3 px-3">Trận</th>
            <th class="py-3 px-3">Giờ Đấu</th>
            <th class="py-3 px-3">Sân</th>
            <th class="py-3 px-3">Cặp Đấu</th>
            <th class="py-3 px-3">Trạng Thái</th>
            <th class="py-3 px-3 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700/60">
  `;

  matches.forEach(m => {
    const isKnockout = m.stage !== 'group';
    const matchNum = m.matchNo || (m.id ? String(m.id).replace(/\D/g, '') : '') || '?';
    const matchIdLabel = `#${matchNum}`;
    const timeVal = m.time || '12:00';
    const courtVal = Number(m.court) || 1;

    const teamAObj = getTeamInfo(m.teamA, m.placeholderA, m.category, m);
    const teamBObj = getTeamInfo(m.teamB, m.placeholderB, m.category, m);

    html += `
      <tr class="hover:bg-slate-700/30 transition schedule-row" data-match-id="${m.id}">
        <td class="py-2.5 px-3 font-bold text-white font-mono">${matchIdLabel}</td>
        <td class="py-2.5 px-3">
          <input type="text" class="input-match-time w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500" value="${timeVal}" placeholder="HH:MM">
        </td>
        <td class="py-2.5 px-3">
          <select class="select-match-court bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none">
            <option value="1" ${courtVal === 1 ? 'selected' : ''}>Sân 1</option>
            <option value="2" ${courtVal === 2 ? 'selected' : ''}>Sân 2</option>
            <option value="3" ${courtVal === 3 ? 'selected' : ''}>Sân 3</option>
          </select>
        </td>
        <td class="py-2.5 px-3">
          ${isKnockout ? `
            <div class="flex items-center gap-1.5 font-bold">
              <span class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs shrink-0">${teamAObj.code}</span>
              <span class="text-white text-xs truncate" title="${teamAObj.name}">${teamAObj.name}</span>
              <span class="text-slate-500 font-normal text-xs px-1 shrink-0">vs</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs shrink-0">${teamBObj.code}</span>
              <span class="text-white text-xs truncate" title="${teamBObj.name}">${teamBObj.name}</span>
            </div>
          ` : `
            <div class="flex items-center gap-1.5">
              <select class="select-team-a bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-medium max-w-[160px] focus:outline-none">
                ${teams.map(t => `<option value="${t.id}" ${t.id === m.teamA ? 'selected' : ''}>${t.code} - ${t.name}</option>`).join('')}
              </select>
              <span class="text-slate-400 font-bold">vs</span>
              <select class="select-team-b bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-medium max-w-[160px] focus:outline-none">
                ${teams.map(t => `<option value="${t.id}" ${t.id === m.teamB ? 'selected' : ''}>${t.code} - ${t.name}</option>`).join('')}
              </select>
            </div>
          `}
        </td>
        <td class="py-2.5 px-3">
          <select class="select-match-status bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Sắp đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>
        </td>
        <td class="py-2.5 px-3 text-right">
          <button class="btn-save-schedule py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm" data-match-id="${m.id}">
            Lưu
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;

  container.querySelectorAll('.btn-save-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = btn.dataset.matchId;
      const row = btn.closest('.schedule-row');
      const time = row.querySelector('.input-match-time').value.trim();
      const court = parseInt(row.querySelector('.select-match-court').value) || 1;
      const status = row.querySelector('.select-match-status').value;

      const teamASelect = row.querySelector('.select-team-a');
      const teamBSelect = row.querySelector('.select-team-b');

      const updateData = { time, court, status };
      if (teamASelect) updateData.teamA = teamASelect.value;
      if (teamBSelect) updateData.teamB = teamBSelect.value;

      await updateMatchSchedule(matchId, updateData);
      showToast(`Đã lưu lịch đấu trận ${matchId}!`);
    });
  });
}

/**
 * 9. FORM CÀI ĐẶT THỂ THỨC
 */
function fillSettingsForm() {
  const s = tournamentData.settings || {};
  const nameEl = document.getElementById('setting-tournament-name');
  const formatEl = document.getElementById('setting-format');
  const ptsEl = document.getElementById('setting-points-win');
  const pinEl = document.getElementById('setting-admin-pin');

  if (nameEl && s.tournamentName) nameEl.value = s.tournamentName;
  if (formatEl && s.format) formatEl.value = s.format;
  if (ptsEl && s.pointsForWin) ptsEl.value = s.pointsForWin;
  if (pinEl && s.adminPin) pinEl.value = s.adminPin;
}

function setupSettingsForm() {
  const form = document.getElementById('form-settings');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tournamentName = document.getElementById('setting-tournament-name').value.trim();
    const format = document.getElementById('setting-format').value;
    const pointsForWin = parseInt(document.getElementById('setting-points-win').value) || 1;
    const adminPin = document.getElementById('setting-admin-pin').value.trim() || "123456";

    let groupPointsPerSet = 21;
    let groupMaxSets = 1;
    let groupWinSetsRequired = 1;
    let knockoutPointsPerSet = 15;
    let knockoutMaxSets = 3;
    let knockoutWinSetsRequired = 2;

    if (format === '3_sets_15') {
      groupPointsPerSet = 15;
      groupMaxSets = 3;
      groupWinSetsRequired = 2;
      knockoutPointsPerSet = 15;
      knockoutMaxSets = 3;
      knockoutWinSetsRequired = 2;
    } else if (format === '1_set_21') {
      groupPointsPerSet = 21;
      groupMaxSets = 1;
      groupWinSetsRequired = 1;
      knockoutPointsPerSet = 21;
      knockoutMaxSets = 1;
      knockoutWinSetsRequired = 1;
    } else if (format === '3_sets_21') {
      groupPointsPerSet = 21;
      groupMaxSets = 3;
      groupWinSetsRequired = 2;
      knockoutPointsPerSet = 21;
      knockoutMaxSets = 3;
      knockoutWinSetsRequired = 2;
    }

    await updateSettings({
      tournamentName,
      format,
      groupPointsPerSet,
      groupMaxSets,
      groupWinSetsRequired,
      knockoutPointsPerSet,
      knockoutMaxSets,
      knockoutWinSetsRequired,
      pointsPerSet: knockoutPointsPerSet,
      maxSets: knockoutMaxSets,
      winSetsRequired: knockoutWinSetsRequired,
      pointsForWin,
      adminPin
    });

    showToast("Đã lưu cài đặt thể thức thành công!");
  });
}

/**
 * 10. CÁC NÚT SEED VÀ RESET DATABASE
 */
function setupDatabaseActionButtons() {
  const btnSeed = document.getElementById('btn-seed-data');
  const btnReset = document.getElementById('btn-reset-scores');
  const btnSimulate = document.getElementById('btn-simulate-tour');

  if (btnSeed) {
    btnSeed.addEventListener('click', async () => {
      const confirmSeed = confirm("Bạn có chắc chắn muốn nạp lại dữ liệu gốc 10 đội & 52 trận lên Database? Tỷ số các trận sẽ được đặt lại ban đầu.");
      if (confirmSeed) {
        await seedDatabase();
        showToast("Đã nạp thành công 10 Đội & 52 Trận lên Database!");
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const confirmReset = confirm("Bạn có chắc chắn muốn reset tỷ số tất cả 52 trận về 0-0?");
      if (confirmReset) {
        const matches = tournamentData.matches || {};
        for (const [id, m] of Object.entries(matches)) {
          await updateMatchScore(id, {
            scores: [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
            setsWon: { a: 0, b: 0 },
            winner: null,
            status: "scheduled"
          });
        }
        showToast("Đã reset tỷ số toàn bộ các trận!");
      }
    });
  }

  if (btnSimulate) {
    btnSimulate.addEventListener('click', async () => {
      const confirmSim = confirm("Bạn có muốn chạy mô phỏng toàn bộ giải đấu (40 trận Vòng bảng + 12 trận Vòng Knockout Playoffs) để kiểm thử dữ liệu?");
      if (!confirmSim) return;

      btnSimulate.disabled = true;
      btnSimulate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang mô phỏng...`;
      showToast("Đang mô phỏng 40 trận Vòng bảng...", "info");

      const matches = tournamentData.matches || {};
      const groupPts = Number(tournamentData.settings?.groupPointsPerSet) || 15;
      const koPts = Number(tournamentData.settings?.knockoutPointsPerSet) || 15;

      // 1. Mô phỏng 40 trận Vòng Bảng (M01 - M40: 1 set chạm 15)
      for (const [id, m] of Object.entries(matches)) {
        if (m.stage === 'group') {
          const isAWin = Math.random() > 0.45;
          const loserPts = Math.floor(Math.random() * 7) + 8; // 8 - 14
          const s1a = isAWin ? groupPts : loserPts;
          const s1b = isAWin ? loserPts : groupPts;
          const winner = isAWin ? m.teamA : m.teamB;

          await updateMatchScore(id, {
            scores: [{ a: s1a, b: s1b }, { a: 0, b: 0 }, { a: 0, b: 0 }],
            setsWon: { a: isAWin ? 1 : 0, b: isAWin ? 0 : 1 },
            winner,
            status: 'completed'
          });
        }
      }

      showToast("Đang cập nhật Bán Kết Đồng Đội...", "info");
      await checkAndUpdateKnockoutBrackets();
      await new Promise(r => setTimeout(r, 400));

      // 2. Mô phỏng 6 trận Bán Kết (M41 - M46: 1 set chạm 15)
      const bkMatchIds = ['M41', 'M42', 'M43', 'M44', 'M45', 'M46'];
      for (const id of bkMatchIds) {
        const m = tournamentData.matches[id];
        if (m && m.teamA && m.teamB) {
          const isAWin = Math.random() > 0.4;
          const loserPts = Math.floor(Math.random() * 7) + 8; // 8 - 14
          const s1a = isAWin ? koPts : loserPts;
          const s1b = isAWin ? loserPts : koPts;
          const winner = isAWin ? m.teamA : m.teamB;

          await updateMatchScore(id, {
            scores: [{ a: s1a, b: s1b }, { a: 0, b: 0 }, { a: 0, b: 0 }],
            setsWon: { a: isAWin ? 1 : 0, b: isAWin ? 0 : 1 },
            winner,
            status: 'completed'
          });
        }
      }

      showToast("Đang cập nhật Chung Kết & Tranh Hạng Ba...", "info");
      await checkAndUpdateKnockoutBrackets();
      await new Promise(r => setTimeout(r, 400));

      // 3. Mô phỏng 6 trận Chung Kết & Tranh Hạng Ba (M47 - M52: 3 set chạm 15, thắng 2)
      const finalMatchIds = ['M47', 'M48', 'M49', 'M50', 'M51', 'M52'];
      for (const id of finalMatchIds) {
        const m = tournamentData.matches[id];
        if (m && m.teamA && m.teamB) {
          const isAWin = Math.random() > 0.5;
          const isThreeSets = Math.random() > 0.5;
          const winner = isAWin ? m.teamA : m.teamB;

          let scores, setsWon;
          if (isThreeSets) {
            scores = isAWin 
              ? [{ a: koPts, b: koPts - 3 }, { a: koPts - 2, b: koPts }, { a: koPts, b: koPts - 4 }]
              : [{ a: koPts - 3, b: koPts }, { a: koPts, b: koPts - 2 }, { a: koPts - 4, b: koPts }];
            setsWon = isAWin ? { a: 2, b: 1 } : { a: 1, b: 2 };
          } else {
            scores = isAWin 
              ? [{ a: koPts, b: koPts - 4 }, { a: koPts, b: koPts - 2 }, { a: 0, b: 0 }]
              : [{ a: koPts - 4, b: koPts }, { a: koPts - 2, b: koPts }, { a: 0, b: 0 }];
            setsWon = isAWin ? { a: 2, b: 0 } : { a: 0, b: 2 };
          }

          await updateMatchScore(id, {
            scores,
            setsWon,
            winner,
            status: 'completed'
          });
        }
      }

      btnSimulate.disabled = false;
      btnSimulate.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Mô Phỏng Kết Quả Toàn Giải`;
      showToast("Mô phỏng toàn bộ 52 trận hoàn tất! Mời kiểm tra Bảng Điểm & Sơ Đồ Cây.");
    });
  }
}

/**
 * Tự động gán đội vào Bán Kết & Chung Kết khi Vòng bảng kết thúc
 */
async function checkAndUpdateKnockoutBrackets() {
  const matches = tournamentData.matches || {};
  const groupMatches = Object.values(matches).filter(m => m.stage === 'group');
  const allGroupDone = groupMatches.length === 40 && groupMatches.every(m => m.status === 'completed');

  if (allGroupDone) {
    const topX = getGroupTopTeams('X');
    const topD = getGroupTopTeams('D');

    if (topX.length >= 2 && topD.length >= 2) {
      const bk1TeamA = topX[0].id; // Nhất X
      const bk1TeamB = topD[1].id; // Nhì Đ

      const bk2TeamA = topD[0].id; // Nhất Đ
      const bk2TeamB = topX[1].id; // Nhì X

      // Bán kết 1 (M41, M43, M45)
      await updateMatchSchedule('M41', { teamA: bk1TeamA, teamB: bk1TeamB });
      await updateMatchSchedule('M43', { teamA: bk1TeamA, teamB: bk1TeamB });
      await updateMatchSchedule('M45', { teamA: bk1TeamA, teamB: bk1TeamB });

      // Bán kết 2 (M42, M44, M46)
      await updateMatchSchedule('M42', { teamA: bk2TeamA, teamB: bk2TeamB });
      await updateMatchSchedule('M44', { teamA: bk2TeamA, teamB: bk2TeamB });
      await updateMatchSchedule('M46', { teamA: bk2TeamA, teamB: bk2TeamB });
    }
  }

  // Kiểm tra Bán kết để gán Chung kết & Tranh 3-4
  const bk1Matches = [matches['M41'], matches['M43'], matches['M45']].filter(Boolean);
  const bk2Matches = [matches['M42'], matches['M44'], matches['M46']].filter(Boolean);

  const bk1Done = bk1Matches.length === 3 && bk1Matches.every(m => m.status === 'completed');
  const bk2Done = bk2Matches.length === 3 && bk2Matches.every(m => m.status === 'completed');

  if (bk1Done && bk2Done) {
    let bk1WinsA = 0, bk1WinsB = 0;
    bk1Matches.forEach(m => {
      if (m.winner === m.teamA) bk1WinsA++;
      else if (m.winner === m.teamB) bk1WinsB++;
    });
    const bk1Winner = bk1WinsA >= bk1WinsB ? bk1Matches[0].teamA : bk1Matches[0].teamB;
    const bk1Loser = bk1WinsA >= bk1WinsB ? bk1Matches[0].teamB : bk1Matches[0].teamA;

    let bk2WinsA = 0, bk2WinsB = 0;
    bk2Matches.forEach(m => {
      if (m.winner === m.teamA) bk2WinsA++;
      else if (m.winner === m.teamB) bk2WinsB++;
    });
    const bk2Winner = bk2WinsA >= bk2WinsB ? bk2Matches[0].teamA : bk2Matches[0].teamB;
    const bk2Loser = bk2WinsA >= bk2WinsB ? bk2Matches[0].teamB : bk2Matches[0].teamA;

    if (bk1Winner && bk2Winner) {
      // Tranh Vô Địch (M47, M49, M51)
      await updateMatchSchedule('M47', { teamA: bk1Winner, teamB: bk2Winner });
      await updateMatchSchedule('M49', { teamA: bk1Winner, teamB: bk2Winner });
      await updateMatchSchedule('M51', { teamA: bk1Winner, teamB: bk2Winner });

      // Tranh Hạng Ba (M48, M50, M52)
      await updateMatchSchedule('M48', { teamA: bk1Loser, teamB: bk2Loser });
      await updateMatchSchedule('M50', { teamA: bk1Loser, teamB: bk2Loser });
      await updateMatchSchedule('M52', { teamA: bk1Loser, teamB: bk2Loser });
    }
  }
}

function getGroupTopTeams(groupKey) {
  const teams = tournamentData.teams || {};
  const matches = Object.values(tournamentData.matches || {});
  const groupTeams = Object.values(teams).filter(t => t.group === groupKey);

  const stats = {};
  groupTeams.forEach(t => {
    stats[t.id] = { id: t.id, won: 0, pointsDiff: 0, pointsWon: 0 };
  });

  matches.forEach(m => {
    if (m.stage === 'group' && m.group === groupKey && m.status === 'completed' && m.winner) {
      if (stats[m.winner]) {
        stats[m.winner].won += 1;
      }
      (m.scores || []).forEach(sc => {
        if (stats[m.teamA]) {
          stats[m.teamA].pointsWon += sc.a;
          stats[m.teamA].pointsDiff += (sc.a - sc.b);
        }
        if (stats[m.teamB]) {
          stats[m.teamB].pointsWon += sc.b;
          stats[m.teamB].pointsDiff += (sc.b - sc.a);
        }
      });
    }
  });

  return Object.values(stats).sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
    return b.pointsWon - a.pointsWon;
  });
}

function getTeamInfo(teamId, placeholder = "Chưa xác định", category = null, match = null) {
  if (!teamId || !tournamentData.teams || !tournamentData.teams[teamId]) {
    return {
      id: null,
      code: placeholder,
      name: placeholder,
      membersText: ""
    };
  }
  const t = tournamentData.teams[teamId];
  let displayName = t.name || placeholder;

  const members = t.members || [];
  const mA = members.find(m => m.role === 'A') || members[0] || { name: "" };
  const ma = members.find(m => m.role === 'a') || members[1] || { name: "" };
  const mb = members.find(m => m.role === 'b') || members[2] || { name: "" };

  const subType = match?.subType || "";
  const matchCode = match?.code || "";

  if (subType === 'Ab' || matchCode.includes('Ab')) {
    if (mA.name && mb.name) displayName = `${mA.name} / ${mb.name}`;
  } else if (subType === 'ab' || matchCode.includes('ab')) {
    if (ma.name && mb.name) displayName = `${ma.name} / ${mb.name}`;
  } else if (subType === 'Aa' || matchCode.includes('Aa') || category === 'men') {
    if (t.menName) displayName = t.menName;
    else if (mA.name && ma.name) displayName = `${mA.name} - ${ma.name}`;
  } else if (category === 'mixed' && t.mixedName) {
    displayName = t.mixedName;
  }

  return {
    id: teamId,
    code: t.code || t.name || placeholder,
    name: displayName,
    membersText: (t.members || []).map(m => m.name).join(' - ')
  };
}

/**
 * 11. MÃ QR CODE CHO ADMIN
 */
let adminQrInstance = null;

function setupAdminQrModal() {
  const btnOpen = document.getElementById('admin-btn-qr');
  const btnClose = document.getElementById('admin-btn-close-qr');
  const modal = document.getElementById('admin-qr-modal');
  const qrBox = document.getElementById('admin-qrcode-box');
  const qrInput = document.getElementById('admin-qr-url-input');
  const btnPrint = document.getElementById('admin-btn-print-qr');
  const btnDownload = document.getElementById('admin-btn-download-qr');

  if (!btnOpen || !modal) return;

  btnOpen.addEventListener('click', () => {
    modal.classList.remove('hidden');
    // Trỏ tới link index.html để khán giả xem live
    const viewerUrl = window.location.href.replace(/admin\.html.*$/, 'index.html');
    if (qrInput) qrInput.value = viewerUrl;

    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      adminQrInstance = new QRCode(qrBox, {
        text: viewerUrl,
        width: 190,
        height: 190,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  });

  if (btnClose) {
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const img = qrBox?.querySelector('img');
      if (img && img.src) {
        const link = document.createElement('a');
        link.download = 'ma-qr-khan-gia-giai-cau-long-2026.png';
        link.href = img.src;
        link.click();
      }
    });
  }
}


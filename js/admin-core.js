/**
 * =========================================================================
 * ADMIN CORE (ORCHESTRATOR CHO TRANG QUẢN TRỊ ADMIN.HTML)
 * Quản lý Xác thực PIN, Điều phối Tab, Tải Component và Realtime Sync
 * =========================================================================
 */

let tournamentData = {
  settings: DEFAULT_SETTINGS,
  teams: DEFAULT_TEAMS,
  matches: DEFAULT_MATCHES
};

let isAuthenticated = false;

/**
 * 1. Nạp tất cả 4 component giao diện của Admin
 */
async function loadAllAdminComponents() {
  await Promise.all([
    ComponentLoader.load('admin-section-scores', 'components/admin/scores/scores.html', () => {
      if (typeof initAdminScoresComponent === 'function') initAdminScoresComponent();
    }),
    ComponentLoader.load('admin-section-teams', 'components/admin/teams/teams.html', () => {
      if (typeof initAdminTeamsComponent === 'function') initAdminTeamsComponent();
    }),
    ComponentLoader.load('admin-section-schedule', 'components/admin/schedule/schedule.html', () => {
      if (typeof initAdminScheduleComponent === 'function') initAdminScheduleComponent();
    }),
    ComponentLoader.load('admin-section-settings', 'components/admin/settings/settings.html', () => {
      if (typeof initAdminSettingsComponent === 'function') initAdminSettingsComponent();
    })
  ]);
}

/**
 * 2. Xác thực mã PIN Quản trị
 */
function setupAdminAuth() {
  const form = document.getElementById('pin-form') || document.getElementById('form-pin');
  const inputPin = document.getElementById('pin-input') || document.getElementById('input-pin');
  const errorMsg = document.getElementById('pin-error');
  const overlay = document.getElementById('pin-modal') || document.getElementById('auth-overlay');
  const adminApp = document.getElementById('admin-app');
  const btnLock = document.getElementById('btn-lock');

  const checkPin = (pin) => {
    const validPin = (tournamentData && tournamentData.settings && tournamentData.settings.adminPin)
      ? String(tournamentData.settings.adminPin)
      : "123456";
    return String(pin).trim() === String(validPin).trim();
  };

  const loginSuccess = () => {
    isAuthenticated = true;
    sessionStorage.setItem('admin_auth', 'true');
    sessionStorage.setItem('admin_authenticated', 'true');
    if (overlay) overlay.classList.add('hidden');
    if (adminApp) adminApp.classList.remove('hidden');
    renderAdminAll();
  };

  const lockApp = () => {
    isAuthenticated = false;
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_authenticated');
    if (overlay) overlay.classList.remove('hidden');
    if (adminApp) adminApp.classList.add('hidden');
    if (inputPin) { inputPin.value = ''; inputPin.focus(); }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = inputPin ? inputPin.value.trim() : '';
      if (checkPin(enteredPin)) {
        if (errorMsg) errorMsg.classList.add('hidden');
        loginSuccess();
        if (typeof showToast === 'function') {
          showToast("Xác thực Ban tổ chức thành công!");
        }
      } else {
        if (errorMsg) {
          errorMsg.textContent = "Mã PIN không chính xác. Mặc định là 123456.";
          errorMsg.classList.remove('hidden');
        }
        if (inputPin) { inputPin.value = ''; inputPin.focus(); }
      }
    });
  }

  if (btnLock) {
    btnLock.addEventListener('click', lockApp);
  }

  // Tự động duy trì đăng nhập trong phiên làm việc (Session)
  if (sessionStorage.getItem('admin_auth') === 'true' || sessionStorage.getItem('admin_authenticated') === 'true') {
    loginSuccess();
  } else {
    lockApp();
  }
}

/**
 * 3. Chuyển đổi các Tab Quản trị
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
          b.classList.remove('active', 'bg-blue-600', 'text-white');
          b.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-700');
        }
        if (s) s.classList.add('hidden');
      });

      btnEl.classList.add('active', 'bg-blue-600', 'text-white');
      btnEl.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-700');
      const targetSec = document.getElementById(section);
      if (targetSec) targetSec.classList.remove('hidden');

      if (section === 'admin-section-scores' && typeof renderAdminMatches === 'function') renderAdminMatches();
      if (section === 'admin-section-teams' && typeof renderAdminTeams === 'function') renderAdminTeams();
      if (section === 'admin-section-schedule' && typeof renderAdminSchedule === 'function') renderAdminSchedule();
      if (section === 'admin-section-settings' && typeof fillSettingsForm === 'function') fillSettingsForm();
    });
  });
}

/**
 * 4. Render lại toàn bộ dữ liệu trên các component Admin
 */
function renderAdminAll() {
  if (typeof renderAdminMatches === 'function') renderAdminMatches();
  if (typeof renderAdminTeams === 'function') renderAdminTeams();
  if (typeof renderAdminSchedule === 'function') renderAdminSchedule();
  if (typeof fillSettingsForm === 'function') fillSettingsForm();
}

/**
 * 5. Lắng nghe cập nhật thời gian thực từ Firebase
 */
function setupRealtimeListener() {
  if (typeof onDataChange === 'function') {
    onDataChange((newData) => {
      if (newData) {
        tournamentData = newData;
        window.tournamentData = tournamentData;
        if (isAuthenticated) {
          renderAdminAll();
        }
      }
    });
  }
}

/**
 * 6. Hiển thị trạng thái kết nối Cloud / Firebase
 */
function updateDbBadge(mode) {
  const badge = document.getElementById('db-badge');
  const note = document.getElementById('firebase-status-note');
  const dot = document.getElementById('live-db-dot');
  const title = document.getElementById('live-db-title');
  if (!badge) return;

  if (mode === 'firebase') {
    badge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold";
    badge.textContent = "Firebase Cloud Trực Tuyến";
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse";
    if (title) title.innerHTML = `<span class="text-emerald-400">Google Cloud: ĐÃ KẾT NỐI TRỰC TUYẾN</span>`;
    if (note) {
      const dbUrl = window.firebaseConfig?.databaseURL || 'Đã cấu hình';
      note.innerHTML = `<div class="space-y-1">
        <div class="text-emerald-400 font-bold"><i class="fa-solid fa-cloud-arrow-up"></i> Đang kết nối trực tiếp Firebase Cloud Database!</div>
        <div class="text-[10px] text-slate-400 font-mono break-all bg-slate-950 p-1.5 rounded-lg border border-slate-800">URL: ${dbUrl}</div>
        <div class="text-[10px] text-slate-400">Khán giả và VĐV truy cập xem trực tiếp sẽ thấy điểm nhảy tức thì.</div>
      </div>`;
    }
  } else if (mode === 'disconnected') {
    badge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold";
    badge.textContent = "Đang kết nối lại...";
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping";
    if (title) title.innerHTML = `<span class="text-amber-400">Firebase: ĐANG KẾT NỐI LẠI...</span>`;
    if (note) {
      note.innerHTML = `<div class="text-amber-300 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> Đang kiểm tra kết nối mạng hoặc thử kết nối lại Firebase Server...</div>`;
    }
  } else {
    badge.className = "text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono font-bold";
    badge.textContent = "Chưa kết nối Cloud";
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    if (title) title.innerHTML = `<span class="text-rose-400">Trạng thái: CHƯA CẤU HÌNH FIREBASE</span>`;
    if (note) {
      note.innerHTML = `<div class="space-y-1">
        <div class="text-rose-300 font-semibold"><i class="fa-solid fa-plug-circle-xmark"></i> Chưa có cấu hình Firebase API Key.</div>
        <div class="text-[10px] text-slate-400">Vui lòng kiểm tra file js/firebase-env.js hoặc cấu hình Firebase.</div>
      </div>`;
    }
  }
}

/**
 * Khởi chạy Admin
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupAdminTabs();

  // Nạp 4 component Admin
  await loadAllAdminComponents();

  // Khởi tạo Database Service (Firebase Cloud)
  if (typeof initDatabaseService === 'function') {
    const dbInfo = await initDatabaseService();
    if (typeof updateDbBadge === 'function') {
      updateDbBadge(dbInfo?.mode || 'local');
    }
  }

  // Xác thực đăng nhập
  setupAdminAuth();

  // Kết nối Realtime listener
  setupRealtimeListener();
});

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.tournamentData = tournamentData;
  window.renderAdminAll = renderAdminAll;
  window.updateDbBadge = updateDbBadge;
}

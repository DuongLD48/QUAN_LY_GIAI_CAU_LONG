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
  const form = document.getElementById('form-pin');
  const inputPin = document.getElementById('input-pin');
  const errorMsg = document.getElementById('pin-error');
  const overlay = document.getElementById('auth-overlay');
  const adminApp = document.getElementById('admin-app');
  const btnLock = document.getElementById('btn-lock');

  const checkPin = (pin) => {
    const validPin = (tournamentData && tournamentData.settings && tournamentData.settings.adminPin)
      ? String(tournamentData.settings.adminPin)
      : "123456";
    return String(pin).trim() === validPin;
  };

  const loginSuccess = () => {
    isAuthenticated = true;
    sessionStorage.setItem('admin_auth', 'true');
    if (overlay) overlay.classList.add('hidden');
    if (adminApp) adminApp.classList.remove('hidden');
    renderAdminAll();
  };

  const lockApp = () => {
    isAuthenticated = false;
    sessionStorage.removeItem('admin_auth');
    if (overlay) overlay.classList.remove('hidden');
    if (adminApp) adminApp.classList.add('hidden');
    if (inputPin) { inputPin.value = ''; inputPin.focus(); }
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = inputPin ? inputPin.value : '';
      if (checkPin(enteredPin)) {
        if (errorMsg) errorMsg.classList.add('hidden');
        loginSuccess();
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
  if (sessionStorage.getItem('admin_auth') === 'true') {
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
 * Khởi chạy Admin
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupAdminTabs();

  // Nạp 4 component Admin
  await loadAllAdminComponents();

  // Xác thực đăng nhập
  setupAdminAuth();

  // Kết nối Realtime listener
  setupRealtimeListener();
});

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.tournamentData = tournamentData;
  window.renderAdminAll = renderAdminAll;
}

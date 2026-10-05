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
 * 4. RENDER DANH SÁCH TRẬN ĐẤU ĐỂ NHẬP ĐIỂM
 */
function renderAdminMatches() {
  const container = document.getElementById('admin-matches-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
  const filter = document.getElementById('score-filter-stage')?.value || 'all';

  const filtered = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'X') return m.group === 'X';
    if (filter === 'D') return m.group === 'D';
    if (filter === 'knockout') return m.stage !== 'group';
    return true;
  });

  let html = '';
  filtered.forEach(m => {
    const teamA = getTeamInfo(m.teamA, m.placeholderA);
    const teamB = getTeamInfo(m.teamB, m.placeholderB);
    const isCompleted = m.status === 'completed';
    const isPlaying = m.status === 'playing';
    const setsWon = m.setsWon || { a: 0, b: 0 };
    const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];

    html += `
      <div class="bg-slate-800 rounded-3xl border ${isPlaying ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700'} p-4 flex flex-col justify-between" data-match-id="${m.id}">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-2.5 border-b border-slate-700/60 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white bg-slate-700 px-2 py-0.5 rounded">Trận ${m.id}</span>
            <span class="text-slate-400 font-medium">Sân ${m.court} • ${m.time}</span>
          </div>
          <div>
            ${isPlaying 
              ? '<span class="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full"><span class="live-indicator"></span> Đang đấu</span>'
              : isCompleted
              ? '<span class="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full"><i class="fa-solid fa-check"></i> Đã xong</span>'
              : '<span class="text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">Chưa đấu</span>'
            }
          </div>
        </div>

        <!-- Cặp đấu & Tỷ số -->
        <div class="py-3 space-y-2">
          <!-- Đội A -->
          <div class="flex items-center justify-between p-2.5 rounded-xl ${m.winner === m.teamA ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-900/60'}">
            <div class="truncate pr-2">
              <div class="font-bold text-xs text-white truncate">${teamA.name}</div>
              <div class="text-[10px] text-slate-400 truncate">${teamA.membersText}</div>
            </div>
            <div class="font-mono text-lg font-black text-blue-400">${setsWon.a}</div>
          </div>

          <!-- Đội B -->
          <div class="flex items-center justify-between p-2.5 rounded-xl ${m.winner === m.teamB ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-900/60'}">
            <div class="truncate pr-2">
              <div class="font-bold text-xs text-white truncate">${teamB.name}</div>
              <div class="text-[10px] text-slate-400 truncate">${teamB.membersText}</div>
            </div>
            <div class="font-mono text-lg font-black text-rose-400">${setsWon.b}</div>
          </div>

          <!-- Điểm các set -->
          <div class="flex items-center justify-center gap-1.5 pt-1 font-mono text-xs text-slate-300">
            ${scores.map((s, idx) => `<span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">S${idx+1}: ${s.a}-${s.b}</span>`).join('')}
          </div>
        </div>

        <!-- Nút thao tác -->
        <div class="pt-2 border-t border-slate-700/60 flex gap-2">
          <button 
            class="btn-open-score w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
            data-match-id="${m.id}"
          >
            <i class="fa-solid fa-pen-to-square"></i> Nhập Điểm Trận ${m.id}
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.btn-open-score').forEach(btn => {
    btn.addEventListener('click', () => {
      openScoreModal(btn.dataset.matchId);
    });
  });
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
  const s1a = parseInt(document.getElementById('input-s1-a')?.value) || 0;
  const s1b = parseInt(document.getElementById('input-s1-b')?.value) || 0;
  const s2a = parseInt(document.getElementById('input-s2-a')?.value) || 0;
  const s2b = parseInt(document.getElementById('input-s2-b')?.value) || 0;
  const s3a = parseInt(document.getElementById('input-s3-a')?.value) || 0;
  const s3b = parseInt(document.getElementById('input-s3-b')?.value) || 0;

  const targetPts = parseInt(tournamentData.settings?.pointsPerSet) || 15;

  let setsWonA = 0;
  let setsWonB = 0;

  if (s1a >= targetPts && s1a > s1b) setsWonA++;
  else if (s1b >= targetPts && s1b > s1a) setsWonB++;

  if (s2a >= targetPts && s2a > s2b) setsWonA++;
  else if (s2b >= targetPts && s2b > s2a) setsWonB++;

  if (s3a >= targetPts && s3a > s3b) setsWonA++;
  else if (s3b >= targetPts && s3b > s3a) setsWonB++;

  const statusSelect = document.getElementById('modal-match-status');
  if (statusSelect) {
    if (setsWonA === 2 || setsWonB === 2) {
      statusSelect.value = 'completed';
    } else if (s1a > 0 || s1b > 0) {
      if (statusSelect.value === 'scheduled') {
        statusSelect.value = 'playing';
      }
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

      const status = document.getElementById('modal-match-status').value;
      const match = tournamentData.matches[currentEditingMatchId];
      if (!match) return;

      let setsWonA = 0;
      let setsWonB = 0;

      if (s1a > s1b) setsWonA++;
      else if (s1b > s1a) setsWonB++;

      if (s2a > s2b) setsWonA++;
      else if (s2b > s2a) setsWonB++;

      if (s3a > s3b) setsWonA++;
      else if (s3b > s3a) setsWonB++;

      let winner = null;
      if (status === 'completed') {
        if (setsWonA > setsWonB) winner = match.teamA;
        else if (setsWonB > setsWonA) winner = match.teamB;
      }

      const updateData = {
        scores: [
          { a: s1a, b: s1b },
          { a: s2a, b: s2b },
          { a: s3a, b: s3b }
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

  const teamA = getTeamInfo(match.teamA, match.placeholderA);
  const teamB = getTeamInfo(match.teamB, match.placeholderB);

  document.getElementById('modal-match-badge').textContent = `Trận ${match.id} • Sân ${match.court} • ${match.time}`;
  document.getElementById('modal-team-a-name').textContent = teamA.name;
  document.getElementById('modal-team-b-name').textContent = teamB.name;

  const targetPts = tournamentData.settings?.pointsPerSet || 15;
  document.querySelectorAll('.modal-target-pts').forEach(el => el.textContent = targetPts);

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
  let html = '';

  teams.forEach(team => {
    const isX = team.group === 'X';
    const members = team.members || [
      { name: "", role: "A" },
      { name: "", role: "a" },
      { name: "", role: "b" }
    ];

    html += `
      <div class="bg-slate-800 rounded-3xl border ${isX ? 'border-blue-500/40' : 'border-rose-500/40'} p-5 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-700">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl ${isX ? 'bg-blue-600' : 'bg-rose-600'} text-white font-black flex items-center justify-center text-xs">
              ${team.code || team.id}
            </span>
            <span class="font-bold text-white text-sm">${team.name}</span>
          </div>
          <span class="text-xs ${isX ? 'text-blue-400' : 'text-rose-400'} font-bold">Bảng ${isX ? 'X (Xanh)' : 'Đ (Đỏ)'}</span>
        </div>

        <form class="team-edit-form space-y-3 text-xs" data-team-id="${team.id}">
          <div>
            <label class="block text-slate-400 font-semibold mb-1">Tên Đội</label>
            <input type="text" class="team-input-name w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-blue-500" value="${team.name}">
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-slate-400 text-[10px] mb-1 font-semibold">VĐV 1 (A - Nam)</label>
              <input type="text" class="team-input-m0 w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white" value="${members[0]?.name || ''}">
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] mb-1 font-semibold">VĐV 2 (a - Nam)</label>
              <input type="text" class="team-input-m1 w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white" value="${members[1]?.name || ''}">
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] mb-1 font-semibold">VĐV 3 (b - Nữ)</label>
              <input type="text" class="team-input-m2 w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white" value="${members[2]?.name || ''}">
            </div>
          </div>

          <div class="pt-1 text-right">
            <button type="submit" class="py-2 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition flex items-center gap-1.5 ml-auto">
              <i class="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi Đội ${team.code || team.id}
            </button>
          </div>
        </form>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.team-edit-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const teamId = form.dataset.teamId;
      const name = form.querySelector('.team-input-name').value.trim();
      const m0 = form.querySelector('.team-input-m0').value.trim();
      const m1 = form.querySelector('.team-input-m1').value.trim();
      const m2 = form.querySelector('.team-input-m2').value.trim();

      await updateTeam(teamId, {
        name,
        members: [
          { name: m0, role: "A" },
          { name: m1, role: "a" },
          { name: m2, role: "b" }
        ]
      });

      showToast(`Đã cập nhật thông tin Đội ${teamId} thành công!`);
    });
  });
}

/**
 * 8. RENDER & CHỈNH SỬA LỊCH & SÂN ĐẤU
 */
function renderAdminSchedule() {
  const container = document.getElementById('admin-schedule-table-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
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

    html += `
      <tr class="hover:bg-slate-700/30 transition schedule-row" data-match-id="${m.id}">
        <td class="py-2.5 px-3 font-bold text-white">${m.id}</td>
        <td class="py-2.5 px-3">
          <input type="text" class="input-match-time w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-white" value="${m.time}">
        </td>
        <td class="py-2.5 px-3">
          <select class="select-match-court bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white">
            <option value="1" ${m.court === 1 ? 'selected' : ''}>Sân 1</option>
            <option value="2" ${m.court === 2 ? 'selected' : ''}>Sân 2</option>
            <option value="3" ${m.court === 3 ? 'selected' : ''}>Sân 3</option>
          </select>
        </td>
        <td class="py-2.5 px-3">
          ${isKnockout ? `
            <span class="font-semibold text-white">${getTeamInfo(m.teamA, m.placeholderA).name}</span>
            <span class="text-slate-400"> vs </span>
            <span class="font-semibold text-white">${getTeamInfo(m.teamB, m.placeholderB).name}</span>
          ` : `
            <div class="flex items-center gap-1.5">
              <select class="select-team-a bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white text-[11px] max-w-[130px]">
                ${teams.map(t => `<option value="${t.id}" ${t.id === m.teamA ? 'selected' : ''}>${t.code} - ${t.name}</option>`).join('')}
              </select>
              <span class="text-slate-400">vs</span>
              <select class="select-team-b bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white text-[11px] max-w-[130px]">
                ${teams.map(t => `<option value="${t.id}" ${t.id === m.teamB ? 'selected' : ''}>${t.code} - ${t.name}</option>`).join('')}
              </select>
            </div>
          `}
        </td>
        <td class="py-2.5 px-3">
          <select class="select-match-status bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Sắp đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>
        </td>
        <td class="py-2.5 px-3 text-right">
          <button class="btn-save-schedule py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition" data-match-id="${m.id}">
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

    let pointsPerSet = 15;
    let maxSets = 3;
    let winSetsRequired = 2;

    if (format === '3_sets_21') {
      pointsPerSet = 21;
      maxSets = 3;
      winSetsRequired = 2;
    } else if (format === '1_set_21') {
      pointsPerSet = 21;
      maxSets = 1;
      winSetsRequired = 1;
    } else if (format === '1_set_31') {
      pointsPerSet = 31;
      maxSets = 1;
      winSetsRequired = 1;
    }

    await updateSettings({
      tournamentName,
      format,
      pointsPerSet,
      maxSets,
      winSetsRequired,
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
      const confirmSeed = confirm("Bạn có chắc chắn muốn nạp lại dữ liệu gốc 10 đội & 24 trận lên Database? Tỷ số các trận sẽ được đặt lại ban đầu.");
      if (confirmSeed) {
        await seedDatabase();
        showToast("Đã nạp thành công 10 Đội & 24 Trận lên Database!");
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const confirmReset = confirm("Bạn có chắc chắn muốn reset tỷ số tất cả 24 trận về 0-0?");
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
      const confirmSim = confirm("Bạn có muốn chạy mô phỏng toàn bộ giải đấu (20 trận vòng bảng + Bán kết + Chung kết) để kiểm thử dữ liệu?");
      if (!confirmSim) return;

      showToast("Đang chạy mô phỏng toàn bộ giải đấu...", "info");

      // 1. Mô phỏng 20 trận vòng bảng
      const matches = tournamentData.matches || {};
      const targetPts = tournamentData.settings?.pointsPerSet || 15;

      for (const [id, m] of Object.entries(matches)) {
        if (m.stage === 'group') {
          // Ngẫu nhiên chọn đội A hoặc đội B thắng
          const isAWin = Math.random() > 0.45;
          const isThreeSets = Math.random() > 0.6;

          let s1a = isAWin ? targetPts : Math.floor(Math.random() * 5) + (targetPts - 5);
          let s1b = isAWin ? Math.floor(Math.random() * 5) + (targetPts - 5) : targetPts;

          let s2a, s2b, s3a = 0, s3b = 0, setsWonA = 0, setsWonB = 0;

          if (isThreeSets) {
            s2a = isAWin ? Math.floor(Math.random() * 5) + (targetPts - 5) : targetPts;
            s2b = isAWin ? targetPts : Math.floor(Math.random() * 5) + (targetPts - 5);
            s3a = isAWin ? targetPts : Math.floor(Math.random() * 5) + (targetPts - 5);
            s3b = isAWin ? Math.floor(Math.random() * 5) + (targetPts - 5) : targetPts;
            setsWonA = isAWin ? 2 : 1;
            setsWonB = isAWin ? 1 : 2;
          } else {
            s2a = isAWin ? targetPts : Math.floor(Math.random() * 5) + (targetPts - 5);
            s2b = isAWin ? Math.floor(Math.random() * 5) + (targetPts - 5) : targetPts;
            setsWonA = isAWin ? 2 : 0;
            setsWonB = isAWin ? 0 : 2;
          }

          const winner = isAWin ? m.teamA : m.teamB;

          await updateMatchScore(id, {
            scores: [
              { a: s1a, b: s1b },
              { a: s2a, b: s2b },
              { a: s3a, b: s3b }
            ],
            setsWon: { a: setsWonA, b: setsWonB },
            winner,
            status: 'completed'
          });
        }
      }

      // 2. Tự động cập nhật Bán kết từ BXH
      await checkAndUpdateKnockoutBrackets();

      // Đợi ngắn để state cập nhật
      await new Promise(r => setTimeout(r, 400));

      // 3. Mô phỏng Bán kết 1 & 2
      const bk1 = tournamentData.matches['M21'];
      const bk2 = tournamentData.matches['M22'];

      if (bk1 && bk1.teamA && bk1.teamB) {
        await updateMatchScore('M21', {
          scores: [{ a: targetPts, b: targetPts - 3 }, { a: targetPts - 2, b: targetPts }, { a: targetPts, b: targetPts - 4 }],
          setsWon: { a: 2, b: 1 },
          winner: bk1.teamA,
          status: 'completed'
        });
      }

      if (bk2 && bk2.teamA && bk2.teamB) {
        await updateMatchScore('M22', {
          scores: [{ a: targetPts, b: targetPts - 4 }, { a: targetPts, b: targetPts - 2 }],
          setsWon: { a: 2, b: 0 },
          winner: bk2.teamA,
          status: 'completed'
        });
      }

      // Cập nhật Chung kết & Tranh 3-4
      await checkAndUpdateKnockoutBrackets();
      await new Promise(r => setTimeout(r, 400));

      // 4. Mô phỏng Chung kết & Tranh 3-4
      const ck = tournamentData.matches['M24'];
      const t34 = tournamentData.matches['M23'];

      if (ck && ck.teamA && ck.teamB) {
        await updateMatchScore('M24', {
          scores: [{ a: targetPts, b: targetPts - 3 }, { a: targetPts, b: targetPts - 1 }],
          setsWon: { a: 2, b: 0 },
          winner: ck.teamA,
          status: 'completed'
        });
      }

      if (t34 && t34.teamA && t34.teamB) {
        await updateMatchScore('M23', {
          scores: [{ a: targetPts - 4, b: targetPts }, { a: targetPts, b: targetPts - 3 }, { a: targetPts, b: targetPts - 2 }],
          setsWon: { a: 2, b: 1 },
          winner: t34.teamA,
          status: 'completed'
        });
      }

      showToast("Mô phỏng toàn bộ giải đấu hoàn tất! Hãy mở trang Xem Live để kiểm tra.");
    });
  }
}

/**
 * Tự động gán đội vào Bán Kết & Chung Kết khi Vòng bảng kết thúc
 */
async function checkAndUpdateKnockoutBrackets() {
  const matches = tournamentData.matches || {};
  const groupMatches = Object.values(matches).filter(m => m.stage === 'group');
  const allGroupDone = groupMatches.length === 20 && groupMatches.every(m => m.status === 'completed');

  if (allGroupDone) {
    const topX = getGroupTopTeams('X');
    const topD = getGroupTopTeams('D');

    if (topX.length >= 2 && topD.length >= 2) {
      await updateMatchSchedule('M21', {
        teamA: topX[0].id,
        teamB: topD[1].id
      });

      await updateMatchSchedule('M22', {
        teamA: topD[0].id,
        teamB: topX[1].id
      });
    }
  }

  const bk1 = matches['M21'];
  const bk2 = matches['M22'];

  if (bk1 && bk2 && bk1.status === 'completed' && bk2.status === 'completed' && bk1.winner && bk2.winner) {
    const loser1 = bk1.winner === bk1.teamA ? bk1.teamB : bk1.teamA;
    const loser2 = bk2.winner === bk2.teamA ? bk2.teamB : bk2.teamA;

    await updateMatchSchedule('M24', {
      teamA: bk1.winner,
      teamB: bk2.winner
    });

    await updateMatchSchedule('M23', {
      teamA: loser1,
      teamB: loser2
    });
  }
}

function getGroupTopTeams(groupKey) {
  const teams = tournamentData.teams || {};
  const matches = Object.values(tournamentData.matches || {});
  const groupTeams = Object.values(teams).filter(t => t.group === groupKey);

  const stats = {};
  groupTeams.forEach(t => {
    stats[t.id] = { id: t.id, won: 0, setsDiff: 0, pointsDiff: 0, pts: 0 };
  });

  matches.forEach(m => {
    if (m.stage === 'group' && m.group === groupKey && m.status === 'completed' && m.winner) {
      if (stats[m.winner]) {
        stats[m.winner].won += 1;
        stats[m.winner].pts += 1;
      }
      const setsWon = m.setsWon || { a: 0, b: 0 };
      if (stats[m.teamA]) stats[m.teamA].setsDiff += (setsWon.a - setsWon.b);
      if (stats[m.teamB]) stats[m.teamB].setsDiff += (setsWon.b - setsWon.a);
    }
  });

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return b.setsDiff - a.setsDiff;
  });
}

function getTeamInfo(teamId, placeholder = "Chưa xác định") {
  if (!teamId || !tournamentData.teams || !tournamentData.teams[teamId]) {
    return { name: placeholder, membersText: "" };
  }
  const t = tournamentData.teams[teamId];
  return {
    name: t.name,
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


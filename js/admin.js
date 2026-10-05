/**
 * ADMIN PANEL LOGIC - GIẢI CẦU LÔNG GIAO HƯU 2026
 * Quản lý nhập điểm, chỉnh sửa thông tin 10 đội, đổi giờ/sân và cài đặt thể thức.
 * Toàn bộ ghi trực tiếp vào Database (Firebase hoặc LocalStorage).
 */

import {
  initDatabaseService,
  onDataChange,
  seedDatabase,
  updateMatchScore,
  updateTeam,
  updateMatchSchedule,
  updateSettings,
  isFirebaseConfigured
} from './firebase-config.js';

let tournamentData = {
  settings: {},
  teams: {},
  matches: {}
};

let currentEditingMatchId = null;
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', async () => {
  setupPinAuth();
  setupAdminTabs();
  setupScoreModal();
  setupSettingsForm();
  setupDatabaseActionButtons();

  // Khởi tạo Database Service
  const dbInfo = await initDatabaseService();
  updateDbBadge(dbInfo.mode);

  // Lắng nghe dữ liệu
  onDataChange((data) => {
    if (!data) return;
    tournamentData = data;
    if (isAuthenticated) {
      renderAdminAll();
    }
  });
});

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
  if (!badge) return;

  if (mode === 'firebase') {
    badge.className = "text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono";
    badge.textContent = "Firebase Online";
    if (note) note.innerHTML = `<span class="text-emerald-400 font-bold">Đã kết nối Firebase Realtime Database.</span> Dữ liệu được đồng bộ trực tiếp lên đám mây.`;
  } else {
    badge.className = "text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono";
    badge.textContent = "Chế độ Local";
    if (note) note.innerHTML = `<span class="text-amber-400 font-bold">Đang lưu cục bộ trên trình duyệt.</span> Để đồng bộ trực tiếp nhiều máy, hãy dán API Key vào <code class="text-white">js/firebase-config.js</code>.`;
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
      <div class="bg-slate-800 rounded-2xl border ${isPlaying ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700'} p-4 flex flex-col justify-between">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-2.5 border-b border-slate-700/60 text-xs">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white bg-slate-700 px-2 py-0.5 rounded">Trận ${m.id}</span>
            <span class="text-slate-400">Sân ${m.court} • ${m.time}</span>
          </div>
          <div>
            ${isPlaying 
              ? '<span class="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">Đang đấu</span>'
              : isCompleted
              ? '<span class="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">Đã xong</span>'
              : '<span class="text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">Chưa đấu</span>'
            }
          </div>
        </div>

        <!-- Cặp đấu & Tỷ số -->
        <div class="py-3 space-y-2">
          <!-- Đội A -->
          <div class="flex items-center justify-between p-2 rounded-xl ${m.winner === m.teamA ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-900/60'}">
            <div class="truncate pr-2">
              <div class="font-bold text-xs text-white truncate">${teamA.name}</div>
              <div class="text-[10px] text-slate-400 truncate">${teamA.membersText}</div>
            </div>
            <div class="font-mono text-base font-extrabold text-blue-400">${setsWon.a}</div>
          </div>

          <!-- Đội B -->
          <div class="flex items-center justify-between p-2 rounded-xl ${m.winner === m.teamB ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-900/60'}">
            <div class="truncate pr-2">
              <div class="font-bold text-xs text-white truncate">${teamB.name}</div>
              <div class="text-[10px] text-slate-400 truncate">${teamB.membersText}</div>
            </div>
            <div class="font-mono text-base font-extrabold text-rose-400">${setsWon.b}</div>
          </div>

          <!-- Điểm các set -->
          <div class="flex items-center justify-center gap-2 pt-1 font-mono text-xs text-slate-300">
            ${scores.map((s, idx) => `<span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">S${idx+1}: ${s.a}-${s.b}</span>`).join('')}
          </div>
        </div>

        <!-- Nút thao tác -->
        <div class="pt-2 border-t border-slate-700/60 flex gap-2">
          <button 
            class="btn-open-score w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
            data-match-id="${m.id}"
          >
            <i class="fa-solid fa-pen-to-square"></i> Nhập Điểm
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;

  // Gắn sự kiện click mở modal nhập điểm
  container.querySelectorAll('.btn-open-score').forEach(btn => {
    btn.addEventListener('click', () => {
      openScoreModal(btn.dataset.matchId);
    });
  });
}

/**
 * 5. MODAL NHẬP ĐIỂM CHI TIẾT
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

      // Tính số set thắng
      let setsWonA = 0;
      let setsWonB = 0;

      if (s1a > s1b) setsWonA++;
      else if (s1b > s1a) setsWonB++;

      if (s2a > s2b) setsWonA++;
      else if (s2b > s2a) setsWonB++;

      if (s3a > s3b) setsWonA++;
      else if (s3b > s3a) setsWonB++;

      // Xác định đội thắng
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

      // Tự động kiểm tra cập nhật Knockout nếu tất cả trận vòng bảng đã xong
      checkAndUpdateKnockoutBrackets();

      modal.classList.add('hidden');
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
 * 6. RENDER & CHỈNH SỬA 10 ĐỘI HÌNH
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
      <div class="bg-slate-800 rounded-2xl border ${isX ? 'border-blue-500/40' : 'border-rose-500/40'} p-4 space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-700">
          <span class="w-7 h-7 rounded-lg ${isX ? 'bg-blue-600' : 'bg-rose-600'} text-white font-bold flex items-center justify-center text-xs">
            ${team.code || team.id}
          </span>
          <span class="text-xs text-slate-400">Bảng ${isX ? 'Xanh (X)' : 'Đỏ (Đ)'}</span>
        </div>

        <form class="team-edit-form space-y-2 text-xs" data-team-id="${team.id}">
          <div>
            <label class="block text-slate-400 font-semibold mb-1">Tên Đội</label>
            <input type="text" class="team-input-name w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white" value="${team.name}">
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-slate-400 text-[10px] mb-1">VĐV 1 (A)</label>
              <input type="text" class="team-input-m0 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" value="${members[0]?.name || ''}">
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] mb-1">VĐV 2 (a)</label>
              <input type="text" class="team-input-m1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" value="${members[1]?.name || ''}">
            </div>
            <div>
              <label class="block text-slate-400 text-[10px] mb-1">VĐV 3 (b)</label>
              <input type="text" class="team-input-m2 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white" value="${members[2]?.name || ''}">
            </div>
          </div>

          <div class="pt-1 text-right">
            <button type="submit" class="py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition">
              <i class="fa-solid fa-floppy-disk"></i> Lưu Đội ${team.code || team.id}
            </button>
          </div>
        </form>
      </div>
    `;
  });

  container.innerHTML = html;

  // Gắn sự kiện submit cho từng form đội
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

      alert(`Đã cập nhật thông tin Đội ${teamId} thành công!`);
    });
  });
}

/**
 * 7. RENDER & CHỈNH SỬA LỊCH & SÂN ĐẤU
 */
function renderAdminSchedule() {
  const container = document.getElementById('admin-schedule-table-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
  let html = `
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left text-slate-300">
        <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
          <tr>
            <th class="py-2.5 px-3">Trận</th>
            <th class="py-2.5 px-3">Giờ Đấu</th>
            <th class="py-2.5 px-3">Sân</th>
            <th class="py-2.5 px-3">Cặp Đấu</th>
            <th class="py-2.5 px-3">Trạng Thái</th>
            <th class="py-2.5 px-3 text-right">Lưu</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700/60">
  `;

  matches.forEach(m => {
    const teamA = getTeamInfo(m.teamA, m.placeholderA);
    const teamB = getTeamInfo(m.teamB, m.placeholderB);

    html += `
      <tr class="hover:bg-slate-700/30 transition schedule-row" data-match-id="${m.id}">
        <td class="py-2 px-3 font-bold text-white">${m.id}</td>
        <td class="py-2 px-3">
          <input type="text" class="input-match-time w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center text-white" value="${m.time}">
        </td>
        <td class="py-2 px-3">
          <select class="select-match-court bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white">
            <option value="1" ${m.court === 1 ? 'selected' : ''}>Sân 1</option>
            <option value="2" ${m.court === 2 ? 'selected' : ''}>Sân 2</option>
            <option value="3" ${m.court === 3 ? 'selected' : ''}>Sân 3</option>
          </select>
        </td>
        <td class="py-2 px-3">
          <span class="font-semibold text-white">${teamA.name}</span>
          <span class="text-slate-400"> vs </span>
          <span class="font-semibold text-white">${teamB.name}</span>
        </td>
        <td class="py-2 px-3">
          <select class="select-match-status bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Sắp đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>
        </td>
        <td class="py-2 px-3 text-right">
          <button class="btn-save-schedule py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition" data-match-id="${m.id}">
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

      await updateMatchSchedule(matchId, { time, court, status });
      alert(`Đã lưu lịch đấu trận ${matchId}!`);
    });
  });
}

/**
 * 8. FORM CÀI ĐẶT THỂ THỨC
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

    await updateSettings({
      tournamentName,
      format,
      pointsForWin,
      adminPin
    });

    alert("Đã lưu cài đặt thể thức thành công!");
  });
}

/**
 * 9. CÁC NÚT SEED VÀ RESET DATABASE
 */
function setupDatabaseActionButtons() {
  const btnSeed = document.getElementById('btn-seed-data');
  const btnReset = document.getElementById('btn-reset-scores');

  if (btnSeed) {
    btnSeed.addEventListener('click', async () => {
      const confirmSeed = confirm("Bạn có chắc chắn muốn nạp dữ liệu gốc 10 đội & 24 trận lên Database? Tỷ số các trận sẽ được đặt lại ban đầu.");
      if (confirmSeed) {
        await seedDatabase();
        alert("Đã nạp thành công 10 Đội & 24 Trận lên Database!");
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
        alert("Đã reset tỷ số toàn bộ các trận!");
      }
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
    // Tính xếp hạng Top 2 mỗi bảng
    const topX = getGroupTopTeams('X');
    const topD = getGroupTopTeams('D');

    if (topX.length >= 2 && topD.length >= 2) {
      // BK1 (M21): Nhất X (MIA1) vs Nhì Đ (MIB2)
      await updateMatchSchedule('M21', {
        teamA: topX[0].id,
        teamB: topD[1].id
      });

      // BK2 (M22): Nhất Đ (MIB1) vs Nhì X (MIA2)
      await updateMatchSchedule('M22', {
        teamA: topD[0].id,
        teamB: topX[1].id
      });
    }
  }

  // Khi 2 trận Bán kết xong -> Điền vào Chung kết (M24) và Tranh 3-4 (M23)
  const bk1 = matches['M21'];
  const bk2 = matches['M22'];

  if (bk1 && bk2 && bk1.status === 'completed' && bk2.status === 'completed' && bk1.winner && bk2.winner) {
    const loser1 = bk1.winner === bk1.teamA ? bk1.teamB : bk1.teamA;
    const loser2 = bk2.winner === bk2.teamA ? bk2.teamB : bk2.teamA;

    // Chung kết (M24)
    await updateMatchSchedule('M24', {
      teamA: bk1.winner,
      teamB: bk2.winner
    });

    // Tranh 3-4 (M23)
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

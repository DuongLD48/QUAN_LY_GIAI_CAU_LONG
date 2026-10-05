/**
 * CLIENT APP LOGIC (NGƯỜI XEM) - GIẢI CẦU LÔNG GIAO HƯU 2026
 * Tự động lắng nghe thay đổi từ Database (Firebase Realtime hoặc LocalStorage)
 * Hiển thị điểm trực tiếp 3 sân, Lịch đấu, Bảng xếp hạng và Nhánh đấu Knockout.
 */

import { initDatabaseService, onDataChange, isFirebaseConfigured } from './firebase-config.js';

// Trạng thái ứng dụng Client
let tournamentData = {
  settings: {},
  teams: {},
  matches: {}
};

let currentFilter = 'all';

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
  setupLiveClock();
  setupTabNavigation();
  setupScheduleFilters();

  // Khởi tạo Database Service
  const dbInfo = await initDatabaseService();
  updateSyncIndicator(dbInfo.mode);

  // Lắng nghe dữ liệu Realtime
  onDataChange((data) => {
    if (!data) return;
    tournamentData = data;
    renderAllViews();
  });
});

/**
 * Cập nhật đồng hồ thời gian thực
 */
function setupLiveClock() {
  const clockEl = document.getElementById('current-time');
  const updateClock = () => {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('vi-VN', { hour12: false });
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

/**
 * Hiển thị trạng thái kết nối
 */
function updateSyncIndicator(mode) {
  const syncText = document.getElementById('sync-text');
  const syncIcon = document.querySelector('#sync-status i');
  if (!syncText || !syncIcon) return;

  if (mode === 'firebase') {
    syncText.textContent = "Firebase Realtime";
    syncIcon.className = "fa-solid fa-cloud text-emerald-400";
  } else {
    syncText.textContent = "Đồng Bộ Nội Bộ";
    syncIcon.className = "fa-solid fa-hard-drive text-amber-400";
  }
}

/**
 * Điều hướng Tab (Trực tiếp, Lịch đấu, BXH, Knockout)
 */
function setupTabNavigation() {
  const tabs = [
    { btn: 'tab-btn-live', section: 'section-live' },
    { btn: 'tab-btn-schedule', section: 'section-schedule' },
    { btn: 'tab-btn-standings', section: 'section-standings' },
    { btn: 'tab-btn-bracket', section: 'section-bracket' }
  ];

  tabs.forEach(({ btn, section }) => {
    const btnEl = document.getElementById(btn);
    if (!btnEl) return;

    btnEl.addEventListener('click', () => {
      // Bỏ active tất cả
      tabs.forEach(t => {
        const b = document.getElementById(t.btn);
        const s = document.getElementById(t.section);
        if (b) {
          b.className = "tab-btn px-3.5 py-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 whitespace-nowrap transition flex items-center gap-1.5";
        }
        if (s) s.classList.add('hidden');
      });

      // Active tab được chọn
      btnEl.className = "tab-btn active px-3.5 py-1.5 rounded-lg bg-white text-blue-800 font-bold shadow-sm whitespace-nowrap transition flex items-center gap-1.5";
      const targetSec = document.getElementById(section);
      if (targetSec) targetSec.classList.remove('hidden');
    });
  });
}

/**
 * Bộ lọc lịch thi đấu
 */
function setupScheduleFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('bg-white', 'text-slate-700');
      });
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('bg-white', 'text-slate-700');

      currentFilter = btn.dataset.filter;
      renderScheduleList();
    });
  });
}

/**
 * Render toàn bộ giao diện khi có dữ liệu mới từ Database
 */
function renderAllViews() {
  const settings = tournamentData.settings || {};
  
  // Tên giải đấu & Thể thức
  const titleEl = document.getElementById('tournament-title');
  if (titleEl && settings.tournamentName) {
    titleEl.textContent = settings.tournamentName;
  }

  const formatBadge = document.getElementById('format-badge');
  if (formatBadge && settings.format) {
    const formatMap = {
      "3_sets_15": "Thể thức: 3 hiệp 15 điểm",
      "3_sets_21": "Thể thức: 3 hiệp 21 điểm",
      "1_set_21": "Thể thức: 1 hiệp 21 điểm",
      "1_set_31": "Thể thức: 1 hiệp 31 điểm"
    };
    formatBadge.textContent = formatMap[settings.format] || "Thể thức: 3 hiệp 15 điểm";
  }

  renderLiveCourts();
  renderScheduleList();
  renderStandings();
  renderBracket();
}

/**
 * 1. RENDER 3 SÂN THI ĐẤU (COURT CARDS)
 */
function renderLiveCourts() {
  const container = document.getElementById('courts-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
  const courts = [1, 2, 3];

  let html = '';

  courts.forEach(courtNumber => {
    // Tìm trận đang đấu trên sân này
    let activeMatch = matches.find(m => m.court === courtNumber && m.status === 'playing');
    
    // Nếu không có trận đang đấu, tìm trận sắp đấu tiếp theo
    if (!activeMatch) {
      activeMatch = matches.find(m => m.court === courtNumber && m.status === 'scheduled');
    }

    // Nếu vẫn không có, lấy trận vừa kết thúc gần nhất
    if (!activeMatch) {
      const finished = matches.filter(m => m.court === courtNumber && m.status === 'completed');
      if (finished.length > 0) {
        activeMatch = finished[finished.length - 1];
      }
    }

    if (!activeMatch) {
      // Sân đang trống
      html += `
        <div class="court-card bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <span class="font-extrabold text-base text-slate-800">SÂN ${courtNumber}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Trống</span>
          </div>
          <div class="py-10 text-center text-slate-400 text-sm">
            <i class="fa-solid fa-moon text-3xl mb-2 text-slate-300"></i>
            <p>Hiện không có trận đấu</p>
          </div>
        </div>
      `;
      return;
    }

    // Lấy thông tin 2 đội
    const teamA = getTeamDisplay(activeMatch.teamA, activeMatch.placeholderA);
    const teamB = getTeamDisplay(activeMatch.teamB, activeMatch.placeholderB);

    const isLive = activeMatch.status === 'playing';
    const isCompleted = activeMatch.status === 'completed';

    // Badge trạng thái
    let statusBadge = '';
    if (isLive) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
        <span class="live-indicator"></span> ĐANG ĐẤU
      </span>`;
    } else if (isCompleted) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
        ĐÃ KẾT THÚC
      </span>`;
    } else {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
        SẮP ĐẤU (${activeMatch.time})
      </span>`;
    }

    // Điểm số các set
    const scores = activeMatch.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    const setsWon = activeMatch.setsWon || { a: 0, b: 0 };

    html += `
      <div class="court-card bg-white rounded-2xl shadow-sm border ${isLive ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200'} p-5 flex flex-col justify-between">
        
        <!-- Header Sân -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full ${courtNumber === 1 ? 'bg-blue-600' : courtNumber === 2 ? 'bg-indigo-600' : 'bg-emerald-600'}"></span>
            <span class="font-extrabold text-base text-slate-800">SÂN ${courtNumber}</span>
            <span class="text-xs text-slate-400">Trận ${activeMatch.id}</span>
          </div>
          <div>${statusBadge}</div>
        </div>

        <!-- Trận đấu & Tỷ số -->
        <div class="py-4 space-y-4">
          <!-- Đội A -->
          <div class="flex items-center justify-between p-2.5 rounded-xl ${activeMatch.winner === activeMatch.teamA ? 'bg-emerald-50 font-bold' : 'bg-slate-50'}">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg ${teamA.group === 'X' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-xs font-bold flex items-center justify-center">
                ${teamA.code}
              </span>
              <div>
                <div class="text-sm font-bold text-slate-800">${teamA.name}</div>
                <div class="text-[11px] text-slate-500">${teamA.membersText}</div>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xl font-extrabold ${activeMatch.winner === activeMatch.teamA ? 'text-emerald-600' : 'text-slate-800'}">
                ${setsWon.a}
              </span>
              <span class="text-[10px] text-slate-400 block">set</span>
            </div>
          </div>

          <!-- Đội B -->
          <div class="flex items-center justify-between p-2.5 rounded-xl ${activeMatch.winner === activeMatch.teamB ? 'bg-emerald-50 font-bold' : 'bg-slate-50'}">
            <div class="flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-lg ${teamB.group === 'X' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-xs font-bold flex items-center justify-center">
                ${teamB.code}
              </span>
              <div>
                <div class="text-sm font-bold text-slate-800">${teamB.name}</div>
                <div class="text-[11px] text-slate-500">${teamB.membersText}</div>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xl font-extrabold ${activeMatch.winner === activeMatch.teamB ? 'text-emerald-600' : 'text-slate-800'}">
                ${setsWon.b}
              </span>
              <span class="text-[10px] text-slate-400 block">set</span>
            </div>
          </div>

          <!-- Chi tiết từng Set -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-mono text-slate-600">
            ${scores.map((s, idx) => `
              <div class="bg-slate-100 px-3 py-1 rounded-lg text-center">
                <span class="text-[10px] text-slate-400 block font-sans">Set ${idx + 1}</span>
                <span class="font-bold ${s.a > s.b ? 'text-blue-600' : s.b > s.a ? 'text-rose-600' : 'text-slate-700'}">${s.a} - ${s.b}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Giờ đấu: <b>${activeMatch.time}</b></span>
          <span>${activeMatch.label || activeMatch.note || ''}</span>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * 2. RENDER LỊCH THI ĐẤU & KẾT QUẢ (SCHEDULE LIST)
 */
function renderScheduleList() {
  const container = document.getElementById('schedule-list-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
  
  // Áp dụng bộ lọc
  const filtered = matches.filter(m => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'court-1') return m.court === 1;
    if (currentFilter === 'court-2') return m.court === 2;
    if (currentFilter === 'court-3') return m.court === 3;
    if (currentFilter === 'group-x') return m.group === 'X';
    if (currentFilter === 'group-d') return m.group === 'D';
    if (currentFilter === 'knockout') return m.stage !== 'group';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">Không tìm thấy trận đấu nào phù hợp với bộ lọc.</div>`;
    return;
  }

  let html = '';
  filtered.forEach(m => {
    const teamA = getTeamDisplay(m.teamA, m.placeholderA);
    const teamB = getTeamDisplay(m.teamB, m.placeholderB);

    const isLive = m.status === 'playing';
    const isCompleted = m.status === 'completed';

    const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    const setsWon = m.setsWon || { a: 0, b: 0 };

    html += `
      <div class="bg-white rounded-xl border ${isLive ? 'border-blue-400 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200'} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-300">
        
        <!-- Info: Time, Court, ID -->
        <div class="flex items-center space-x-3 sm:w-1/4">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-700 font-bold border border-slate-200">
            <span class="text-xs text-slate-500 font-normal">Sân</span>
            <span class="text-base leading-none">${m.court}</span>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">${m.time} • Trận ${m.id}</div>
            <div class="text-[11px] text-slate-500">${m.label || m.note || 'Vòng Bảng'}</div>
          </div>
        </div>

        <!-- Teams & Scores -->
        <div class="flex-grow flex items-center justify-between sm:justify-center gap-4 sm:gap-8">
          <!-- Đội A -->
          <div class="text-right sm:w-5/12 ${m.winner === m.teamA ? 'font-bold text-emerald-700' : 'text-slate-800'}">
            <div class="text-sm font-semibold">${teamA.name}</div>
            <div class="text-[11px] text-slate-500 truncate max-w-[200px] ml-auto">${teamA.membersText}</div>
          </div>

          <!-- Tỷ số giữa 2 đội -->
          <div class="flex flex-col items-center justify-center min-w-[70px]">
            <div class="px-3 py-1 rounded-lg ${isLive ? 'bg-rose-50 text-rose-600 font-extrabold' : 'bg-slate-100 text-slate-800 font-bold'} text-sm font-mono tracking-widest border border-slate-200">
              ${setsWon.a} - ${setsWon.b}
            </div>
            ${isLive ? '<span class="live-indicator mt-1"></span>' : ''}
          </div>

          <!-- Đội B -->
          <div class="text-left sm:w-5/12 ${m.winner === m.teamB ? 'font-bold text-emerald-700' : 'text-slate-800'}">
            <div class="text-sm font-semibold">${teamB.name}</div>
            <div class="text-[11px] text-slate-500 truncate max-w-[200px]">${teamB.membersText}</div>
          </div>
        </div>

        <!-- Scores detail per set & Status -->
        <div class="sm:w-1/4 flex sm:flex-col sm:items-end justify-between items-center text-xs">
          <div class="flex items-center gap-1.5 font-mono text-slate-600">
            ${scores.map(s => `<span class="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">${s.a}-${s.b}</span>`).join('')}
          </div>
          <div class="mt-1">
            ${isLive 
              ? '<span class="text-rose-600 font-bold text-[11px] flex items-center gap-1"><span class="live-indicator"></span>Đang đấu</span>'
              : isCompleted
              ? '<span class="text-emerald-600 font-medium text-[11px]"><i class="fa-solid fa-check"></i> Đã xong</span>'
              : '<span class="text-slate-400 text-[11px]">Chưa đấu</span>'
            }
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * 3. RENDER BẢNG XẾP HẠNG (STANDINGS)
 */
function renderStandings() {
  const standingsX = calculateGroupStandings('X');
  const standingsD = calculateGroupStandings('D');

  renderStandingsTable('standings-body-x', standingsX, 'X');
  renderStandingsTable('standings-body-d', standingsD, 'D');
}

/**
 * Tính toán BXH tự động cho từng bảng
 */
function calculateGroupStandings(groupKey) {
  const teams = tournamentData.teams || {};
  const matches = Object.values(tournamentData.matches || {});
  const settings = tournamentData.settings || {};
  const winPts = settings.pointsForWin || 1;

  // Lọc các đội thuộc bảng này
  const groupTeams = Object.values(teams).filter(t => t.group === groupKey);

  const stats = {};
  groupTeams.forEach(t => {
    stats[t.id] = {
      team: t,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      points: 0
    };
  });

  // Duyệt các trận vòng bảng đã xong của bảng này
  matches.forEach(m => {
    if (m.stage === 'group' && m.group === groupKey && m.status === 'completed' && m.winner) {
      const sA = stats[m.teamA];
      const sB = stats[m.teamB];
      if (!sA || !sB) return;

      sA.played += 1;
      sB.played += 1;

      if (m.winner === m.teamA) {
        sA.won += 1;
        sA.points += winPts;
        sB.lost += 1;
      } else if (m.winner === m.teamB) {
        sB.won += 1;
        sB.points += winPts;
        sA.lost += 1;
      }

      const setsWon = m.setsWon || { a: 0, b: 0 };
      sA.setsWon += setsWon.a;
      sA.setsLost += setsWon.b;
      sB.setsWon += setsWon.b;
      sB.setsLost += setsWon.a;

      (m.scores || []).forEach(sc => {
        sA.pointsWon += sc.a;
        sA.pointsLost += sc.b;
        sB.pointsWon += sc.b;
        sB.pointsLost += sc.a;
      });
    }
  });

  // Sắp xếp theo thứ tự: Điểm -> Hiệu số set -> Hiệu số điểm
  const sorted = Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffSetsA = a.setsWon - a.setsLost;
    const diffSetsB = b.setsWon - b.setsLost;
    if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;
    const diffPtsA = a.pointsWon - a.pointsLost;
    const diffPtsB = b.pointsWon - b.pointsLost;
    return diffPtsB - diffPtsA;
  });

  return sorted;
}

function renderStandingsTable(tbodyId, standingsList, groupKey) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  let html = '';
  standingsList.forEach((item, index) => {
    const rank = index + 1;
    const isTop2 = rank <= 2;
    const setDiff = item.setsWon - item.setsLost;
    const ptDiff = item.pointsWon - item.pointsLost;

    html += `
      <tr class="${isTop2 ? (groupKey === 'X' ? 'bg-blue-50/50' : 'bg-rose-50/50') : 'hover:bg-slate-50'} transition">
        <td class="py-2.5 px-3 text-center font-bold">
          <span class="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs ${
            rank === 1 ? 'bg-amber-400 text-slate-900 font-extrabold shadow-sm' :
            rank === 2 ? 'bg-slate-300 text-slate-800 font-bold' :
            'text-slate-500'
          }">
            ${rank}
          </span>
        </td>
        <td class="py-2.5 px-3">
          <div class="font-bold text-slate-800">${item.team.name}</div>
          <div class="text-[11px] text-slate-500 truncate max-w-[180px]">
            ${(item.team.members || []).map(m => m.name).join(' - ')}
          </div>
        </td>
        <td class="py-2.5 px-2 text-center text-slate-600">${item.played}</td>
        <td class="py-2.5 px-2 text-center font-semibold text-emerald-600">${item.won}</td>
        <td class="py-2.5 px-2 text-center text-rose-500">${item.lost}</td>
        <td class="py-2.5 px-2 text-center font-mono ${setDiff > 0 ? 'text-emerald-600' : setDiff < 0 ? 'text-rose-500' : 'text-slate-500'}">
          ${item.setsWon}/${item.setsLost}
        </td>
        <td class="py-2.5 px-2 text-center font-mono ${ptDiff > 0 ? 'text-emerald-600' : ptDiff < 0 ? 'text-rose-500' : 'text-slate-500'}">
          ${ptDiff > 0 ? '+' + ptDiff : ptDiff}
        </td>
        <td class="py-2.5 px-3 text-center font-extrabold text-sm ${groupKey === 'X' ? 'text-blue-600' : 'text-rose-600'}">
          ${item.points}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * 4. RENDER NHÁNH ĐẤU VÒNG CHUNG KẾT (BRACKET)
 */
function renderBracket() {
  const container = document.getElementById('bracket-container');
  if (!container) return;

  const matches = tournamentData.matches || {};
  const m21 = matches['M21']; // Bán kết 1
  const m22 = matches['M22']; // Bán kết 2
  const m23 = matches['M23']; // Tranh 3-4
  const m24 = matches['M24']; // Chung kết

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Bán Kết 1 & 2 -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-flag-checkered text-blue-600"></i> Vòng Bán Kết (11h10)
        </h3>
        
        <!-- Card BK1 -->
        ${renderBracketMatchCard(m21, 'BÁN KẾT 1 • SÂN 2', 'Nhất Bảng X', 'Nhì Bảng Đ')}

        <!-- Card BK2 -->
        ${renderBracketMatchCard(m22, 'BÁN KẾT 2 • SÂN 3', 'Nhất Bảng Đ', 'Nhì Bảng X')}
      </div>

      <!-- Vòng Chung Kết & Tranh 3-4 -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-crown text-amber-500"></i> Vòng Chung Kết (12h20)
        </h3>

        <!-- Card Chung Kết -->
        ${renderBracketMatchCard(m24, 'CHUNG KẾT (VÔ ĐỊCH) • SÂN 2', 'Thắng Bán kết 1', 'Thắng Bán kết 2', true)}

        <!-- Card Tranh 3-4 -->
        ${renderBracketMatchCard(m23, 'TRANH HẠNG 3 - 4 • SÂN 3', 'Thua Bán kết 1', 'Thua Bán kết 2')}
      </div>

    </div>
  `;
}

function renderBracketMatchCard(m, title, placeholderA, placeholderB, isFinal = false) {
  if (!m) return '';

  const teamA = getTeamDisplay(m.teamA, placeholderA);
  const teamB = getTeamDisplay(m.teamB, placeholderB);
  const setsWon = m.setsWon || { a: 0, b: 0 };
  const isCompleted = m.status === 'completed';

  return `
    <div class="bg-white rounded-2xl border ${isFinal ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md' : 'border-slate-200'} p-4">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold ${isFinal ? 'text-amber-600' : 'text-slate-600'}">
        <span>${title}</span>
        <span class="font-normal text-slate-400">${m.time}</span>
      </div>

      <div class="py-3 space-y-2">
        <div class="flex items-center justify-between p-2 rounded-xl ${m.winner === m.teamA && isCompleted ? 'bg-emerald-50 font-bold' : 'bg-slate-50'}">
          <div class="text-xs font-semibold text-slate-800">${teamA.name}</div>
          <span class="font-bold text-sm text-slate-800">${setsWon.a}</span>
        </div>
        <div class="flex items-center justify-between p-2 rounded-xl ${m.winner === m.teamB && isCompleted ? 'bg-emerald-50 font-bold' : 'bg-slate-50'}">
          <div class="text-xs font-semibold text-slate-800">${teamB.name}</div>
          <span class="font-bold text-sm text-slate-800">${setsWon.b}</span>
        </div>
      </div>

      ${isCompleted && m.winner ? `
        <div class="pt-2 border-t border-slate-100 text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
          <i class="fa-solid fa-trophy text-amber-500"></i>
          Thắng trận: ${getTeamDisplay(m.winner).name}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Trợ giúp lấy tên và thành viên đội hiển thị
 */
function getTeamDisplay(teamId, placeholder = "Chưa xác định") {
  if (!teamId || !tournamentData.teams || !tournamentData.teams[teamId]) {
    return {
      id: null,
      code: "?",
      name: placeholder,
      group: "X",
      membersText: ""
    };
  }

  const team = tournamentData.teams[teamId];
  const membersText = (team.members || []).map(m => m.name).join(' - ');
  return {
    ...team,
    membersText
  };
}

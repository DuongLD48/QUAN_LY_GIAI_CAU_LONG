/**
 * CLIENT APP LOGIC (NGƯỜI XEM) - GIẢI CẦU LÔNG GIAO HƯU 2026
 * Tự động lắng nghe thay đổi từ Database (Firebase Realtime hoặc LocalStorage)
 * Hiển thị điểm trực tiếp 3 sân, Lịch đấu có tìm kiếm, Bảng xếp hạng và Nhánh đấu Knockout.
 */

// Lấy các service từ window (hỗ trợ cả file:// và http://)
const getDbService = () => window.initDatabaseService || initDatabaseService;
const getDataListener = () => window.onDataChange || onDataChange;

// Trạng thái ứng dụng Client
let tournamentData = {
  settings: {},
  teams: {},
  matches: {}
};

let currentFilter = 'all';
let searchQuery = '';
let previousScores = {}; // Lưu điểm số lần trước để phát hiện điểm nhảy và tạo hiệu ứng flash
let isTvMode = false;

async function startClientApp() {
  setupLiveClock();
  setupTabNavigation();
  setupScheduleFilters();
  setupSearchInput();
  setupTvMode();
  setupQrCodeModal();

  // Khởi tạo Database Service
  const dbInfo = await window.initDatabaseService();
  updateSyncIndicator(dbInfo?.mode || 'local');

  // Lắng nghe dữ liệu Realtime
  window.onDataChange((data) => {
    if (!data) return;
    checkScoreChanges(data.matches);
    tournamentData = data;
    renderAllViews();
  });
}

// Khởi chạy khi DOM sẵn sàng (hỗ trợ cả trường hợp đã load xong)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startClientApp);
} else {
  startClientApp();
}

/**
 * Theo dõi thay đổi tỷ số để phát hiện trận nào vừa nhảy điểm
 */
function checkScoreChanges(newMatches = {}) {
  const changedMatchIds = [];
  for (const [id, m] of Object.entries(newMatches)) {
    const prev = previousScores[id];
    const currentScoreStr = JSON.stringify(m.scores || []) + JSON.stringify(m.setsWon || {});
    if (prev && prev !== currentScoreStr) {
      changedMatchIds.push(id);
    }
    previousScores[id] = currentScoreStr;
  }

  // Đánh dấu các phần tử vừa nhảy điểm sau khi render
  if (changedMatchIds.length > 0) {
    setTimeout(() => {
      changedMatchIds.forEach(id => {
        const els = document.querySelectorAll(`[data-match-id="${id}"]`);
        els.forEach(el => el.classList.add('score-updated'));
      });
    }, 50);
  }
}

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
  const syncStatus = document.getElementById('sync-status');
  if (!syncText || !syncIcon) return;

  if (mode === 'firebase') {
    syncText.textContent = "Cloud DB: Online";
    syncIcon.className = "fa-solid fa-cloud text-emerald-400";
    if (syncStatus) syncStatus.className = "inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold";
  } else {
    syncText.textContent = "Chế độ: Local Storage";
    syncIcon.className = "fa-solid fa-hard-drive text-amber-400";
    if (syncStatus) syncStatus.className = "inline-flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold";
  }
}

if (typeof window !== 'undefined') {
  window.updateSyncIndicator = updateSyncIndicator;
}

/**
 * Chế độ TV / Trình chiếu màn hình lớn
 */
function setupTvMode() {
  const tvBtn = document.getElementById('btn-tv-mode');
  if (!tvBtn) return;

  tvBtn.addEventListener('click', () => {
    isTvMode = !isTvMode;
    document.body.classList.toggle('tv-mode', isTvMode);

    if (isTvMode) {
      tvBtn.classList.add('bg-amber-500', 'text-slate-900');
      tvBtn.classList.remove('bg-white/10', 'text-white');
      // Thử fullscreen nếu trình duyệt hỗ trợ
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      tvBtn.classList.remove('bg-amber-500', 'text-slate-900');
      tvBtn.classList.add('bg-white/10', 'text-white');
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  });
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
      tabs.forEach(t => {
        const b = document.getElementById(t.btn);
        const s = document.getElementById(t.section);
        if (b) {
          b.className = "tab-btn px-3.5 py-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 whitespace-nowrap transition flex items-center gap-1.5";
        }
        if (s) s.classList.add('hidden');
      });

      btnEl.className = "tab-btn active px-3.5 py-1.5 rounded-lg bg-white text-blue-800 font-bold shadow-sm whitespace-nowrap transition flex items-center gap-1.5";
      const targetSec = document.getElementById(section);
      if (targetSec) targetSec.classList.remove('hidden');
    });
  });
}

/**
 * Bộ lọc lịch thi đấu theo sân / bảng
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
 * Ô tìm kiếm VĐV hoặc mã đội trong lịch thi đấu
 */
function setupSearchInput() {
  const searchInput = document.getElementById('schedule-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderScheduleList();
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
      "3_sets_15": "Thể thức: 3 hiệp 15 điểm (Thắng 2)",
      "3_sets_21": "Thể thức: 3 hiệp 21 điểm (Thắng 2)",
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
    // 1. Tìm trận đang đấu trên sân này
    let activeMatch = matches.find(m => m.court === courtNumber && m.status === 'playing');
    
    // 2. Nếu không có, tìm trận sắp đấu tiếp theo
    if (!activeMatch) {
      activeMatch = matches.find(m => m.court === courtNumber && m.status === 'scheduled');
    }

    // 3. Nếu vẫn không có, lấy trận vừa kết thúc gần nhất
    if (!activeMatch) {
      const finished = matches.filter(m => m.court === courtNumber && m.status === 'completed');
      if (finished.length > 0) {
        activeMatch = finished[finished.length - 1];
      }
    }

    if (!activeMatch) {
      html += `
        <div class="court-card bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <span class="font-extrabold text-base text-slate-800">SÂN ${courtNumber}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Trống</span>
          </div>
          <div class="py-12 text-center text-slate-400 text-sm">
            <i class="fa-solid fa-moon text-3xl mb-2 text-slate-300"></i>
            <p>Hiện không có trận đấu</p>
          </div>
        </div>
      `;
      return;
    }

    const teamA = getTeamDisplay(activeMatch.teamA, activeMatch.placeholderA);
    const teamB = getTeamDisplay(activeMatch.teamB, activeMatch.placeholderB);

    const isLive = activeMatch.status === 'playing';
    const isCompleted = activeMatch.status === 'completed';

    // Badge trạng thái
    let statusBadge = '';
    if (isLive) {
      statusBadge = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-600 border border-rose-200 shadow-sm animate-pulse">
        <span class="live-indicator"></span> ĐANG ĐẤU
      </span>`;
    } else if (isCompleted) {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
        <i class="fa-solid fa-circle-check mr-1"></i> ĐÃ KẾT THÚC
      </span>`;
    } else {
      statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <i class="fa-regular fa-clock mr-1"></i> ${activeMatch.time}
      </span>`;
    }

    const scores = activeMatch.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    const setsWon = activeMatch.setsWon || { a: 0, b: 0 };

    const courtColor = courtNumber === 1 
      ? 'from-blue-600 to-indigo-600' 
      : courtNumber === 2 
      ? 'from-indigo-600 to-purple-600' 
      : 'from-emerald-600 to-teal-600';

    html += `
      <div class="court-card bg-white rounded-3xl shadow-sm border ${isLive ? 'border-blue-400 ring-4 ring-blue-500/10' : 'border-slate-200'} p-5 sm:p-6 flex flex-col justify-between" data-match-id="${activeMatch.id}">
        
        <!-- Header Sân -->
        <div class="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-gradient-to-br ${courtColor} text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
              ${courtNumber}
            </span>
            <div>
              <div class="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">SÂN THI ĐẤU ${courtNumber}</div>
              <div class="text-[11px] text-slate-400 font-medium">Trận ${activeMatch.id} • ${activeMatch.time}</div>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>

        <!-- Bảng điểm trung tâm (Scoreboard) -->
        <div class="py-4 space-y-3.5">
          
          <!-- Đội A -->
          <div class="flex items-center justify-between p-3 rounded-2xl ${activeMatch.winner === activeMatch.teamA ? 'bg-emerald-50/80 border border-emerald-200 font-bold' : 'bg-slate-50/80 border border-slate-100'} transition">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-xl ${teamA.group === 'X' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-xs font-black flex items-center justify-center shadow-sm">
                ${teamA.code}
              </span>
              <div class="pr-2">
                <div class="text-sm font-bold text-slate-800 leading-snug">${teamA.name}</div>
                <div class="text-[11px] text-slate-500 font-medium">${teamA.membersText}</div>
              </div>
            </div>
            <div class="text-right pl-2">
              <span class="score-number text-2xl sm:text-3xl font-black ${activeMatch.winner === activeMatch.teamA ? 'text-emerald-600' : 'text-slate-800'}">
                ${setsWon.a}
              </span>
              <span class="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Set</span>
            </div>
          </div>

          <!-- Đội B -->
          <div class="flex items-center justify-between p-3 rounded-2xl ${activeMatch.winner === activeMatch.teamB ? 'bg-emerald-50/80 border border-emerald-200 font-bold' : 'bg-slate-50/80 border border-slate-100'} transition">
            <div class="flex items-center gap-3">
              <span class="w-7 h-7 rounded-xl ${teamB.group === 'X' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-xs font-black flex items-center justify-center shadow-sm">
                ${teamB.code}
              </span>
              <div class="pr-2">
                <div class="text-sm font-bold text-slate-800 leading-snug">${teamB.name}</div>
                <div class="text-[11px] text-slate-500 font-medium">${teamB.membersText}</div>
              </div>
            </div>
            <div class="text-right pl-2">
              <span class="score-number text-2xl sm:text-3xl font-black ${activeMatch.winner === activeMatch.teamB ? 'text-emerald-600' : 'text-slate-800'}">
                ${setsWon.b}
              </span>
              <span class="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Set</span>
            </div>
          </div>

          <!-- Chi tiết từng Set (Set 1, Set 2, Set 3) -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-around gap-2 text-xs font-mono">
            ${scores.map((s, idx) => `
              <div class="flex-1 bg-slate-100/90 py-1.5 px-2 rounded-xl text-center border border-slate-200/60">
                <span class="text-[10px] text-slate-500 block font-sans font-semibold">Set ${idx + 1}</span>
                <span class="text-sm font-black ${s.a > s.b ? 'text-blue-600' : s.b > s.a ? 'text-rose-600' : 'text-slate-600'}">
                  ${s.a} - ${s.b}
                </span>
              </div>
            `).join('')}
          </div>

        </div>

        <!-- Footer Card -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span class="flex items-center gap-1">
            <i class="fa-regular fa-clock"></i> Khởi tranh: <b>${activeMatch.time}</b>
          </span>
          <span class="text-slate-500 font-semibold truncate max-w-[140px] text-right">
            ${activeMatch.label || activeMatch.note || 'Vòng Bảng'}
          </span>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * 2. RENDER LỊCH THI ĐẤU & KẾT QUẢ (SCHEDULE LIST CÓ TÌM KIẾM)
 */
function renderScheduleList() {
  const container = document.getElementById('schedule-list-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
  
  // Áp dụng bộ lọc và tìm kiếm
  const filtered = matches.filter(m => {
    // 1. Lọc theo danh mục
    let passFilter = true;
    if (currentFilter === 'court-1') passFilter = m.court === 1;
    else if (currentFilter === 'court-2') passFilter = m.court === 2;
    else if (currentFilter === 'court-3') passFilter = m.court === 3;
    else if (currentFilter === 'group-x') passFilter = m.group === 'X';
    else if (currentFilter === 'group-d') passFilter = m.group === 'D';
    else if (currentFilter === 'knockout') passFilter = m.stage !== 'group';
    if (!passFilter) return false;

    // 2. Lọc theo từ khóa tìm kiếm (Tên đội, Tên VĐV, Mã trận, Mã đội)
    if (searchQuery) {
      const teamA = getTeamDisplay(m.teamA, m.placeholderA);
      const teamB = getTeamDisplay(m.teamB, m.placeholderB);
      const matchText = [
        m.id,
        m.code || '',
        teamA.name,
        teamA.membersText,
        teamA.code,
        teamB.name,
        teamB.membersText,
        teamB.code,
        m.time
      ].join(' ').toLowerCase();

      return matchText.includes(searchQuery);
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200">
        <i class="fa-solid fa-magnifying-glass text-3xl mb-3 text-slate-300"></i>
        <p class="text-sm font-semibold text-slate-600">Không tìm thấy trận đấu phù hợp</p>
        <p class="text-xs text-slate-400 mt-1">Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc "Tất cả"</p>
      </div>
    `;
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
      <div class="bg-white rounded-2xl border ${isLive ? 'border-blue-400 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200'} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-300 hover:shadow-sm" data-match-id="${m.id}">
        
        <!-- Cột 1: Thông tin Trận, Giờ, Sân -->
        <div class="flex items-center space-x-3 sm:w-1/4">
          <div class="w-12 h-12 rounded-2xl ${m.court === 1 ? 'bg-blue-50 text-blue-700 border-blue-200' : m.court === 2 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} flex flex-col items-center justify-center font-black border shadow-xs">
            <span class="text-[10px] uppercase font-bold tracking-tight opacity-70">Sân</span>
            <span class="text-lg leading-none">${m.court}</span>
          </div>
          <div>
            <div class="text-xs font-black text-slate-800">${m.time} • Trận ${m.id}</div>
            <div class="text-[11px] text-slate-500 font-medium">${m.label || m.note || 'Vòng Bảng'}</div>
          </div>
        </div>

        <!-- Cột 2: Cặp đấu & Tỷ số -->
        <div class="flex-grow flex items-center justify-between sm:justify-center gap-3 sm:gap-6">
          <!-- Đội A -->
          <div class="text-right sm:w-5/12 ${m.winner === m.teamA ? 'font-bold text-emerald-700' : 'text-slate-800'}">
            <div class="text-xs sm:text-sm font-bold flex items-center justify-end gap-1.5">
              <span>${teamA.name}</span>
              <span class="w-5 h-5 rounded-md ${teamA.group === 'X' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-[10px] font-black inline-flex items-center justify-center">
                ${teamA.code}
              </span>
            </div>
            <div class="text-[10px] text-slate-500 truncate max-w-[190px] ml-auto font-medium">${teamA.membersText}</div>
          </div>

          <!-- Tỷ số Set -->
          <div class="flex flex-col items-center justify-center min-w-[70px]">
            <div class="px-3.5 py-1.5 rounded-xl ${isLive ? 'bg-rose-500 text-white font-black shadow-md' : 'bg-slate-100 text-slate-800 font-black'} text-base font-mono tracking-widest border border-slate-200">
              ${setsWon.a} - ${setsWon.b}
            </div>
            ${isLive ? '<span class="live-indicator mt-1.5"></span>' : ''}
          </div>

          <!-- Đội B -->
          <div class="text-left sm:w-5/12 ${m.winner === m.teamB ? 'font-bold text-emerald-700' : 'text-slate-800'}">
            <div class="text-xs sm:text-sm font-bold flex items-center gap-1.5">
              <span class="w-5 h-5 rounded-md ${teamB.group === 'X' ? 'bg-blue-600' : 'bg-rose-600'} text-white text-[10px] font-black inline-flex items-center justify-center">
                ${teamB.code}
              </span>
              <span>${teamB.name}</span>
            </div>
            <div class="text-[10px] text-slate-500 truncate max-w-[190px] font-medium">${teamB.membersText}</div>
          </div>
        </div>

        <!-- Cột 3: Chi tiết các set & Trạng thái -->
        <div class="sm:w-1/4 flex sm:flex-col sm:items-end justify-between items-center text-xs">
          <div class="flex items-center gap-1.5 font-mono text-slate-600">
            ${scores.map(s => `<span class="bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-slate-200/80">${s.a}-${s.b}</span>`).join('')}
          </div>
          <div class="mt-1.5">
            ${isLive 
              ? '<span class="text-rose-600 font-bold text-xs flex items-center gap-1.5"><span class="live-indicator"></span>Đang đấu</span>'
              : isCompleted
              ? '<span class="text-emerald-600 font-bold text-xs flex items-center gap-1"><i class="fa-solid fa-check"></i> Đã xong</span>'
              : '<span class="text-slate-400 font-medium text-xs">Sắp diễn ra</span>'
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
 * Thuật toán tính BXH Vòng Bảng:
 * 1. Điểm thắng trận
 * 2. Hiệu số Set
 * 3. Hiệu số Điểm
 */
function calculateGroupStandings(groupKey) {
  const teams = tournamentData.teams || {};
  const matches = Object.values(tournamentData.matches || {});
  const settings = tournamentData.settings || {};
  const winPts = settings.pointsForWin || 1;

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

  // Duyệt các trận vòng bảng đã hoàn thành
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

  // Sắp xếp
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
      <tr class="${isTop2 ? (groupKey === 'X' ? 'bg-blue-50/60' : 'bg-rose-50/60') : 'hover:bg-slate-50'} transition">
        <td class="py-3 px-3 text-center">
          <span class="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black shadow-xs ${
            rank === 1 ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300' :
            rank === 2 ? 'bg-slate-300 text-slate-900 font-bold' :
            'bg-slate-100 text-slate-500 font-medium'
          }">
            ${rank}
          </span>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-800 flex items-center gap-1.5">
            <span>${item.team.name}</span>
            ${isTop2 ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Vào BK</span>' : ''}
          </div>
          <div class="text-[11px] text-slate-500 truncate max-w-[200px] font-medium">
            ${(item.team.members || []).map(m => m.name).join(' - ')}
          </div>
        </td>
        <td class="py-3 px-2 text-center text-slate-600 font-semibold">${item.played}</td>
        <td class="py-3 px-2 text-center font-bold text-emerald-600">${item.won}</td>
        <td class="py-3 px-2 text-center font-medium text-rose-500">${item.lost}</td>
        <td class="py-3 px-2 text-center font-mono font-semibold ${setDiff > 0 ? 'text-emerald-600' : setDiff < 0 ? 'text-rose-500' : 'text-slate-500'}">
          ${item.setsWon}/${item.setsLost}
        </td>
        <td class="py-3 px-2 text-center font-mono font-semibold ${ptDiff > 0 ? 'text-emerald-600' : ptDiff < 0 ? 'text-rose-500' : 'text-slate-500'}">
          ${ptDiff > 0 ? '+' + ptDiff : ptDiff}
        </td>
        <td class="py-3 px-3 text-center font-black text-sm ${groupKey === 'X' ? 'text-blue-600' : 'text-rose-600'}">
          ${item.points}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * 4. RENDER NHÁNH ĐẤU VÒNG CHUNG KẾT (BRACKET TRỰC QUAN)
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
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Cột 1: VÒNG BÁN KẾT -->
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-1 border-b border-slate-200">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-bolt text-blue-600"></i> Vòng Bán Kết (11h10)
          </h3>
          <span class="text-xs text-slate-400 font-medium">Top 1 vs Top 2 chéo bảng</span>
        </div>
        
        <!-- Bán kết 1 -->
        ${renderBracketMatchCard(m21, 'BÁN KẾT 1 • SÂN 2', 'Nhất Bảng X', 'Nhì Bảng Đ')}

        <!-- Bán kết 2 -->
        ${renderBracketMatchCard(m22, 'BÁN KẾT 2 • SÂN 3', 'Nhất Bảng Đ', 'Nhì Bảng X')}
      </div>

      <!-- Cột 2: TRANH HUY CHƯƠNG -->
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-1 border-b border-slate-200">
          <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-trophy text-amber-500"></i> Tranh Huy Chương (12h20)
          </h3>
          <span class="text-xs text-slate-400 font-medium">Chung kết & Tranh Hạng 3</span>
        </div>

        <!-- Trận Chung Kết -->
        ${renderBracketMatchCard(m24, 'CHUNG KẾT TRANH VÔ ĐỊCH • SÂN 2', 'Thắng Bán kết 1', 'Thắng Bán kết 2', 'final')}

        <!-- Trận Tranh 3-4 -->
        ${renderBracketMatchCard(m23, 'TRANH HẠNG BA (HUY CHƯƠNG ĐỒNG) • SÂN 3', 'Thua Bán kết 1', 'Thua Bán kết 2', 'third')}
      </div>

    </div>
  `;
}

function renderBracketMatchCard(m, title, placeholderA, placeholderB, type = 'normal') {
  if (!m) return '';

  const teamA = getTeamDisplay(m.teamA, placeholderA);
  const teamB = getTeamDisplay(m.teamB, placeholderB);
  const setsWon = m.setsWon || { a: 0, b: 0 };
  const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
  const isCompleted = m.status === 'completed';
  const isPlaying = m.status === 'playing';

  const isFinal = type === 'final';
  const isThird = type === 'third';

  return `
    <div class="bg-white rounded-3xl border ${isFinal ? 'border-amber-400 ring-4 ring-amber-400/15 shadow-md' : isPlaying ? 'border-blue-400 ring-2 ring-blue-500/15' : 'border-slate-200'} p-5 transition hover:shadow-sm" data-match-id="${m.id}">
      
      <!-- Card Header -->
      <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs font-black ${isFinal ? 'text-amber-600' : 'text-slate-700'}">
        <span class="flex items-center gap-1.5">
          ${isFinal ? '<i class="fa-solid fa-crown text-amber-500 text-sm"></i>' : isThird ? '<i class="fa-solid fa-medal text-amber-600 text-sm"></i>' : '<i class="fa-solid fa-diagram-project text-blue-500"></i>'}
          ${title}
        </span>
        <span class="font-semibold text-slate-400">${m.time}</span>
      </div>

      <!-- Teams -->
      <div class="py-3.5 space-y-2">
        <!-- Đội A -->
        <div class="flex items-center justify-between p-2.5 rounded-2xl ${m.winner === m.teamA && isCompleted ? 'bg-emerald-50 border border-emerald-200 font-bold' : 'bg-slate-50 border border-slate-100'}">
          <div>
            <div class="text-xs sm:text-sm font-bold text-slate-800">${teamA.name}</div>
            <div class="text-[10px] text-slate-400 font-medium">${teamA.membersText}</div>
          </div>
          <span class="font-mono font-black text-lg ${m.winner === m.teamA && isCompleted ? 'text-emerald-600' : 'text-slate-800'}">${setsWon.a}</span>
        </div>

        <!-- Đội B -->
        <div class="flex items-center justify-between p-2.5 rounded-2xl ${m.winner === m.teamB && isCompleted ? 'bg-emerald-50 border border-emerald-200 font-bold' : 'bg-slate-50 border border-slate-100'}">
          <div>
            <div class="text-xs sm:text-sm font-bold text-slate-800">${teamB.name}</div>
            <div class="text-[10px] text-slate-400 font-medium">${teamB.membersText}</div>
          </div>
          <span class="font-mono font-black text-lg ${m.winner === m.teamB && isCompleted ? 'text-emerald-600' : 'text-slate-800'}">${setsWon.b}</span>
        </div>
      </div>

      <!-- Scores & Winner Footer -->
      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div class="font-mono text-[11px] text-slate-500 flex gap-1.5">
          ${scores.map(s => `<span class="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">${s.a}-${s.b}</span>`).join('')}
        </div>
        <div>
          ${isCompleted && m.winner ? `
            <span class="font-bold text-emerald-600 flex items-center gap-1">
              <i class="fa-solid fa-trophy text-amber-500"></i>
              ${isFinal ? 'VÔ ĐỊCH: ' : 'Thắng: '} ${getTeamDisplay(m.winner).name}
            </span>
          ` : isPlaying ? `
            <span class="text-rose-600 font-bold flex items-center gap-1">
              <span class="live-indicator"></span> Đang diễn ra
            </span>
          ` : `
            <span class="text-slate-400 font-medium">Chờ thi đấu</span>
          `}
        </div>
      </div>

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

/**
 * 5. TẠO & IN MÃ QR CODE GIẢI ĐẤU
 */
let qrInstance = null;

function setupQrCodeModal() {
  const btnOpen = document.getElementById('btn-qr-modal');
  const btnClose = document.getElementById('btn-close-qr');
  const modal = document.getElementById('qr-modal');
  const qrBox = document.getElementById('qrcode-box');
  const qrInput = document.getElementById('qr-url-input');
  const btnPrint = document.getElementById('btn-print-qr');
  const btnDownload = document.getElementById('btn-download-qr');

  if (!btnOpen || !modal) return;

  btnOpen.addEventListener('click', () => {
    modal.classList.remove('hidden');
    const currentUrl = window.location.href.split('#')[0];
    if (qrInput) qrInput.value = currentUrl;

    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      qrInstance = new QRCode(qrBox, {
        text: currentUrl,
        width: 190,
        height: 190,
        colorDark: "#1e293b",
        colorLight: "#f8fafc",
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
        link.download = 'ma-qr-giai-cau-long-2026.png';
        link.href = img.src;
        link.click();
      }
    });
  }
}


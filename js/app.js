/**
 * CLIENT APP LOGIC (NGƯỜI XEM) - GIẢI CẦU LÔNG GIAO HƯU 2026
 * Hỗ trợ chuẩn xác 100% toàn bộ 48 trận đấu (Đôi Nam Nữ & Đôi Nam)
 * Phong cách Cyberpunk / E-Sports Dark Navy & Glowing Cyan chuẩn theo giao diện mẫu
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
let currentCategory = 'all'; // 'all', 'mixed', 'men'
let searchQuery = '';
let previousScores = {}; // Lưu điểm số lần trước để phát hiện điểm nhảy và tạo hiệu ứng flash
let isTvMode = false;
let groupAccordionState = {}; // Lưu trạng thái đóng/mở của accordion lịch đấu từng bảng
let scheduleViewMode = 'cards'; // 'cards' (Thẻ Bảng Điểm Chuẩn) hoặc 'rows' (Hàng Ngang)

async function startClientApp() {
  setupLiveClock();
  setupTabNavigation();
  setupCategoryFilters();
  setupSearchInput();
  setupRankRulesModal();
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

// Khởi chạy khi DOM sẵn sàng
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
    syncText.textContent = "Cloud DB: Trực tuyến";
    syncIcon.className = "fa-solid fa-cloud text-cyan-400";
    if (syncStatus) syncStatus.className = "inline-flex items-center gap-1 text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold";
  } else if (mode === 'disconnected') {
    syncText.textContent = "Cloud DB: Mất kết nối";
    syncIcon.className = "fa-solid fa-triangle-exclamation text-amber-400";
    if (syncStatus) syncStatus.className = "inline-flex items-center gap-1 text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold";
  } else {
    syncText.textContent = "Chưa kết nối Cloud DB";
    syncIcon.className = "fa-solid fa-plug-circle-xmark text-rose-400";
    if (syncStatus) syncStatus.className = "inline-flex items-center gap-1 text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold";
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
      tvBtn.classList.add('bg-amber-500', 'text-slate-900', 'border-amber-400');
      tvBtn.classList.remove('bg-[#0c1626]', 'text-amber-300');
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      tvBtn.classList.remove('bg-amber-500', 'text-slate-900', 'border-amber-400');
      tvBtn.classList.add('bg-[#0c1626]', 'text-amber-300');
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  });
}

/**
 * Điều hướng Tab (Lịch & Địa Điểm, Thể Lệ, Bảng Điểm, Trực Tiếp Sân, Knockout)
 */
function setupTabNavigation() {
  const tabs = [
    { btn: 'tab-btn-schedule', section: 'section-schedule' },
    { btn: 'tab-btn-rules', section: 'section-rules' },
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
          b.classList.remove('tab-pill-cyan-active');
          b.classList.add('tab-pill-cyan-inactive');
        }
        if (s) s.classList.add('hidden');
      });

      btnEl.classList.remove('tab-pill-cyan-inactive');
      btnEl.classList.add('tab-pill-cyan-active');
      const targetSec = document.getElementById(section);
      if (targetSec) targetSec.classList.remove('hidden');
    });
  });

  // Nút quay lại Bảng Điểm từ tab Thể Lệ
  const backBtn = document.getElementById('btn-back-to-standings');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const standingsTab = document.getElementById('tab-btn-standings');
      if (standingsTab) standingsTab.click();
    });
  }
}

/**
 * Bộ lọc Danh mục thi đấu (TẤT CẢ, ĐÔI NAM NỮ, ĐÔI NAM)
 */
function setupCategoryFilters() {
  const catBtns = document.querySelectorAll('.cat-filter-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => {
        b.classList.remove('active', 'bg-gradient-to-r', 'from-cyan-600', 'to-cyan-500', 'text-white', 'border-cyan-400', 'shadow-[0_0_12px_rgba(6,182,212,0.5)]');
        b.classList.add('bg-[#0c1524]', 'hover:bg-[#132238]', 'border-[#1c2e47]', 'text-slate-300');
      });

      btn.classList.add('active', 'bg-gradient-to-r', 'from-cyan-600', 'to-cyan-500', 'text-white', 'border-cyan-400', 'shadow-[0_0_12px_rgba(6,182,212,0.5)]');
      btn.classList.remove('bg-[#0c1524]', 'hover:bg-[#132238]', 'border-[#1c2e47]', 'text-slate-300');

      currentCategory = btn.dataset.cat || 'all';
      renderStandings();
      renderScheduleList();
    });
  });
}

/**
 * Bộ lọc lịch thi đấu theo sân / knockout
 */
function setupScheduleFilters() {
  const filterBtns = document.querySelectorAll('.schedule-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-cyan-600', 'text-white', 'shadow-[0_0_10px_rgba(0,229,255,0.4)]', 'border-cyan-400');
        b.classList.add('bg-[#091120]', 'text-slate-300', 'border-[#16263f]');
      });
      btn.classList.add('active', 'bg-cyan-600', 'text-white', 'shadow-[0_0_10px_rgba(0,229,255,0.4)]', 'border-cyan-400');
      btn.classList.remove('bg-[#091120]', 'text-slate-300', 'border-[#16263f]');

      currentFilter = btn.dataset.filter;
      renderScheduleList();
    });
  });

  const modeBtns = document.querySelectorAll('.schedule-view-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => {
        b.classList.remove('active', 'bg-cyan-600', 'text-white', 'shadow-sm', 'border-cyan-400');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active', 'bg-cyan-600', 'text-white', 'shadow-sm', 'border-cyan-400');
      btn.classList.remove('text-slate-400');

      scheduleViewMode = btn.dataset.mode || 'cards';
      renderScheduleList();
    });
  });
}

/**
 * Ô tìm kiếm toàn cục VĐV hoặc mã đội
 */
function setupSearchInput() {
  const searchInput = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('btn-clear-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    if (clearBtn) {
      if (searchQuery) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }
    renderStandings();
    renderScheduleList();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.classList.add('hidden');
      renderStandings();
      renderScheduleList();
    });
  }
}

/**
 * Modal Cách tính xếp hạng vòng bảng
 */
function setupRankRulesModal() {
  const modal = document.getElementById('rank-rules-modal');
  const openBtn = document.getElementById('btn-open-rank-rules');
  const closeBtn = document.getElementById('btn-close-rank-rules');
  const okBtn = document.getElementById('btn-ok-rank-rules');

  const openModal = () => {
    if (modal) modal.classList.remove('hidden');
  };
  const closeModal = () => {
    if (modal) modal.classList.add('hidden');
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (okBtn) okBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Cho phép gọi từ ngoài HTML
  window.openRankRulesModal = openModal;
}

/**
 * Modal mã QR
 */
function setupQrCodeModal() {
  const modal = document.getElementById('qr-modal');
  const btnOpen = document.getElementById('btn-qr-modal');
  const btnOpenMobile = document.getElementById('btn-qr-modal-mobile');
  const btnClose = document.getElementById('btn-close-qr');
  const qrBox = document.getElementById('qrcode-box');
  const qrUrlInput = document.getElementById('qr-url-input');
  const btnPrint = document.getElementById('btn-print-qr');
  const btnDownload = document.getElementById('btn-download-qr');

  if (!modal) return;

  let qrInstance = null;

  const openQr = () => {
    const currentUrl = window.location.href;
    if (qrUrlInput) qrUrlInput.value = currentUrl;

    if (qrBox && window.QRCode) {
      qrBox.innerHTML = '';
      qrInstance = new QRCode(qrBox, {
        text: currentUrl,
        width: 190,
        height: 190,
        colorDark: "#0c1524",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
    modal.classList.remove('hidden');
  };

  const closeQr = () => {
    modal.classList.add('hidden');
  };

  if (btnOpen) btnOpen.addEventListener('click', openQr);
  if (btnOpenMobile) btnOpenMobile.addEventListener('click', openQr);
  if (btnClose) btnClose.addEventListener('click', closeQr);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeQr();
  });

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const img = qrBox.querySelector('img');
      if (img && img.src) {
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'ma-qr-giai-cau-long-2026.png';
        a.click();
      }
    });
  }
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
      "1_set_31": "Thể thức: 1 hiệp 31 điểm",
      "mixed_group21_ko15": "Vòng bảng: 1 set 21 • Knockout: 3 set 15"
    };
    formatBadge.textContent = formatMap[settings.format] || "Thể thức: Tất cả các trận 1 set 15 điểm";
  }

  renderStandings();
  renderBracket();
}

/**
 * =========================================================================
 * 1. RENDER BẢNG ĐIỂM (STANDINGS + IN-CARD MATCH SCHEDULES) - 48 TRẬN CHUẨN XÁC
 * =========================================================================
 */
function renderStandings() {
  const container = document.getElementById('groups-container');
  if (!container) return;

  const teams = tournamentData.teams || {};
  const matches = Object.values(tournamentData.matches || {});

  const groups = [
    { key: 'X', name: 'BẢNG XANH (X)', color: 'cyan' },
    { key: 'D', name: 'BẢNG ĐỎ (Đ)', color: 'rose' }
  ];

  let html = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full">';

  groups.forEach(grp => {
    const groupKey = grp.key;
    const isCyan = grp.color === 'cyan';
    const accordionId = `group-standings-${groupKey}`;

    const groupMatches = matches.filter(m => m.stage === 'group' && m.group === groupKey);
    const completedMatchesCount = groupMatches.filter(m => m.status === 'completed').length;
    const groupTeamsList = Object.values(teams).filter(t => t.group === groupKey);

    const standingsList = calculateGroupStandings(groupKey);

    let displayedStandings = standingsList;
    if (searchQuery) {
      displayedStandings = standingsList.filter(item => {
        const team = item.team;
        const membersStr = (team.members || []).map(m => m.name).join(' ');
        const searchPool = [team.name, team.code, team.id, team.menName || '', team.mixedName || '', membersStr].join(' ').toLowerCase();
        return searchPool.includes(searchQuery);
      });
    }

    let tableRowsHtml = '';
    if (displayedStandings.length === 0) {
      tableRowsHtml = `
        <tr>
          <td colspan="6" class="py-6 text-center text-slate-500 italic text-xs">
            Không có VĐV nào khớp với từ khóa tìm kiếm
          </td>
        </tr>
      `;
    } else {
      displayedStandings.forEach((item, index) => {
        const rank = index + 1;
        const ptDiff = item.pointsWon - item.pointsLost;
        
        let rankBadgeHtml = `<span class="text-slate-400 font-bold text-xs">${rank}</span>`;
        if (rank === 1) {
          rankBadgeHtml = `<span class="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center font-black text-xs shadow-sm">1</span>`;
        } else if (rank === 2) {
          rankBadgeHtml = `<span class="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 inline-flex items-center justify-center font-black text-xs shadow-sm">2</span>`;
        } else if (rank === 3) {
          rankBadgeHtml = `<span class="w-6 h-6 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/40 inline-flex items-center justify-center font-bold text-xs">3</span>`;
        }

        const athleteNames = (item.team.members && item.team.members.length > 0)
          ? item.team.members.map(m => m.name).join(' / ')
          : item.team.name;

        tableRowsHtml += `
          <tr class="hover:bg-[#0e1b2f]/60 transition border-b border-[#121f33]/60">
            <!-- RANK -->
            <td class="py-2.5 px-2 text-center font-black text-[11px]">
              ${rankBadgeHtml}
            </td>

            <!-- TEAM CODE -->
            <td class="py-2.5 px-2">
              <span class="px-2 py-0.5 rounded bg-[#101e33] text-slate-200 border border-[#1d3252] text-[11px] font-black tracking-wider">
                ${item.team.code}
              </span>
            </td>

            <!-- ATHLETE -->
            <td class="py-2.5 px-2 font-bold text-white text-[11px] max-w-[170px] truncate">
              ${athleteNames}
            </td>

            <!-- TRẬN THẮNG (T: +1đ/trận thắng) -->
            <td class="py-2.5 px-2 text-center font-mono font-black text-[11px] text-emerald-400">
              ${item.won}
            </td>

            <!-- HIỆU SỐ (HS) -->
            <td class="py-2.5 px-2 text-center font-mono font-bold text-[11px] ${ptDiff > 0 ? 'text-emerald-400' : ptDiff < 0 ? 'text-rose-400' : 'text-slate-400'}">
              ${ptDiff > 0 ? '+' + ptDiff : ptDiff}
            </td>

            <!-- TỔNG ĐIỂM SĨ SỐ (Đ) -->
            <td class="py-2.5 px-2 text-center font-mono font-bold text-[11px] text-cyan-400">
              ${item.pointsWon}
            </td>
          </tr>
        `;
      });
    }

    // Render danh sách các trận vòng bảng thuộc bảng này
    let matchesHtml = '';
    const sortedGroupMatches = [...groupMatches].sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));

    let displayGroupMatches = sortedGroupMatches;
    if (searchQuery) {
      displayGroupMatches = sortedGroupMatches.filter(m => {
        const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category);
        const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category);
        const namesA = getPlayerNameLines(teamA, m.category);
        const namesB = getPlayerNameLines(teamB, m.category);

        const poolA = [teamA.code, teamA.name, namesA.line1, namesA.line2, (teamA.members || []).map(mem => mem.name).join(' ')].join(' ').toLowerCase();
        const poolB = [teamB.code, teamB.name, namesB.line1, namesB.line2, (teamB.members || []).map(mem => mem.name).join(' ')].join(' ').toLowerCase();
        const matchPool = [m.id, `m${m.matchNo}`, `#${m.matchNo}`, `sân ${m.court}`, m.time, poolA, poolB].join(' ').toLowerCase();

        return matchPool.includes(searchQuery);
      });
    }

    if (displayGroupMatches.length === 0) {
      matchesHtml = `
        <div class="py-4 text-center text-slate-500 italic text-xs">
          Không có trận đấu nào khớp với từ khóa tìm kiếm
        </div>
      `;
    } else {
      displayGroupMatches.forEach(m => {
        const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category);
        const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category);

        const isLive = m.status === 'playing';
        const isCompleted = m.status === 'completed';

        const scores = m.scores || [{ a: 0, b: 0 }];
        const s1 = scores[0] || { a: 0, b: 0 };

        let statusBadgeText = '';
        if (isLive) {
          statusBadgeText = '<span class="text-rose-400 font-bold animate-pulse">[Đang đấu]</span>';
        } else if (isCompleted) {
          statusBadgeText = '<span class="text-slate-400">[Đã đấu]</span>';
        } else {
          statusBadgeText = '<span class="text-slate-500">[Sắp đấu]</span>';
        }

        let scoreBadge = isCompleted || isLive ? `[${s1.a} - ${s1.b}]` : `[ - ]`;

        const namesA = getPlayerNameLines(teamA, m.category);
        const namesB = getPlayerNameLines(teamB, m.category);

        const aWin = (isCompleted || isLive) && (m.winner === m.teamA || s1.a > s1.b);
        const bWin = (isCompleted || isLive) && (m.winner === m.teamB || s1.b > s1.a);

        matchesHtml += `
          <div class="bg-[#070d18] py-2 px-2.5 hover:bg-[#0f1b2d] rounded-xl transition border border-[#14233a] text-[11px] space-y-1 my-1.5 shadow-sm" data-match-id="${m.id}">
            <!-- Dòng 1: #1 Sân 1 07:30 ---------------- [Đang đấu] -->
            <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-0.5 border-b border-[#142338]/40">
              <div class="flex items-center gap-1.5">
                <span class="text-slate-500 font-bold">#${m.matchNo || m.id.replace(/\D/g,'')}</span>
                <span class="text-cyan-400 font-medium">Sân ${m.court} • ${m.time}</span>
              </div>
              <div>
                ${statusBadgeText}
              </div>
            </div>

            <!-- Dòng 2: Team A -->
            <div class="flex items-center justify-between gap-2 py-0.5 ${aWin ? 'text-cyan-300 font-bold' : 'text-slate-200'}">
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <span class="px-1.5 py-0.2 rounded ${aWin ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#101e33] text-cyan-300 border border-[#1d3252]'} text-[10px] font-black shrink-0 font-mono">${teamA.code}</span>
                <span class="text-[11px] font-medium leading-tight text-white break-words">
                  ${namesA.line1}${namesA.line2 ? ` | ${namesA.line2}` : ''}
                </span>
              </div>
              <span class="font-mono font-black text-[11px] px-2 py-0.5 rounded ${isCompleted || isLive ? (aWin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#091120] text-slate-300') : 'text-slate-500'} shrink-0">
                ${isCompleted || isLive ? s1.a : '-'}
              </span>
            </div>

            <!-- Dòng 3: Team B -->
            <div class="flex items-center justify-between gap-2 py-0.5 ${bWin ? 'text-cyan-300 font-bold' : 'text-slate-200'}">
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <span class="px-1.5 py-0.2 rounded ${bWin ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#101e33] text-cyan-300 border border-[#1d3252]'} text-[10px] font-black shrink-0 font-mono">${teamB.code}</span>
                <span class="text-[11px] font-medium leading-tight text-white break-words">
                  ${namesB.line1}${namesB.line2 ? ` | ${namesB.line2}` : ''}
                </span>
              </div>
              <span class="font-mono font-black text-[11px] px-2 py-0.5 rounded ${isCompleted || isLive ? (bWin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#091120] text-slate-300') : 'text-slate-500'} shrink-0">
                ${isCompleted || isLive ? s1.b : '-'}
              </span>
            </div>
          </div>
        `;
      });
    }

    const isAccordionOpen = searchQuery ? true : (groupAccordionState[accordionId] === true);

    html += `
      <div class="space-y-5 sm:space-y-6">
        
        <!-- ELEMENT 1: BẢNG ĐIỂM XẾP HẠNG -->
        <div class="bg-[#0c1524] rounded-2xl border ${isCyan ? 'border-cyan-500/30' : 'border-rose-500/30'} p-4 sm:p-5 shadow-2xl space-y-4">
          <!-- Header Bảng: Tên Bảng & Số trận hoàn thành -->
          <div class="flex items-center justify-between pb-3 border-b border-[#142338]">
            <div class="flex items-center space-x-2 sm:space-x-2.5">
              <span class="w-3 h-3 rounded-full ${isCyan ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}"></span>
              <h3 class="font-black text-[11px] text-white uppercase tracking-wider">
                ${grp.name}
              </h3>
            </div>
            <div class="text-[11px] font-mono font-bold">
              <span class="${completedMatchesCount === sortedGroupMatches.length && sortedGroupMatches.length > 0 ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}">${completedMatchesCount}/${sortedGroupMatches.length}</span>
            </div>
          </div>

          <!-- Bảng Điểm Standings chuẩn theo giao diện mẫu -->
          <div class="overflow-x-auto my-1">
            <table class="w-full text-[11px] text-left whitespace-nowrap">
              <thead class="text-slate-400 border-b border-[#142338] text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th class="py-2.5 px-2 text-center w-10">RANK</th>
                  <th class="py-2.5 px-2 w-14">TEAM</th>
                  <th class="py-2.5 px-2">ATHLETE</th>
                  <th class="py-2.5 px-2 text-center text-emerald-400" title="Trận thắng (+1 điểm/trận thắng)">T</th>
                  <th class="py-2.5 px-2 text-center" title="Hiệu số điểm quả (Tổng điểm ghi được - bị mất)">HS</th>
                  <th class="py-2.5 px-2 text-center text-cyan-400" title="Tổng điểm thắng sĩ số">Đ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#121f33]/40">
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- ELEMENT 2: LỊCH THI ĐẤU & TỶ SỐ (ELEMENT RIÊNG BIỆT) -->
        <div class="bg-[#0c1524] rounded-2xl border ${isCyan ? 'border-cyan-500/30' : 'border-rose-500/30'} p-4 sm:p-5 shadow-2xl space-y-3">
          <button type="button" class="group-matches-toggle w-full flex items-center justify-between text-[11px] text-slate-200 hover:text-cyan-400 font-bold uppercase tracking-wider transition py-1" data-accordion="${accordionId}">
            <div class="flex items-center space-x-2 sm:space-x-2.5">
              <span>LỊCH THI ĐẤU & TỶ SỐ (${sortedGroupMatches.length} TRẬN)</span>
            </div>
            <i class="fa-solid fa-chevron-up ${isCyan ? 'text-cyan-400' : 'text-rose-400'} text-xs transition-transform transform ${isAccordionOpen ? '' : 'rotate-180'}"></i>
          </button>

          <div class="group-matches-content space-y-1 pt-2 border-t border-[#142338] ${isAccordionOpen ? '' : 'hidden'}" id="group-matches-${accordionId}">
            ${matchesHtml}
          </div>
        </div>

      </div>
    `;
  });

  html += '</div>';

  container.innerHTML = html;

  // Gắn sự kiện đóng mở accordion
  const toggleBtns = container.querySelectorAll('.group-matches-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const accId = btn.dataset.accordion;
      const content = document.getElementById(`group-matches-${accId}`);
      const icon = btn.querySelector('i.fa-chevron-up');
      if (content && icon) {
        const isHidden = content.classList.contains('hidden');
        if (isHidden) {
          content.classList.remove('hidden');
          icon.classList.remove('rotate-180');
          groupAccordionState[accId] = true;
        } else {
          content.classList.add('hidden');
          icon.classList.add('rotate-180');
          groupAccordionState[accId] = false;
        }
      }
    });
  });
}

/**
 * Thuật toán tính BXH Vòng Bảng (Có lọc theo Category)
 */
function calculateGroupStandings(groupKey, category = null) {
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
      if (category && m.category && m.category !== category) return;

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

  // Sắp xếp: Số trận thắng T (+1đ/trận) -> Hiệu số HS -> Tổng điểm thắng sĩ số Đ
  const sorted = Object.values(stats).sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    const diffPtsA = a.pointsWon - a.pointsLost;
    const diffPtsB = b.pointsWon - b.pointsLost;
    if (diffPtsB !== diffPtsA) return diffPtsB - diffPtsA;
    return b.pointsWon - a.pointsWon;
  });

  return sorted;
}

/**
 * =========================================================================
 * 2. RENDER LỊCH THI ĐẤU & KẾT QUẢ (SCHEDULE LIST THEO SÂN & THỜI GIAN)
 * =========================================================================
 */
function renderScheduleList() {
  const container = document.getElementById('schedule-list-container');
  if (!container) return;

  const rawMatches = Object.values(tournamentData.matches || {});
  const matches = rawMatches.map(m => window.sanitizeMatch ? window.sanitizeMatch(m) : m);
  
  // Sắp xếp các trận theo số thứ tự matchNo hoặc thời gian
  const sortedMatches = [...matches].sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));

  // Áp dụng bộ lọc và tìm kiếm
  const filtered = sortedMatches.filter(m => {
    let passFilter = true;
    if (currentFilter === 'court-1') passFilter = Number(m.court) === 1;
    else if (currentFilter === 'court-2') passFilter = Number(m.court) === 2;
    else if (currentFilter === 'court-3') passFilter = Number(m.court) === 3;
    else if (currentFilter === 'knockout') passFilter = m.stage !== 'group';
    if (!passFilter) return false;

    if (searchQuery) {
      const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category);
      const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category);
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
      <div class="bg-[#0c1524] rounded-2xl p-10 text-center text-slate-400 border border-[#16263f]">
        <i class="fa-solid fa-magnifying-glass text-3xl mb-3 text-slate-500"></i>
        <p class="text-sm font-semibold text-slate-300">Không tìm thấy trận đấu phù hợp</p>
        <p class="text-xs text-slate-500 mt-1">Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc "Tất cả"</p>
      </div>
    `;
    return;
  }

  const isCardMode = scheduleViewMode === 'cards';

  let html = '';
  if (isCardMode) {
    html = '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 p-1 sm:p-2">';
    filtered.forEach(m => {
      html += renderRedesignedMatchCard(m);
    });
    html += '</div>';
  } else {
    filtered.forEach(m => {
      const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category);
      const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category);

      const isLive = m.status === 'playing';
      const isCompleted = m.status === 'completed';

      const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
      const setsWon = m.setsWon || { a: 0, b: 0 };

      const formatInfo = window.getMatchFormat ? window.getMatchFormat(m, tournamentData.settings) : {
        isGroup: m.stage === 'group',
        label: m.stage === 'group' ? "1 set 21" : "3 set 15"
      };

      const s1 = scores[0] || { a: 0, b: 0 };
      const playedSets = scores.filter(s => s.a > 0 || s.b > 0);

      const namesA = getPlayerNameLines(teamA, m.category);
      const namesB = getPlayerNameLines(teamB, m.category);

      const catBadge = m.category === 'mixed'
        ? '<span class="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">Đôi Nam Nữ</span>'
        : '<span class="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50">Đôi Nam</span>';

      let statusBadgeText = '';
      if (isLive) {
        statusBadgeText = '<span class="text-rose-400 font-bold animate-pulse">[Đang đấu]</span>';
      } else if (isCompleted) {
        statusBadgeText = '<span class="text-slate-400">[Đã đấu]</span>';
      } else {
        statusBadgeText = '<span class="text-slate-500">[Sắp đấu]</span>';
      }

      html += `
        <div class="bg-[#0c1524] rounded-2xl border ${isLive ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-[0_0_15px_rgba(0,229,255,0.15)]' : 'border-[#16263f]'} p-3.5 hover:bg-[#0e1b2f] transition text-xs space-y-1.5 mb-3" data-match-id="${m.id}">
          <!-- Dòng 1: #1 Sân 1 07:30 ---------------- [Đang đấu] -->
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono pb-1 border-b border-[#142338]/60">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-slate-500 font-bold">#${m.matchNo || m.id.replace(/\D/g,'')}</span>
              <span class="text-cyan-400 font-semibold">Sân ${m.court} • ${m.time}</span>
              ${catBadge}
            </div>
            <div>
              ${statusBadgeText}
            </div>
          </div>

          <!-- Dòng 2: X1 Toàn - Trung cute | Ngân ---------------- 15 -->
          <div class="flex items-center justify-between gap-2 py-0.5 ${m.winner === m.teamA ? 'text-cyan-300 font-bold' : 'text-slate-200'}">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="px-1.5 py-0.5 rounded bg-[#101e33] text-cyan-300 border border-[#1d3252] text-xs font-black shrink-0 font-mono">${teamA.code}</span>
              <span class="text-xs font-medium leading-tight text-white break-words">
                ${namesA.line1}${namesA.line2 ? ` | ${namesA.line2}` : ''}
              </span>
            </div>
            <span class="font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded ${isCompleted || isLive ? (m.winner === m.teamA ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#091120] text-slate-300') : 'text-slate-500'} shrink-0">
              ${isCompleted || isLive ? (formatInfo.isGroup ? s1.a : setsWon.a) : '-'}
            </span>
          </div>

          <!-- Dòng 3: X2 Gia - Bảo bối | Trúc ---------------- 10 -->
          <div class="flex items-center justify-between gap-2 py-0.5 ${m.winner === m.teamB ? 'text-cyan-300 font-bold' : 'text-slate-200'}">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="px-1.5 py-0.5 rounded bg-[#101e33] text-cyan-300 border border-[#1d3252] text-xs font-black shrink-0 font-mono">${teamB.code}</span>
              <span class="text-xs font-medium leading-tight text-white break-words">
                ${namesB.line1}${namesB.line2 ? ` | ${namesB.line2}` : ''}
              </span>
            </div>
            <span class="font-mono font-black text-xs sm:text-sm px-2.5 py-0.5 rounded ${isCompleted || isLive ? (m.winner === m.teamB ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#091120] text-slate-300') : 'text-slate-500'} shrink-0">
              ${isCompleted || isLive ? (formatInfo.isGroup ? s1.b : setsWon.b) : '-'}
            </span>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

/**
 * =========================================================================
 * 3. RENDER 3 SÂN THI ĐẤU (LIVE COURTS DASHBOARD)
 * =========================================================================
 */
function renderLiveCourts() {
  const container = document.getElementById('courts-container');
  if (!container) return;

  const matches = Object.values(tournamentData.matches || {});
  const courts = [1, 2, 3];

  let html = '';

  courts.forEach(courtNumber => {
    let activeMatch = matches.find(m => Number(m.court) === courtNumber && m.status === 'playing');
    
    if (!activeMatch) {
      activeMatch = matches.find(m => Number(m.court) === courtNumber && m.status === 'scheduled');
    }

    if (!activeMatch) {
      const finished = matches.filter(m => Number(m.court) === courtNumber && m.status === 'completed');
      if (finished.length > 0) {
        activeMatch = finished[finished.length - 1];
      }
    }

    if (!activeMatch) {
      html += `
        <div class="court-card bg-[#0c1524] rounded-3xl border border-[#16263f] p-5 sm:p-6 flex flex-col justify-between">
          <div class="flex items-center justify-between pb-3 border-b border-[#142338]">
            <span class="font-extrabold text-base text-white">SÂN ${courtNumber}</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-[#091120] text-slate-500 font-medium">Trống</span>
          </div>
          <div class="py-10 text-center text-slate-500 text-sm">
            <i class="fa-solid fa-moon text-3xl mb-2 text-slate-600"></i>
            <p>Hiện không có trận đấu</p>
          </div>
        </div>
      `;
      return;
    }

    // Các trận tiếp theo trên sân này (tối đa 2 trận kế tiếp)
    const upcomingOnCourt = matches.filter(m => Number(m.court) === courtNumber && m.id !== activeMatch.id && m.status === 'scheduled').slice(0, 2);

    const teamA = getTeamDisplay(activeMatch.teamA, activeMatch.placeholderA, activeMatch.category);
    const teamB = getTeamDisplay(activeMatch.teamB, activeMatch.placeholderB, activeMatch.category);

    const isLive = activeMatch.status === 'playing';
    const isCompleted = activeMatch.status === 'completed';

    const formatInfo = window.getMatchFormat ? window.getMatchFormat(activeMatch, tournamentData.settings) : {
      isGroup: activeMatch.stage === 'group',
      label: activeMatch.stage === 'group' ? "1 set 21" : "3 set 15"
    };

    let statusBadge = '';
    if (isLive) {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-950/80 text-rose-400 border border-rose-500/40 shadow-sm animate-pulse">
        <span class="live-indicator-red"></span> ĐANG ĐẤU
      </span>`;
    } else if (isCompleted) {
      statusBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
        <i class="fa-solid fa-check mr-1"></i> ĐÃ XONG
      </span>`;
    } else {
      statusBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-[#091120] text-amber-300 border border-amber-500/30">
        <i class="fa-regular fa-clock mr-1"></i> ${activeMatch.time}
      </span>`;
    }

    const scores = activeMatch.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    const setsWon = activeMatch.setsWon || { a: 0, b: 0 };

    let scoreText = '';
    let subDetailText = '';

    if (formatInfo.isGroup) {
      const s1 = scores[0] || { a: 0, b: 0 };
      scoreText = `[${s1.a} - ${s1.b}]`;
      subDetailText = `Thể thức: 1 set chạm 21`;
    } else {
      if (isLive) {
        const setIdx = Math.min((setsWon.a + setsWon.b), 2);
        const curScore = scores[setIdx] || { a: 0, b: 0 };
        scoreText = `[${curScore.a} - ${curScore.b}]`;
        subDetailText = `Đang đánh Set ${setIdx + 1} (Tỷ số set: ${setsWon.a}-${setsWon.b})`;
      } else {
        scoreText = `[${setsWon.a} - ${setsWon.b}]`;
        const played = scores.filter(s => s.a > 0 || s.b > 0).map(s => `${s.a}-${s.b}`).join(', ');
        subDetailText = played ? `Các set: ${played}` : `Thể thức: 3 set 15`;
      }
    }

    html += `
      <div class="court-card bg-[#0c1524] rounded-3xl border ${isLive ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-[0_0_20px_rgba(0,229,255,0.2)]' : 'border-[#16263f]'} p-5 sm:p-6 flex flex-col justify-between" data-match-id="${activeMatch.id}">
        
        <!-- Header Sân -->
        <div class="flex items-center justify-between pb-3 border-b border-[#142338]">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-[#081e33] border border-cyan-500/40 text-cyan-400 font-extrabold text-xs flex items-center justify-center shadow-xs">
              ${courtNumber}
            </span>
            <div>
              <span class="font-extrabold text-sm text-white">SÂN ${courtNumber}</span>
              <span class="text-[11px] text-slate-400 ml-1.5 font-medium">Trận ${activeMatch.id}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#091120] text-cyan-300 border border-[#16263f]">
              ${formatInfo.label}
            </span>
            ${statusBadge}
          </div>
        </div>

        <!-- BẢNG ĐIỂM TRUNG TÂM -->
        <div class="my-3 py-4 px-4 sm:px-5 rounded-2xl bg-[#08111e] border border-[#16263f] flex items-center justify-between shadow-inner">
          <!-- Đội A -->
          <div class="w-5/12 text-left">
            <div class="text-xl sm:text-2xl font-black text-white tracking-wide">
              ${teamA.code || teamA.id}
            </div>
            <div class="text-xs text-[#7d93b0] font-medium truncate" title="${teamA.name}">
              ${teamA.name}
            </div>
          </div>

          <!-- Tỷ số [15 - 7] -->
          <div class="w-2/12 flex flex-col items-center justify-center text-center">
            <span class="px-2 py-0.5 rounded bg-[#0c182a] text-cyan-400 text-[11px] font-mono font-bold border border-cyan-800/50 mb-1">
              ${activeMatch.time}
            </span>
            <div class="text-xl sm:text-2xl font-mono font-black text-cyan-300 tracking-wider whitespace-nowrap score-pill-cyan px-2.5 py-0.5 rounded-lg">
              ${scoreText}
            </div>
          </div>

          <!-- Đội B -->
          <div class="w-5/12 text-right">
            <div class="text-xl sm:text-2xl font-black text-white tracking-wide">
              ${teamB.code || teamB.id}
            </div>
            <div class="text-xs text-[#7d93b0] font-medium truncate" title="${teamB.name}">
              ${teamB.name}
            </div>
          </div>
        </div>

        <!-- Footer Card -->
        <div class="pt-2.5 border-t border-[#142338] flex items-center justify-between text-xs text-slate-400 font-medium">
          <span class="text-[11px] text-cyan-400/80 font-mono">
            ${subDetailText}
          </span>
          <span class="text-slate-400 font-semibold truncate max-w-[150px] text-right">
            ${activeMatch.label || activeMatch.note || 'Vòng Bảng'}
          </span>
        </div>

        <!-- Các trận sắp tới trên sân này -->
        ${upcomingOnCourt.length > 0 ? `
          <div class="mt-3 pt-2.5 border-t border-[#142338]/80 space-y-1.5">
            <div class="text-[10px] uppercase font-bold text-cyan-400/80 tracking-wider flex items-center gap-1">
              <i class="fa-regular fa-clock text-[10px]"></i> Các trận tiếp theo trên Sân ${courtNumber}:
            </div>
            ${upcomingOnCourt.map(u => `
              <div class="flex items-center justify-between text-[11px] bg-[#091120] px-2.5 py-1.5 rounded-lg border border-[#16263f]">
                <span class="font-mono text-cyan-400 font-bold">${u.time} • Trận ${u.id}</span>
                <span class="text-white font-semibold">${getTeamDisplay(u.teamA, u.placeholderA, u.category).code || getTeamDisplay(u.teamA, u.placeholderA, u.category).name} vs ${getTeamDisplay(u.teamB, u.placeholderB, u.category).code || getTeamDisplay(u.teamB, u.placeholderB, u.category).name}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * =========================================================================
 * 4. RENDER NHÁNH ĐẤU VÒNG CHUNG KẾT (BRACKET ĐÔI NAM NỮ & ĐÔI NAM)
 * =========================================================================
 */
function getTeam3MembersText(teamInfo, placeholder) {
  if (!teamInfo || !teamInfo.id || !tournamentData.teams || !tournamentData.teams[teamInfo.id]) {
    return teamInfo?.name || placeholder || "Chưa xác định";
  }
  const team = tournamentData.teams[teamInfo.id];
  if (team.members && Array.isArray(team.members) && team.members.length > 0) {
    const names = team.members.map(m => m.name).filter(Boolean);
    if (names.length > 0) return names.join(' - ');
  }
  return team.name || placeholder;
}

function getKnockoutSubMatchPair(m, teamId, placeholder) {
  if (!teamId || !tournamentData.teams || !tournamentData.teams[teamId]) {
    return placeholder || "Chưa xác định";
  }
  const team = tournamentData.teams[teamId];
  const members = team.members || [];
  const mA = members.find(mem => mem.role === 'A') || members[0] || { name: "" };
  const ma = members.find(mem => mem.role === 'a') || members[1] || { name: "" };
  const mb = members.find(mem => mem.role === 'b') || members[2] || { name: "" };

  const subType = m ? (m.subType || "") : "";
  const matchCode = m ? (m.code || "") : "";

  if (subType === 'Ab' || matchCode.includes('Ab')) {
    if (mA.name && mb.name) return `${mA.name} / ${mb.name}`;
  } else if (subType === 'ab' || matchCode.includes('ab')) {
    if (ma.name && mb.name) return `${ma.name} / ${mb.name}`;
  } else if (subType === 'Aa' || matchCode.includes('Aa') || m?.category === 'men') {
    if (team.menName) return team.menName;
    if (mA.name && ma.name) return `${mA.name} - ${ma.name}`;
  }

  return team.name || placeholder;
}

function renderBracket() {
  const container = document.getElementById('bracket-container');
  if (!container) return;

  const matches = tournamentData.matches || {};

  // Trận Đồng Đội 1: Bán kết 1 (Nhất X vs Nhì Đ) -> M41 (Ab), M43 (ab), M45 (Aa)
  const bk1TieMatches = ['M41', 'M43', 'M45'];
  
  // Trận Đồng Đội 2: Bán kết 2 (Nhất Đ vs Nhì X) -> M42 (Ab), M44 (ab), M46 (Aa)
  const bk2TieMatches = ['M42', 'M44', 'M46'];

  // Trận Đồng Đội 3: Chung kết (Thắng BK1 vs Thắng BK2) -> M47 (Ab), M49 (ab), M51 (Aa)
  const finalTieMatches = ['M47', 'M49', 'M51'];

  // Trận Đồng Đội 4: Tranh Hạng Ba (Thua BK1 vs Thua BK2) -> M48 (Ab), M50 (ab), M52 (Aa)
  const thirdTieMatches = ['M48', 'M50', 'M52'];

  const getTieWinner = (matchesList) => {
    const subMatches = matchesList.map(id => matches[id]).filter(Boolean);
    if (subMatches.length === 0) return null;
    let teamAWins = 0;
    let teamBWins = 0;
    let teamA = subMatches[0].teamA;
    let teamB = subMatches[0].teamB;
    subMatches.forEach(m => {
      if (m.status === 'completed' && m.winner) {
        if (m.winner === teamA) teamAWins++;
        else if (m.winner === teamB) teamBWins++;
      }
    });
    if (teamAWins >= 2) return { winnerId: teamA, loserId: teamB, score: `${teamAWins}-${teamBWins}` };
    if (teamBWins >= 2) return { winnerId: teamB, loserId: teamA, score: `${teamBWins}-${teamAWins}` };
    return null;
  };

  const finalRes = getTieWinner(finalTieMatches);
  const thirdRes = getTieWinner(thirdTieMatches);

  let championHtml = '';
  if (finalRes && finalRes.winnerId && tournamentData.teams && tournamentData.teams[finalRes.winnerId]) {
    const champTeam = tournamentData.teams[finalRes.winnerId];
    const runnerTeam = tournamentData.teams[finalRes.loserId];
    const thirdTeam = thirdRes && thirdRes.winnerId ? tournamentData.teams[thirdRes.winnerId] : null;

    championHtml = `
      <div class="relative overflow-hidden bg-gradient-to-r from-amber-950/90 via-slate-900 to-yellow-950/90 rounded-3xl border-2 border-amber-400/80 p-5 sm:p-6 shadow-[0_0_35px_rgba(251,191,36,0.3)] space-y-4 mb-6">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div class="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xl font-black shadow-lg">
              <i class="fa-solid fa-trophy animate-bounce"></i>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider">VINH DANH NHÀ VÔ ĐỊCH GIẢI ĐẤU NGỌC PHÁT SUNDAY</h3>
              <p class="text-xs text-amber-200/70">Chúc mừng các đội thi đấu xuất sắc nhất Vòng Loại!</p>
            </div>
          </div>
          <span class="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold">🏆 CƠ CẤU GIẢI THƯỞNG</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 🥇 VÔ ĐỊCH -->
          <div class="bg-amber-950/60 border border-amber-400/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <span class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">🥇</span>
            <div class="min-w-0">
              <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">NHÀ VÔ ĐỊCH</span>
              <div class="flex items-center gap-1.5 truncate mt-0.5">
                <span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-xs shrink-0">${champTeam.code}</span>
                <span class="font-bold text-white text-xs truncate" title="${getTeam3MembersText(champTeam, champTeam.name)}">${getTeam3MembersText(champTeam, champTeam.name)}</span>
              </div>
            </div>
          </div>

          <!-- 🥈 Á QUÂN -->
          ${runnerTeam ? `
            <div class="bg-slate-900/80 border border-slate-600/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <span class="w-10 h-10 rounded-xl bg-slate-300 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">🥈</span>
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Á QUÂN (HẠNG 2)</span>
                <div class="flex items-center gap-1.5 truncate mt-0.5">
                  <span class="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono font-black text-xs shrink-0">${runnerTeam.code}</span>
                  <span class="font-bold text-white text-xs truncate" title="${getTeam3MembersText(runnerTeam, runnerTeam.name)}">${getTeam3MembersText(runnerTeam, runnerTeam.name)}</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- 🥉 HẠNG BA -->
          ${thirdTeam ? `
            <div class="bg-amber-950/30 border border-amber-700/50 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <span class="w-10 h-10 rounded-xl bg-amber-700 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">🥉</span>
              <div class="min-w-0">
                <span class="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">HẠNG BA (HẠNG 3)</span>
                <div class="flex items-center gap-1.5 truncate mt-0.5">
                  <span class="px-1.5 py-0.5 rounded bg-amber-900 text-amber-300 font-mono font-black text-xs shrink-0">${thirdTeam.code}</span>
                  <span class="font-bold text-white text-xs truncate" title="${getTeam3MembersText(thirdTeam, thirdTeam.name)}">${getTeam3MembersText(thirdTeam, thirdTeam.name)}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  const renderTeamTieCard = (tieTitle, matchesList, placeholderA, placeholderB, type = 'normal') => {
    const subMatches = matchesList.map(id => matches[id]).filter(Boolean);
    if (subMatches.length === 0) return '';

    const firstM = subMatches[0];
    const teamA = getTeamDisplay(firstM.teamA, placeholderA);
    const teamB = getTeamDisplay(firstM.teamB, placeholderB);

    let teamAWins = 0;
    let teamBWins = 0;
    subMatches.forEach(m => {
      if (m.status === 'completed' && m.winner) {
        if (m.winner === m.teamA) teamAWins++;
        else if (m.winner === m.teamB) teamBWins++;
      }
    });

    const isCompleted = subMatches.length > 0 && subMatches.every(m => m.status === 'completed');
    const isPlaying = subMatches.some(m => m.status === 'playing');
    const isTieFinished = (teamAWins >= 2 || teamBWins >= 2);

    const isFinal = type === 'final';
    const isThird = type === 'third';

    let subMatchesHtml = '';
    subMatches.forEach(m => {
      const isMCompleted = m.status === 'completed';
      const isMPlaying = m.status === 'playing';
      const scores = m.scores || [{ a: 0, b: 0 }];
      const s1 = scores[0] || { a: 0, b: 0 };

      const pairA = getKnockoutSubMatchPair(m, m.teamA, placeholderA);
      const pairB = getKnockoutSubMatchPair(m, m.teamB, placeholderB);

      const matchNo = m.matchNo || (m.id ? m.id.replace(/\D/g, '') : '');
      const subTypeLabel = m.subType || (m.code ? m.code.split('-')[1] : '');
      const categoryText = m.category === 'mixed' ? (subTypeLabel === 'Ab' ? 'Nam A + Nữ b' : 'Nam a + Nữ b') : 'Đôi Nam (A+a)';

      const aWin = isMCompleted && s1.a > s1.b;
      const bWin = isMCompleted && s1.b > s1.a;

      subMatchesHtml += `
        <div class="bg-[#070d18] py-2 px-2.5 hover:bg-[#0f1b2d] rounded-xl transition border ${isMPlaying ? 'border-cyan-400 ring-1 ring-cyan-400/40 bg-cyan-950/20' : 'border-[#14233a]'} text-[11px] space-y-1 my-1.5 shadow-sm" data-match-id="${m.id}">
          <!-- Dòng 1: #MatchNo SubType • Sân • Time ---------------- Trạng thái -->
          <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-0.5 border-b border-[#142338]/40">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-500 font-bold">#${matchNo} ${subTypeLabel}</span>
              <span class="text-cyan-400 font-medium">Sân ${m.court} • ${m.time}</span>
              <span class="text-slate-400 text-[10px]">(${categoryText})</span>
            </div>
            <div>
              ${isMPlaying ? '<span class="text-rose-400 font-bold animate-pulse text-[10px] px-1.5 py-0.2 bg-rose-950 rounded border border-rose-500/40">ĐANG ĐẤU</span>' : isMCompleted ? '<span class="text-slate-400">[Đã đấu]</span>' : '<span class="text-slate-500">[Sắp đấu]</span>'}
            </div>
          </div>

          <!-- Dòng 2: Pair A ---------------- Score A -->
          <div class="flex items-center justify-between gap-2 py-0.5 ${aWin ? 'text-cyan-300 font-bold' : 'text-slate-200'}">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <span class="px-1.5 py-0.2 rounded ${aWin ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#101e33] text-cyan-300 border border-[#1d3252]'} text-[10px] font-black shrink-0 font-mono">${teamA.code}</span>
              <span class="text-[11px] font-medium leading-tight text-white truncate" title="${pairA}">
                ${pairA}
              </span>
            </div>
            <span class="font-mono font-black text-[11px] px-2 py-0.5 rounded ${isMCompleted || isMPlaying ? (aWin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#091120] text-slate-300') : 'text-slate-500'} shrink-0">
              ${isMCompleted || isMPlaying ? s1.a : '-'}
            </span>
          </div>

          <!-- Dòng 3: Pair B ---------------- Score B -->
          <div class="flex items-center justify-between gap-2 py-0.5 ${bWin ? 'text-cyan-300 font-bold' : 'text-slate-200'}">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <span class="px-1.5 py-0.2 rounded ${bWin ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#101e33] text-cyan-300 border border-[#1d3252]'} text-[10px] font-black shrink-0 font-mono">${teamB.code}</span>
              <span class="text-[11px] font-medium leading-tight text-white truncate" title="${pairB}">
                ${pairB}
              </span>
            </div>
            <span class="font-mono font-black text-[11px] px-2 py-0.5 rounded ${isMCompleted || isMPlaying ? (bWin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[#091120] text-slate-300') : 'text-slate-500'} shrink-0">
              ${isMCompleted || isMPlaying ? s1.b : '-'}
            </span>
          </div>
        </div>
      `;
    });

    const displayMembersA = getTeam3MembersText(teamA, placeholderA);
    const displayMembersB = getTeam3MembersText(teamB, placeholderB);
    const aTieWin = teamAWins >= 2;
    const bTieWin = teamBWins >= 2;

    return `
      <div class="bg-[#0c1524] rounded-2xl border ${isFinal ? 'border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/40' : isThird ? 'border-amber-600/50 shadow-md' : isPlaying ? 'border-cyan-400 ring-2 ring-cyan-500/20' : 'border-[#16263f]'} p-4 space-y-3 shadow-xl transition hover:border-cyan-500/50">
        
        <!-- Card Header -->
        <div class="flex items-center justify-between pb-2 border-b border-[#142338] text-[11px] font-black ${isFinal ? 'text-amber-400' : isThird ? 'text-amber-500' : 'text-cyan-400'} uppercase tracking-wider">
          <span class="flex items-center gap-1.5">
            ${isFinal ? '<i class="fa-solid fa-crown text-amber-400 text-sm"></i>' : isThird ? '<i class="fa-solid fa-medal text-amber-500 text-sm"></i>' : '<i class="fa-solid fa-trophy text-cyan-400"></i>'}
            ${tieTitle}
          </span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${isTieFinished ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : isPlaying ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse' : 'bg-slate-900 text-slate-400'}">${isTieFinished ? 'ĐÃ XONG' : isPlaying ? 'ĐANG THI ĐẤU' : 'SẮP ĐẤU'}</span>
        </div>

        <!-- Tên 2 Đội & Tỷ số Đồng Đội (Bố cục phẳng chuẩn đồng nhất) -->
        <div class="bg-[#070d18] py-2 px-2.5 hover:bg-[#0f1b2d] rounded-xl transition border border-[#14233a] text-[11px] space-y-1 my-1.5 shadow-sm">
          <!-- Dòng thông tin đồng đội -->
          <div class="pb-0.5 border-b border-[#142338]/40">
            <span class="text-cyan-400 font-bold">Trận Đồng Đội</span>
          </div>

          <!-- Đội A -->
          <div class="flex items-center justify-between gap-2 py-0.5 ${aTieWin ? 'text-cyan-300 font-bold' : 'text-slate-300 font-normal'}">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <span class="px-1.5 py-0.2 rounded ${aTieWin ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#101e33] text-cyan-300 border border-[#1d3252]'} text-[10px] font-black shrink-0 font-mono">${teamA.code}</span>
              <span class="text-[11px] leading-tight text-white truncate ${aTieWin ? 'font-bold' : 'font-normal text-slate-300'}" title="${displayMembersA}">
                ${displayMembersA}
              </span>
            </div>
            <span class="font-mono text-[11px] px-2 py-0.5 rounded ${aTieWin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black' : 'bg-[#091120] text-slate-300 font-normal'} shrink-0">
              ${teamAWins}
            </span>
          </div>

          <!-- Đội B -->
          <div class="flex items-center justify-between gap-2 py-0.5 ${bTieWin ? 'text-cyan-300 font-bold' : 'text-slate-300 font-normal'}">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <span class="px-1.5 py-0.2 rounded ${bTieWin ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-[#101e33] text-cyan-300 border border-[#1d3252]'} text-[10px] font-black shrink-0 font-mono">${teamB.code}</span>
              <span class="text-[11px] leading-tight text-white truncate ${bTieWin ? 'font-bold' : 'font-normal text-slate-300'}" title="${displayMembersB}">
                ${displayMembersB}
              </span>
            </div>
            <span class="font-mono text-[11px] px-2 py-0.5 rounded ${bTieWin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black' : 'bg-[#091120] text-slate-300 font-normal'} shrink-0">
              ${teamBWins}
            </span>
          </div>
        </div>

        <!-- Danh sách 3 trận thi đấu nhỏ -->
        <div class="space-y-1.5 pt-1">
          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1 flex items-center justify-between">
            <span>Các trận con (3 Trận):</span>
            <span class="text-cyan-400 text-[10px]">Chạm 15 điểm</span>
          </div>
          ${subMatchesHtml}
        </div>

      </div>
    `;
  };

  container.innerHTML = `
    <div class="bg-[#0c1524] rounded-3xl border border-[#16263f] p-4 sm:p-6 shadow-2xl space-y-6">
      
      <!-- BẢNG VINH DANH (NẾU CÓ NHÀ VÔ ĐỊCH) -->
      ${championHtml}

      <!-- SƠ ĐỒ NHÁNH ĐẤU KNOCKOUT (1 HÀNG 2 Ô DẠNG FLEX) -->
      <div class="space-y-6">
        
        <!-- VÒNG BÁN KẾT (1 HÀNG 2 Ô: BÁN KẾT 1 & BÁN KẾT 2) -->
        <div class="space-y-3">
          <div class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
            VÒNG BÁN KẾT ĐỒNG ĐỘI (2 TRẬN)
          </div>
          <div class="flex flex-col md:flex-row gap-4 sm:gap-5">
            <div class="flex-1 min-w-0">
              ${renderTeamTieCard('BÁN KẾT 1 ĐỒNG ĐỘI', bk1TieMatches, 'Nhất Bảng X', 'Nhì Bảng Đ')}
            </div>
            <div class="flex-1 min-w-0">
              ${renderTeamTieCard('BÁN KẾT 2 ĐỒNG ĐỘI', bk2TieMatches, 'Nhất Bảng Đ', 'Nhì Bảng X')}
            </div>
          </div>
        </div>

        <!-- VÒNG CHUNG KẾT & TRANH HẠNG BA (1 HÀNG 2 Ô: CHUNG KẾT & TRANH HẠNG 3) -->
        <div class="space-y-3">
          <div class="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
            VÒNG CHUNG KẾT & TRANH HẠNG BA
          </div>
          <div class="flex flex-col md:flex-row gap-4 sm:gap-5">
            <div class="flex-1 min-w-0">
              ${renderTeamTieCard('CHUNG KẾT TRANH VÔ ĐỊCH', finalTieMatches, 'Thắng BK 1', 'Thắng BK 2', 'final')}
            </div>
            <div class="flex-1 min-w-0">
              ${renderTeamTieCard('TRANH HẠNG 3 ĐỒNG ĐỘI', thirdTieMatches, 'Thua BK 1', 'Thua BK 2', 'third')}
            </div>
          </div>
        </div>

      </div>

    </div>
  `;
}

/**
 * Trợ giúp lấy tên và thành viên đội hiển thị
 */
function getTeamDisplay(teamId, placeholder = "Chưa xác định", category = null) {
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
  let displayName = team.name;
  if (category === 'men' && team.menName) {
    displayName = team.menName;
  } else if (category === 'mixed' && team.mixedName) {
    displayName = team.mixedName;
  }

  const membersText = (team.members || []).map(m => m.name).join(' - ');

  return {
    ...team,
    name: displayName,
    membersText
  };
}

/**
 * Tách tên thành viên của Đội thành 2 dòng (dòng 1 & dòng 2)
 */
function getPlayerNameLines(teamInfo, category = null) {
  if (!teamInfo) return { line1: "Chưa xác định", line2: "" };

  const matchCategory = category || teamInfo.matchCategory || teamInfo.category;

  const team = (teamInfo.id && tournamentData.teams && tournamentData.teams[teamInfo.id])
    ? tournamentData.teams[teamInfo.id]
    : teamInfo;

  if (team && team.members && Array.isArray(team.members) && team.members.length > 0) {
    const menMembers = team.members.filter(m => m.role === 'A' || m.role === 'a' || m.role !== 'b');
    const womenMembers = team.members.filter(m => m.role === 'b');

    if (matchCategory === 'mixed') {
      const line1 = menMembers.map(m => m.name).join(' / ') || team.menName || "";
      const line2 = womenMembers.map(m => m.name).join(' / ') || "";
      return { line1, line2 };
    } else {
      const line1 = menMembers[0] ? menMembers[0].name : "";
      const line2 = menMembers.slice(1).map(m => m.name).join(' - ');
      return { line1, line2 };
    }
  }

  const raw = teamInfo.name || teamInfo.membersText || "";
  const parts = raw.split(/[\/\-]/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      line1: parts[0],
      line2: parts.slice(1).join(" / ")
    };
  }

  return {
    line1: raw || "Chưa xác định",
    line2: ""
  };
}

/**
 * Render Element Hiển thị Bảng Điểm Trận Đấu theo thiết kế mới:
 * - Badge Trên: Mã/Tên Đội A (vd: X1, A)
 * - Badge Dưới: Mã/Tên Đội B (vd: Đ2, J)
 * - Badge Trái: Số Sân (vd: 1, 2, 3)
 * - Badge Phải: Mã Trận Đấu (vd: M1, M2...) [Match 1, Match 2 theo yêu cầu]
 * - Nội dung ở giữa: Tên cầu thủ Đội A & Điểm A (Đỏ/Highlight), vạch ngăn cách, Tên cầu thủ Đội B & Điểm B
 */
function renderRedesignedMatchCard(m, category = null) {
  const teamA = getTeamDisplay(m.teamA, m.placeholderA, category || m.category);
  const teamB = getTeamDisplay(m.teamB, m.placeholderB, category || m.category);

  const isLive = m.status === 'playing';
  const isCompleted = m.status === 'completed';

  const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
  const setsWon = m.setsWon || { a: 0, b: 0 };
  const s1 = scores[0] || { a: 0, b: 0 };

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(m, tournamentData.settings) : {
    isGroup: m.stage === 'group',
    label: m.stage === 'group' ? "1 set 21" : "3 set 15"
  };

  const playersA = getPlayerNameLines(teamA, category || m.category);
  const playersB = getPlayerNameLines(teamB, category || m.category);

  let scoreA = formatInfo.isGroup ? s1.a : setsWon.a;
  let scoreB = formatInfo.isGroup ? s1.b : setsWon.b;

  let scoreAColor = 'text-slate-400';
  let scoreBColor = 'text-slate-400';
  let nameAColor = 'text-white';
  let nameBColor = 'text-slate-300';

  if (isCompleted || isLive || s1.a > 0 || s1.b > 0) {
    if (scoreA > scoreB || m.winner === m.teamA) {
      scoreAColor = 'text-rose-500 font-black drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]';
      scoreBColor = 'text-slate-400 font-bold';
      nameAColor = 'text-white font-extrabold';
      nameBColor = 'text-slate-400 font-medium';
    } else if (scoreB > scoreA || m.winner === m.teamB) {
      scoreAColor = 'text-slate-400 font-bold';
      scoreBColor = 'text-rose-500 font-black drop-shadow-[0_0_6px_rgba(244,63,94,0.4)]';
      nameAColor = 'text-slate-400 font-medium';
      nameBColor = 'text-white font-extrabold';
    } else {
      scoreAColor = 'text-cyan-400 font-black';
      scoreBColor = 'text-cyan-400 font-black';
      nameAColor = 'text-white font-bold';
      nameBColor = 'text-white font-bold';
    }
  }

  const matchNoText = `M${m.matchNo || m.id.replace(/\D/g, '')}`;
  const playedSets = scores.filter(s => s.a > 0 || s.b > 0);

  return `
    <div class="relative bg-[#0c1524] rounded-xl border ${isLive ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-[0_0_12px_rgba(0,229,255,0.18)]' : 'border-[#16263f]'} p-3 sm:p-3.5 transition hover:border-cyan-500/40 my-1" data-match-id="${m.id}">
      
      <!-- 1. BADGE TRÊN: TÊN / MÃ ĐỘI A (vd: X1, A) -->
      <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#16263f] text-slate-200 border border-[#273e61] px-2.5 py-0.2 rounded-md text-[10px] sm:text-[11px] font-black tracking-wider shadow-sm z-10 flex items-center justify-center min-w-[30px]">
        <span>${teamA.code || 'A'}</span>
      </div>

      <!-- 2. BADGE DƯỚI: TÊN / MÃ ĐỘI B (vd: Đ2, J) -->
      <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#16263f] text-slate-200 border border-[#273e61] px-2.5 py-0.2 rounded-md text-[10px] sm:text-[11px] font-black tracking-wider shadow-sm z-10 flex items-center justify-center min-w-[30px]">
        <span>${teamB.code || 'J'}</span>
      </div>

      <!-- 3. BADGE TRÁI: SỐ SÂN (vd: 1) -->
      <div class="absolute -left-2.5 top-1/2 -translate-y-1/2 bg-[#091526] text-cyan-400 border border-cyan-500/40 w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-md font-mono font-black text-[10px] sm:text-xs flex items-center justify-center shadow-sm z-10" title="Sân ${m.court}">
        <span>${m.court}</span>
      </div>

      <!-- 4. BADGE PHẢI: MÃ TRẬN ĐẤU (vd: M1, M2...) -->
      <div class="absolute -right-2.5 top-1/2 -translate-y-1/2 bg-[#091526] text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-mono font-black text-[10px] sm:text-[11px] flex items-center justify-center shadow-sm z-10" title="Mã trận ${matchNoText}">
        <span>${matchNoText}</span>
      </div>

      <!-- HEADER TRẬN: GIỜ THI ĐẤU, TRẠNG THÁI & CÁC SET -->
      <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#142338]/60 text-[10px] sm:text-[11px] pr-3.5 sm:pr-4.5">
        <div class="flex items-center gap-1">
          <span class="text-slate-400 font-semibold"><i class="fa-regular fa-clock text-cyan-400/80 mr-1"></i>${m.time}</span>
          <span class="text-slate-600">•</span>
          <span class="text-slate-400 truncate max-w-[100px] sm:max-w-[120px]">${m.label || (m.category === 'mixed' ? 'Đôi Nam Nữ' : 'Đôi Nam')}</span>
        </div>
        <div class="flex items-center gap-1">
          ${!formatInfo.isGroup && playedSets.length > 0 ? `
            <div class="flex items-center gap-0.5 font-mono text-[9px]">
              ${playedSets.map(s => `<span class="bg-[#091120] px-1 py-0.2 rounded text-cyan-300 border border-[#16263f]">${s.a}-${s.b}</span>`).join('')}
            </div>
          ` : ''}
          ${isLive 
            ? '<span class="text-rose-400 font-bold text-[9px] flex items-center gap-1 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-500/30 animate-pulse"><span class="live-indicator-red"></span>Đang đấu</span>'
            : isCompleted
            ? '<span class="text-emerald-400 font-bold text-[9px] flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30"><i class="fa-solid fa-check"></i> Xong</span>'
            : '<span class="text-slate-500 font-medium text-[9px] bg-slate-900/60 px-1.5 py-0.2 rounded border border-slate-800">Sắp đấu</span>'
          }
        </div>
      </div>

      <!-- CHÍNH: HIỂN THỊ CẦU THỦ & ĐIỂM SỐ GỌN GÀNG -->
      <div class="flex flex-col space-y-1.5 py-0.5 px-0.5">
        
        <!-- DÒNG TRÊN: ĐỘI A -->
        <div class="flex items-center justify-between">
          <div class="flex flex-col text-left truncate pr-2">
            <span class="${nameAColor} text-xs sm:text-sm leading-snug truncate">${playersA.line1}</span>
            ${playersA.line2 ? `<span class="${nameAColor} text-[11px] sm:text-xs leading-snug opacity-85 truncate">${playersA.line2}</span>` : ''}
          </div>
          <div class="font-mono text-xl sm:text-2xl ${scoreAColor} transition-all pr-4.5 sm:pr-5 pl-2 flex-shrink-0">
            ${scoreA}
          </div>
        </div>

        <!-- VẠCH NGĂN CÁCH GIỮA -->
        <div class="border-b border-[#182a47]/70 my-0.5"></div>

        <!-- DÒNG DƯỚI: ĐỘI B -->
        <div class="flex items-center justify-between">
          <div class="flex flex-col text-left truncate pr-2">
            <span class="${nameBColor} text-xs sm:text-sm leading-snug truncate">${playersB.line1}</span>
            ${playersB.line2 ? `<span class="${nameBColor} text-[11px] sm:text-xs leading-snug opacity-85 truncate">${playersB.line2}</span>` : ''}
          </div>
          <div class="font-mono text-xl sm:text-2xl ${scoreBColor} transition-all pr-4.5 sm:pr-5 pl-2 flex-shrink-0">
            ${scoreB}
          </div>
        </div>

      </div>

    </div>
  `;
}

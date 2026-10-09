/**
 * =========================================================================
 * COMPONENT CONTROLLER: BẢNG ĐIỂM VÒNG BẢNG (STANDINGS)
 * =========================================================================
 */

let groupAccordionState = {
  'X': false,
  'D': false
};

/**
 * Thuật toán tính BXH Vòng Bảng (T: Trận thắng +1đ, HS: Hiệu số điểm, Đ: Tổng điểm quả)
 */
function calculateGroupStandings(groupKey, category = null) {
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const teams = tData.teams || {};
  const matches = Object.values(tData.matches || {});
  const settings = tData.settings || {};
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

  // Sắp xếp: Số trận thắng T (+1đ/trận) -> Hiệu số điểm HS (+/-) -> Tổng điểm ghi được Đ
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
 * Render Bảng điểm vòng bảng và các trận đấu con
 */
function renderStandings() {
  const container = document.getElementById('groups-container');
  if (!container) return;

  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const teams = tData.teams || {};
  const rawMatches = Object.values(tData.matches || {});
  const matches = rawMatches.map(m => window.sanitizeMatch ? window.sanitizeMatch(m) : m);
  const searchQ = (window.searchQuery || '').trim().toLowerCase();

  const groups = [
    { key: 'X', name: 'BẢNG XANH (BẢNG X)' },
    { key: 'D', name: 'BẢNG ĐỎ (BẢNG Đ)' }
  ];

  let html = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">';

  groups.forEach(grp => {
    const isCyan = grp.key === 'X';
    const accordionId = grp.key;
    const standings = calculateGroupStandings(grp.key);

    const groupMatches = matches.filter(m => m.stage === 'group' && m.group === grp.key);
    const completedMatchesCount = groupMatches.filter(m => m.status === 'completed').length;

    let displayedStandings = standings;
    if (searchQ) {
      displayedStandings = standings.filter(item => {
        const t = item.team;
        const athleteNames = (t.members || []).map(m => m.name).join(' ');
        const textPool = `${t.code} ${t.name} ${athleteNames}`.toLowerCase();
        return textPool.includes(searchQ);
      });
    }

    let tableRowsHtml = '';
    if (displayedStandings.length === 0) {
      tableRowsHtml = `
        <tr>
          <td colspan="6" class="py-6 text-center text-slate-500 italic text-xs">
            Không tìm thấy đội nào phù hợp
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
            <td class="py-2.5 px-2 text-center font-black text-[11px]">${rankBadgeHtml}</td>
            <td class="py-2.5 px-2">
              <span class="px-2 py-0.5 rounded bg-[#101e33] text-slate-200 border border-[#1d3252] text-[11px] font-black tracking-wider">
                ${item.team.code}
              </span>
            </td>
            <td class="py-2.5 px-2 font-bold text-white text-[11px] max-w-[170px] truncate">
              ${athleteNames}
            </td>
            <td class="py-2.5 px-2 text-center font-mono font-black text-[11px] text-emerald-400">
              ${item.won}
            </td>
            <td class="py-2.5 px-2 text-center font-mono font-bold text-[11px] ${ptDiff > 0 ? 'text-emerald-400' : ptDiff < 0 ? 'text-rose-400' : 'text-slate-400'}">
              ${ptDiff > 0 ? '+' + ptDiff : ptDiff}
            </td>
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
    if (searchQ) {
      displayGroupMatches = sortedGroupMatches.filter(m => {
        const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category, m, false);
        const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category, m, true);
        const namesA = getPlayerNameLines(teamA, m.category);
        const namesB = getPlayerNameLines(teamB, m.category);

        const poolA = [teamA.code, teamA.name, namesA.line1, namesA.line2, (teamA.members || []).map(mem => mem.name).join(' ')].join(' ').toLowerCase();
        const poolB = [teamB.code, teamB.name, namesB.line1, namesB.line2, (teamB.members || []).map(mem => mem.name).join(' ')].join(' ').toLowerCase();
        const matchPool = [m.id, `m${m.matchNo}`, `#${m.matchNo}`, `sân ${m.court}`, m.time, poolA, poolB].join(' ').toLowerCase();

        return matchPool.includes(searchQ);
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
        const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category, m, false);
        const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category, m, true);

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
              <div>${statusBadgeText}</div>
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

    const isAccordionOpen = searchQ ? true : (groupAccordionState[accordionId] === true);

    html += `
      <div class="space-y-5 sm:space-y-6">
        <!-- ELEMENT 1: BẢNG ĐIỂM XẾP HẠNG -->
        <div class="bg-[#0c1524] rounded-2xl border ${isCyan ? 'border-cyan-500/30' : 'border-rose-500/30'} p-4 sm:p-5 shadow-2xl space-y-4">
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

          <div class="overflow-x-auto my-1">
            <table class="w-full text-[11px] text-left whitespace-nowrap">
              <thead class="text-slate-400 border-b border-[#142338] text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th class="py-2.5 px-2 text-center w-10">RANK</th>
                  <th class="py-2.5 px-2 w-14">TEAM</th>
                  <th class="py-2.5 px-2">ATHLETE</th>
                  <th class="py-2.5 px-2 text-center text-emerald-400" title="Tổng số trận thắng đồng đội (+1đ/trận)">T</th>
                  <th class="py-2.5 px-2 text-center" title="Hiệu số điểm quả (Điểm ghi được - Điểm bị mất)">HS</th>
                  <th class="py-2.5 px-2 text-center text-cyan-400" title="Tổng số điểm quả ghi được">Đ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#121f33]/40">
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <!-- ELEMENT 2: LỊCH THI ĐẤU & TỶ SỐ CỦA BẢNG -->
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
 * Khởi tạo Modal giải thích quy tắc xếp hạng
 */
function setupRankRulesModal() {
  const modal = document.getElementById('rank-rules-modal');
  const openBtn = document.getElementById('btn-open-rank-rules');
  const closeBtn = document.getElementById('btn-close-rank-rules');
  const okBtn = document.getElementById('btn-ok-rank-rules');

  const openModal = () => { if (modal) modal.classList.remove('hidden'); };
  const closeModal = () => { if (modal) modal.classList.add('hidden'); };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (okBtn) okBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

function initStandingsComponent() {
  setupRankRulesModal();
  renderStandings();
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.calculateGroupStandings = calculateGroupStandings;
  window.renderStandings = renderStandings;
  window.initStandingsComponent = initStandingsComponent;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStandingsComponent);
} else {
  initStandingsComponent();
}

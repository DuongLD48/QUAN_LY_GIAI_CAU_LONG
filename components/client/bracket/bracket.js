/**
 * =========================================================================
 * COMPONENT CONTROLLER: VÒNG LOẠI TRỰC TIẾP (KNOCKOUT & BRACKET)
 * =========================================================================
 */

function renderBracket() {
  const container = document.getElementById('bracket-container');
  if (!container) return;

  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const matches = tData.matches || {};
  const teams = tData.teams || {};

  // Trận Đồng Đội 1: Bán kết 1 (Nhất X vs Nhì Đ) -> M41 (Ab), M43 (ab), M45 (Aa)
  const bk1TieMatches = ['M41', 'M43', 'M45'];

  // Trận Đồng Đội 2: Bán kết 2 (Nhất Đ vs Nhì X) -> M42 (Ab), M44 (ab), M46 (Aa)
  const bk2TieMatches = ['M42', 'M44', 'M46'];

  // Trận Đồng Đội 3: Chung kết (Thắng BK1 vs Thắng BK2) -> M47 (Ab), M49 (ab), M51 (Aa)
  const finalTieMatches = ['M47', 'M49', 'M51'];

  // Trận Đồng Đội 4: Tranh Hạng Ba (Thua BK1 vs Thua BK2) -> M48 (Ab), M50 (ab), M52 (Aa)
  const thirdTieMatches = ['M48', 'M50', 'M52'];

  const getTieWinner = (matchIds) => {
    const subMatches = matchIds.map(id => matches[id]).filter(Boolean);
    if (subMatches.length === 0) return null;

    const firstM = subMatches[0];
    const teamA = resolveKnockoutTeamId(firstM, false);
    const teamB = resolveKnockoutTeamId(firstM, true);
    if (!teamA || !teamB) return null;

    const winCounts = {};
    subMatches.forEach(m => {
      const s1 = (m.scores || [])[0] || { a: 0, b: 0 };
      const isMCompleted = m.status === 'completed' || s1.a > 0 || s1.b > 0;
      if (isMCompleted) {
        const w = getSubMatchWinner(m);
        if (w) {
          winCounts[w] = (winCounts[w] || 0) + 1;
        }
      }
    });

    const teamAWins = winCounts[teamA] || 0;
    const teamBWins = winCounts[teamB] || 0;
    if (teamAWins >= 2) return { winnerId: teamA, loserId: teamB, score: `${teamAWins}-${teamBWins}` };
    if (teamBWins >= 2) return { winnerId: teamB, loserId: teamA, score: `${teamBWins}-${teamAWins}` };
    return null;
  };

  const finalRes = getTieWinner(finalTieMatches);
  const thirdRes = getTieWinner(thirdTieMatches);

  const champTeam = finalRes && finalRes.winnerId ? teams[normalizeTeamId(finalRes.winnerId)] : null;
  const runnerTeam = finalRes && finalRes.loserId ? teams[normalizeTeamId(finalRes.loserId)] : null;
  const thirdTeam = thirdRes && thirdRes.winnerId ? teams[normalizeTeamId(thirdRes.winnerId)] : null;

  let championHtml = `
    <div class="relative overflow-hidden bg-gradient-to-r from-amber-950/90 via-slate-900 to-yellow-950/90 rounded-3xl border-2 border-amber-400/80 p-5 sm:p-6 shadow-[0_0_35px_rgba(251,191,36,0.3)] space-y-4 mb-6">
      <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

      <div class="flex items-center justify-between border-b border-amber-500/30 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xl font-black shadow-lg">
            <i class="fa-solid fa-trophy animate-bounce"></i>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider">VINH DANH NHÀ VÔ ĐỊCH GIẢI ĐẤU NGỌC PHÁT SUNDAY</h3>
            <p class="text-xs text-amber-200/70">Chúc mừng các đội thi đấu xuất sắc nhất Vòng Loại & Chung Kết!</p>
          </div>
        </div>
        <span class="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-bold">🏆 CƠ CẤU GIẢI THƯỞNG</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 🥇 VÔ ĐỊCH -->
        <div class="bg-amber-950/60 border border-amber-400/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <span class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">🥇</span>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">NHÀ VÔ ĐỊCH</span>
            ${champTeam ? `
              <div class="flex items-center gap-1.5 truncate mt-0.5">
                <span class="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-xs shrink-0">${champTeam.code}</span>
                <span class="font-bold text-white text-xs truncate" title="${getTeam3MembersText(champTeam, champTeam.name)}">${getTeam3MembersText(champTeam, champTeam.name)}</span>
              </div>
            ` : `
              <span class="text-xs font-medium text-amber-200/60 italic mt-0.5 block">Chờ kết quả Chung Kết</span>
            `}
          </div>
        </div>

        <!-- 🥈 Á QUÂN -->
        <div class="bg-slate-900/80 border border-slate-600/60 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <span class="w-10 h-10 rounded-xl bg-slate-300 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">🥈</span>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Á QUÂN (HẠNG 2)</span>
            ${runnerTeam ? `
              <div class="flex items-center gap-1.5 truncate mt-0.5">
                <span class="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono font-black text-xs shrink-0">${runnerTeam.code}</span>
                <span class="font-bold text-white text-xs truncate" title="${getTeam3MembersText(runnerTeam, runnerTeam.name)}">${getTeam3MembersText(runnerTeam, runnerTeam.name)}</span>
              </div>
            ` : `
              <span class="text-xs font-medium text-slate-400 italic mt-0.5 block">Chờ kết quả Chung Kết</span>
            `}
          </div>
        </div>

        <!-- 🥉 HẠNG BA -->
        <div class="bg-amber-950/30 border border-amber-700/50 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <span class="w-10 h-10 rounded-xl bg-amber-700 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">🥉</span>
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">HẠNG BA (HẠNG 3)</span>
            ${thirdTeam ? `
              <div class="flex items-center gap-1.5 truncate mt-0.5">
                <span class="px-1.5 py-0.5 rounded bg-amber-900 text-amber-300 font-mono font-black text-xs shrink-0">${thirdTeam.code}</span>
                <span class="font-bold text-white text-xs truncate" title="${getTeam3MembersText(thirdTeam, thirdTeam.name)}">${getTeam3MembersText(thirdTeam, thirdTeam.name)}</span>
              </div>
            ` : `
              <span class="text-xs font-medium text-amber-400/60 italic mt-0.5 block">Chờ kết quả Tranh Hạng 3</span>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  const renderTeamTieCard = (tieTitle, matchesList, placeholderA, placeholderB, type = 'normal') => {
    const subMatches = matchesList.map(id => matches[id]).filter(Boolean);
    if (subMatches.length === 0) return '';

    const firstM = subMatches[0];
    const resolvedTeamAId = resolveKnockoutTeamId(firstM, false);
    const resolvedTeamBId = resolveKnockoutTeamId(firstM, true);
    const teamA = getTeamDisplay(resolvedTeamAId, placeholderA, null, firstM, false);
    const teamB = getTeamDisplay(resolvedTeamBId, placeholderB, null, firstM, true);

    let teamAWins = 0;
    let teamBWins = 0;
    subMatches.forEach(m => {
      const s1 = (m.scores || [])[0] || { a: 0, b: 0 };
      const isMCompleted = m.status === 'completed' || s1.a > 0 || s1.b > 0;
      if (isMCompleted) {
        const w = normalizeTeamId(getSubMatchWinner(m));
        if (w && w === resolvedTeamAId) teamAWins++;
        else if (w && w === resolvedTeamBId) teamBWins++;
      }
    });

    const isCompleted = subMatches.length > 0 && subMatches.every(m => m.status === 'completed' || ((m.scores || [])[0]?.a > 0 || (m.scores || [])[0]?.b > 0));
    const isPlaying = subMatches.some(m => m.status === 'playing');
    const isTieFinished = (teamAWins >= 2 || teamBWins >= 2) || (subMatches.length === 3 && isCompleted);

    const isFinal = type === 'final';
    const isThird = type === 'third';

    let subMatchesHtml = '';
    subMatches.forEach(m => {
      const isMCompleted = m.status === 'completed';
      const isMPlaying = m.status === 'playing';
      const scores = m.scores || [{ a: 0, b: 0 }];
      const s1 = scores[0] || { a: 0, b: 0 };

      const pairA = getKnockoutSubMatchPair(m, resolvedTeamAId, placeholderA, false);
      const pairB = getKnockoutSubMatchPair(m, resolvedTeamBId, placeholderB, true);

      const matchNo = m.matchNo || (m.id ? m.id.replace(/\D/g, '') : '');
      const subTypeLabel = m.subType || (m.code ? m.code.split('-')[1] : '');

      const aWin = isMCompleted && s1.a > s1.b;
      const bWin = isMCompleted && s1.b > s1.a;

      subMatchesHtml += `
        <div class="bg-[#070d18] py-2 px-2.5 hover:bg-[#0f1b2d] rounded-xl transition border ${isMPlaying ? 'border-cyan-400 ring-1 ring-cyan-400/40 bg-cyan-950/20' : 'border-[#14233a]'} text-[11px] space-y-1 my-1.5 shadow-sm" data-match-id="${m.id}">
          <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-0.5 border-b border-[#142338]/40">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-500 font-bold">#${matchNo} ${subTypeLabel}</span>
              <span class="text-cyan-400 font-medium">Sân ${m.court} • ${m.time}</span>
            </div>
            <div>
              ${isMPlaying ? '<span class="text-rose-400 font-bold animate-pulse text-[10px] px-1.5 py-0.2 bg-rose-950 rounded border border-rose-500/40">ĐANG ĐẤU</span>' : isMCompleted ? '<span class="text-slate-400">[Đã đấu]</span>' : '<span class="text-slate-500">[Sắp đấu]</span>'}
            </div>
          </div>

          <!-- Pair A -->
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

          <!-- Pair B -->
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
        
        <div class="flex items-center justify-between pb-2 border-b border-[#142338] text-[11px] font-black ${isFinal ? 'text-amber-400' : isThird ? 'text-amber-500' : 'text-cyan-400'} uppercase tracking-wider">
          <span class="flex items-center gap-1.5">
            ${isFinal ? '<i class="fa-solid fa-crown text-amber-400 text-sm"></i>' : isThird ? '<i class="fa-solid fa-medal text-amber-500 text-sm"></i>' : '<i class="fa-solid fa-trophy text-cyan-400"></i>'}
            ${tieTitle}
          </span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full ${isTieFinished ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : isPlaying ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse' : 'bg-slate-900 text-slate-400'}">${isTieFinished ? 'ĐÃ XONG' : isPlaying ? 'ĐANG THI ĐẤU' : 'SẮP ĐẤU'}</span>
        </div>

        <!-- Tên 2 Đội & Tỷ số Đồng Đội -->
        <div class="bg-[#070d18] py-2 px-2.5 hover:bg-[#0f1b2d] rounded-xl transition border border-[#14233a] text-[11px] space-y-1 my-1.5 shadow-sm">
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

        <!-- 3 trận con -->
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
      ${championHtml}
      <div class="space-y-6">
        <!-- VÒNG BÁN KẾT -->
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

        <!-- VÒNG CHUNG KẾT & TRANH HẠNG BA -->
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

function initBracketComponent() {
  renderBracket();
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.renderBracket = renderBracket;
  window.initBracketComponent = initBracketComponent;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBracketComponent);
} else {
  initBracketComponent();
}

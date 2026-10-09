/**
 * =========================================================================
 * COMPONENT CONTROLLER ADMIN: NHẬP TỶ SỐ TRẬN ĐẤU (SCORES)
 * =========================================================================
 */

let currentEditingMatchId = null;

/**
 * Render danh sách trận đấu để nhập điểm (Dạng hàng rút gọn tối ưu siêu nhanh)
 */
function renderAdminMatches() {
  const container = document.getElementById('admin-matches-container');
  if (!container) return;

  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const rawMatches = Object.values(tData.matches || {});
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
      const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category, m, false);
      const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category, m, true);
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
    const teamA = getTeamDisplay(m.teamA, m.placeholderA, m.category, m, false);
    const teamB = getTeamDisplay(m.teamB, m.placeholderB, m.category, m, true);
    const isCompleted = m.status === 'completed';
    const isPlaying = m.status === 'playing';
    const setsWon = m.setsWon || { a: 0, b: 0 };
    const scores = m.scores || [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    const s1 = scores[0] || { a: 0, b: 0 };

    const formatInfo = window.getMatchFormat ? window.getMatchFormat(m, tData.settings) : {
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
          ${(() => {
            const subTypeLabel = m.subType || (m.code ? m.code.split('-')[1] : '');
            if (subTypeLabel === 'Ab' || m.code?.includes('Ab')) {
              return '<span class="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 font-semibold shrink-0">Nam A + Nữ b</span>';
            } else if (subTypeLabel === 'ab' || m.code?.includes('ab')) {
              return '<span class="text-[10px] text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 font-semibold shrink-0">Nam a + Nữ b</span>';
            } else if (subTypeLabel === 'Aa' || m.code?.includes('Aa') || m.category === 'men') {
              return '<span class="text-[10px] text-blue-300 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/50 font-semibold shrink-0">Đôi Nam (A+a)</span>';
            } else {
              return '<span class="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 font-semibold shrink-0">Đôi Nam Nữ</span>';
            }
          })()}
        </div>

        <!-- Cột Giữa: Cặp Đấu & Điểm Số Inline -->
        <div class="flex-grow flex items-center justify-between md:justify-center gap-2 sm:gap-3 min-w-0">
          <!-- Đội A -->
          <div class="flex-1 flex items-center gap-1.5 justify-start md:justify-end min-w-0">
            ${teamALabel}
          </div>

          <!-- Cụm Nhập Điểm Gọn -->
          <div class="flex items-center space-x-1.5 shrink-0 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-700/80">
            <input 
              type="number" 
              class="admin-score-input-inline w-11 bg-slate-950 border border-slate-700 rounded text-center text-white font-mono font-black text-sm py-1 focus:outline-none focus:border-blue-500" 
              value="${s1.a}" 
              data-match-id="${m.id}" 
              data-team="a"
              min="0" max="99"
            >
            <span class="text-slate-500 font-bold text-xs">-</span>
            <input 
              type="number" 
              class="admin-score-input-inline w-11 bg-slate-950 border border-slate-700 rounded text-center text-white font-mono font-black text-sm py-1 focus:outline-none focus:border-blue-500" 
              value="${s1.b}" 
              data-match-id="${m.id}" 
              data-team="b"
              min="0" max="99"
            >
          </div>

          <!-- Đội B -->
          <div class="flex-1 flex items-center gap-1.5 justify-end md:justify-start min-w-0">
            ${teamBLabel}
          </div>
        </div>

        <!-- Cột Phải: Trạng Thái & Thao Tác -->
        <div class="flex items-center justify-end space-x-2 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-700/50">
          <select class="admin-status-select-inline bg-slate-900 border border-slate-700 rounded-lg text-xs py-1 px-2 text-slate-200 font-semibold focus:outline-none" data-match-id="${m.id}">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Sắp đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>

          <!-- Nút Lưu Nhanh Inline -->
          <button class="btn-save-score-inline py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm" data-match-id="${m.id}" title="Lưu điểm dòng này">
            <i class="fa-solid fa-floppy-disk"></i>
          </button>

          <!-- Nút Mở Modal Chi Tiết (Cho trận 3 set hoặc xem chi tiết) -->
          <button class="btn-open-score py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition" data-match-id="${m.id}" title="Nhập điểm chi tiết 3 set">
            <i class="fa-solid fa-up-right-and-down-left-from-center text-[10px]"></i>
          </button>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;

  // Gắn sự kiện cho các nút lưu inline
  container.querySelectorAll('.btn-save-score-inline').forEach(btn => {
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
 * Lưu điểm trực tiếp từ hàng trận đấu
 */
async function saveInlineMatchScore(matchId) {
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const match = tData.matches ? tData.matches[matchId] : null;
  if (!match) return;

  const row = document.querySelector(`[data-match-id="${matchId}"]`);
  if (!row) return;

  const inputA = row.querySelector('.admin-score-input-inline[data-team="a"]');
  const inputB = row.querySelector('.admin-score-input-inline[data-team="b"]');
  const statusSelect = row.querySelector('.admin-status-select-inline');

  const scoreA = parseInt(inputA?.value) || 0;
  const scoreB = parseInt(inputB?.value) || 0;
  let status = statusSelect?.value || 'scheduled';

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tData.settings) : {
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

  try {
    const updateFn = window.updateMatchScore || (typeof updateMatchScore !== 'undefined' ? updateMatchScore : null);
    if (typeof updateFn === 'function') {
      await updateFn(matchId, {
        status: match.status,
        scores: match.scores,
        setsWon: match.setsWon,
        winner: match.winner
      });
      if (typeof checkAndUpdateKnockoutBrackets === 'function') {
        await checkAndUpdateKnockoutBrackets();
      }
      showToast(`Đã lưu Trận #${match.matchNo || matchId} [${scoreA} - ${scoreB}]!`);
    }
  } catch (err) {
    showToast(`❌ Không thể lưu tỷ số: ${err.message}`, "error");
    alert(`❌ Lỗi kết nối Database: ${err.message}`);
  }
}

/**
 * Các nút tăng giảm điểm nhanh (+1, -1)
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

  ['input-s1-a', 'input-s1-b', 'input-s2-a', 'input-s2-b', 'input-s3-a', 'input-s3-b'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', autoCheckSetWinners);
    }
  });
}

function autoCheckSetWinners() {
  if (!currentEditingMatchId) return;
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const match = tData.matches ? tData.matches[currentEditingMatchId] : null;
  if (!match) return;

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tData.settings) : {
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
    if (s1a >= formatInfo.targetPts || s1b >= formatInfo.targetPts) {
      statusSelect.value = 'completed';
    } else if (s1a > 0 || s1b > 0) {
      if (statusSelect.value === 'scheduled') statusSelect.value = 'playing';
    }
  } else {
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
 * Modal nhập điểm chi tiết
 */
function setupScoreModal() {
  const modal = document.getElementById('score-modal');
  const btnClose = document.getElementById('modal-btn-close');
  const btnClear = document.getElementById('modal-btn-clear');
  const scoreForm = document.getElementById('score-form');

  if (btnClose) btnClose.addEventListener('click', () => modal.classList.add('hidden'));

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

      const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
      const match = tData.matches ? tData.matches[currentEditingMatchId] : null;
      if (!match) return;

      const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tData.settings) : {
        isGroup: match.stage === 'group',
        targetPts: match.stage === 'group' ? 21 : 15
      };

      let setsWonA = 0;
      let setsWonB = 0;
      let winner = null;

      if (formatInfo.isGroup) {
        if (status === 'completed' && s1a !== s1b) {
          setsWonA = s1a > s1b ? 1 : 0;
          setsWonB = s1b > s1a ? 1 : 0;
          winner = s1a > s1b ? match.teamA : match.teamB;
        }
      } else {
        if (s1a >= formatInfo.targetPts && s1a > s1b) setsWonA++;
        else if (s1b >= formatInfo.targetPts && s1b > s1a) setsWonB++;

        if (s2a >= formatInfo.targetPts && s2a > s2b) setsWonA++;
        else if (s2b >= formatInfo.targetPts && s2b > s2a) setsWonB++;

        if (s3a >= formatInfo.targetPts && s3a > s3b) setsWonA++;
        else if (s3b >= formatInfo.targetPts && s3b > s3a) setsWonB++;

        if (status === 'completed' && setsWonA !== setsWonB) {
          winner = setsWonA > setsWonB ? match.teamA : match.teamB;
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

      try {
        await updateMatchScore(currentEditingMatchId, updateData);
        if (typeof checkAndUpdateKnockoutBrackets === 'function') {
          await checkAndUpdateKnockoutBrackets();
        }
        modal.classList.add('hidden');
        showToast(`Đã lưu kết quả Trận ${currentEditingMatchId} thành công!`);
      } catch (err) {
        showToast(`❌ Không thể lưu tỷ số: ${err.message}`, "error");
        alert(`❌ Lỗi kết nối Database: ${err.message}`);
      }
    });
  }
}

function openScoreModal(matchId) {
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const match = tData.matches ? tData.matches[matchId] : null;
  if (!match) return;

  currentEditingMatchId = matchId;
  const modal = document.getElementById('score-modal');

  const teamA = getTeamDisplay(match.teamA, match.placeholderA, match.category, match, false);
  const teamB = getTeamDisplay(match.teamB, match.placeholderB, match.category, match, true);

  const formatInfo = window.getMatchFormat ? window.getMatchFormat(match, tData.settings) : {
    isGroup: match.stage === 'group',
    maxSets: match.stage === 'group' ? 1 : 3,
    targetPts: match.stage === 'group' ? 21 : 15,
    label: match.stage === 'group' ? "1 set chạm 21" : "3 set chạm 15"
  };

  const subTypeLabelModal = match.subType || (match.code ? match.code.split('-')[1] : '');
  const subTypeBadgeModal = (subTypeLabelModal === 'Ab' || match.code?.includes('Ab'))
    ? 'Nam A + Nữ b (Đôi Nam Nữ)'
    : (subTypeLabelModal === 'ab' || match.code?.includes('ab'))
      ? 'Nam a + Nữ b (Đôi Nam Nữ)'
      : (subTypeLabelModal === 'Aa' || match.code?.includes('Aa') || match.category === 'men')
        ? 'Nam A + Nam a (Đôi Nam)'
        : (match.category === 'mixed' ? 'Đôi Nam Nữ' : 'Đôi Nam');

  document.getElementById('modal-match-badge').textContent = `Trận ${match.id} • ${subTypeBadgeModal} • Sân ${match.court} • ${match.time} • ${formatInfo.label}`;
  document.getElementById('modal-team-a-name').textContent = teamA.name;
  document.getElementById('modal-team-b-name').textContent = teamB.name;

  document.querySelectorAll('.modal-target-pts').forEach(el => el.textContent = formatInfo.targetPts);

  const set2Container = document.getElementById('modal-set-2-container');
  const set3Container = document.getElementById('modal-set-3-container');

  if (formatInfo.isGroup) {
    if (set2Container) set2Container.classList.add('hidden');
    if (set3Container) set3Container.classList.add('hidden');
  } else {
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
 * Gán đội vào Bán Kết & Chung Kết khi cấu hình thủ công hoặc khi có kết quả
 */
async function checkAndUpdateKnockoutBrackets() {
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const matches = tData.matches || {};
  const settings = tData.settings || {};
  const manualTeams = settings.manualKnockoutTeams || {};

  const bk1TeamA = manualTeams.top1X || null;
  const bk1TeamB = manualTeams.top2D || null;
  const bk2TeamA = manualTeams.top1D || null;
  const bk2TeamB = manualTeams.top2X || null;

  // 1. Chỉ ghi vào Firebase khi đã điền đủ tên 4 đội
  if (bk1TeamA && bk1TeamB && bk2TeamA && bk2TeamB) {
    for (const id of ['M41', 'M43', 'M45']) {
      if (matches[id]) { matches[id].teamA = bk1TeamA; matches[id].teamB = bk1TeamB; }
      await updateMatchSchedule(id, { teamA: bk1TeamA, teamB: bk1TeamB });
    }
    for (const id of ['M42', 'M44', 'M46']) {
      if (matches[id]) { matches[id].teamA = bk2TeamA; matches[id].teamB = bk2TeamB; }
      await updateMatchSchedule(id, { teamA: bk2TeamA, teamB: bk2TeamB });
    }
  } else {
    for (const id of ['M41', 'M42', 'M43', 'M44', 'M45', 'M46']) {
      if (matches[id]) { matches[id].teamA = null; matches[id].teamB = null; }
      await updateMatchSchedule(id, { teamA: null, teamB: null });
    }
  }

  // 2. Kiểm tra Bán kết để gán Chung kết & Tranh 3-4
  const bk1Matches = [matches['M41'], matches['M43'], matches['M45']].filter(Boolean);
  const bk2Matches = [matches['M42'], matches['M44'], matches['M46']].filter(Boolean);

  let bk1WinsA = 0, bk1WinsB = 0;
  bk1Matches.forEach(m => {
    const s1 = (m.scores || [])[0] || { a: 0, b: 0 };
    const isMCompleted = m.status === 'completed' || s1.a > 0 || s1.b > 0;
    if (isMCompleted) {
      if (m.winner === bk1TeamA || s1.a > s1.b) bk1WinsA++;
      else if (m.winner === bk1TeamB || s1.b > s1.a) bk1WinsB++;
    }
  });

  let bk2WinsA = 0, bk2WinsB = 0;
  bk2Matches.forEach(m => {
    const s1 = (m.scores || [])[0] || { a: 0, b: 0 };
    const isMCompleted = m.status === 'completed' || s1.a > 0 || s1.b > 0;
    if (isMCompleted) {
      if (m.winner === bk2TeamA || s1.a > s1.b) bk2WinsA++;
      else if (m.winner === bk2TeamB || s1.b > s1.a) bk2WinsB++;
    }
  });

  let bk1Winner = null, bk1Loser = null;
  if (bk1TeamA && bk1TeamB) {
    if (bk1WinsA >= 2) { bk1Winner = bk1TeamA; bk1Loser = bk1TeamB; }
    else if (bk1WinsB >= 2) { bk1Winner = bk1TeamB; bk1Loser = bk1TeamA; }
  }

  let bk2Winner = null, bk2Loser = null;
  if (bk2TeamA && bk2TeamB) {
    if (bk2WinsA >= 2) { bk2Winner = bk2TeamA; bk2Loser = bk2TeamB; }
    else if (bk2WinsB >= 2) { bk2Winner = bk2TeamB; bk2Loser = bk2TeamA; }
  }

  if (bk1Winner && bk2Winner) {
    for (const id of ['M47', 'M49', 'M51']) {
      if (matches[id]) { matches[id].teamA = bk1Winner; matches[id].teamB = bk2Winner; }
      await updateMatchSchedule(id, { teamA: bk1Winner, teamB: bk2Winner });
    }
  } else {
    for (const id of ['M47', 'M49', 'M51']) {
      if (matches[id]) { matches[id].teamA = null; matches[id].teamB = null; }
      await updateMatchSchedule(id, { teamA: null, teamB: null });
    }
  }

  if (bk1Loser && bk2Loser) {
    for (const id of ['M48', 'M50', 'M52']) {
      if (matches[id]) { matches[id].teamA = bk1Loser; matches[id].teamB = bk2Loser; }
      await updateMatchSchedule(id, { teamA: bk1Loser, teamB: bk2Loser });
    }
  } else {
    for (const id of ['M48', 'M50', 'M52']) {
      if (matches[id]) { matches[id].teamA = null; matches[id].teamB = null; }
      await updateMatchSchedule(id, { teamA: null, teamB: null });
    }
  }

  if (typeof renderAdminSchedule === 'function') renderAdminSchedule();
}

function initAdminScoresComponent() {
  setupStepButtons();
  setupScoreModal();

  const filterStage = document.getElementById('score-filter-stage');
  if (filterStage) {
    filterStage.addEventListener('change', renderAdminMatches);
  }

  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderAdminMatches);
  }

  renderAdminMatches();
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.renderAdminMatches = renderAdminMatches;
  window.saveInlineMatchScore = saveInlineMatchScore;
  window.openScoreModal = openScoreModal;
  window.checkAndUpdateKnockoutBrackets = checkAndUpdateKnockoutBrackets;
  window.initAdminScoresComponent = initAdminScoresComponent;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminScoresComponent);
} else {
  initAdminScoresComponent();
}

/**
 * =========================================================================
 * COMPONENT CONTROLLER ADMIN: LỊCH & SÂN ĐẤU (SCHEDULE)
 * =========================================================================
 */

function renderAdminSchedule() {
  const container = document.getElementById('admin-schedule-table-container');
  if (!container) return;

  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const rawMatches = Object.values(tData.matches || {});
  const matches = rawMatches.map(m => window.sanitizeMatch ? window.sanitizeMatch(m) : m)
    .sort((a, b) => (a.matchNo || 0) - (b.matchNo || 0));
  const teams = Object.values(tData.teams || {});

  let html = `
    <!-- DESKTOP TABLE VIEW (md+) -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full text-xs text-left text-slate-300">
        <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
          <tr>
            <th class="py-3 px-3">Trận</th>
            <th class="py-3 px-3">Giờ Đấu</th>
            <th class="py-3 px-3">Sân</th>
            <th class="py-3 px-3">Nội Dung</th>
            <th class="py-3 px-3">Cặp Đấu</th>
            <th class="py-3 px-3">Trạng Thái</th>
            <th class="py-3 px-3 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-700/60">
  `;

  matches.forEach(m => {
    const isKnockout = m.stage !== 'group';
    const matchNum = m.matchNo || (m.id ? String(m.id).replace(/\D/g, '') : '') || '?';
    const matchIdLabel = `#${matchNum}`;
    const timeVal = m.time || '12:00';
    const courtVal = Number(m.court) || 1;

    const teamAId = isKnockout ? (resolveKnockoutTeamId(m, false) || null) : m.teamA;
    const teamBId = isKnockout ? (resolveKnockoutTeamId(m, true) || null) : m.teamB;

    const teamAObj = getTeamDisplay(teamAId, m.placeholderA, m.category, m, false);
    const teamBObj = getTeamDisplay(teamBId, m.placeholderB, m.category, m, true);

    const subTypeLabel = m.subType || (m.code ? m.code.split('-')[1] : '');
    const catBadge = (subTypeLabel === 'Ab' || m.code?.includes('Ab'))
      ? '<span class="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 font-semibold inline-block whitespace-nowrap">Nam A + Nữ b</span>'
      : (subTypeLabel === 'ab' || m.code?.includes('ab'))
        ? '<span class="text-[10px] text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 font-semibold inline-block whitespace-nowrap">Nam a + Nữ b</span>'
        : (subTypeLabel === 'Aa' || m.code?.includes('Aa') || m.category === 'men')
          ? '<span class="text-[10px] text-blue-300 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/50 font-semibold inline-block whitespace-nowrap">Đôi Nam (A+a)</span>'
          : '<span class="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 font-semibold inline-block whitespace-nowrap">Đôi Nam Nữ</span>';

    html += `
      <tr class="hover:bg-slate-700/30 transition schedule-row" data-match-id="${m.id}">
        <td class="py-2.5 px-3 font-bold text-white font-mono">${matchIdLabel}</td>
        <td class="py-2.5 px-3">
          <input type="text" class="input-match-time w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500" value="${timeVal}" placeholder="HH:MM">
        </td>
        <td class="py-2.5 px-3">
          <select class="select-match-court bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none">
            <option value="1" ${courtVal === 1 ? 'selected' : ''}>Sân 1</option>
            <option value="2" ${courtVal === 2 ? 'selected' : ''}>Sân 2</option>
            <option value="3" ${courtVal === 3 ? 'selected' : ''}>Sân 3</option>
          </select>
        </td>
        <td class="py-2.5 px-3">
          ${catBadge}
        </td>
        <td class="py-2.5 px-3">
          ${isKnockout ? `
            <div class="flex items-center gap-1.5 font-bold">
              <span class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs shrink-0">${teamAObj.code}</span>
              <span class="text-white text-xs truncate" title="${teamAObj.name}">${teamAObj.name}</span>
              <span class="text-slate-500 font-normal text-xs px-1 shrink-0">vs</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs shrink-0">${teamBObj.code}</span>
              <span class="text-white text-xs truncate" title="${teamBObj.name}">${teamBObj.name}</span>
            </div>
          ` : `
            <div class="flex items-center gap-1.5">
              <select class="select-team-a bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-medium max-w-[160px] focus:outline-none">
                ${teams.map(t => {
                  const labelName = (m.category === 'men' && t.menName) ? t.menName : t.name;
                  return `<option value="${t.id}" ${t.id === m.teamA ? 'selected' : ''}>${t.code} - ${labelName}</option>`;
                }).join('')}
              </select>
              <span class="text-slate-400 font-bold">vs</span>
              <select class="select-team-b bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-medium max-w-[160px] focus:outline-none">
                ${teams.map(t => {
                  const labelName = (m.category === 'men' && t.menName) ? t.menName : t.name;
                  return `<option value="${t.id}" ${t.id === m.teamB ? 'selected' : ''}>${t.code} - ${labelName}</option>`;
                }).join('')}
              </select>
            </div>
          `}
        </td>
        <td class="py-2.5 px-3">
          <select class="select-match-status bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Sắp đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>
        </td>
        <td class="py-2.5 px-3 text-right">
          <button class="btn-save-schedule py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm" data-match-id="${m.id}">
            Lưu
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;

  // MOBILE CARD VIEW (< md)
  html += `<div class="md:hidden p-3 space-y-3">`;
  matches.forEach(m => {
    const isKnockout = m.stage !== 'group';
    const matchNum = m.matchNo || (m.id ? String(m.id).replace(/\D/g, '') : '') || '?';
    const matchIdLabel = `#${matchNum}`;
    const timeVal = m.time || '12:00';
    const courtVal = Number(m.court) || 1;

    const teamAId = isKnockout ? (resolveKnockoutTeamId(m, false) || null) : m.teamA;
    const teamBId = isKnockout ? (resolveKnockoutTeamId(m, true) || null) : m.teamB;

    const teamAObj = getTeamDisplay(teamAId, m.placeholderA, m.category, m, false);
    const teamBObj = getTeamDisplay(teamBId, m.placeholderB, m.category, m, true);

    const subTypeLabelMobile = m.subType || (m.code ? m.code.split('-')[1] : '');
    const catBadge = (subTypeLabelMobile === 'Ab' || m.code?.includes('Ab'))
      ? '<span class="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 font-semibold inline-block whitespace-nowrap">Nam A + Nữ b</span>'
      : (subTypeLabelMobile === 'ab' || m.code?.includes('ab'))
        ? '<span class="text-[10px] text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 font-semibold inline-block whitespace-nowrap">Nam a + Nữ b</span>'
        : (subTypeLabelMobile === 'Aa' || m.code?.includes('Aa') || m.category === 'men')
          ? '<span class="text-[10px] text-blue-300 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/50 font-semibold inline-block whitespace-nowrap">Đôi Nam (A+a)</span>'
          : '<span class="text-[10px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/50 font-semibold inline-block whitespace-nowrap">Đôi Nam Nữ</span>';

    html += `
      <div class="bg-slate-900/90 rounded-xl border border-slate-700/80 p-3 space-y-2.5 schedule-row shadow-sm" data-match-id="${m.id}">
        <div class="flex items-center justify-between border-b border-slate-700/60 pb-2 gap-2">
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-white text-xs bg-slate-800 px-2 py-0.5 rounded font-mono border border-slate-700">${matchIdLabel}</span>
            ${catBadge}
          </div>
          <select class="select-match-status bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none">
            <option value="scheduled" ${m.status === 'scheduled' ? 'selected' : ''}>Chưa đấu</option>
            <option value="playing" ${m.status === 'playing' ? 'selected' : ''}>Đang đấu</option>
            <option value="completed" ${m.status === 'completed' ? 'selected' : ''}>Đã xong</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-400 font-semibold block mb-1">Giờ Thi Đấu</label>
            <input type="text" class="input-match-time w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white font-mono font-bold text-xs focus:outline-none focus:border-blue-500" value="${timeVal}" placeholder="HH:MM">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 font-semibold block mb-1">Chọn Sân</label>
            <select class="select-match-court w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-blue-500">
              <option value="1" ${courtVal === 1 ? 'selected' : ''}>Sân 1</option>
              <option value="2" ${courtVal === 2 ? 'selected' : ''}>Sân 2</option>
              <option value="3" ${courtVal === 3 ? 'selected' : ''}>Sân 3</option>
            </select>
          </div>
        </div>

        <div>
          <label class="text-[10px] text-slate-400 font-semibold block mb-1">Cặp Đấu Thi Đấu</label>
          ${isKnockout ? `
            <div class="flex items-center gap-1.5 font-bold bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs shrink-0">${teamAObj.code}</span>
              <span class="text-white text-xs truncate flex-1 min-w-0">${teamAObj.name}</span>
              <span class="text-slate-500 font-normal text-xs px-1 shrink-0">vs</span>
              <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs shrink-0">${teamBObj.code}</span>
              <span class="text-white text-xs truncate flex-1 min-w-0 text-right">${teamBObj.name}</span>
            </div>
          ` : `
            <div class="space-y-1.5">
              <div class="flex items-center gap-1">
                <span class="text-[10px] text-slate-400 w-8 font-bold">Đội A:</span>
                <select class="select-team-a flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-medium focus:outline-none min-w-0">
                  ${teams.map(t => {
                    const labelName = (m.category === 'men' && t.menName) ? t.menName : t.name;
                    return `<option value="${t.id}" ${t.id === m.teamA ? 'selected' : ''}>${t.code} - ${labelName}</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] text-slate-400 w-8 font-bold">Đội B:</span>
                <select class="select-team-b flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-medium focus:outline-none min-w-0">
                  ${teams.map(t => {
                    const labelName = (m.category === 'men' && t.menName) ? t.menName : t.name;
                    return `<option value="${t.id}" ${t.id === m.teamB ? 'selected' : ''}>${t.code} - ${labelName}</option>`;
                  }).join('')}
                </select>
              </div>
            </div>
          `}
        </div>

        <button class="btn-save-schedule w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 mt-1" data-match-id="${m.id}">
          <i class="fa-solid fa-floppy-disk"></i> Lưu Trận Này
        </button>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll('.btn-save-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = btn.dataset.matchId;
      const row = btn.closest('.schedule-row');
      if (!row) return;

      const time = row.querySelector('.input-match-time')?.value.trim() || "12:00";
      const court = parseInt(row.querySelector('.select-match-court')?.value) || 1;
      const status = row.querySelector('.select-match-status')?.value || 'scheduled';

      const updateData = { time, court, status };
      const selectA = row.querySelector('.select-team-a');
      const selectB = row.querySelector('.select-team-b');
      if (selectA && selectB) {
        updateData.teamA = selectA.value;
        updateData.teamB = selectB.value;
      }

      try {
        const updateFn = window.updateMatchSchedule || (typeof updateMatchSchedule !== 'undefined' ? updateMatchSchedule : null);
        if (typeof updateFn === 'function') {
          await updateFn(matchId, updateData);
          showToast(`Đã lưu lịch Trận ${matchId}!`);
        }
      } catch (err) {
        showToast(`❌ Không thể lưu lịch: ${err.message}`, "error");
        alert(`❌ Lỗi kết nối Database: ${err.message}`);
      }
    });
  });
}

function initAdminScheduleComponent() {
  renderAdminSchedule();
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.renderAdminSchedule = renderAdminSchedule;
  window.initAdminScheduleComponent = initAdminScheduleComponent;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminScheduleComponent);
} else {
  initAdminScheduleComponent();
}

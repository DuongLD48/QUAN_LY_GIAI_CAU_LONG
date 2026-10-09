/**
 * =========================================================================
 * UTILITY HELPERS DÙNG CHUNG TOÀN HỆ THỐNG WEB CẦU LÔNG 2026
 * Tái sử dụng cho cả trang Khán Giả (index) và Ban Quản Trị (admin)
 * =========================================================================
 */

/**
 * Chuẩn hóa mã đội (ví dụ 'Đ1' -> 'D1' để đồng nhất key)
 */
function normalizeTeamId(id) {
  if (!id) return null;
  if (typeof id !== 'string') return id;
  return id.replace(/^Đ/i, 'D');
}

/**
 * Lấy chuỗi danh sách 3 thành viên đội (hoặc tên đội)
 */
function getTeam3MembersText(teamInfo, placeholder = "Chưa xác định") {
  const teams = (typeof tournamentData !== 'undefined' && tournamentData.teams) ? tournamentData.teams : {};
  const normId = normalizeTeamId(teamInfo?.id || (typeof teamInfo === 'string' ? teamInfo : null));
  if (!normId || !teams[normId]) {
    return teamInfo?.name || placeholder || "Chưa xác định";
  }
  const team = teams[normId];
  if (team.members && Array.isArray(team.members) && team.members.length > 0) {
    const names = team.members.map(m => m.name).filter(Boolean);
    if (names.length > 0) return names.join(' - ');
  }
  return team.name || placeholder;
}

/**
 * Xác định ID đội cho các trận Knockout (Bán Kết M41-M46, Chung Kết & Tranh Hạng Ba M47-M52)
 * Chế độ hoàn toàn Thủ công (Manual) - manualKnockoutTeams là nguồn chân lý duy nhất!
 */
function resolveKnockoutTeamId(match, isTeamB = false) {
  if (!match) return null;
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const matches = tData.matches || {};
  const settings = tData.settings || {};
  const manualTeams = settings.manualKnockoutTeams || {};

  // 1. Xử lý Bán kết (M41-M46)
  if (match.stage === 'semi_final' || ['M41','M42','M43','M44','M45','M46'].includes(match.id)) {
    const isBK1 = ['M41','M43','M45'].includes(match.id) || (match.code && match.code.includes('BK1'));
    const isBK2 = ['M42','M44','M46'].includes(match.id) || (match.code && match.code.includes('BK2'));

    const top1X = manualTeams.top1X || null;
    const top2X = manualTeams.top2X || null;
    const top1D = manualTeams.top1D || null;
    const top2D = manualTeams.top2D || null;

    if (isBK1) return isTeamB ? top2D : top1X;
    else if (isBK2) return isTeamB ? top2X : top1D;
    return null;
  }

  // 2. Xử lý Chung kết & Tranh Hạng Ba (M47-M52)
  if (match.stage === 'final' || match.stage === 'third_place' || ['M47','M48','M49','M50','M51','M52'].includes(match.id)) {
    const isFinal = ['M47','M49','M51'].includes(match.id) || (!['M48','M50','M52'].includes(match.id) && (match.stage === 'final' || (match.code && match.code.includes('CK'))));
    const isThird = ['M48','M50','M52'].includes(match.id) || (!isFinal && (match.stage === 'third_place' || (match.code && match.code.includes('H3'))));
    const bk1Matches = [matches['M41'], matches['M43'], matches['M45']].filter(Boolean);
    const bk2Matches = [matches['M42'], matches['M44'], matches['M46']].filter(Boolean);

    // Lấy tên đội bán kết từ resolveKnockoutTeamId
    const bk1TeamA = resolveKnockoutTeamId(bk1Matches[0], false);
    const bk1TeamB = resolveKnockoutTeamId(bk1Matches[0], true);
    const bk2TeamA = resolveKnockoutTeamId(bk2Matches[0], false);
    const bk2TeamB = resolveKnockoutTeamId(bk2Matches[0], true);

    // Nếu chưa xác định được đủ 4 đội bán kết -> không hiện chung kết
    if (!bk1TeamA || !bk1TeamB || !bk2TeamA || !bk2TeamB) return null;

    let bk1WinsA = 0, bk1WinsB = 0;
    bk1Matches.forEach(sub => {
      const s1 = (sub.scores || [])[0] || { a: 0, b: 0 };
      if (sub.status === 'completed' || s1.a > 0 || s1.b > 0) {
        const normW = normalizeTeamId(sub.winner);
        if (normW === bk1TeamA || s1.a > s1.b) bk1WinsA++;
        else if (normW === bk1TeamB || s1.b > s1.a) bk1WinsB++;
      }
    });

    let bk2WinsA = 0, bk2WinsB = 0;
    bk2Matches.forEach(sub => {
      const s1 = (sub.scores || [])[0] || { a: 0, b: 0 };
      if (sub.status === 'completed' || s1.a > 0 || s1.b > 0) {
        const normW = normalizeTeamId(sub.winner);
        if (normW === bk2TeamA || s1.a > s1.b) bk2WinsA++;
        else if (normW === bk2TeamB || s1.b > s1.a) bk2WinsB++;
      }
    });

    let bk1Winner = bk1WinsA >= 2 ? bk1TeamA : (bk1WinsB >= 2 ? bk1TeamB : null);
    let bk1Loser = bk1WinsA >= 2 ? bk1TeamB : (bk1WinsB >= 2 ? bk1TeamA : null);
    let bk2Winner = bk2WinsA >= 2 ? bk2TeamA : (bk2WinsB >= 2 ? bk2TeamB : null);
    let bk2Loser = bk2WinsA >= 2 ? bk2TeamB : (bk2WinsB >= 2 ? bk2TeamA : null);

    let result = null;
    if (!isTeamB) {
      result = isThird ? bk1Loser : bk1Winner;
    } else {
      result = isThird ? bk2Loser : bk2Winner;
    }
    return result; // null nếu chưa có kết quả bán kết
  }

  return null;
}

/**
 * Lấy đối tượng thông tin hiển thị của đội (Code, Name, MembersText...)
 */
function getTeamDisplay(teamId, placeholder = "Chưa xác định", category = null, match = null, isTeamB = false) {
  const teams = (typeof tournamentData !== 'undefined' && tournamentData.teams) ? tournamentData.teams : {};
  let effectiveTeamId = normalizeTeamId(teamId);
  if (match && match.stage !== 'group') {
    // Trận Knockout: resolveKnockoutTeamId là nguồn chân lý duy nhất!
    effectiveTeamId = resolveKnockoutTeamId(match, isTeamB) || null;
  }

  if (!effectiveTeamId || !teams[effectiveTeamId]) {
    return {
      id: null,
      code: "?",
      name: placeholder,
      group: "X",
      membersText: ""
    };
  }

  const team = teams[effectiveTeamId];
  const members = team.members || [];
  const mA = members.find(m => m.role === 'A') || members[0] || { name: "" };
  const ma = members.find(m => m.role === 'a') || members[1] || { name: "" };
  const mb = members.find(m => m.role === 'b') || members[2] || { name: "" };

  const subType = match?.subType || "";
  const matchCode = match?.code || "";
  const cat = category || match?.category;

  let displayName = team.name;

  if (subType === 'Ab' || matchCode.includes('Ab')) {
    if (mA.name && mb.name) displayName = `${mA.name} / ${mb.name}`;
    else if (team.mixedName) displayName = team.mixedName;
  } else if (subType === 'ab' || matchCode.includes('ab')) {
    if (ma.name && mb.name) displayName = `${ma.name} / ${mb.name}`;
    else if (team.mixedName) displayName = team.mixedName;
  } else if (subType === 'Aa' || matchCode.includes('Aa') || cat === 'men') {
    if (team.menName) displayName = team.menName;
    else if (mA.name && ma.name) displayName = `${mA.name} - ${ma.name}`;
  } else if (cat === 'mixed' && team.mixedName) {
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
  const teams = (typeof tournamentData !== 'undefined' && tournamentData.teams) ? tournamentData.teams : {};
  const matchCategory = category || teamInfo.matchCategory || teamInfo.category;

  const team = (teamInfo.id && teams[teamInfo.id]) ? teams[teamInfo.id] : teamInfo;

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
 * Lấy tên cặp thi đấu cho trận con Knockout (Ab: Nam A + Nữ b, ab: Nam a + Nữ b, Aa: Nam A + Nam a)
 */
function getKnockoutSubMatchPair(m, teamId, placeholder, isTeamB = false) {
  const teams = (typeof tournamentData !== 'undefined' && tournamentData.teams) ? tournamentData.teams : {};
  const effectiveTeamId = resolveKnockoutTeamId(m, isTeamB) || normalizeTeamId(teamId);
  if (!effectiveTeamId || !teams[effectiveTeamId]) {
    return placeholder || "Chưa xác định";
  }
  const team = teams[effectiveTeamId];
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

/**
 * Xác định đội thắng của một trận con
 */
function getSubMatchWinner(m) {
  if (!m) return null;
  const normWinner = normalizeTeamId(m.winner);
  const normTeamA = resolveKnockoutTeamId(m, false);
  const normTeamB = resolveKnockoutTeamId(m, true);

  if (normWinner) {
    if (normWinner === normTeamA || normWinner === normTeamB) return normWinner;
  }
  const s = (m.scores && m.scores[0]) || { a: 0, b: 0 };
  if (s.a > s.b) return normTeamA;
  if (s.b > s.a) return normTeamB;
  return null;
}

/**
 * Toast thông báo nhanh góc màn hình
 */
function showToast(message, type = "success") {
  const oldToast = document.getElementById('app-toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold transition-all transform translate-y-0 opacity-100 flex items-center gap-2 border ${
    type === 'success' 
      ? 'bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10' 
      : 'bg-slate-900/95 text-rose-300 border-rose-500/40 shadow-rose-500/10'
  }`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'} text-sm"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.normalizeTeamId = normalizeTeamId;
  window.getTeam3MembersText = getTeam3MembersText;
  window.resolveKnockoutTeamId = resolveKnockoutTeamId;
  window.getTeamDisplay = getTeamDisplay;
  window.getPlayerNameLines = getPlayerNameLines;
  window.getKnockoutSubMatchPair = getKnockoutSubMatchPair;
  window.getSubMatchWinner = getSubMatchWinner;
  window.showToast = showToast;
}

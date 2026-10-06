/**
 * DATA HẠT GIỐNG (SEED DATA) GIẢI CẦU LÔNG GIAO HƯU 2026
 * Trích xuất chuẩn xác 100% từ bảng phân cặp và lịch thi đấu chính thức.
 * Tương thích 100% cả khi mở trực tiếp file:// trong máy tính lẫn môi trường HTTP/GitHub Pages.
 */

const DEFAULT_SETTINGS = {
  tournamentName: "GIẢI CẦU LÔNG GIAO HƯU 2026",
  format: "mixed_group21_ko15", // Vòng bảng: 1 set 21; Vòng trong: 3 set 15
  groupPointsPerSet: 21,
  groupMaxSets: 1,
  groupWinSetsRequired: 1,
  knockoutPointsPerSet: 15,
  knockoutMaxSets: 3,
  knockoutWinSetsRequired: 2,
  pointsForWin: 1,
  pointsForLoss: 0,
  adminPin: "123456"
};

/**
 * Xác định thể thức thi đấu chuẩn xác cho từng trận
 * - Vòng bảng (M01 - M20): 1 set chạm 21
 * - Vòng trong (M21 - M24: BK, CK, Tranh 3-4): 3 set chạm 15 (thắng 2)
 */
function getMatchFormat(match, settings = DEFAULT_SETTINGS) {
  const isGroup = match?.stage === 'group' || (match?.id && parseInt(String(match.id).replace(/\D/g, '')) <= 20);
  if (isGroup) {
    return {
      isGroup: true,
      maxSets: 1,
      targetPts: Number(settings?.groupPointsPerSet) || 21,
      winSetsRequired: 1,
      label: "1 set chạm 21"
    };
  } else {
    return {
      isGroup: false,
      maxSets: 3,
      targetPts: Number(settings?.knockoutPointsPerSet) || 15,
      winSetsRequired: 2,
      label: "3 set chạm 15"
    };
  }
}

const DEFAULT_TEAMS = {
  // === BẢNG X (XANH) ===
  "X1": {
    id: "X1",
    code: "X1",
    name: "Toàn - Trung cute - Ngân",
    group: "X",
    color: "#2563eb",
    members: [
      { name: "Toàn", role: "A" },
      { name: "Trung cute", role: "a" },
      { name: "Ngân", role: "b" }
    ]
  },
  "X2": {
    id: "X2",
    code: "X2",
    name: "Gia - Bảo bối - Trúc",
    group: "X",
    color: "#2563eb",
    members: [
      { name: "Gia", role: "A" },
      { name: "Bảo bối", role: "a" },
      { name: "Trúc", role: "b" }
    ]
  },
  "X3": {
    id: "X3",
    code: "X3",
    name: "Hùng - Thịnh - Mến",
    group: "X",
    color: "#2563eb",
    members: [
      { name: "Hùng", role: "A" },
      { name: "Thịnh", role: "a" },
      { name: "Mến", role: "b" }
    ]
  },
  "X4": {
    id: "X4",
    code: "X4",
    name: "Tú - Gia Bảo - Phương Thảo",
    group: "X",
    color: "#2563eb",
    members: [
      { name: "Tú", role: "A" },
      { name: "Gia Bảo", role: "a" },
      { name: "Phương Thảo", role: "b" }
    ]
  },
  "X5": {
    id: "X5",
    code: "X5",
    name: "Hoàng - Hải - Vy",
    group: "X",
    color: "#2563eb",
    members: [
      { name: "Hoàng", role: "A" },
      { name: "Hải", role: "a" },
      { name: "Vy", role: "b" }
    ]
  },

  // === BẢNG Đ (ĐỎ) ===
  "D1": {
    id: "D1",
    code: "Đ1",
    name: "Huy - Bảo bế - Điệp",
    group: "D",
    color: "#dc2626",
    members: [
      { name: "Huy", role: "A" },
      { name: "Bảo bế", role: "a" },
      { name: "Điệp", role: "b" }
    ]
  },
  "D2": {
    id: "D2",
    code: "Đ2",
    name: "Nhi - Dương - Tường Vi",
    group: "D",
    color: "#dc2626",
    members: [
      { name: "Nhi", role: "A" },
      { name: "Dương", role: "a" },
      { name: "Tường Vi", role: "b" }
    ]
  },
  "D3": {
    id: "D3",
    code: "Đ3",
    name: "Vũ - Nam - Lộc",
    group: "D",
    color: "#dc2626",
    members: [
      { name: "Vũ", role: "A" },
      { name: "Nam", role: "a" },
      { name: "Lộc", role: "b" }
    ]
  },
  "D4": {
    id: "D4",
    code: "Đ4",
    name: "Trung - Long - Thảo Vi",
    group: "D",
    color: "#dc2626",
    members: [
      { name: "Trung", role: "A" },
      { name: "Long", role: "a" },
      { name: "Thảo Vi", role: "b" }
    ]
  },
  "D5": {
    id: "D5",
    code: "Đ5",
    name: "Phát - Đại - Mai Thảo",
    group: "D",
    color: "#dc2626",
    members: [
      { name: "Phát", role: "A" },
      { name: "Đại", role: "a" },
      { name: "Mai Thảo", role: "b" }
    ]
  }
};

const DEFAULT_MATCHES = {
  // BẢNG X (SÂN 1) - 10 TRẬN
  "M01": { id: "M01", matchNo: 1, court: 1, time: "07:30", stage: "group", group: "X", teamA: "X1", teamB: "X2", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M02": { id: "M02", matchNo: 2, court: 1, time: "07:45", stage: "group", group: "X", teamA: "X3", teamB: "X4", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M03": { id: "M03", matchNo: 3, court: 1, time: "08:00", stage: "group", group: "X", teamA: "X5", teamB: "X1", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M04": { id: "M04", matchNo: 4, court: 1, time: "08:15", stage: "group", group: "X", teamA: "X2", teamB: "X3", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M05": { id: "M05", matchNo: 5, court: 1, time: "08:30", stage: "group", group: "X", teamA: "X4", teamB: "X5", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M06": { id: "M06", matchNo: 6, court: 1, time: "08:45", stage: "group", group: "X", teamA: "X1", teamB: "X3", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M07": { id: "M07", matchNo: 7, court: 1, time: "09:00", stage: "group", group: "X", teamA: "X2", teamB: "X4", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M08": { id: "M08", matchNo: 8, court: 1, time: "09:15", stage: "group", group: "X", teamA: "X3", teamB: "X5", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M09": { id: "M09", matchNo: 9, court: 1, time: "09:30", stage: "group", group: "X", teamA: "X1", teamB: "X4", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },
  "M10": { id: "M10", matchNo: 10, court: 1, time: "09:45", stage: "group", group: "X", teamA: "X2", teamB: "X5", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng X" },

  // BẢNG Đ (SÂN 2) - 10 TRẬN
  "M11": { id: "M11", matchNo: 11, court: 2, time: "07:30", stage: "group", group: "D", teamA: "D1", teamB: "D2", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M12": { id: "M12", matchNo: 12, court: 2, time: "07:45", stage: "group", group: "D", teamA: "D3", teamB: "D4", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M13": { id: "M13", matchNo: 13, court: 2, time: "08:00", stage: "group", group: "D", teamA: "D5", teamB: "D1", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M14": { id: "M14", matchNo: 14, court: 2, time: "08:15", stage: "group", group: "D", teamA: "D2", teamB: "D3", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M15": { id: "M15", matchNo: 15, court: 2, time: "08:30", stage: "group", group: "D", teamA: "D4", teamB: "D5", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M16": { id: "M16", matchNo: 16, court: 2, time: "08:45", stage: "group", group: "D", teamA: "D1", teamB: "D3", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M17": { id: "M17", matchNo: 17, court: 2, time: "09:00", stage: "group", group: "D", teamA: "D2", teamB: "D4", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M18": { id: "M18", matchNo: 18, court: 2, time: "09:15", stage: "group", group: "D", teamA: "D3", teamB: "D5", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M19": { id: "M19", matchNo: 19, court: 2, time: "09:30", stage: "group", group: "D", teamA: "D1", teamB: "D4", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },
  "M20": { id: "M20", matchNo: 20, court: 2, time: "09:45", stage: "group", group: "D", teamA: "D2", teamB: "D5", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, note: "Vòng bảng Bảng Đ" },

  // KNOCKOUT - 4 TRẬN
  "M21": { id: "M21", matchNo: 21, code: "BK1", court: 2, time: "11:10", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng X", placeholderB: "Nhì Bảng Đ", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 1 (Nhất X vs Nhì Đ)" },
  "M22": { id: "M22", matchNo: 22, code: "BK2", court: 3, time: "11:10", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng Đ", placeholderB: "Nhì Bảng X", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 2 (Nhất Đ vs Nhì X)" },
  "M23": { id: "M23", matchNo: 23, code: "T34", court: 3, time: "12:20", stage: "third_place", teamA: null, teamB: null, placeholderA: "Thua Bán kết 1", placeholderB: "Thua Bán kết 2", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Trận Tranh Hạng Ba" },
  "M24": { id: "M24", matchNo: 24, code: "CK", court: 2, time: "12:20", stage: "final", teamA: null, teamB: null, placeholderA: "Thắng Bán kết 1", placeholderB: "Thắng Bán kết 2", status: "scheduled", scores: [{a:0,b:0},{a:0,b:0},{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Trận Chung Kết" }
};

function getInitialDatabaseData() {
  return {
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    teams: JSON.parse(JSON.stringify(DEFAULT_TEAMS)),
    matches: JSON.parse(JSON.stringify(DEFAULT_MATCHES)),
    updatedAt: new Date().toISOString()
  };
}

// Gán toàn cục cho Browser
if (typeof window !== 'undefined') {
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.DEFAULT_TEAMS = DEFAULT_TEAMS;
  window.DEFAULT_MATCHES = DEFAULT_MATCHES;
  window.getInitialDatabaseData = getInitialDatabaseData;
  window.getMatchFormat = getMatchFormat;
}

// Hỗ trợ Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SETTINGS, DEFAULT_TEAMS, DEFAULT_MATCHES, getInitialDatabaseData, getMatchFormat };
}

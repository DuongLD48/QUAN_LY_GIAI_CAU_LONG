/**
 * DATA HẠT GIỐNG (SEED DATA) GIẢI CẦU LÔNG GIAO HƯU 2026
 * Trích xuất chuẩn xác 100% từ bảng phân cặp và lịch thi đấu chính thức (48 trận).
 * Bao gồm 2 Nội Dung: ĐÔI NAM NỮ (Mixed) & ĐÔI NAM (Men).
 */

const DEFAULT_SETTINGS = {
  tournamentName: "Giải Cầu Lông Đồng Đội Ngọc Phát Sunday",
  format: "all_1set15_team_ties", // Tất cả các trận đấu toàn giải đều thi đấu 1 set chạm 15
  groupPointsPerSet: 15,
  groupMaxSets: 1,
  groupWinSetsRequired: 1,
  knockoutPointsPerSet: 15,
  knockoutMaxSets: 1,
  knockoutWinSetsRequired: 1,
  pointsForWin: 1,
  pointsForLoss: 0,
  adminPin: "123456"
};

/**
 * Xác định thể thức thi đấu chuẩn xác cho từng trận
 * - Tất cả các trận toàn giải (Vòng bảng, Bán kết, Chung kết): 1 set chạm 15 điểm
 */
function getMatchFormat(match, settings = DEFAULT_SETTINGS) {
  return {
    isGroup: true,
    isFinalStage: false,
    maxSets: 1,
    targetPts: Number(settings?.groupPointsPerSet) || 15,
    winSetsRequired: 1,
    label: "1 set 15"
  };
}

const DEFAULT_TEAMS = {
  // === BẢNG X (XANH) ===
  "X1": {
    id: "X1",
    code: "X1",
    name: "Toàn / Trung cute - Ngân",
    menName: "Toàn - Trung",
    mixedName: "Toàn/Trung-Ngân",
    group: "X",
    color: "#00b4d8",
    members: [
      { name: "Toàn", role: "A" },
      { name: "Trung cute", role: "a" },
      { name: "Ngân", role: "b" }
    ]
  },
  "X2": {
    id: "X2",
    code: "X2",
    name: "Gia / Bảo bối - Trúc",
    menName: "Gia - Bảo bối",
    mixedName: "Gia/Bảo bối-Trúc",
    group: "X",
    color: "#00b4d8",
    members: [
      { name: "Gia", role: "A" },
      { name: "Bảo bối", role: "a" },
      { name: "Trúc", role: "b" }
    ]
  },
  "X3": {
    id: "X3",
    code: "X3",
    name: "Hùng / Thịnh - Mến",
    menName: "Hùng - Thịnh",
    mixedName: "Hùng/Thịnh-Mến",
    group: "X",
    color: "#00b4d8",
    members: [
      { name: "Hùng", role: "A" },
      { name: "Thịnh", role: "a" },
      { name: "Mến", role: "b" }
    ]
  },
  "X4": {
    id: "X4",
    code: "X4",
    name: "Tú / Gia Bảo - P.Thảo",
    menName: "Tú - Gia Bảo",
    mixedName: "Tú/Gia Bảo-P.Thảo",
    group: "X",
    color: "#00b4d8",
    members: [
      { name: "Tú", role: "A" },
      { name: "Gia Bảo", role: "a" },
      { name: "Phương Thảo", role: "b" }
    ]
  },
  "X5": {
    id: "X5",
    code: "X5",
    name: "Hoàng / Hải - Vy",
    menName: "Hoàng - Hải",
    mixedName: "Hoàng/Hải-Vy",
    group: "X",
    color: "#00b4d8",
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
    name: "Huy / Bảo bể - Điệp",
    menName: "Huy - Bảo bể",
    mixedName: "Huy/Bảo bể -Điệp",
    group: "D",
    color: "#f43f5e",
    members: [
      { name: "Huy", role: "A" },
      { name: "Bảo bể", role: "a" },
      { name: "Điệp", role: "b" }
    ]
  },
  "D2": {
    id: "D2",
    code: "Đ2",
    name: "Nhi / Dương - Tường Vi",
    menName: "Nhi - Dương",
    mixedName: "Nhi/Dương-Tường Vi",
    group: "D",
    color: "#f43f5e",
    members: [
      { name: "Nhi", role: "A" },
      { name: "Dương", role: "a" },
      { name: "Tường Vi", role: "b" }
    ]
  },
  "D3": {
    id: "D3",
    code: "Đ3",
    name: "Vũ / Nam - Lộc",
    menName: "Vũ - Nam",
    mixedName: "Vũ/Nam-Lộc",
    group: "D",
    color: "#f43f5e",
    members: [
      { name: "Vũ", role: "A" },
      { name: "Nam", role: "a" },
      { name: "Lộc", role: "b" }
    ]
  },
  "D4": {
    id: "D4",
    code: "Đ4",
    name: "Trung / Long - Thảo Vi",
    menName: "Trung - Long",
    mixedName: "Trung/Long -Thảo Vi",
    group: "D",
    color: "#f43f5e",
    members: [
      { name: "Trung", role: "A" },
      { name: "Long", role: "a" },
      { name: "Thảo Vi", role: "b" }
    ]
  },
  "D5": {
    id: "D5",
    code: "Đ5",
    name: "Phát / Đại - Mai Thảo",
    menName: "Phát - Đại",
    mixedName: "Phát/Đại-Mai Thảo",
    group: "D",
    color: "#f43f5e",
    members: [
      { name: "Phát", role: "A" },
      { name: "Đại", role: "a" },
      { name: "Mai Thảo", role: "b" }
    ]
  }
};

const DEFAULT_MATCHES = {
  // =========================================================================
  // 1. VÒNG BẢNG ĐÔI NAM NỮ (MIXED DOUBLES) - 20 TRẬN (M01 - M20)
  // =========================================================================
  // BẢNG X (SÂN 1)
  "M01": { id: "M01", matchNo: 1, court: 1, time: "07:30", category: "mixed", stage: "group", group: "X", teamA: "X1", teamB: "X2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M02": { id: "M02", matchNo: 2, court: 1, time: "07:45", category: "mixed", stage: "group", group: "X", teamA: "X3", teamB: "X4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M03": { id: "M03", matchNo: 3, court: 1, time: "08:00", category: "mixed", stage: "group", group: "X", teamA: "X5", teamB: "X1", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M04": { id: "M04", matchNo: 4, court: 1, time: "08:15", category: "mixed", stage: "group", group: "X", teamA: "X2", teamB: "X3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M05": { id: "M05", matchNo: 5, court: 1, time: "08:30", category: "mixed", stage: "group", group: "X", teamA: "X4", teamB: "X5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M06": { id: "M06", matchNo: 6, court: 1, time: "08:45", category: "mixed", stage: "group", group: "X", teamA: "X1", teamB: "X3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M07": { id: "M07", matchNo: 7, court: 1, time: "09:00", category: "mixed", stage: "group", group: "X", teamA: "X2", teamB: "X4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M08": { id: "M08", matchNo: 8, court: 1, time: "09:15", category: "mixed", stage: "group", group: "X", teamA: "X3", teamB: "X5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M09": { id: "M09", matchNo: 9, court: 1, time: "09:30", category: "mixed", stage: "group", group: "X", teamA: "X1", teamB: "X4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },
  "M10": { id: "M10", matchNo: 10, court: 1, time: "09:45", category: "mixed", stage: "group", group: "X", teamA: "X2", teamB: "X5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng X" },

  // BẢNG Đ (SÂN 2)
  "M11": { id: "M11", matchNo: 11, court: 2, time: "07:30", category: "mixed", stage: "group", group: "D", teamA: "D1", teamB: "D2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M12": { id: "M12", matchNo: 12, court: 2, time: "07:45", category: "mixed", stage: "group", group: "D", teamA: "D3", teamB: "D4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M13": { id: "M13", matchNo: 13, court: 2, time: "08:00", category: "mixed", stage: "group", group: "D", teamA: "D5", teamB: "D1", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M14": { id: "M14", matchNo: 14, court: 2, time: "08:15", category: "mixed", stage: "group", group: "D", teamA: "D2", teamB: "D3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M15": { id: "M15", matchNo: 15, court: 2, time: "08:30", category: "mixed", stage: "group", group: "D", teamA: "D4", teamB: "D5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M16": { id: "M16", matchNo: 16, court: 2, time: "08:45", category: "mixed", stage: "group", group: "D", teamA: "D1", teamB: "D3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M17": { id: "M17", matchNo: 17, court: 2, time: "09:00", category: "mixed", stage: "group", group: "D", teamA: "D2", teamB: "D4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M18": { id: "M18", matchNo: 18, court: 2, time: "09:15", category: "mixed", stage: "group", group: "D", teamA: "D3", teamB: "D5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M19": { id: "M19", matchNo: 19, court: 2, time: "09:30", category: "mixed", stage: "group", group: "D", teamA: "D1", teamB: "D4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },
  "M20": { id: "M20", matchNo: 20, court: 2, time: "09:45", category: "mixed", stage: "group", group: "D", teamA: "D2", teamB: "D5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam Nữ • Bảng Đ" },

  // =========================================================================
  // 2. VÒNG BẢNG ĐÔI NAM (MEN'S DOUBLES) - 20 TRẬN (M21 - M40)
  // =========================================================================
  // Đợt 1 (07:30 - 09:45 trên Sân 3) & Đợt 2 (10:00 - 10:45 trên Sân 1, 2, 3)
  "M21": { id: "M21", matchNo: 21, court: 3, time: "07:30", category: "men", stage: "group", group: "X", teamA: "X3", teamB: "X4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M22": { id: "M22", matchNo: 22, court: 3, time: "07:45", category: "men", stage: "group", group: "D", teamA: "D1", teamB: "D2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M23": { id: "M23", matchNo: 23, court: 3, time: "08:00", category: "men", stage: "group", group: "D", teamA: "D3", teamB: "D4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M24": { id: "M24", matchNo: 24, court: 3, time: "08:15", category: "men", stage: "group", group: "X", teamA: "X4", teamB: "X5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M25": { id: "M25", matchNo: 25, court: 3, time: "08:30", category: "men", stage: "group", group: "D", teamA: "D2", teamB: "D3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M26": { id: "M26", matchNo: 26, court: 3, time: "08:45", category: "men", stage: "group", group: "X", teamA: "X2", teamB: "X4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M27": { id: "M27", matchNo: 27, court: 3, time: "09:00", category: "men", stage: "group", group: "D", teamA: "D5", teamB: "D1", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M28": { id: "M28", matchNo: 28, court: 3, time: "09:15", category: "men", stage: "group", group: "X", teamA: "X1", teamB: "X2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M29": { id: "M29", matchNo: 29, court: 3, time: "09:30", category: "men", stage: "group", group: "D", teamA: "D2", teamB: "D5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M30": { id: "M30", matchNo: 30, court: 3, time: "09:45", category: "men", stage: "group", group: "X", teamA: "X1", teamB: "X4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },

  // Lượt tiếp theo của Đôi Nam từ 10:00 (trên Sân 1, Sân 2, Sân 3)
  "M31": { id: "M31", matchNo: 31, court: 1, time: "10:00", category: "men", stage: "group", group: "X", teamA: "X2", teamB: "X3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M32": { id: "M32", matchNo: 32, court: 2, time: "10:00", category: "men", stage: "group", group: "D", teamA: "D1", teamB: "D3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M33": { id: "M33", matchNo: 33, court: 3, time: "10:00", category: "men", stage: "group", group: "X", teamA: "X5", teamB: "X1", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M34": { id: "M34", matchNo: 34, court: 1, time: "10:15", category: "men", stage: "group", group: "D", teamA: "D4", teamB: "D5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M35": { id: "M35", matchNo: 35, court: 2, time: "10:15", category: "men", stage: "group", group: "X", teamA: "X1", teamB: "X3", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M36": { id: "M36", matchNo: 36, court: 3, time: "10:15", category: "men", stage: "group", group: "X", teamA: "X2", teamB: "X5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M37": { id: "M37", matchNo: 37, court: 1, time: "10:30", category: "men", stage: "group", group: "D", teamA: "D3", teamB: "D5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M38": { id: "M38", matchNo: 38, court: 2, time: "10:30", category: "men", stage: "group", group: "D", teamA: "D1", teamB: "D4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },
  "M39": { id: "M39", matchNo: 39, court: 3, time: "10:30", category: "men", stage: "group", group: "X", teamA: "X3", teamB: "X5", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng X" },
  "M40": { id: "M40", matchNo: 40, court: 1, time: "10:45", category: "men", stage: "group", group: "D", teamA: "D2", teamB: "D4", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Đôi Nam • Bảng Đ" },

  // =========================================================================
  // 3. VÒNG KNOCKOUT (PLAYOFFS) - 12 TRẬN (M41 - M52)
  // =========================================================================
  // =========================================================================
  // 3. VÒNG KNOCKOUT (PLAYOFFS) - 12 TRẬN (M41 - M52)
  // 4 Đội vào vòng trong (2 Đội Bảng X + 2 Đội Bảng Đ). Mỗi cặp đấu 3 trận con: Ab, ab, Aa (1 set 15)
  // =========================================================================
  // --- BÁN KẾT 1 & 2 • TRẬN 1 (Ab: Nam A + Nữ b) ---
  "M41": { id: "M41", matchNo: 41, code: "BK1-Ab", court: 2, time: "11:10", category: "mixed", subType: "Ab", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng X (BK1)", placeholderB: "Nhì Bảng Đ (BK1)", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 1 • Trận 1 (Ab - Nam A + Nữ b)" },
  "M42": { id: "M42", matchNo: 42, code: "BK2-Ab", court: 3, time: "11:10", category: "mixed", subType: "Ab", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng Đ (BK2)", placeholderB: "Nhì Bảng X (BK2)", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 2 • Trận 1 (Ab - Nam A + Nữ b)" },

  // --- BÁN KẾT 1 & 2 • TRẬN 2 (ab: Nam a + Nữ b) ---
  "M43": { id: "M43", matchNo: 43, code: "BK1-ab", court: 2, time: "11:30", category: "mixed", subType: "ab", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng X (BK1)", placeholderB: "Nhì Bảng Đ (BK1)", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 1 • Trận 2 (ab - Nam a + Nữ b)" },
  "M44": { id: "M44", matchNo: 44, code: "BK2-ab", court: 3, time: "11:30", category: "mixed", subType: "ab", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng Đ (BK2)", placeholderB: "Nhì Bảng X (BK2)", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 2 • Trận 2 (ab - Nam a + Nữ b)" },

  // --- BÁN KẾT 1 & 2 • TRẬN 3 (Aa: Nam A + Nam a - ĐÔI NAM) ---
  "M45": { id: "M45", matchNo: 45, code: "BK1-Aa", court: 2, time: "11:50", category: "men", subType: "Aa", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng X (BK1)", placeholderB: "Nhì Bảng Đ (BK1)", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 1 • Trận 3 (Aa - Đôi Nam A+a)" },
  "M46": { id: "M46", matchNo: 46, code: "BK2-Aa", court: 3, time: "11:50", category: "men", subType: "Aa", stage: "semi_final", teamA: null, teamB: null, placeholderA: "Nhất Bảng Đ (BK2)", placeholderB: "Nhì Bảng X (BK2)", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Bán kết 2 • Trận 3 (Aa - Đôi Nam A+a)" },

  // --- CHUNG KẾT & TRANH HẠNG 3 • TRẬN 1 (Ab: Nam A + Nữ b) ---
  "M47": { id: "M47", matchNo: 47, code: "CK-Ab", court: 2, time: "12:20", category: "mixed", subType: "Ab", stage: "final", teamA: null, teamB: null, placeholderA: "Thắng BK1", placeholderB: "Thắng BK2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Chung Kết 🏆 • Trận 1 (Ab - Nam A + Nữ b)" },
  "M48": { id: "M48", matchNo: 48, code: "H3-Ab", court: 3, time: "12:20", category: "mixed", subType: "Ab", stage: "third_place", teamA: null, teamB: null, placeholderA: "Thua BK1", placeholderB: "Thua BK2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Tranh Hạng 3 🥉 • Trận 1 (Ab - Nam A + Nữ b)" },

  // --- CHUNG KẾT & TRANH HẠNG 3 • TRẬN 2 (ab: Nam a + Nữ b) ---
  "M49": { id: "M49", matchNo: 49, code: "CK-ab", court: 2, time: "12:40", category: "mixed", subType: "ab", stage: "final", teamA: null, teamB: null, placeholderA: "Thắng BK1", placeholderB: "Thắng BK2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Chung Kết 🏆 • Trận 2 (ab - Nam a + Nữ b)" },
  "M50": { id: "M50", matchNo: 50, code: "H3-ab", court: 3, time: "12:40", category: "mixed", subType: "ab", stage: "third_place", teamA: null, teamB: null, placeholderA: "Thua BK1", placeholderB: "Thua BK2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Tranh Hạng 3 🥉 • Trận 2 (ab - Nam a + Nữ b)" },

  // --- CHUNG KẾT & TRANH HẠNG 3 • TRẬN 3 (Aa: Nam A + Nam a - ĐÔI NAM) ---
  "M51": { id: "M51", matchNo: 51, code: "CK-Aa", court: 2, time: "13:00", category: "men", subType: "Aa", stage: "final", teamA: null, teamB: null, placeholderA: "Thắng BK1", placeholderB: "Thắng BK2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Chung Kết 🏆 • Trận 3 (Aa - Đôi Nam A+a)" },
  "M52": { id: "M52", matchNo: 52, code: "H3-Aa", court: 3, time: "13:00", category: "men", subType: "Aa", stage: "third_place", teamA: null, teamB: null, placeholderA: "Thua BK1", placeholderB: "Thua BK2", status: "scheduled", scores: [{a:0,b:0}], setsWon: {a:0,b:0}, winner: null, label: "Tranh Hạng 3 🥉 • Trận 3 (Aa - Đôi Nam A+a)" }
};

function sanitizeMatch(rawMatch, key) {
  const def = (DEFAULT_MATCHES && DEFAULT_MATCHES[key || (rawMatch && rawMatch.id)]) || {};
  const id = (rawMatch && rawMatch.id) || key || def.id;
  const matchNo = (rawMatch && rawMatch.matchNo) || def.matchNo || (id ? Number(String(id).replace(/\D/g, '')) : 0);

  return {
    ...def,
    ...(rawMatch || {}),
    id: id,
    matchNo: matchNo,
    court: Number((rawMatch && rawMatch.court) || def.court || 1),
    time: (rawMatch && rawMatch.time) || def.time || "12:00",
    code: (rawMatch && rawMatch.code) || def.code || id,
    subType: (rawMatch && rawMatch.subType) || def.subType || "",
    category: (rawMatch && rawMatch.category) || def.category || "mixed",
    stage: (rawMatch && rawMatch.stage) || def.stage || "group",
    group: (rawMatch && rawMatch.group) || def.group || null,
    teamA: (rawMatch && rawMatch.teamA !== undefined) ? rawMatch.teamA : def.teamA,
    teamB: (rawMatch && rawMatch.teamB !== undefined) ? rawMatch.teamB : def.teamB,
    placeholderA: (rawMatch && rawMatch.placeholderA) || def.placeholderA || "Đội A",
    placeholderB: (rawMatch && rawMatch.placeholderB) || def.placeholderB || "Đội B",
    label: (rawMatch && rawMatch.label) || def.label || ""
  };
}

function sanitizeTournamentData(data) {
  if (!data) return getInitialDatabaseData();

  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const teams = { ...DEFAULT_TEAMS, ...(data.teams || {}) };
  const rawMatches = data.matches || {};
  const matches = {};

  Object.keys(DEFAULT_MATCHES).forEach(key => {
    matches[key] = sanitizeMatch(rawMatches[key], key);
  });

  Object.keys(rawMatches).forEach(key => {
    if (!matches[key]) {
      matches[key] = sanitizeMatch(rawMatches[key], key);
    }
  });

  return {
    ...data,
    settings,
    teams,
    matches,
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

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
  window.sanitizeMatch = sanitizeMatch;
  window.sanitizeTournamentData = sanitizeTournamentData;
}

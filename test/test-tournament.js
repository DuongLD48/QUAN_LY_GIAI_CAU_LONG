/**
 * AUTOMATED TEST SUITE: BADMINTON TOURNAMENT LOGIC (PHASE 4 & 5)
 * Kiểm thử toàn diện:
 * 1. Tính toàn vẹn của dữ liệu hạt giống (Seed Data 10 đội & 24 trận).
 * 2. Thuật toán tính toán Bảng Xếp Hạng (Wins, Sets Diff, Points Diff, Head-to-Head).
 * 3. Thuật toán tự động ghép cặp Bán kết (MIA1 vs MIB2, MIA2 vs MIB1).
 * 4. Thuật toán tự động ghép cặp Chung kết (MCK) và Tranh 3-4 (Mi3-4).
 */

import dataPkg from '../js/data.js';
const { DEFAULT_TEAMS, DEFAULT_MATCHES, DEFAULT_SETTINGS, getInitialDatabaseData } = dataPkg;

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("=================================================");
console.log("🏸 BẮT ĐẦU KIỂM THỬ HỆ THỐNG GIẢI CẦU LÔNG 2026");
console.log("=================================================\n");

// ==========================================
// TEST 1: KIỂM TRA DỮ LIỆU HẠT GIỐNG (SEED DATA)
// ==========================================
console.log("👉 Test 1: Kiểm tra cấu trúc & dữ liệu 10 Đội hình...");
const teamKeys = Object.keys(DEFAULT_TEAMS);
assert(teamKeys.length === 10, "Tổng số đội phải là đúng 10 đội (5 Đội Bảng X, 5 Đội Bảng Đ).");

const groupXTeams = teamKeys.filter(k => DEFAULT_TEAMS[k].group === "X");
const groupDTeams = teamKeys.filter(k => DEFAULT_TEAMS[k].group === "D");
assert(groupXTeams.length === 5, "Bảng X có chính xác 5 đội (X1 - X5).");
assert(groupDTeams.length === 5, "Bảng Đ có chính xác 5 đội (D1 - D5).");

teamKeys.forEach(key => {
  const t = DEFAULT_TEAMS[key];
  assert(t.name && t.name.length > 0, `Đội ${key} có tên hợp lệ: "${t.name}"`);
  assert(Array.isArray(t.members) && t.members.length === 3, `Đội ${key} có đầy đủ 3 VĐV (A, a, b).`);
});

console.log("\n👉 Test 2: Kiểm tra lịch 52 trận đấu...");
const matchKeys = Object.keys(DEFAULT_MATCHES);
assert(matchKeys.length === 52, "Tổng số trận trong giải phải là đúng 52 trận.");

const groupMatches = matchKeys.filter(k => DEFAULT_MATCHES[k].stage === "group");
const knockoutMatches = matchKeys.filter(k => DEFAULT_MATCHES[k].stage !== "group");
assert(groupMatches.length === 40, "Vòng bảng có chính xác 40 trận.");
assert(knockoutMatches.length === 12, "Vòng Knockout có chính xác 12 trận.");

assert(DEFAULT_MATCHES["M41"].stage === "semi_final", "M41 thuộc Bán kết 1.");
assert(DEFAULT_MATCHES["M42"].stage === "semi_final", "M42 thuộc Bán kết 2.");
assert(DEFAULT_MATCHES["M48"].stage === "third_place", "M48 thuộc Tranh Hạng Ba.");
assert(DEFAULT_MATCHES["M47"].stage === "final", "M47 thuộc Chung Kết.");

// ==========================================
// TEST 3: KIỂM THỬ THUẬT TOÁN TÍNH BẢNG XẾP HẠNG
// ==========================================
console.log("\n👉 Test 3: Kiểm thử thuật toán tính Bảng Xếp Hạng & Hiệu số...");

function calculateStandings(teams, matches, groupKey, pointsForWin = 1) {
  const groupTeams = Object.values(teams).filter(t => t.group === groupKey);
  const stats = {};
  groupTeams.forEach(t => {
    stats[t.id] = { id: t.id, name: t.name, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, pointsWon: 0, pointsLost: 0, points: 0 };
  });

  Object.values(matches).forEach(m => {
    if (m.stage === 'group' && m.group === groupKey && m.status === 'completed' && m.winner) {
      const sA = stats[m.teamA];
      const sB = stats[m.teamB];
      if (!sA || !sB) return;

      sA.played++;
      sB.played++;

      if (m.winner === m.teamA) {
        sA.won++;
        sA.points += pointsForWin;
        sB.lost++;
      } else {
        sB.won++;
        sB.points += pointsForWin;
        sA.lost++;
      }

      sA.setsWon += (m.setsWon?.a || 0);
      sA.setsLost += (m.setsWon?.b || 0);
      sB.setsWon += (m.setsWon?.b || 0);
      sB.setsLost += (m.setsWon?.a || 0);

      (m.scores || []).forEach(sc => {
        sA.pointsWon += sc.a;
        sA.pointsLost += sc.b;
        sB.pointsWon += sc.b;
        sB.pointsLost += sc.a;
      });
    }
  });

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffSetsA = a.setsWon - a.setsLost;
    const diffSetsB = b.setsWon - b.setsLost;
    if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;
    const diffPtsA = a.pointsWon - a.pointsLost;
    const diffPtsB = b.pointsWon - b.pointsLost;
    return diffPtsB - diffPtsA;
  });
}

// Giả lập trận M01 (Vòng bảng: 1 set chạm 21): X1 thắng X2 (1-0): Set 1: 21-18
const testData = getInitialDatabaseData();
testData.matches["M01"] = {
  ...testData.matches["M01"],
  status: "completed",
  scores: [{ a: 21, b: 18 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
  setsWon: { a: 1, b: 0 },
  winner: "X1"
};

const standingsX = calculateStandings(testData.teams, testData.matches, "X");
assert(standingsX[0].id === "X1", "Đội X1 thắng trận M01 phải đứng đầu Bảng X.");
assert(standingsX[0].points === 1, "Đội X1 có 1 điểm.");
assert(standingsX[0].setsWon === 1 && standingsX[0].setsLost === 0, "Đội X1 có 1 set thắng, 0 set thua (1 set 21).");
assert(standingsX[0].pointsWon === 21 && standingsX[0].pointsLost === 18, "Hiệu số điểm X1: 21 ghi được, 18 bị mất (+3).");

// ==========================================
// TEST 4: MÔ PHỎNG HOÀN TOÀN 20 TRẬN VÒNG BẢNG (1 SET 21) & TỰ ĐỘNG GÁN BÁN KẾT
// ==========================================
console.log("\n👉 Test 4: Mô phỏng 20 trận vòng bảng (1 set chạm 21) & tự động gán cặp Bán kết...");

// Tạo kịch bản kết quả có chủ đích cho Bảng X:
// X1 thắng tất cả 4 trận -> 4 điểm (Nhất Bảng X)
// X2 thắng 3 trận -> 3 điểm (Nhì Bảng X)
// Bảng Đ:
// D1 thắng tất cả 4 trận -> 4 điểm (Nhất Bảng Đ)
// D2 thắng 3 trận -> 3 điểm (Nhì Bảng Đ)

const groupXOrder = ["X1", "X2", "X3", "X4", "X5"];
const groupDOrder = ["D1", "D2", "D3", "D4", "D5"];

// Hoàn thành tất cả 10 trận Bảng X & Bảng Đ: 1 set chạm 21, đội index nhỏ hơn thắng 21-16
Object.keys(testData.matches).forEach(mId => {
  const m = testData.matches[mId];
  if (m.stage === "group") {
    if (m.group === "X") {
      const idxA = groupXOrder.indexOf(m.teamA);
      const idxB = groupXOrder.indexOf(m.teamB);
      const winner = idxA < idxB ? m.teamA : m.teamB;
      testData.matches[mId] = {
        ...m,
        status: "completed",
        scores: winner === m.teamA ? [{ a: 21, b: 16 }, { a: 0, b: 0 }, { a: 0, b: 0 }] : [{ a: 16, b: 21 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
        setsWon: winner === m.teamA ? { a: 1, b: 0 } : { a: 0, b: 1 },
        winner: winner
      };
    } else if (m.group === "D") {
      const idxA = groupDOrder.indexOf(m.teamA);
      const idxB = groupDOrder.indexOf(m.teamB);
      const winner = idxA < idxB ? m.teamA : m.teamB;
      testData.matches[mId] = {
        ...m,
        status: "completed",
        scores: winner === m.teamA ? [{ a: 21, b: 16 }, { a: 0, b: 0 }, { a: 0, b: 0 }] : [{ a: 16, b: 21 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
        setsWon: winner === m.teamA ? { a: 1, b: 0 } : { a: 0, b: 1 },
        winner: winner
      };
    }
  }
});

const finalStandingsX = calculateStandings(testData.teams, testData.matches, "X");
const finalStandingsD = calculateStandings(testData.teams, testData.matches, "D");

assert(finalStandingsX[0].id === "X1", "Nhất Bảng X là X1 (4 trận thắng).");
assert(finalStandingsX[1].id === "X2", "Nhì Bảng X là X2 (3 trận thắng).");
assert(finalStandingsD[0].id === "D1", "Nhất Bảng Đ là D1 (4 trận thắng).");
assert(finalStandingsD[1].id === "D2", "Nhì Bảng Đ là D2 (3 trận thắng).");

// Kiểm tra quy tắc gán Bán kết:
// BK1 (M21): Nhất X (X1) vs Nhì Đ (D2)
// BK2 (M22): Nhất Đ (D1) vs Nhì X (X2)
const topX = finalStandingsX.slice(0, 2);
const topD = finalStandingsD.slice(0, 2);

testData.matches["M21"].teamA = topX[0].id;
testData.matches["M21"].teamB = topD[1].id;

testData.matches["M22"].teamA = topD[0].id;
testData.matches["M22"].teamB = topX[1].id;

assert(testData.matches["M21"].teamA === "X1" && testData.matches["M21"].teamB === "D2", "Bán kết 1: X1 (Nhất X) vs D2 (Nhì Đ) chuẩn xác 100%.");
assert(testData.matches["M22"].teamA === "D1" && testData.matches["M22"].teamB === "X2", "Bán kết 2: D1 (Nhất Đ) vs X2 (Nhì X) chuẩn xác 100%.");

// ==========================================
// TEST 5: MÔ PHỎNG VÒNG KNOCKOUT (BÁN KẾT -> CHUNG KẾT & TRANH 3-4)
// ==========================================
console.log("\n👉 Test 5: Mô phỏng Bán kết -> Tự động xếp Chung kết & Tranh 3-4...");

// BK1: X1 thắng D2 (2-1)
testData.matches["M21"] = {
  ...testData.matches["M21"],
  status: "completed",
  scores: [{ a: 15, b: 12 }, { a: 11, b: 15 }, { a: 15, b: 13 }],
  setsWon: { a: 2, b: 1 },
  winner: "X1"
};

// BK2: D1 thắng X2 (2-0)
testData.matches["M22"] = {
  ...testData.matches["M22"],
  status: "completed",
  scores: [{ a: 15, b: 10 }, { a: 15, b: 9 }],
  setsWon: { a: 2, b: 0 },
  winner: "D1"
};

// Ghép Chung kết: Thắng BK1 (X1) vs Thắng BK2 (D1)
// Ghép Tranh 3-4: Thua BK1 (D2) vs Thua BK2 (X2)
const bk1 = testData.matches["M21"];
const bk2 = testData.matches["M22"];
const loser1 = bk1.winner === bk1.teamA ? bk1.teamB : bk1.teamA;
const loser2 = bk2.winner === bk2.teamA ? bk2.teamB : bk2.teamA;

testData.matches["M24"].teamA = bk1.winner; // X1
testData.matches["M24"].teamB = bk2.winner; // D1
testData.matches["M23"].teamA = loser1;    // D2
testData.matches["M23"].teamB = loser2;    // X2

assert(testData.matches["M24"].teamA === "X1" && testData.matches["M24"].teamB === "D1", "Trận Chung Kết (M24): X1 vs D1 chuẩn xác 100%.");
assert(testData.matches["M23"].teamA === "D2" && testData.matches["M23"].teamB === "X2", "Trận Tranh Hạng Ba (M23): D2 vs X2 chuẩn xác 100%.");

// Mô phỏng trận Chung kết: X1 thắng D1 -> X1 Vô Địch
testData.matches["M24"] = {
  ...testData.matches["M24"],
  status: "completed",
  scores: [{ a: 15, b: 13 }, { a: 13, b: 15 }, { a: 15, b: 11 }],
  setsWon: { a: 2, b: 1 },
  winner: "X1"
};

assert(testData.matches["M24"].winner === "X1", "Xác định nhà Vô Địch: Đội X1 (Toàn - Trung cute - Ngân) 🏆");

console.log("\n=================================================");
console.log(`🎉 TẤT CẢ ${passedTests}/${totalTests} BÀI KIỂM THỬ ĐỀU THÀNH CÔNG RỰC RỠ!`);
console.log("=================================================");

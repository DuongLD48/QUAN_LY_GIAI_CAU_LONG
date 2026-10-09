/**
 * =========================================================================
 * COMPONENT CONTROLLER ADMIN: CÀI ĐẶT THỂ THỨC & NẠP DỮ LIỆU (SETTINGS)
 * =========================================================================
 */

function fillSettingsForm() {
  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const settings = tData.settings || {};
  const teams = tData.teams || {};

  const inputPoints = document.getElementById('setting-points-win');
  const inputPin = document.getElementById('setting-admin-pin');

  if (inputPoints) inputPoints.value = settings.pointsForWin || 1;
  if (inputPin) inputPin.value = settings.adminPin || "123456";

  const manualTeams = settings.manualKnockoutTeams || {};
  const groupXTeams = Object.values(teams).filter(t => t.group === 'X');
  const groupDTeams = Object.values(teams).filter(t => t.group === 'D');

  const populateSelect = (selectId, teamList, selectedVal) => {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    let optHtml = '<option value="">-- Chưa chọn đội --</option>';
    teamList.forEach(t => {
      optHtml += `<option value="${t.id}" ${t.id === selectedVal ? 'selected' : ''}>${t.code} - ${t.name}</option>`;
    });
    sel.innerHTML = optHtml;
  };

  populateSelect('select-top1-x', groupXTeams, manualTeams.top1X);
  populateSelect('select-top2-x', groupXTeams, manualTeams.top2X);
  populateSelect('select-top1-d', groupDTeams, manualTeams.top1D);
  populateSelect('select-top2-d', groupDTeams, manualTeams.top2D);
}

function setupSettingsForm() {
  const form = document.getElementById('form-settings');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const pointsForWin = parseInt(document.getElementById('setting-points-win')?.value) || 1;
      const adminPin = document.getElementById('setting-admin-pin')?.value.trim() || "123456";

      const top1X = document.getElementById('select-top1-x')?.value || "";
      const top2X = document.getElementById('select-top2-x')?.value || "";
      const top1D = document.getElementById('select-top1-d')?.value || "";
      const top2D = document.getElementById('select-top2-d')?.value || "";

      const updatedSettings = {
        pointsForWin,
        adminPin,
        knockoutMode: 'manual',
        manualKnockoutTeams: { top1X, top2X, top1D, top2D }
      };

      try {
        const updateFn = window.updateSettings || (typeof updateSettings !== 'undefined' ? updateSettings : null);
        if (typeof updateFn === 'function') {
          await updateFn(updatedSettings);
          if (typeof checkAndUpdateKnockoutBrackets === 'function') {
            await checkAndUpdateKnockoutBrackets();
          }
          showToast("Đã lưu toàn bộ cài đặt thể thức thành công!");
        }
      } catch (err) {
        showToast(`❌ Không thể lưu cài đặt: ${err.message}`, "error");
        alert(`❌ Lỗi kết nối Database: ${err.message}`);
      }
    });
  }

  // 1. Nút nạp dữ liệu gốc 10 Đội & 52 Trận
  const btnSeed = document.getElementById('btn-seed-data');
  if (btnSeed) {
    btnSeed.addEventListener('click', async () => {
      const confirmSeed = confirm("⚠️ CẢNH BÁO: Hành động này sẽ nạp lại 10 ĐỘI và 52 TRẬN ĐẤU gốc lên Database. Bạn có chắc chắn muốn thực hiện?");
      if (!confirmSeed) return;

      btnSeed.disabled = true;
      btnSeed.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang nạp...`;

      try {
        const seedFn = window.seedDatabase || (typeof seedDatabase !== 'undefined' ? seedDatabase : null);
        if (typeof seedFn === 'function') {
          await seedFn();
          showToast("Đã nạp dữ liệu chuẩn 10 Đội & 52 Trận lên Database thành công!");
          fillSettingsForm();
          if (typeof renderAdminAll === 'function') renderAdminAll();
        }
      } catch (err) {
        showToast(`❌ Lỗi nạp dữ liệu: ${err.message}`, "error");
        alert(`❌ Lỗi kết nối Database: ${err.message}`);
      } finally {
        btnSeed.disabled = false;
        btnSeed.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-sm"></i> Nạp Dữ Liệu Gốc 10 Đội & 52 Trận`;
      }
    });
  }

  // 2. Nút Reset điểm toàn bộ về 0-0
  const btnReset = document.getElementById('btn-reset-scores');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const confirmReset = confirm("⚠️ Bạn có chắc chắn muốn đặt lại điểm của TẤT CẢ CÁC TRẬN về 0 - 0 không?");
      if (!confirmReset) return;

      btnReset.disabled = true;
      btnReset.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang reset...`;

      try {
        const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
        const matches = tData.matches || {};
        for (const matchId of Object.keys(matches)) {
          const resetPayload = {
            scores: [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
            setsWon: { a: 0, b: 0 },
            winner: null,
            status: 'scheduled'
          };
          if (typeof updateMatchScore === 'function') {
            await updateMatchScore(matchId, resetPayload);
          }
        }

        if (typeof checkAndUpdateKnockoutBrackets === 'function') {
          await checkAndUpdateKnockoutBrackets();
        }

        showToast("Đã đặt lại điểm toàn bộ các trận về 0 - 0!");
        if (typeof renderAdminAll === 'function') renderAdminAll();
      } catch (err) {
        showToast(`❌ Lỗi đặt lại điểm: ${err.message}`, "error");
        alert(`❌ Lỗi kết nối Database: ${err.message}`);
      } finally {
        btnReset.disabled = false;
        btnReset.innerHTML = `<i class="fa-solid fa-rotate-left"></i> Đặt Lại Điểm Tất Cả Các Trận Về 0-0`;
      }
    });
  }

  // 3. Nút Mô phỏng kết quả toàn giải
  const btnSimulate = document.getElementById('btn-simulate-tour');
  if (btnSimulate) {
    btnSimulate.addEventListener('click', async () => {
      const confirmSim = confirm("⚡ Bạn có muốn tự động sinh tỷ số ngẫu nhiên cho toàn bộ 52 trận đấu để kiểm tra không?");
      if (!confirmSim) return;

      btnSimulate.disabled = true;
      btnSimulate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang mô phỏng...`;

      try {
        const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
        const matches = tData.matches || {};
        const groupPoints = Number(tData.settings?.groupPointsPerSet) || 21;
        const koPts = Number(tData.settings?.knockoutPointsPerSet) || 15;

        // Vòng bảng (M01 - M40)
        for (let i = 1; i <= 40; i++) {
          const id = `M${String(i).padStart(2, '0')}`;
          const m = matches[id];
          if (m && m.teamA && m.teamB) {
            const isAWin = Math.random() > 0.5;
            const loserPts = Math.floor(Math.random() * 8) + (groupPoints - 10);
            const sA = isAWin ? groupPoints : loserPts;
            const sB = isAWin ? loserPts : groupPoints;
            const winner = isAWin ? m.teamA : m.teamB;

            if (typeof updateMatchScore === 'function') {
              await updateMatchScore(id, {
                scores: [{ a: sA, b: sB }, { a: 0, b: 0 }, { a: 0, b: 0 }],
                setsWon: { a: isAWin ? 1 : 0, b: isAWin ? 0 : 1 },
                winner: winner,
                status: 'completed'
              });
            }
          }
        }

        if (typeof checkAndUpdateKnockoutBrackets === 'function') {
          await checkAndUpdateKnockoutBrackets();
        }

        showToast("Mô phỏng toàn bộ giải đấu hoàn tất!");
        if (typeof renderAdminAll === 'function') renderAdminAll();
      } catch (err) {
        showToast(`❌ Lỗi mô phỏng: ${err.message}`, "error");
        alert(`❌ Lỗi kết nối Database: ${err.message}`);
      } finally {
        btnSimulate.disabled = false;
        btnSimulate.innerHTML = `<i class="fa-solid fa-play"></i> Chạy Mô Phỏng Kết Quả Toàn Giải (Tự Động)`;
      }
    });
  }

  // 4. Kiểm tra kết nối ping DB
  const btnPing = document.getElementById('btn-ping-db');
  if (btnPing) {
    btnPing.addEventListener('click', async () => {
      const box = document.getElementById('ping-result-box');
      if (box) {
        box.classList.remove('hidden');
        box.innerHTML = '<span class="text-amber-400">Đang gửi gói tin kiểm tra...</span>';
      }
      if (typeof testDatabaseConnection === 'function') {
        const res = await testDatabaseConnection();
        if (box) {
          box.innerHTML = `<span class="${res.success ? 'text-emerald-400' : 'text-rose-400'}">${res.message}</span>`;
        }
      }
    });
  }
}

function initAdminSettingsComponent() {
  setupSettingsForm();
  fillSettingsForm();
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.fillSettingsForm = fillSettingsForm;
  window.setupSettingsForm = setupSettingsForm;
  window.initAdminSettingsComponent = initAdminSettingsComponent;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminSettingsComponent);
} else {
  initAdminSettingsComponent();
}

/**
 * =========================================================================
 * COMPONENT CONTROLLER ADMIN: QUẢN LÝ ĐỘI HÌNH & VĐV (TEAMS)
 * =========================================================================
 */

function renderAdminTeams() {
  const container = document.getElementById('admin-teams-container');
  if (!container) return;

  const tData = typeof tournamentData !== 'undefined' ? tournamentData : {};
  const teams = Object.values(tData.teams || {});

  let html = '';
  teams.forEach(t => {
    const isCyan = t.group === 'X';
    const members = t.members || [];
    const mA = members.find(m => m.role === 'A') || members[0] || { name: "" };
    const ma = members.find(m => m.role === 'a') || members[1] || { name: "" };
    const mb = members.find(m => m.role === 'b') || members[2] || { name: "" };

    html += `
      <div class="bg-slate-800 rounded-2xl border border-slate-700/80 p-4 space-y-3.5 shadow-sm" data-team-id="${t.id}">
        <!-- Header Đội -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-700/60">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full ${isCyan ? 'bg-cyan-400' : 'bg-rose-500'}"></span>
            <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white font-mono font-black text-xs">${t.code}</span>
            <span class="text-xs font-bold text-slate-300">Bảng ${t.group === 'X' ? 'Xanh (X)' : 'Đỏ (Đ)'}</span>
          </div>
          <button class="btn-save-team py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm" data-team-id="${t.id}">
            <i class="fa-solid fa-floppy-disk text-[11px]"></i> Lưu Đội
          </button>
        </div>

        <!-- Tên Đội Hiển Thị Chung -->
        <div>
          <label class="block text-[11px] text-slate-400 font-semibold mb-1">Tên Đội Hiển Thị</label>
          <input type="text" class="input-team-name w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-blue-500" value="${t.name || ''}" placeholder="Nhập tên đội">
        </div>

        <!-- 3 Thành Viên -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <label class="block text-[10px] text-cyan-400 font-semibold mb-1 truncate">VĐV Nam A (Chính)</label>
            <input type="text" class="input-member-A w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${mA.name || ''}" placeholder="Tên VĐV A">
          </div>
          <div>
            <label class="block text-[10px] text-blue-400 font-semibold mb-1 truncate">VĐV Nam a (Phụ)</label>
            <input type="text" class="input-member-a w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${ma.name || ''}" placeholder="Tên VĐV a">
          </div>
          <div>
            <label class="block text-[10px] text-purple-400 font-semibold mb-1 truncate">VĐV Nữ b</label>
            <input type="text" class="input-member-b w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${mb.name || ''}" placeholder="Tên VĐV b">
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.btn-save-team').forEach(btn => {
    btn.addEventListener('click', () => {
      saveTeamInfo(btn.dataset.teamId);
    });
  });
}

/**
 * Lưu thông tin đội lên Firebase
 */
async function saveTeamInfo(teamId) {
  const card = document.querySelector(`[data-team-id="${teamId}"]`);
  if (!card) return;

  const nameInput = card.querySelector('.input-team-name');
  const nameA = card.querySelector('.input-member-A')?.value.trim() || "";
  const name_a = card.querySelector('.input-member-a')?.value.trim() || "";
  const name_b = card.querySelector('.input-member-b')?.value.trim() || "";

  let autoName = nameInput?.value.trim() || "";
  if (!autoName && nameA) {
    autoName = `${nameA}${name_a ? ' - ' + name_a : ''}${name_b ? ' / ' + name_b : ''}`;
    if (nameInput) nameInput.value = autoName;
  }

  const updatedData = {
    name: autoName,
    menName: (nameA && name_a) ? `${nameA} - ${name_a}` : autoName,
    mixedName: (nameA && name_b) ? `${nameA}/${name_b}` : autoName,
    members: [
      { name: nameA, role: 'A' },
      { name: name_a, role: 'a' },
      { name: name_b, role: 'b' }
    ]
  };

  try {
    const updateFn = window.updateTeam || (typeof updateTeam !== 'undefined' ? updateTeam : null);
    if (typeof updateFn === 'function') {
      await updateFn(teamId, updatedData);
      showToast(`Đã cập nhật Đội ${teamId}: "${autoName}"!`);
    }
  } catch (err) {
    showToast(`❌ Không thể lưu thông tin đội: ${err.message}`, "error");
    alert(`❌ Lỗi kết nối Database: ${err.message}`);
  }
}

function initAdminTeamsComponent() {
  renderAdminTeams();
}

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.renderAdminTeams = renderAdminTeams;
  window.saveTeamInfo = saveTeamInfo;
  window.initAdminTeamsComponent = initAdminTeamsComponent;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminTeamsComponent);
} else {
  initAdminTeamsComponent();
}

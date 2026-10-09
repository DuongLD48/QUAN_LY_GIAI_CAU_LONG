/**
 * =========================================================================
 * APP CORE (ORCHESTRATOR CHO TRANG NGƯỜI XEM INDEX.HTML)
 * Quản lý Navigation, Tải Component, Ô tìm kiếm và Realtime Sync
 * =========================================================================
 */

let tournamentData = {
  settings: DEFAULT_SETTINGS,
  teams: DEFAULT_TEAMS,
  matches: DEFAULT_MATCHES
};

let searchQuery = "";
let currentActiveTab = "standings";

/**
 * 1. Khởi tạo và nạp các thành phần giao diện (Components)
 */
async function loadAllClientComponents() {
  await Promise.all([
    ComponentLoader.load('section-rules', 'components/client/rules/rules.html', () => {
      if (typeof initRulesComponent === 'function') initRulesComponent();
    }),
    ComponentLoader.load('section-standings', 'components/client/standings/standings.html', () => {
      if (typeof initStandingsComponent === 'function') initStandingsComponent();
    }),
    ComponentLoader.load('section-bracket', 'components/client/bracket/bracket.html', () => {
      if (typeof initBracketComponent === 'function') initBracketComponent();
    })
  ]);
}

/**
 * 2. Điều hướng Tabs (Thể Lệ, Bảng Điểm, Vòng Loại)
 */
function setupTabNavigation() {
  const tabs = [
    { btn: 'tab-btn-rules', section: 'section-rules', id: 'rules' },
    { btn: 'tab-btn-standings', section: 'section-standings', id: 'standings' },
    { btn: 'tab-btn-bracket', section: 'section-bracket', id: 'bracket' }
  ];

  tabs.forEach(({ btn, section, id }) => {
    const btnEl = document.getElementById(btn);
    if (!btnEl) return;

    btnEl.addEventListener('click', () => {
      tabs.forEach(t => {
        const b = document.getElementById(t.btn);
        const s = document.getElementById(t.section);
        if (b) {
          b.classList.remove('tab-pill-cyan-active');
          b.classList.add('tab-pill-cyan-inactive');
        }
        if (s) s.classList.add('hidden');
      });

      btnEl.classList.remove('tab-pill-cyan-inactive');
      btnEl.classList.add('tab-pill-cyan-active');
      const targetSec = document.getElementById(section);
      if (targetSec) targetSec.classList.remove('hidden');

      currentActiveTab = id;
      if (id === 'standings' && typeof renderStandings === 'function') renderStandings();
      if (id === 'bracket' && typeof renderBracket === 'function') renderBracket();
    });
  });
}

/**
 * 3. Ô tìm kiếm toàn cục VĐV hoặc mã đội
 */
function setupSearchInput() {
  const searchInput = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('btn-clear-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    window.searchQuery = searchQuery;

    if (clearBtn) {
      if (searchQuery) clearBtn.classList.remove('hidden');
      else clearBtn.classList.add('hidden');
    }

    if (typeof renderStandings === 'function') renderStandings();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      window.searchQuery = '';
      clearBtn.classList.add('hidden');
      if (typeof renderStandings === 'function') renderStandings();
    });
  }
}

/**
 * 4. Lắng nghe dữ liệu thời gian thực từ Firebase Realtime DB
 */
function setupRealtimeListener() {
  if (typeof onDataChange === 'function') {
    onDataChange((newData) => {
      if (newData) {
        tournamentData = newData;
        window.tournamentData = tournamentData;

        // Tự động render lại các component đang hiển thị
        if (typeof renderStandings === 'function') renderStandings();
        if (typeof renderBracket === 'function') renderBracket();
      }
    });
  }
}

/**
 * Khởi chạy toàn bộ ứng dụng người xem
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupTabNavigation();
  setupSearchInput();

  // Nạp 3 component HTML vào trang
  await loadAllClientComponents();

  // Kết nối Realtime
  setupRealtimeListener();
});

// Gán toàn cục window
if (typeof window !== 'undefined') {
  window.tournamentData = tournamentData;
  window.searchQuery = searchQuery;
}

/**
 * FIREBASE REALTIME DATABASE CONFIGURATION & UNIFIED DATA SERVICE
 * Tương thích 100% khi mở trực tiếp file:// hoặc deploy trên GitHub Pages.
 */

/**
 * Đọc cấu hình Firebase từ các nguồn an toàn theo thứ tự:
 * 1. window.FIREBASE_ENV (nạp từ js/firebase-env.js - file nằm trong .gitignore, không bị đẩy lên GitHub)
 * 2. localStorage ('badminton_custom_firebase_config' do Quản trị viên nhập trên trình duyệt)
 * 3. Fallback rỗng an toàn (không chứa secret keys)
 */
function getFirebaseConfig() {
  // 1. Nạp từ window.FIREBASE_ENV
  if (typeof window !== 'undefined' && window.FIREBASE_ENV && window.FIREBASE_ENV.apiKey && !window.FIREBASE_ENV.apiKey.includes('YOUR_')) {
    return { ...window.FIREBASE_ENV };
  }

  // 2. Nạp từ cấu hình do Admin lưu trên trình duyệt (LocalStorage)
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('badminton_custom_firebase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey && !parsed.apiKey.includes('YOUR_')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Không thể đọc custom firebase config:", e);
    }
  }

  // 3. Mặc định trống - 100% an toàn khi push lên GitHub
  return {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };
}

let firebaseConfig = getFirebaseConfig();

function saveCustomFirebaseConfig(config) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('badminton_custom_firebase_config', JSON.stringify(config));
    firebaseConfig = getFirebaseConfig();
    return true;
  }
  return false;
}

function clearCustomFirebaseConfig() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('badminton_custom_firebase_config');
    firebaseConfig = getFirebaseConfig();
    return true;
  }
  return false;
}

function isFirebaseConfigured() {
  firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.apiKey.trim() === "") return false;
  
  if (!firebaseConfig.databaseURL && firebaseConfig.projectId) {
    firebaseConfig.databaseURL = `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;
  }

  return Boolean(
    firebaseConfig.databaseURL &&
    !firebaseConfig.databaseURL.includes("YOUR_")
  );
}

let firebaseApp = null;
let firebaseDb = null;
let fallbackChannel = null;
let activeListeners = [];

const LOCAL_STORAGE_KEY = "badminton_tournament_data_2026";
let inMemoryData = null; // Fallback an toàn nếu trình duyệt chặn localStorage

function getFallbackInitialData() {
  if (typeof window !== 'undefined' && typeof window.getInitialDatabaseData === 'function') {
    return window.getInitialDatabaseData();
  }
  return { settings: {}, teams: {}, matches: {} };
}

function getLocalData() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return window.sanitizeTournamentData ? window.sanitizeTournamentData(parsed) : parsed;
      }
    }
  } catch (e) {
    console.warn("LocalStorage không khả dụng, dùng bộ nhớ RAM:", e);
  }
  return window.sanitizeTournamentData ? window.sanitizeTournamentData(inMemoryData) : inMemoryData;
}

function saveLocalData(data) {
  const sanitized = window.sanitizeTournamentData ? window.sanitizeTournamentData(data) : data;
  inMemoryData = sanitized;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
    }
    if (fallbackChannel) {
      fallbackChannel.postMessage({ type: "DATA_UPDATED", data: sanitized });
    }
  } catch (e) {
    console.warn("Không thể ghi LocalStorage:", e);
  }
  notifyListeners(sanitized);
}

let isCloudConnected = false;
let initDbPromise = null;
let latestData = null;
let firebaseDataLoaded = false;

async function initDatabaseService() {
  if (initDbPromise) return initDbPromise;

  initDbPromise = (async () => {
    const isRealFirebase = isFirebaseConfigured();

    if (isRealFirebase && typeof window !== 'undefined' && typeof window.firebase !== 'undefined') {
      try {
        if (!window.firebase.apps.length) {
          firebaseApp = window.firebase.initializeApp(firebaseConfig);
        } else {
          firebaseApp = window.firebase.app();
        }
        firebaseDb = window.firebase.database();
        
        // Đăng ký lắng nghe toàn bộ dữ liệu từ node gốc Firebase
        const rootRef = firebaseDb.ref();
        rootRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (val) {
            firebaseDataLoaded = true;
            notifyListeners(val);
          } else if (!firebaseDataLoaded) {
            notifyListeners(getFallbackInitialData());
          }
        }, (err) => {
          console.error("❌ Lỗi đọc dữ liệu Firebase:", err);
        });

        // Theo dõi trạng thái kết nối Cloud Realtime (.info/connected)
        const connectedRef = firebaseDb.ref('.info/connected');
        connectedRef.on('value', (snap) => {
          isCloudConnected = snap.val() === true;
          if (isCloudConnected) {
            console.log("🔥 Đã kết nối Cloud Firebase Realtime Database!");
          } else {
            console.log("⚠️ Mất kết nối mạng hoặc đang kết nối lại Firebase...");
          }
          if (typeof window !== 'undefined' && typeof window.updateDbBadge === 'function') {
            window.updateDbBadge(isCloudConnected ? "firebase" : "disconnected");
          }
          if (typeof window !== 'undefined' && typeof window.updateSyncIndicator === 'function') {
            window.updateSyncIndicator(isCloudConnected ? "firebase" : "disconnected");
          }
        });

        return { mode: "firebase", db: firebaseDb, url: firebaseConfig.databaseURL };
      } catch (err) {
        console.error("❌ Lỗi khởi tạo Firebase Database:", err);
        if (typeof window !== 'undefined' && typeof window.updateDbBadge === 'function') {
          window.updateDbBadge("unconfigured");
        }
        if (typeof window !== 'undefined' && typeof window.updateSyncIndicator === 'function') {
          window.updateSyncIndicator("unconfigured");
        }
        return { mode: "unconfigured", db: null, error: err.message };
      }
    }

    // Nếu chưa cấu hình Firebase
    if (typeof window !== 'undefined' && typeof window.updateDbBadge === 'function') {
      window.updateDbBadge("unconfigured");
    }
    if (typeof window !== 'undefined' && typeof window.updateSyncIndicator === 'function') {
      window.updateSyncIndicator("unconfigured");
    }

    return { mode: "unconfigured", db: null };
  })();

  return initDbPromise;
}

/**
 * Kiểm tra kết nối thực tế tới Database (Ping test)
 */
async function testDatabaseConnection() {
  if (isFirebaseConfigured()) {
    if (!firebaseDb) {
      await initDatabaseService();
    }
    if (firebaseDb) {
      const startTime = Date.now();
      try {
        // Đọc node settings từ Firebase để kiểm tra quyền đọc & latency
        const snap = await firebaseDb.ref('settings/tournamentName').once('value');
        const latency = Date.now() - startTime;
        return {
          success: true,
          mode: 'firebase',
          latency: `${latency}ms`,
          url: firebaseConfig.databaseURL,
          message: `Đã kết nối thành công tới Firebase Cloud! (Độ trễ: ${latency}ms)`
        };
      } catch (err) {
        return {
          success: false,
          mode: 'firebase_error',
          error: err.message,
          url: firebaseConfig.databaseURL,
          message: `Lỗi kết nối Firebase: ${err.message}. Kiểm tra lại Rules trong Firebase Console (Rules cần có ".read": true, ".write": true).`
        };
      }
    }
  }

  return {
    success: false,
    mode: 'unconfigured',
    message: 'Chưa cấu hình Firebase API Key. Vui lòng nhập API Key và Database URL trong phần Cài đặt.'
  };
}

function onDataChange(callback) {
  activeListeners.push(callback);

  // Gửi ngay dữ liệu khả dụng hiện tại
  const initialData = latestData || getLocalData() || getFallbackInitialData();
  try {
    callback(initialData);
  } catch (e) {
    console.error("Lỗi callback khởi tạo:", e);
  }

  // Tự động kích hoạt kết nối Firebase nếu có cấu hình
  if (isFirebaseConfigured()) {
    initDatabaseService().catch(err => console.error("Lỗi tự động kết nối Firebase:", err));
  }

  return () => {
    activeListeners = activeListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners(data) {
  const sanitized = window.sanitizeTournamentData ? window.sanitizeTournamentData(data) : data;
  latestData = sanitized;
  activeListeners.forEach(cb => {
    try {
      cb(sanitized);
    } catch (e) {
      console.error("Lỗi callback:", e);
    }
  });
}

async function seedDatabase(customData = null) {
  if (!firebaseDb) {
    throw new Error("Chưa kết nối Firebase Cloud Database! Vui lòng nhập API Key và kết nối Firebase trước khi nạp dữ liệu.");
  }
  const data = customData || getFallbackInitialData();
  data.updatedAt = new Date().toISOString();
  await firebaseDb.ref().set(data);
  return data;
}

async function updateMatchScore(matchId, matchUpdate) {
  const curData = getFallbackInitialData();
  const updatedMatches = {
    ...(curData.matches || {}),
    [matchId]: {
      ...((curData.matches && curData.matches[matchId]) || {}),
      ...matchUpdate,
      updatedAt: new Date().toISOString()
    }
  };
  saveLocalData({ ...curData, matches: updatedMatches });

  if (firebaseDb) {
    try {
      await firebaseDb.ref(`matches/${matchId}`).update({
        ...matchUpdate,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firebase sync error:", e);
    }
  }
}

async function updateTeam(teamId, teamData) {
  const curData = getFallbackInitialData();
  const updatedTeams = {
    ...(curData.teams || {}),
    [teamId]: {
      ...((curData.teams && curData.teams[teamId]) || {}),
      ...teamData,
      updatedAt: new Date().toISOString()
    }
  };
  saveLocalData({ ...curData, teams: updatedTeams });

  if (firebaseDb) {
    try {
      await firebaseDb.ref(`teams/${teamId}`).update({
        ...teamData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firebase sync error:", e);
    }
  }
}

async function updateMatchSchedule(matchId, scheduleData) {
  const curData = getFallbackInitialData();
  const updatedMatches = {
    ...(curData.matches || {}),
    [matchId]: {
      ...((curData.matches && curData.matches[matchId]) || {}),
      ...scheduleData,
      updatedAt: new Date().toISOString()
    }
  };
  saveLocalData({ ...curData, matches: updatedMatches });

  if (firebaseDb) {
    try {
      await firebaseDb.ref(`matches/${matchId}`).update({
        ...scheduleData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firebase sync error:", e);
    }
  }
}

async function updateSettings(newSettings) {
  const curData = getFallbackInitialData();
  const updatedSettings = {
    ...(curData.settings || {}),
    ...newSettings,
    updatedAt: new Date().toISOString()
  };
  saveLocalData({ ...curData, settings: updatedSettings });

  if (firebaseDb) {
    try {
      await firebaseDb.ref('settings').update({
        ...newSettings,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Firebase sync error:", e);
    }
  }
}

// Gán toàn cục vào window
if (typeof window !== 'undefined') {
  window.getFirebaseConfig = getFirebaseConfig;
  window.saveCustomFirebaseConfig = saveCustomFirebaseConfig;
  window.clearCustomFirebaseConfig = clearCustomFirebaseConfig;
  window.firebaseConfig = firebaseConfig;
  window.isFirebaseConfigured = isFirebaseConfigured;
  window.initDatabaseService = initDatabaseService;
  window.onDataChange = onDataChange;
  window.seedDatabase = seedDatabase;
  window.updateMatchScore = updateMatchScore;
  window.updateTeam = updateTeam;
  window.updateMatchSchedule = updateMatchSchedule;
  window.updateSettings = updateSettings;
  window.testDatabaseConnection = testDatabaseConnection;
  window.isCloudConnected = () => isCloudConnected;
  window.getLocalData = getLocalData;
  window.saveLocalData = saveLocalData;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFirebaseConfig,
    saveCustomFirebaseConfig,
    clearCustomFirebaseConfig,
    firebaseConfig,
    isFirebaseConfigured,
    initDatabaseService,
    testDatabaseConnection,
    onDataChange,
    seedDatabase,
    updateMatchScore,
    updateTeam,
    updateMatchSchedule,
    updateSettings
  };
}

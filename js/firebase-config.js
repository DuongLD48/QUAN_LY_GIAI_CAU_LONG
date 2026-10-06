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
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("LocalStorage không khả dụng, dùng bộ nhớ RAM:", e);
  }
  return inMemoryData;
}

function saveLocalData(data) {
  inMemoryData = data;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    if (fallbackChannel) {
      fallbackChannel.postMessage({ type: "DATA_UPDATED", data });
    }
  } catch (e) {
    console.warn("Không thể ghi LocalStorage:", e);
  }
  notifyListeners(data);
}

let isCloudConnected = false;

async function initDatabaseService() {
  const isRealFirebase = isFirebaseConfigured();

  if (isRealFirebase && typeof window !== 'undefined' && typeof window.firebase !== 'undefined') {
    try {
      if (!window.firebase.apps.length) {
        firebaseApp = window.firebase.initializeApp(firebaseConfig);
      } else {
        firebaseApp = window.firebase.app();
      }
      firebaseDb = window.firebase.database();
      
      // Theo dõi trạng thái kết nối Cloud Realtime
      const connectedRef = firebaseDb.ref('.info/connected');
      connectedRef.on('value', (snap) => {
        isCloudConnected = snap.val() === true;
        if (isCloudConnected) {
          console.log("🔥 Đã kết nối Cloud Firebase Realtime Database!");
        } else {
          console.log("⚠️ Mất kết nối mạng hoặc đang kết nối lại Firebase...");
        }
        if (typeof window !== 'undefined' && typeof window.updateDbBadge === 'function') {
          window.updateDbBadge(isCloudConnected ? "firebase" : "local");
        }
        if (typeof window !== 'undefined' && typeof window.updateSyncIndicator === 'function') {
          window.updateSyncIndicator(isCloudConnected ? "firebase" : "local");
        }
      });

      return { mode: "firebase", db: firebaseDb, url: firebaseConfig.databaseURL };
    } catch (err) {
      console.warn("⚠️ Không thể kết nối Firebase, chuyển sang LocalStorage:", err);
    }
  }

  // Chế độ Local
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      fallbackChannel = new BroadcastChannel("badminton_sync_channel");
      fallbackChannel.onmessage = (event) => {
        if (event.data && event.data.type === "DATA_UPDATED") {
          notifyListeners(event.data.data);
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel không hỗ trợ:", e);
    }
  }

  // Khởi tạo data ban đầu nếu chưa có
  const currentData = getLocalData();
  if (!currentData || !currentData.matches || !currentData.teams) {
    const initial = getFallbackInitialData();
    saveLocalData(initial);
  }

  return { mode: "local", db: null };
}

/**
 * Kiểm tra kết nối thực tế tới Database (Ping test)
 */
async function testDatabaseConnection() {
  if (isFirebaseConfigured() && firebaseDb) {
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

  return {
    success: true,
    mode: 'local',
    message: 'Đang dùng Local Storage nội bộ trên trình duyệt (Chưa cấu hình Firebase API Key).'
  };
}

function onDataChange(callback) {
  activeListeners.push(callback);

  if (isFirebaseConfigured() && firebaseDb) {
    const rootRef = firebaseDb.ref();
    rootRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        callback(val);
      } else {
        callback(getFallbackInitialData());
      }
    });
  } else {
    const data = getLocalData() || getFallbackInitialData();
    callback(data);
  }

  return () => {
    activeListeners = activeListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners(data) {
  activeListeners.forEach(cb => {
    try {
      cb(data);
    } catch (e) {
      console.error("Lỗi callback:", e);
    }
  });
}

async function seedDatabase(customData = null) {
  const data = customData || getFallbackInitialData();
  data.updatedAt = new Date().toISOString();

  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref().set(data);
  } else {
    saveLocalData(data);
  }
  return data;
}

async function updateMatchScore(matchId, matchUpdate) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref(`matches/${matchId}`).update({
      ...matchUpdate,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getFallbackInitialData();
    if (data.matches && data.matches[matchId]) {
      data.matches[matchId] = {
        ...data.matches[matchId],
        ...matchUpdate,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
    }
  }
}

async function updateTeam(teamId, teamData) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref(`teams/${teamId}`).update({
      ...teamData,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getFallbackInitialData();
    if (data.teams && data.teams[teamId]) {
      data.teams[teamId] = {
        ...data.teams[teamId],
        ...teamData,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
    }
  }
}

async function updateMatchSchedule(matchId, scheduleData) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref(`matches/${matchId}`).update({
      ...scheduleData,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getFallbackInitialData();
    if (data.matches && data.matches[matchId]) {
      data.matches[matchId] = {
        ...data.matches[matchId],
        ...scheduleData,
        updatedAt: new Date().toISOString()
      };
      saveLocalData(data);
    }
  }
}

async function updateSettings(newSettings) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref('settings').update({
      ...newSettings,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getFallbackInitialData();
    data.settings = {
      ...(data.settings || (typeof window !== 'undefined' ? window.DEFAULT_SETTINGS : {})),
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    saveLocalData(data);
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

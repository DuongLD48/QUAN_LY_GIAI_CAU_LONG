/**
 * FIREBASE REALTIME DATABASE CONFIGURATION & DATA SERVICE LAYER
 * Cấu hình kết nối Firebase Realtime Database cho Giải Cầu Lông 2026.
 * Hỗ trợ đồng bộ Realtime 2 chiều + Fallback LocalStorage & BroadcastChannel
 * để có thể test ngay tức thì ngay cả khi chưa paste Firebase API Key!
 */

import { getInitialDatabaseData, DEFAULT_SETTINGS } from './data.js';

// =========================================================================
// 1. CẤU HÌNH FIREBASE CỦA BẠN (Thay thế các thông số bên dưới khi có Firebase)
// =========================================================================
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Kiểm tra xem người dùng đã cấu hình Firebase thật chưa
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("YOUR_") &&
    firebaseConfig.databaseURL &&
    !firebaseConfig.databaseURL.includes("YOUR_")
  );
}

// Biến trạng thái toàn cục
let firebaseApp = null;
let firebaseDb = null;
let fallbackChannel = null;
let activeListeners = [];

const LOCAL_STORAGE_KEY = "badminton_tournament_data_2026";

/**
 * Khởi tạo Database Service (Firebase hoặc Fallback LocalStorage)
 */
export async function initDatabaseService() {
  const isRealFirebase = isFirebaseConfigured();

  if (isRealFirebase && typeof window.firebase !== 'undefined') {
    try {
      if (!window.firebase.apps.length) {
        firebaseApp = window.firebase.initializeApp(firebaseConfig);
      } else {
        firebaseApp = window.firebase.app();
      }
      firebaseDb = window.firebase.database();
      console.log("🔥 Kết nối Firebase Realtime Database thành công!");
      return { mode: "firebase", db: firebaseDb };
    } catch (err) {
      console.warn("⚠️ Không thể kết nối Firebase, chuyển sang chế độ LocalStorage:", err);
    }
  }

  // Chế độ LocalStorage Fallback (có đồng bộ đa tab qua BroadcastChannel)
  console.log("💾 Đang sử dụng chế độ lưu trữ LocalStorage (Đồng bộ đa tab BroadcastChannel).");
  if (typeof BroadcastChannel !== 'undefined') {
    fallbackChannel = new BroadcastChannel("badminton_sync_channel");
    fallbackChannel.onmessage = (event) => {
      if (event.data && event.data.type === "DATA_UPDATED") {
        notifyListeners(event.data.data);
      }
    };
  }

  // Khởi tạo data ban đầu nếu LocalStorage rỗng
  const currentData = getLocalData();
  if (!currentData || !currentData.matches || !currentData.teams) {
    const initial = getInitialDatabaseData();
    saveLocalData(initial);
  }

  return { mode: "local", db: null };
}

/**
 * Lấy dữ liệu từ LocalStorage
 */
export function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Lỗi đọc LocalStorage", e);
    return null;
  }
}

/**
 * Lưu dữ liệu vào LocalStorage và phát sóng cho các tab khác
 */
export function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    if (fallbackChannel) {
      fallbackChannel.postMessage({ type: "DATA_UPDATED", data });
    }
    notifyListeners(data);
  } catch (e) {
    console.error("Lỗi ghi LocalStorage", e);
  }
}

/**
 * Đăng ký lắng nghe thay đổi dữ liệu (Realtime Listener)
 * Callback nhận toàn bộ object { settings, teams, matches }
 */
export function onDataChange(callback) {
  activeListeners.push(callback);

  if (isFirebaseConfigured() && firebaseDb) {
    const rootRef = firebaseDb.ref();
    rootRef.on('value', (snapshot) => {
      const val = snapshot.val();
      if (val) {
        callback(val);
      } else {
        // Database trên Firebase chưa có dữ liệu -> cung cấp data ban đầu
        callback(getInitialDatabaseData());
      }
    });
  } else {
    // Trả về dữ liệu cục bộ ngay lập tức
    const data = getLocalData() || getInitialDatabaseData();
    callback(data);
  }

  // Trả về hàm hủy đăng ký
  return () => {
    activeListeners = activeListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners(data) {
  activeListeners.forEach(cb => {
    try {
      cb(data);
    } catch (e) {
      console.error("Lỗi listener callback", e);
    }
  });
}

/**
 * Nạp dữ liệu hạt giống (Seed Database)
 */
export async function seedDatabase(customData = null) {
  const data = customData || getInitialDatabaseData();
  data.updatedAt = new Date().toISOString();

  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref().set(data);
    console.log("✅ Đã nạp thành công Seed Data lên Firebase Realtime Database!");
  } else {
    saveLocalData(data);
    console.log("✅ Đã nạp thành công Seed Data vào LocalStorage!");
  }
  return data;
}

/**
 * Lưu cập nhật tỷ số trận đấu
 */
export async function updateMatchScore(matchId, matchUpdate) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref(`matches/${matchId}`).update({
      ...matchUpdate,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getInitialDatabaseData();
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

/**
 * Cập nhật thông tin đội & thành viên (Khi BTC muốn sửa chính tả, đổi người)
 */
export async function updateTeam(teamId, teamData) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref(`teams/${teamId}`).update({
      ...teamData,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getInitialDatabaseData();
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

/**
 * Cập nhật thông tin lịch đấu (Đổi giờ, đổi sân, đổi trạng thái)
 */
export async function updateMatchSchedule(matchId, scheduleData) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref(`matches/${matchId}`).update({
      ...scheduleData,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getInitialDatabaseData();
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

/**
 * Cập nhật Cài đặt giải đấu (Thể thức, điểm mỗi set, PIN)
 */
export async function updateSettings(newSettings) {
  if (isFirebaseConfigured() && firebaseDb) {
    await firebaseDb.ref('settings').update({
      ...newSettings,
      updatedAt: new Date().toISOString()
    });
  } else {
    const data = getLocalData() || getInitialDatabaseData();
    data.settings = {
      ...(data.settings || DEFAULT_SETTINGS),
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    saveLocalData(data);
  }
}

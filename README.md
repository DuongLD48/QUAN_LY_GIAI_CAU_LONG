# 🏸 Website Theo Dõi Trực Tiếp & Quản Lý Điểm Giải Cầu Lông 2026

Hệ thống theo dõi tỷ số trực tiếp (Live Score), lịch thi đấu, bảng xếp hạng tự động và quản lý kết quả giải đấu cầu lông 3 sân đồng thời, tối ưu cho điện thoại và máy tính.

---

## 🌟 Tính Năng Nổi Bật

1. **Giao diện Người xem (Client - `index.html`):**
   - **Trực tiếp 3 Sân:** Theo dõi đồng thời Sân 1, Sân 2, Sân 3 với điểm số từng set cập nhật Realtime không cần reload (F5).
   - **Lịch thi đấu & Kết quả:** Toàn bộ 24 trận đấu kèm bộ lọc thông minh (Theo Sân 1-2-3, Bảng X, Bảng Đ, Vòng Knockout).
   - **Bảng xếp hạng Tự động:** Tự động tính trận thắng/thua, hiệu số set, hiệu số điểm và điểm xếp hạng cho Bảng X và Bảng Đ.
   - **Nhánh đấu Vòng Chung Kết:** Tự động điền các đội nhất/nhì vào Bán kết và Chung kết.

2. **Giao diện Quản trị (Admin - `admin.html`):**
   - **Bảo mật PIN:** Đăng nhập an toàn bằng mã PIN (Mặc định: `123456`).
   - **Nạp Dữ Liệu Gốc 1-Click (Seed Data):** Nạp toàn bộ 10 đội và 24 trận đấu chuẩn vào Database.
   - **Sửa Đội & VĐV:** Chỉnh sửa trực tiếp tên đội hoặc tên 3 VĐV khi có sai sót chính tả hoặc đổi người đột xuất.
   - **Đổi Giờ & Sân Đấu:** Linh hoạt điều chỉnh lịch thi đấu và sân đấu thực tế.
   - **Nhập Tỷ Số Nhanh:** Nhập điểm từng set (Set 1, Set 2, Set 3), hệ thống tự động xác định đội thắng và tính toán BXH.
   - **Tùy biến Thể thức:** Hỗ trợ thể thức 3 hiệp 15 điểm (mặc định), 3 hiệp 21 điểm, 1 hiệp 21 điểm, 1 hiệp 31 điểm.

---

## 📁 Cấu Trúc Mã Nguồn

```text
├── index.html              # Giao diện người xem (Live Score, Lịch, BXH, Bracket)
├── admin.html              # Bảng điều khiển Quản trị (Nhập điểm, sửa đội, đổi lịch)
├── css/
│   └── style.css           # Hiệu ứng nhấp nháy trực tiếp & giao diện bổ trợ
├── js/
│   ├── firebase-config.js  # Cấu hình Firebase & Tầng dịch vụ dữ liệu (hỗ trợ Local fallback)
│   ├── data.js             # Dữ liệu gốc (Seed Data 10 đội, 24 trận)
│   ├── app.js              # Logic hiển thị Client (lắng nghe Realtime)
│   └── admin.js            # Logic Quản trị (xác thực PIN, cập nhật Database)
└── assets/                 # Hình ảnh, icon giải đấu
```

---

## ⚡ Hướng Dẫn Kích Hoạt Firebase Realtime Database (Chỉ 2 Phút)

Hệ thống có sẵn cơ chế **Fallback Local** để bạn trải nghiệm ngay. Khi muốn chia sẻ cho khán giả và VĐV xem trực tiếp qua internet:

1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập tài khoản Google.
2. Bấm **"Add Project"** (Tạo dự án mới), đặt tên bất kỳ (ví dụ: `giai-cau-long-2026`).
3. Trong menu bên trái, chọn **Build > Realtime Database** > bấm **"Create Database"** > chọn vị trí `Singapore (asia-southeast1)` > chọn chế độ **Start in test mode** (hoặc đặt rules read/write công khai).
4. Vào biểu tượng **Bánh răng (Project Settings)** > kéo xuống mục **Your apps** > bấm biểu tượng Web `</>` để đăng ký app.
5. Copy đoạn cấu hình `firebaseConfig` và dán vào file [`js/firebase-config.js`](js/firebase-config.js):
   ```javascript
   export const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "giai-cau-long.firebaseapp.com",
     databaseURL: "https://giai-cau-long-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "giai-cau-long",
     storageBucket: "giai-cau-long.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. Vào trang `admin.html` > Bấm **"Nạp Dữ Liệu Gốc 10 Đội & 24 Trận"** để đẩy toàn bộ dữ liệu lên Firebase!

---

## 🚀 Hướng Dẫn Deploy Lên GitHub Pages Miễn Phí

1. Khởi tạo và đẩy code lên kho lưu trữ GitHub của bạn:
   ```bash
   git add .
   git commit -m "feat: complete badminton live score system"
   git push origin main
   ```
2. Trên GitHub, vào **Settings** của repository > chọn mục **Pages**.
3. Tại **Build and deployment > Branch**, chọn nhánh `main` và thư mục `/ (root)` > Bấm **Save**.
4. Chờ 1 phút, bạn sẽ nhận được đường dẫn website công khai dạng:
   `https://<ten-user>.github.io/<ten-repo>/`
5. Tạo mã QR trỏ tới link trên và in ra dán tại nhà thi đấu để VĐV/khán giả quét mã xem trực tiếp!

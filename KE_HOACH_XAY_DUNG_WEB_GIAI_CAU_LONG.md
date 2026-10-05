# 🏸 KẾ HOẠCH XÂY DỰNG WEBSITE THEO DÕI ĐIỂM & LỊCH ĐẤU GIẢI CẦU LÔNG
> **Nền tảng triển khai:** GitHub Pages (Frontend Hosting)  
> **Cơ sở dữ liệu:** Firebase Realtime Database (Đồng bộ trực tiếp)  
> **Hình thức vận hành:** Toàn bộ dữ liệu (10 đội, lịch đấu, điểm số) lưu trữ trên Database. BTC có thể chỉnh sửa dữ liệu (tên đội, VĐV, giờ, sân đấu) và nhập điểm trực tiếp -> Toàn bộ BXH & Lịch đấu cập nhật tức thì.

---

## 📌 TỔNG QUAN GIẢI ĐẤU & YÊU CẦU HỆ THỐNG

### 1. Dữ liệu giải đấu (Trích xuất từ bảng lịch đấu)
* **Số sân:** 3 Sân đấu đồng thời (Sân 1, Sân 2, Sân 3).
* **Số đội tham gia:** 10 đội (mỗi đội gồm 3 VĐV):
  * **Bảng X (Xanh):**
    * `X1`: Toàn - Trung cute - Ngân
    * `X2`: Gia - Bảo bối - Trúc
    * `X3`: Hùng - Thịnh - Mến
    * `X4`: Tú - Gia Bảo - Phương Thảo
    * `X5`: Hoàng - Hải - Vy
  * **Bảng Đ (Đỏ):**
    * `Đ1`: Huy - Bảo bế - Điệp
    * `Đ2`: Nhi - Dương - Tường Vi
    * `Đ3`: Vũ - Nam - Lộc
    * `Đ4`: Trung - Long - Thảo Vi
    * `Đ5`: Phát - Đại - Mai Thảo
* **Tiến trình thi đấu:**
  * **Vòng bảng:** 7h30 – 10h45 (Đấu vòng tròn nội bộ từng bảng).
  * **Vòng Bán kết:** 11h10 & 11h30 (MIA1 vs MIB2, MIA2 vs MIB1).
  * **Vòng Tranh 3-4 & Chung kết:** 12h20 & 13h00 (MCK & Mi3-4).
* **Thể thức thi đấu:** 
  * Mặc định: **3 set 15 điểm (3c 15)** — thắng 2 set là thắng trận.
  * Có tính năng linh hoạt thay đổi thể thức trong trang Quản trị (1 set 21, 1 set 31, 3 set 21...).
* **Yêu cầu dữ liệu động:** Dữ liệu đội hình và lịch đấu được lưu trực tiếp trên Database (Firebase), hỗ trợ chỉnh sửa nhanh khi phát sinh sai sót trong quá trình nhập liệu hoặc khi giải đấu có thay đổi giờ/sân.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ

```
┌────────────────────────────────────────────────────────┐
│               GIAO DIỆN NGƯỜI XEM (Client)             │
│   - Bảng điểm 3 Sân (Sân 1, 2, 3)                      │
│   - Lịch thi đấu & Kết quả                             │
│   - Bảng xếp hạng tự động (Bảng X, Bảng Đ)             │
│   - Nhánh đấu Bán kết / Chung kết                      │
└───────────────────────────▲────────────────────────────┘
                            │ (Lắng nghe sự kiện Realtime)
┌───────────────────────────┴────────────────────────────┐
│         FIREBASE REALTIME DATABASE (Cloud)             │
│   - Single Source of Truth cho toàn bộ giải đấu        │
│   - Lưu trữ Teams, Matches, Scores, Settings           │
└───────────────────────────▲────────────────────────────┘
                            │ (Ghi/Sửa điểm & Thông tin)
┌───────────────────────────┴────────────────────────────┐
│               GIAO DIỆN QUẢN TRỊ (Admin Panel)          │
│   - Bảo vệ bằng Mật mã PIN                             │
│   - Nạp dữ liệu ban đầu (Seed Data) lên Database       │
│   - Chỉnh sửa thông tin Đội, VĐV, Giờ đấu, Sân đấu     │
│   - Nhập tỷ số các set (Set 1, Set 2, Set 3)           │
│   - Đổi trạng thái trận đấu (Sắp đấu/Đang đấu/Đã xong) │
│   - Cài đặt Thể thức thi đấu (Số set, Điểm mỗi set)   │
└────────────────────────────────────────────────────────┘
```

* **Frontend:** HTML5, TailwindCSS (CDN), JavaScript (ES6 Modules) — Tối ưu 100% cho GitHub Pages tĩnh, không cần build phức tạp.
* **Database & Sync:** Firebase Realtime Database SDK (Miễn phí hoàn toàn với gói Spark).
* **Deploy & Hosting:** GitHub Pages (Truy cập qua link dạng: `https://<username>.github.io/<repo-name>`).

---

## 📅 KẾ HOẠCH TRIỂN KHAI CHI TIẾT THEO TỪNG PHASE

```mermaid
gantt
    title Lộ trình Triển khai Dự án Web Giải Cầu Lông
    dateFormat  X
    axisFormat Phase %d
    section Triển khai
    Phase 1: Khởi tạo & Cấu hình Firebase       :p1, 0, 1
    Phase 2: Xây dựng Giao diện Người xem       :p2, 1, 3
    Phase 3: Xây dựng Admin Nhập điểm & Thể thức :p3, 3, 5
    Phase 4: Tự động hóa BXH & Nhánh Knockout   :p4, 5, 7
    Phase 5: Kiểm thử, QR Code & Deploy GitHub  :p5, 7, 8
```

---

### 🔹 PHASE 1: KHỞI TẠO DỰ ÁN & CẤU HÌNH CSDL FIREBASE
**Mục tiêu:** Thiết lập cấu trúc mã nguồn Git, tạo Firebase project và chuẩn bị dữ liệu mẫu.

1. **Khởi tạo Repo GitHub:**
   * Tạo repository mới trên GitHub (ví dụ: `badminton-tournament-live`).
   * Cấu trúc thư mục:
     ```text
     ├── index.html          # Trang chủ người xem (Live Score, Lịch, BXH, Bracket)
     ├── admin.html          # Trang ban tổ chức nhập điểm & cài đặt
     ├── css/
     │   └── style.css       # Style bổ trợ (TailwindCSS dùng qua CDN)
     ├── js/
     │   ├── firebase-config.js # Cấu hình kết nối Firebase
     │   ├── data.js         # Dữ liệu hạt giống (Seed data 10 đội & lịch thi đấu) để nạp vào Database
     │   ├── app.js          # Logic hiển thị Realtime phía Client (lấy trực tiếp từ Database)
     │   └── admin.js        # Logic Quản trị: nạp seed, sửa đội/lịch, nhập điểm & cài đặt (ghi Database)
     └── assets/             # Hình ảnh, icon cầu lông, mã QR
     ```
2. **Thiết lập Firebase Realtime Database:**
   * Tạo Firebase Project trên console.firebase.google.com (miễn phí).
   * Bật **Realtime Database** ở chế độ đọc công khai cho Client, ghi điểm và dữ liệu có kiểm soát qua Admin PIN.
3. **Định nghĩa Cấu trúc Dữ liệu (Database Schema):**
   ```json
   {
     "settings": {
       "tournamentName": "GIẢI CẦU LÔNG GIAO HƯU 2026",
       "format": "3_sets_15", // 3_sets_15, 3_sets_21, 1_set_21, 1_set_31
       "pointsPerSet": 15,
       "maxSets": 3,
       "winSetsRequired": 2
     },
     "teams": {
       "X1": { "id": "X1", "name": "Toàn - Trung cute - Ngân", "group": "X" },
       "X2": { "id": "X2", "name": "Gia - Bảo bối - Trúc", "group": "X" },
       ...
       "D1": { "id": "D1", "name": "Huy - Bảo bế - Điệp", "group": "D" }
     },
     "matches": {
       "M01": {
         "id": "M01",
         "court": 1,
         "time": "07:30",
         "stage": "group", // group, semi_final, third_place, final
         "teamA": "X1",
         "teamB": "X2",
         "status": "scheduled", // scheduled, playing, completed
         "scores": [
           { "a": 15, "b": 12 },
           { "a": 10, "b": 15 },
           { "a": 15, "b": 13 }
         ],
         "setsWon": { "a": 2, "b": 1 },
         "winner": "X1"
       }
     }
   }
   ```
4. **Cơ chế Lưu trữ & Quản lý Dữ liệu Động (Database as Single Source of Truth):**
   * File `data.js` đóng vai trò là dữ liệu hạt giống ban đầu (Seed Data).
   * Khi khởi động lần đầu hoặc khi muốn thiết lập lại, Admin có nút bấm **"Khởi tạo / Nạp dữ liệu giải đấu"** để đẩy toàn bộ 10 đội và lịch 24 trận lên Firebase Realtime Database.
   * Toàn bộ Client (người xem) và Admin sẽ đọc/ghi trực tiếp từ Firebase Database. Khi phát sinh nhập sai tên VĐV, sai giờ đấu, đổi sân đấu, Admin có thể chỉnh sửa ngay trên giao diện Admin và Database sẽ cập nhật tức thì mà không cần can thiệp vào code hay deploy lại website.

---

### 🔹 PHASE 2: XÂY DỰNG GIAO DIỆN NGƯỜI XEM (VIEWER UI)
**Mục tiêu:** Tạo trải nghiệm theo dõi sống động, giao diện tối ưu trên điện thoại di động và màn hình TV.

1. **Header & Thanh điều hướng:**
   * Tên giải đấu, đồng hồ thời gian thực, nút chuyển tab: `[Trực tiếp các sân]`, `[Lịch thi đấu]`, `[Bảng xếp hạng]`, `[Vòng Chung Kết]`.
2. **Module 1 - Trực tiếp 3 Sân (Court Live Cards):**
   * Hiển thị 3 card tương ứng với **Sân 1, Sân 2, Sân 3**.
   * Badge trạng thái: `Đang diễn ra` (đỏ nhấp nháy), `Sắp diễn ra` (vàng), `Đã hoàn thành` (xanh).
   * Tỉ số set đấu to, rõ ràng theo đúng thể thức (ví dụ: `Set 1: 15-12 | Set 2: 13-15 | Set 3: 15-9`).
3. **Module 2 - Lịch thi đấu & Kết quả (Schedule Timeline):**
   * Lập danh sách toàn bộ các trận theo mốc thời gian từ 7h30 đến 13h00.
   * Bộ lọc nhanh: *Tất cả*, *Sân 1*, *Sân 2*, *Sân 3*, *Bảng X*, *Bảng Đ*.
4. **Module 3 - Bảng xếp hạng Vòng bảng (Live Standings):**
   * Bảng Xanh (Bảng X) và Bảng Đỏ (Bảng Đ).
   * Cột hiển thị: Hạng, Tên Đội, Số trận đấu (ST), Thắng (T), Thua (B), Tỉ số Set (Thắng/Thua), Hiệu số điểm (+/-), Tổng điểm.
5. **Module 4 - Sơ đồ Nhánh đấu Vòng Chung Kết (Bracket View):**
   * Bán kết 1 (MIA1 vs MIB2), Bán kết 2 (MIA2 vs MIB1).
   * Tranh Hạng 3-4 (Mi3-4) và Chung Kết (MCK).

---

### 🔹 PHASE 3: XÂY DỰNG GIAO DIỆN QUẢN TRỊ & QUẢN LÝ DỮ LIỆU (ADMIN PANEL)
**Mục tiêu:** Thao tác nhập điểm cực nhanh, đồng thời cho phép chỉnh sửa linh hoạt danh sách đội, VĐV, giờ đấu, sân đấu trực tiếp trên Database khi có phát sinh sai sót.

1. **Bảo mật cơ bản:**
   * Yêu cầu nhập mã PIN bảo mật khi vào trang `admin.html` (tránh người ngoài sửa điểm hoặc can thiệp dữ liệu).
2. **Quản lý & Chỉnh sửa Dữ liệu Đội / Lịch thi đấu (Data Management):**
   * **Nút Nạp dữ liệu gốc (Seed Data):** Nạp toàn bộ 10 đội và 24 trận từ mẫu vào Firebase Database chỉ với 1 click.
   * **Chỉnh sửa danh sách đội & VĐV:** Cho phép BTC sửa tên đội, tên 3 VĐV trực tiếp khi phát hiện nhập sai chính tả hoặc thay người đột xuất.
   * **Chỉnh sửa lịch & sân đấu:** Cho phép đổi giờ đấu, đổi số sân (Sân 1, Sân 2, Sân 3), đổi cặp đấu linh hoạt nếu lịch thực tế bị trễ hoặc thay đổi.
   * Mọi thao tác chỉnh sửa được lưu trực tiếp vào Database và tự động đồng bộ sang màn hình người xem ngay lập tức.
3. **Bảng điều khiển Thể thức thi đấu (Tournament Settings):**
   * Dropdown chọn thể thức:
     * `3 hiệp 15 điểm (Thắng 2 set)` (Mặc định).
     * `3 hiệp 21 điểm (Thắng 2 set)`.
     * `1 hiệp 21 điểm (Đánh 1 set duy nhất)`.
     * `1 hiệp 31 điểm`.
   * Cấu hình điểm thưởng: Thắng (+2 hoặc +3 điểm), Thua (+0 hoặc +1 điểm).
4. **Giao diện Nhập điểm từng trận (Match Score Modal):**
   * Danh sách trận đấu kèm nút **[Nhập điểm]**.
   * Form nhập:
     * Ô nhập điểm Set 1: `[ Điểm Đội A ]` - `[ Điểm Đội B ]`
     * Ô nhập điểm Set 2: `[ Điểm Đội A ]` - `[ Điểm Đội B ]`
     * Ô nhập điểm Set 3: `[ Điểm Đội A ]` - `[ Điểm Đội B ]` (Tự động ẩn nếu 1 đội đã thắng 2-0).
   * Nút **[Lưu kết quả]** $\rightarrow$ Hệ thống tự động xác định đội thắng và đồng bộ lên Firebase.
   * Nút **[Chỉnh sửa lại]** hoặc **[Reset trận]** nếu nhập nhầm điểm.

---

### 🔹 PHASE 4: TỰ ĐỘNG HÓA TÍNH ĐIỂM & ĐỒNG BỘ REALTIME
**Mục tiêu:** Không cần tính tay, hệ thống tự động giải toán logic xếp hạng và chia cặp bán kết.

1. **Thuật toán Tự động Xếp hạng (Auto-Standings Engine):**
   * Tiêu chí ưu tiên:
     1. Tổng điểm thắng trận (Wins).
     2. Hiệu số Set thắng - Set thua ($\Delta \text{Sets}$).
     3. Hiệu số Điểm ghi được - Điểm thua ($\Delta \text{Points}$).
     4. Kết quả đối đầu trực tiếp (Head-to-head).
2. **Thuật toán Tự động Cập nhật Vòng Bán kết & Chung kết:**
   * Khi 10 trận vòng bảng hoàn thành:
     * Đội Nhất Bảng X $\rightarrow$ Gán vào `MIA1` (Bán kết 1).
     * Đội Nhì Bảng Đ $\rightarrow$ Gán vào `MIB2` (Bán kết 1).
     * Đội Nhất Bảng Đ $\rightarrow$ Gán vào `MIB1` (Bán kết 2).
     * Đội Nhì Bảng X $\rightarrow$ Gán vào `MIA2` (Bán kết 2).
   * Khi 2 trận Bán kết xong:
     * 2 đội thắng $\rightarrow$ Gán vào trận Chung kết `MCK`.
     * 2 đội thua $\rightarrow$ Gán vào trận Tranh 3-4 `Mi3-4`.
3. **Đồng bộ Firebase Realtime Listener:**
   * Sử dụng `onValue(ref(db, 'matches'), callback)` và `onValue(ref(db, 'teams'), callback)` để giao diện người xem tự động cập nhật ngay tức thì mà **không cần bấm F5 / Reload trang**.

---

### 🔹 PHASE 5: KIỂM THỬ, TẠO MÃ QR & DEPLOY LÊN GITHUB PAGES
**Mục tiêu:** Đưa website lên internet và sẵn sàng cho ngày khai mạc giải.

1. **Kiểm thử toàn diện (Testing):**
   * Test nạp dữ liệu ban đầu lên Database và tính năng sửa thông tin đội / trận đấu khi có sai sót.
   * Test nhập điểm giả lập 10 trận vòng bảng, kiểm tra độ chính xác của BXH.
   * Test thay đổi thể thức từ 3c15 sang 1c21 xem giao diện có thích ứng tốt không.
   * Test tốc độ phản hồi trên điện thoại 4G/Wifi sân cầu.
2. **Deploy lên GitHub Pages:**
   * Đẩy toàn bộ source code lên GitHub:
     ```bash
     git add .
     git commit -m "feat: complete badminton live score system"
     git push origin main
     ```
   * Vào **Settings > Pages > Branch: `main` > Save**.
   * Nhận đường dẫn web: `https://<ten-user>.github.io/<ten-repo>/`.
3. **Tạo mã QR Code Giải đấu:**
   * Tạo mã QR trỏ thẳng đến link GitHub Pages.
   * In mã QR dán tại bàn Ban tổ chức và các góc sân để VĐV/khán giả quét xem điểm trực tiếp.

---

## 🚀 CHECKLIST BẮT ĐẦU THỰC HIỆN

- [x] Phân tích dữ liệu 10 đội & lịch 24 trận từ ảnh.
- [x] Lập file kế hoạch chi tiết `KE_HOACH_XAY_DUNG_WEB_GIAI_CAU_LONG.md`.
- [x] Khởi tạo bộ source code mẫu (HTML/JS + TailwindCSS + Firebase Config).
- [x] Chuẩn bị dữ liệu hạt giống (Seed data 10 đội & lịch đấu) và xây dựng tính năng nạp 1-click vào Firebase Realtime Database.
- [x] Hoàn thiện Giao diện Người xem (Viewer UI): Live 3 sân, Lịch đấu & Tìm kiếm VĐV, BXH tự động, Nhánh Knockout & Chế độ TV.
- [ ] Xây dựng giao diện Quản trị (Admin) cho phép chỉnh sửa thông tin 10 đội, VĐV, giờ đấu, sân đấu trực tiếp trên Database khi có sai sót.
- [ ] Xây dựng tính năng Nhập điểm, Cài đặt thể thức & Đồng bộ Realtime.
- [ ] Kiểm thử và Xuất bản lên GitHub Pages.

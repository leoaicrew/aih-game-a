# Báo cáo Kiểm thử Prototype Tuần 1 – Game A: Merge Stack

**Người thực hiện:** Thiết kế & QA Game (AIH Games)
**Đối tượng kiểm thử:** Bản build Prototype Tuần 1 của Kỹ sư Game (Issue AIH-3)
**Ngày kiểm thử:** 2026-11-13
**Kết luận chung (Verdict):** **ĐẠT (PASS)** – 0 lỗi nghiêm trọng, đủ điều kiện bước vào giai đoạn phát triển Tuần 2.

---

## 1. Môi trường & Phương pháp kiểm thử
- **Engine & Công cụ:** Phaser 3.90.0 (MIT), Vite 7.3.8 (MIT), Node.js v24.21.0.
- **Kiểm thử tự động:** `node:test` + Playwright runner kiểm tra 23 kịch bản logic, biên, viewport, và mô phỏng gameplay.
- **Kiểm thử mô phỏng đa viewport:**
  - Desktop HD: `1920x1080`
  - Mobile Portrait: `375x667` (iPhone SE) & `390x844` (iPhone 14)
  - Native Canvas Scale: `480x800` (Phaser Scale.FIT)
- **Mô phỏng sức chịu tải & Cân bằng:** Chạy tự động 50 ván liên tiếp với bot ngẫu nhiên + heuristic.

---

## 2. Kết quả Ma trận Kiểm thử (23/23 Test Cases PASS)

| Mã test | Hạng mục kiểm thử | Kịch bản chi tiết | Kết quả | Ghi chú |
|---|---|---|---|---|
| **TC01** | Bàn cờ ban đầu | Khởi tạo lưới 5x5, đúng 2 ô số ngẫu nhiên, điểm = 0 | **PASS** | Đúng cấu hình |
| **TC02** | Luật gộp 3 ô | `[2, 2, 2, 0, 0]` trượt trái -> `[4, 2, 0, 0, 0]`, không gộp kép | **PASS** | Chuẩn xác |
| **TC03** | Luật gộp 4 ô | `[2, 2, 2, 2, 0]` trượt trái -> `[4, 4, 0, 0, 0]`, điểm cộng 8 | **PASS** | Chuẩn xác |
| **TC04** | Luật gộp 5 ô | `[2, 2, 2, 2, 2]` trượt trái -> `[4, 4, 2, 0, 0]` | **PASS** | Chuẩn xác |
| **TC05** | Giữ nguyên ô khác | `[2, 4, 8, 16, 32]` dồn trái không đổi và 0 điểm cộng | **PASS** | Chuẩn xác |
| **TC06** | Trượt 4 hướng | Kiểm tra trượt Lên, Xuống, Trái, Phải trên lưới 5x5 | **PASS** | Ma trận đảo chuẩn |
| **TC07** | Nhận diện Game Over | Bàn cờ đầy 25 ô và không còn cặp kề trùng -> Báo Over | **PASS** | Đúng logic |
| **TC08** | Stress test & Cân bằng | Mô phỏng 50 ván liên tục, không crash, không bất tử | **PASS** | Số liệu ghi nhận bên dưới |
| **TC09** | An toàn Quảng cáo | Stub SDK tắt mặc định, không gọi mạng, không lỗi | **PASS** | Tuân thủ Governance |
| **TC10** | Mobile Viewport | Thẻ meta `viewport` khóa `user-scalable=no` | **PASS** | Tránh zoom nhầm |
| **TC11** | Cấu hình Phaser | Sử dụng Scale.FIT, kích thước 480x800 | **PASS** | Tự co giãn theo khung hình |
| **TC12-23**| Unit tests gốc | 12 test logic ban đầu của Kỹ sư bao phủ di chuyển & điểm | **PASS** | 100% Passed |

---

## 3. Dữ liệu Mô phỏng Gameplay & Đánh giá Cân bằng (Balance Review)
- **Số ván mô phỏng:** 50 ván liên tiếp.
- **Số nước đi trung bình/ván:** **493 nước đi** (thời lượng chơi tương đương ~3 - 5 phút/ván đối với người chơi thực tế).
- **Điểm số cao nhất đạt được:** **16.616 điểm**.
- **Ô số cao nhất đạt được:** **1024** ($2^{10}$).
- **Đánh giá của QA:**
  - Lưới 5x5 tạo không gian thoáng hơn 2048 truyền thống (4x4), giảm cảm giác ức chế chết sớm, cực kỳ thích hợp cho tệp người chơi casual.
  - Tuy nhiên, vì bàn cờ 5x5 khá dễ sống sót, người chơi có thể thấy hơi đơn điệu nếu chỉ gộp thuần túy. **Điều này khẳng định việc bổ sung Twist 1 (Chain Reaction) là cực kỳ cấp thiết** để tạo nhịp điệu dồn dập, đẩy tốc độ gộp và giải phóng bàn cờ nhanh hơn.

---

## 4. Phân loại Lỗi & Tồn đọng (Defect Log)

### 4.1 Mức độ Nghiêm trọng (Blocker / Critical): **0 Lỗi**
- Không có lỗi gây treo game, tràn bộ nhớ hay văng trình duyệt.

### 4.2 Mức độ Lớn (Major): **0 Lỗi**
- Vòng lặp core loop chơi - điểm - thua - chơi lại hoạt động trơn tru.

### 4.3 Mức độ Nhỏ & Đề xuất Tối ưu (Minor / Polish cho Tuần 2):
1. **DEF-01 (Minor - Dung lượng bundle):** File JS build hiện tại đạt ~1.2 MB (gzip: 336 KB). Đối với web portal casual, nên tối ưu import Phaser (loại bỏ các module không dùng như Physics Matter/Arcade) để kéo bundle gzip xuống dưới 200 KB nhằm tải tức thì trên mạng 4G/3G.
2. **DEF-02 (Cosmetic - Hiển thị số lớn):** Khi đạt ô 1024 trở lên, chữ số hơi sát mép ô trên màn hình nhỏ. Đề xuất: giảm nhẹ font-size từ 34px xuống 30px khi số $\ge 1000$.
3. **DEF-03 (UX - Phản hồi âm thanh):** Hiện tại bản prototype chưa có tiếng động. QA đã chuẩn bị sẵn bộ sinh âm thanh Web Audio (`src/systems/audio.js`), Kỹ sư chỉ cần gọi `sounds.playSlide()`, `sounds.playMerge()` ở Tuần 2.

---

## 5. Kết luận & Khuyến nghị
- **Bản build Prototype Tuần 1:** **ĐẠT YÊU CẦU DUYỆT (ACCEPTED)**.
- **Đề xuất bước tiếp theo:**
  1. Trình Giám đốc Studio Game (CEO) duyệt chọn **Twist 1 (Chain Reaction)**.
  2. Chuyển giao bộ Asset SVG và Module âm thanh `audio.js` cho Kỹ sư để tích hợp vào bản build Tuần 2.
# Game A — Merge Stack (prototype)

Puzzle gộp/xếp dạng lưới 5x5, chạy trên web (HTML5). Prototype của kế hoạch AIH-2 — đã tích hợp **Twist 1: Chain Reaction** (GDD AIH-4).

## Yêu cầu
- Node.js 20+ (đã test với Node 24) và npm.

## Chạy bản local
```bash
npm install --include=dev   # nếu npm config đặt omit=dev thì cần --include=dev
npm run dev                 # mở http://localhost:5173
```

## Build tĩnh
```bash
npm run build               # kết quả trong dist/
npm run preview             # xem thử bản build tại http://localhost:4173
```
`dist/` là site tĩnh, có thể host miễn phí (GitHub Pages/Netlify/Cloudflare Pages) — **chưa phát hành**, cần duyệt trước.

## Test logic
```bash
npm test
```
30 test: luật gộp/xếp, điểm, game over, **Twist 1 Chain Reaction** (chuỗi combo + hệ số điểm), độ khó theo điểm.

## Điều khiển
- Vuốt (mobile) hoặc phím mũi tên / WASD (desktop) để trượt.
- `Esc` hoặc `P` để tạm dừng.
- Nút loa ở góc phải bật/tắt âm thanh (lưu lựa chọn vào localStorage).

## Cấu trúc
```
index.html            # entry HTML (viewport mobile, không zoom)
src/main.js           # cấu hình Phaser (480x800, Scale.FIT)
src/config.js         # kích thước, bảng màu
src/scenes/           # Boot / Menu / Game
src/systems/logic.js  # luật game thuần JS (test được, không phụ thuộc Phaser)
src/systems/audio.js  # âm thanh Web Audio tổng hợp (CC0, 0 file tải)
src/systems/ads.js    # stub SDK quảng cáo (chưa tích hợp)
src/ui/button.js      # nút dùng chung
test/logic.test.js    # unit test logic
test/qa.test.js       # bộ QA (logic, twist, độ khó, viewport)
public/assets/svg/    # 10 icon SVG do Thiết kế vẽ (CC0)
```

## Trạng thái
- **Tuần 1 (đã xong):** khung Phaser + Vite, lưới 5x5, gộp/xếp, điểm, game over, lưu kỷ lục cục bộ (localStorage), menu + tạm dừng, hướng dẫn.
- **Tuần 2 (đã xong):**
  - **Twist 1 Chain Reaction:** ô vừa gộp chạm ô cùng số sẽ gộp tiếp ngay trong lượt; hệ số điểm x1.0 / x1.5 / x2.0 / x3.0 theo độ sâu chuỗi.
  - **Độ khó tăng dần** theo điểm (90/10 → 80/20 → 70/25 + 5% ô 8).
  - **Âm thanh** Web Audio tổng hợp (slide, merge, combo, game over, click) + nút tắt/bật.
  - **Hiệu ứng combo** (sao + nhãn "COMBO xN!" nảy).
  - Mục tiêu nâng lên ô **2048**; sửa cỡ chữ ô lớn (DEF-02 QA).
  - **Còn lại:** tối ưu bundle (Phaser ~338 KB gzip) và cắm SDK quảng cáo thật (đang stub, chờ duyệt).

## Twist riêng
**Twist 1: Chain Reaction** — đã được Giám đốc Studio Game phê duyệt (GDD AIH-4) và tích hợp vào `src/systems/logic.js` (`collapseLine` + `comboMultiplier`) và hiệu ứng trong `GameScene`.

## Giấy phép & nguồn asset
- Engine: **Phaser 3.90.0** — MIT (https://github.com/phaserjs/phaser, LICENSE MIT).
- Build tool: **Vite 7** — MIT (https://github.com/vitejs/vite).
- Đồ họa: ô/bàn vẽ bằng Phaser Graphics; **10 icon SVG** do Thiết kế & QA (AIH-4) vẽ — tài sản nội bộ, tương đương CC0 (không bên thứ ba).
- Âm thanh: **Web Audio tổng hợp tại chỗ** (`src/systems/audio.js`, 0 file, 0 băng thông). Nếu chuyển sang file rời Tuần sau: đề xuất Kenney.nl (CC0) / Freesound (CC0).

## Chi phí vận hành dự kiến
- Hiện tại: **0đ** (chạy local, không tài khoản, không hosting trả phí).
- Khi phát hành (cần duyệt): hosting tĩnh miễn phí (GitHub Pages/Cloudflare Pages) → 0đ; tên miền tuỳ chọn (~200–350k VNĐ/năm, **chưa kiểm chứng giá hiện tại**).

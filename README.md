# Game A — Merge Stack (prototype)

Puzzle gộp/xếp dạng lưới 5x5, chạy trên web (HTML5). Prototype Tuần 1 của kế hoạch AIH-2.

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
12 test cho luật gộp/xếp, điểm, game over.

## Điều khiển
- Vuốt (mobile) hoặc phím mũi tên / WASD (desktop) để trượt.
- `Esc` hoặc `P` để tạm dừng.

## Cấu trúc
```
index.html            # entry HTML (viewport mobile, không zoom)
src/main.js           # cấu hình Phaser (480x800, Scale.FIT)
src/config.js         # kích thước, bảng màu
src/scenes/           # Boot / Menu / Game
src/systems/logic.js  # luật game thuần JS (test được, không phụ thuộc Phaser)
src/systems/ads.js    # stub SDK quảng cáo (chưa tích hợp)
src/ui/button.js      # nút dùng chung
test/logic.test.js    # unit test logic
```

## Trạng thái
- **Tuần 1 (đã xong):** khung Phaser + Vite, lưới 5x5, gộp/xếp, điểm, game over, lưu kỷ lục cục bộ (localStorage), menu + tạm dừng, hướng dẫn.
- **Tuần 2 (chưa):** độ khó tăng dần, hiệu ứng nâng cao, âm thanh, tối ưu tải, cắm SDK quảng cáo thật (stub đã có).

## Twist riêng
Đang chờ GDD/twist từ AIH-4 (Thiết kế & QA). Prototype này dùng luật gộp/xếp gốc để có bản chơi được; twist sẽ được chèn khi GDD chốt.

## Giấy phép & nguồn asset
- Engine: **Phaser 3.90.0** — MIT (https://github.com/phaserjs/phaser, LICENSE MIT).
- Build tool: **Vite 7** — MIT (https://github.com/vitejs/vite).
- Đồ họa: **không dùng asset ngoài** — vẽ bằng Phaser Graphics (hình khối/màu), font hệ thống.
- Âm thanh: chưa có (Tuần 2, sẽ dùng CC0 và ghi nguồn).

## Chi phí vận hành dự kiến
- Hiện tại: **0đ** (chạy local, không tài khoản, không hosting trả phí).
- Khi phát hành (cần duyệt): hosting tĩnh miễn phí (GitHub Pages/Cloudflare Pages) → 0đ; tên miền tuỳ chọn (~200–350k VNĐ/năm, **chưa kiểm chứng giá hiện tại**).

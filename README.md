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

## Phát hành (web tĩnh, hosting miễn phí)
Hướng dẫn deploy 1 lệnh/1 click, URL dự kiến và checklist ra mắt: xem [`deploy/README.md`](deploy/README.md).
- GitHub Pages: `.github/workflows/deploy-pages.yml` (kích hoạt tay bằng `workflow_dispatch`).
- Cloudflare Pages: `deploy/cloudflare-pages.toml`.
- `vite.config.js` dùng `base: './'` → cùng `dist/` chạy được cả domain gốc lẫn subpath.

## Test logic
```bash
npm test
```
43 test: luật gộp/xếp, điểm, game over, **Twist 1 Chain Reaction** (chuỗi combo + hệ số điểm), độ khó theo điểm, **UI v2** (gradient/tier màu), **juice >=10 tween**, **audio nhạc nền + mute**.

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
src/ui/button.js      # nút bevel + hover/press tween
src/ui/visuals.js     # nền gradient, glow, vignette, panel viền-bóng
src/ui/fx.js          # bộ hiệu ứng "juice" (>=10 tween) + đếm fx
test/logic.test.js    # unit test logic
test/qa.test.js       # bộ QA (logic, twist, độ khó, viewport)
test/uiux.test.js     # UI v2, juice >=10 tween, audio + nhạc nền, CREDITS
public/assets/svg/    # 10 icon SVG phong cách Neon Night (CC0, đã nâng cấp AIH-21)
public/assets/art/    # Bộ 37 asset 2D thật (tiles, UI kit, icons, backgrounds, mascot "Stacky")
docs/                 # Hướng dẫn tích hợp asset, showcase HTML, ảnh chụp trước/sau

```

## UI/UX v2 + juice + audio (AIH-18/AIH-19)
- Nhận diện mới: nền gradient dọc `#0b1020 -> #1a2238`, glow board, vignette, accent cyan `#22d3ee` + vàng `#e9c46a`.
- Tile bevel (viền sáng trên + bóng dưới), tier 256/512/1024/2048 khác màu (violet/rose/amber/gold).
- 14 hiệu ứng tween: spawn pop, merge bounce, merge flash, board shake, particle burst, confetti kỷ lục,
  score counter, score pop, nút hover/press, logo float, CTA pulse, scene fade, overlay slide-in.
- Nhạc nền loop tự sinh bằng Web Audio (Am–F–C–G), mute tắt cả nhạc; thêm SFX menu + kỷ lục. 0 file audio, offline.
- Ảnh trước/sau: `docs/screenshots/before/` (bản 68dd57e), `docs/screenshots/after/` (bản v2).

## Bộ Asset Đồ Họa 2D Thật (AIH-21 — Game Artist)
- **37 asset vector SVG nguyên bản** do Game Artist thiết kế theo brief "Neon Night" (AIH-18):
  - **Tile set (14 assets):** Tiers 2..2048 có bevel 3D + specular arc + drop shadow + halo hào quang bậc cao + vương miện 2048, kèm tile-selected (reticle), tile-merge-flash (8-way starburst), tile-empty.
  - **Backgrounds (2 assets):** `bg-main.svg`, `bg-menu.svg` (480x800 chuẩn mobile viewport, gradient đa tầng, chòm sao cyber, vignette).
  - **UI Kit (8 assets):** `btn-primary`, `btn-secondary` (normal/pressed), `panel-card`, `score-board`, `progress-bar`, `badge-combo`.
  - **Icons (10 assets):** `icon-play`, `icon-pause`, `icon-replay`, `icon-volume`, `icon-volume-mute`, `icon-trophy`, `icon-hammer`, `icon-bomb`, `icon-help`, `icon-combo-star`.
  - **Linh vật "Stacky" (3 assets):** `mascot-idle.svg` (chào đón), `mascot-cheer.svg` (kỷ lục/combo), `mascot-shock.svg` (game over).
- **Tài liệu & Thẩm mỹ:**
  - `docs/ART_INTEGRATION_GUIDE.md`: hướng dẫn nạp và sử dụng trong Phaser 3.
  - `docs/art-showcase.html`: gallery tổng hợp trực quan toàn bộ asset.
  - Ảnh preview: `docs/screenshots/art-showcase-full.png`, `docs/screenshots/art-before-after.png`, `docs/screenshots/art-mascot-sheet.png`.
- **Giấy phép:** 100% tự tạo độc quyền cho AIH Games, phát hành CC0 1.0 (chi tiết tại `public/assets/art/ART_LICENSES.md`). Chi phí: 0 VNĐ.


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

# HƯỚNG DẪN TÍCH HỢP BỘ ASSET 2D THẬT CHO KỸ SƯ PHASER (AIH-21)

Tác giả: Game Artist (2D) — Studio Game AIH
Dành cho: Kỹ sư Game (Phaser 3 + Vite)
Đường dẫn asset: \`public/assets/art/\` và \`public/assets/svg/\`

---

## 1. Tổng quan bộ asset & vị trí file

Bộ 37 asset vector SVG chuẩn, nhẹ, sắc nét ở mọi độ phân giải (480x800 @1x, @2x, @3x):

- \`public/assets/art/tiles/\`: 11 tile cấp bậc (2..2048) + tile-selected + tile-merge-flash + tile-empty
- \`public/assets/art/backgrounds/\`: bg-main.svg, bg-menu.svg (480x800)
- \`public/assets/art/ui/\`: btn-primary, btn-secondary (normal/pressed), panel-card, score-board, progress-bar, badge-combo
- \`public/assets/art/icons/\`: 10 icons (play, pause, replay, volume, mute, trophy, hammer, bomb, help, combo-star)
- \`public/assets/art/mascot/\`: 3 sprite mascot "Stacky" (idle, cheer, shock)

*Lưu ý:* 10 icon cũ tại \`public/assets/svg/\` đã được cập nhật đồng bộ lên phong cách Neon Night mới, giữ nguyên đường dẫn để không phá vỡ logic cũ.

---

## 2. Mã mẫu nạp asset trong Phaser 3 (Preload)

Kỹ sư có thể nạp trong \`preload()\` hoặc trong \`BootScene\`:

\`\`\`javascript
// 1. Nạp Tile set
const TIER_NUMBERS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
TIER_NUMBERS.forEach(val => {
  this.load.svg(\`tile-\${val}\`, \`assets/art/tiles/tile-\${val}.svg\`, { width: 128, height: 128 });
});
this.load.svg('tile-selected', 'assets/art/tiles/tile-selected.svg', { width: 128, height: 128 });
this.load.svg('tile-empty', 'assets/art/tiles/tile-empty.svg', { width: 128, height: 128 });
this.load.svg('tile-flash', 'assets/art/tiles/tile-merge-flash.svg', { width: 128, height: 128 });

// 2. Nạp Background
this.load.svg('bg-main', 'assets/art/backgrounds/bg-main.svg', { width: 480, height: 800 });
this.load.svg('bg-menu', 'assets/art/backgrounds/bg-menu.svg', { width: 480, height: 800 });

// 3. Nạp UI Kit
this.load.svg('btn-primary', 'assets/art/ui/btn-primary.svg', { width: 240, height: 64 });
this.load.svg('panel-card', 'assets/art/ui/panel-card.svg', { width: 420, height: 520 });
this.load.svg('score-board', 'assets/art/ui/score-board.svg', { width: 180, height: 64 });
this.load.svg('badge-combo', 'assets/art/ui/badge-combo.svg', { width: 160, height: 54 });

// 4. Nạp Linh vật "Stacky"
this.load.svg('mascot-idle', 'assets/art/mascot/mascot-idle.svg', { width: 160, height: 160 });
this.load.svg('mascot-cheer', 'assets/art/mascot/mascot-cheer.svg', { width: 160, height: 160 });
this.load.svg('mascot-shock', 'assets/art/mascot/mascot-shock.svg', { width: 160, height: 160 });
\`\`\`

---

## 3. Cách sử dụng trong Scene

### A. Hiển thị Linh vật trong Màn hình Menu (MenuScene.js)
\`\`\`javascript
// Đặt mascot ở phía trên nút CHƠI, thêm tween float
const mascot = this.add.image(240, 360, 'mascot-idle').setOrigin(0.5);
this.tweens.add({
  targets: mascot,
  y: 350,
  duration: 1200,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.InOut'
});
\`\`\`

### B. Hiển thị Linh vật trong Màn hình Game Over / Kỷ lục (GameScene.js)
\`\`\`javascript
// Nếu kỷ lục mới hoặc combo lớn:
const cheerMascot = this.add.image(240, 220, 'mascot-cheer').setOrigin(0.5).setScale(0.8);

// Nếu thua ván (Game Over bình thường):
const shockMascot = this.add.image(240, 240, 'mascot-shock').setOrigin(0.5).setScale(0.8);
\`\`\`

### C. Gắn Background SVG thay cho Canvas runtime
\`\`\`javascript
// Thay thế hàm addGradientBackground bằng ảnh nền SVG có sẵn:
this.add.image(240, 400, 'bg-main').setOrigin(0.5).setDisplaySize(480, 800);
\`\`\`

---

## 4. Kiểm tra trước/sau & Gallery
Xem gallery trực quan toàn bộ asset tại:
- Tệp tĩnh: \`docs/art-showcase.html\` (mở trực tiếp trên trình duyệt)
- Ảnh chụp tổng hợp: \`docs/screenshots/art-showcase-full.png\`
- Ảnh so sánh trước/sau: \`docs/screenshots/art-before-after.png\`
- Ảnh linh vật: \`docs/screenshots/art-mascot-sheet.png\`

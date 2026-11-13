import Phaser from 'phaser';
import { PALETTE, FONT } from '../config.js';

// Chunky store-quality button: gradient-free bevel body (top light + bottom
// shadow), glow halo, smooth hover/press tweens and click SFX hook.
// Returns a Container. Motion is tween-based (no instant scale jumps).
export function makeButton(scene, x, y, label, onClick, opts = {}) {
  const w = opts.width ?? 280;
  const h = opts.height ?? 76;
  const fill = opts.fill ?? PALETTE.cyan;
  const fillBottom = opts.fillBottom ?? shade(fill, 0.7);
  const radius = opts.radius ?? 22;
  const textColor = opts.textColor ?? '#04121a';

  const container = scene.add.container(x, y);

  const glow = scene.add.graphics();
  glow.fillStyle(fill, 0.28);
  glow.fillRoundedRect(-w / 2 - 6, -h / 2 - 4, w + 12, h + 14, radius + 6);
  glow.setBlendMode(Phaser.BlendModes.ADD);
  glow.setAlpha(0.6);

  const g = scene.add.graphics();
  // bottom "3D" lip
  g.fillStyle(PALETTE.black, 0.5);
  g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, radius);
  // body gradient (stacked bands, cheap + crisp)
  const bands = 12;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    g.fillStyle(mix(fill, fillBottom, t), 1);
    const bh = h / bands;
    const bx = -w / 2;
    const by = -h / 2 + i * bh;
    if (i === 0) g.fillRoundedRect(bx, by, w, bh + radius, { tl: radius, tr: radius, bl: 0, br: 0 });
    else if (i === bands - 1) g.fillRoundedRect(bx, by, w, bh, { tl: 0, tr: 0, bl: radius, br: radius });
    else g.fillRect(bx, by, w, bh + 1);
  }
  // top bevel highlight
  g.lineStyle(2, 0xffffff, 0.55);
  g.beginPath();
  g.moveTo(-w / 2 + radius, -h / 2 + 2);
  g.lineTo(w / 2 - radius, -h / 2 + 2);
  g.strokePath();
  // outer border
  g.lineStyle(2, 0xffffff, 0.18);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);

  const text = scene.add
    .text(0, -2, label, {
      fontFamily: FONT,
      fontSize: opts.fontSize ?? '30px',
      color: textColor,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  container.add([glow, g, text]);
  container.setSize(w, h + 6);
  container.setInteractive({ useHandCursor: true });

  const SFX = opts.sfx;
  const tweenScale = (to, duration = 140, ease = 'Back.Out') => {
    scene.tweens.killTweensOf(container);
    scene.tweens.add({ targets: container, scale: to, duration, ease });
  };

  container.on('pointerover', () => {
    tweenScale(1.05);
    scene.tweens.add({ targets: glow, alpha: 1, duration: 160 });
  });
  container.on('pointerout', () => {
    tweenScale(1);
    scene.tweens.add({ targets: glow, alpha: 0.6, duration: 160 });
  });
  container.on('pointerdown', () => {
    SFX?.playClick?.();
    tweenScale(0.94, 70, 'Quad.Out');
  });
  container.on('pointerup', () => {
    tweenScale(1.05, 160, 'Back.Out');
    onClick?.();
  });

  return container;
}

// Small round icon button (HUD): pause / mute. Icon is a text glyph or SVG image.
export function makeIconButton(scene, x, y, glyph, onClick, opts = {}) {
  const size = opts.size ?? 56;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.black, 0.45);
  g.fillRoundedRect(-size / 2, -size / 2 + 4, size, size, 16);
  g.fillStyle(opts.fill ?? PALETTE.panel, 1);
  g.fillRoundedRect(-size / 2, -size / 2, size, size, 16);
  g.lineStyle(2, PALETTE.panelEdge, 1);
  g.strokeRoundedRect(-size / 2, -size / 2, size, size, 16);
  const t = scene.add
    .text(0, -1, glyph, { fontFamily: FONT, fontSize: opts.fontSize ?? '26px', color: '#f5f7fa' })
    .setOrigin(0.5);
  c.add([g, t]);
  c.setSize(size, size);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.1, duration: 120, ease: 'Quad.Out' }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120, ease: 'Quad.Out' }));
  c.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scale: 0.9, duration: 60, ease: 'Quad.Out' });
    opts.sfx?.playClick?.();
  });
  c.on('pointerup', () => {
    scene.tweens.add({ targets: c, scale: 1.08, duration: 140, ease: 'Back.Out' });
    onClick?.();
  });
  c.glyph = t;
  return c;
}

function mix(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

function shade(c, k) {
  return mix(c, 0x000000, 1 - k);
}

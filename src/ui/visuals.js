import Phaser from 'phaser';
import { GAME_W, PALETTE, FONT } from '../config.js';

// Reusable visual kit for the v2 identity (AIH-18 brief):
// vertical night-sky gradient, soft glows, vignette, panels with edge+bottom shadow.
// Everything is drawn with Phaser Graphics at runtime: 0 image assets, 0 network.

// Paint a vertical gradient across the full screen. `container` may be a scene
// or a container; the texture is generated once and cached in the scene.
export function addGradientBackground(scene, top = PALETTE.bgTop, bottom = PALETTE.bgBottom) {
  const key = `bg-grad-${top.toString(16)}-${bottom.toString(16)}`;
  if (!scene.textures.exists(key)) {
    const c = scene.textures.createCanvas(key, 8, 256);
    const ctx = c.context;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    const hex = (v) => `#${v.toString(16).padStart(6, '0')}`;
    grad.addColorStop(0, hex(top));
    grad.addColorStop(1, hex(bottom));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 256);
    c.refresh();
  }
  return scene.add.image(GAME_W / 2, 0, key).setOrigin(0.5, 0).setDisplaySize(GAME_W, scene.scale.height);
}

// Radial glow (fake light bloom) behind the board / logo.
export function addGlow(scene, x, y, radius, color, alpha = 0.25) {
  const key = `glow-${color.toString(16)}-${radius}`;
  if (!scene.textures.exists(key)) {
    const size = radius * 2;
    const c = scene.textures.createCanvas(key, size, size);
    const ctx = c.context;
    const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    grad.addColorStop(0, hex);
    grad.addColorStop(0.45, hex);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    c.refresh();
  }
  return scene.add.image(x, y, key).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD);
}

// Dark vignette overlay: 4 edge gradients darkening the corners.
export function addVignette(scene) {
  const key = 'vignette-tile';
  if (!scene.textures.exists(key)) {
    const c = scene.textures.createCanvas(key, 128, 128);
    const ctx = c.context;
    const grad = ctx.createRadialGradient(64, 64, 20, 64, 64, 92);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    c.refresh();
  }
  return scene.add.image(GAME_W / 2, scene.scale.height / 2, key)
    .setDisplaySize(GAME_W * 1.05, scene.scale.height * 1.05)
    .setDepth(1);
}

// Rounded panel with top edge-light + drop shadow below.
export function drawPanel(scene, x, y, w, h, radius = 20, opts = {}) {
  const g = scene.add.graphics();
  const fill = opts.fill ?? PALETTE.panel;
  const edge = opts.edge ?? PALETTE.panelEdge;
  // drop shadow (offset down)
  g.fillStyle(PALETTE.black, opts.shadowAlpha ?? 0.45);
  g.fillRoundedRect(x - w / 2, y - h / 2 + 7, w, h, radius);
  // body
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  // top highlight line
  g.lineStyle(2, edge, 1);
  g.beginPath();
  g.moveTo(x - w / 2 + radius, y - h / 2 + 1);
  g.lineTo(x + w / 2 - radius, y - h / 2 + 1);
  g.strokePath();
  // border
  g.lineStyle(2, edge, 0.9);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  return g;
}

export function textStyle(size, color, extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    fontStyle: 'bold',
    ...extra,
  };
}

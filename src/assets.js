// Asset manifest for the real 2D art set (AIH-21, commit e9cf8f8).
// Single source of truth: BootScene preloads everything here, scenes read
// texture keys + ASSET_FILES for QA ("tất cả asset phải load, không 404").
// License: CC0 / AIH Games internal (see public/assets/art/ART_LICENSES.md).

export const ART_BASE = 'assets/art';

export const TIER_NUMBERS = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

function tex(id, file, width, height) {
  return { key: `art-${id}`, url: file, width, height };
}

// Tiles load at 2x native (256px) so on high-DPI screens the 74px downscale
// stays crisp (AIH-24: "nhoè" fix — no blur filters in the SVG either).
export const TILES = TIER_NUMBERS.reduce((acc, val) => {
  acc[val] = tex(`tile-${val}`, `${ART_BASE}/tiles/tile-${val}.svg`, 256, 256);
  return acc;
}, {});

export const TILE_EXTRAS = {
  empty: tex('tile-empty', `${ART_BASE}/tiles/tile-empty.svg`, 256, 256),
  selected: tex('tile-selected', `${ART_BASE}/tiles/tile-selected.svg`, 256, 256),
  flash: tex('tile-flash', `${ART_BASE}/tiles/tile-merge-flash.svg`, 256, 256),
};

export const BACKGROUNDS = {
  main: tex('bg-main', `${ART_BASE}/backgrounds/bg-main.svg`, 480, 800),
  menu: tex('bg-menu', `${ART_BASE}/backgrounds/bg-menu.svg`, 480, 800),
};

export const UI = {
  btnPrimary: tex('btn-primary', `${ART_BASE}/ui/btn-primary.svg`, 240, 64),
  btnPrimaryPressed: tex('btn-primary-pressed', `${ART_BASE}/ui/btn-primary-pressed.svg`, 240, 64),
  btnSecondary: tex('btn-secondary', `${ART_BASE}/ui/btn-secondary.svg`, 240, 64),
  btnSecondaryPressed: tex('btn-secondary-pressed', `${ART_BASE}/ui/btn-secondary-pressed.svg`, 240, 64),
  panel: tex('panel-card', `${ART_BASE}/ui/panel-card.svg`, 420, 520),
  scoreBoard: tex('score-board', `${ART_BASE}/ui/score-board.svg`, 180, 64),
  progressBar: tex('progress-bar', `${ART_BASE}/ui/progress-bar.svg`, 240, 24),
  badgeCombo: tex('badge-combo', `${ART_BASE}/ui/badge-combo.svg`, 160, 54),
};

export const ICONS = {
  play: tex('icon-play', `${ART_BASE}/icons/icon-play.svg`, 64, 64),
  pause: tex('icon-pause', `${ART_BASE}/icons/icon-pause.svg`, 64, 64),
  replay: tex('icon-replay', `${ART_BASE}/icons/icon-replay.svg`, 64, 64),
  volume: tex('icon-volume', `${ART_BASE}/icons/icon-volume.svg`, 64, 64),
  mute: tex('icon-mute', `${ART_BASE}/icons/icon-volume-mute.svg`, 64, 64),
  trophy: tex('icon-trophy', `${ART_BASE}/icons/icon-trophy.svg`, 64, 64),
  hammer: tex('icon-hammer', `${ART_BASE}/icons/icon-hammer.svg`, 64, 64),
  bomb: tex('icon-bomb', `${ART_BASE}/icons/icon-bomb.svg`, 64, 64),
  help: tex('icon-help', `${ART_BASE}/icons/icon-help.svg`, 64, 64),
  comboStar: tex('icon-combo-star', `${ART_BASE}/icons/icon-combo-star.svg`, 64, 64),
};

export const MASCOT = {
  idle: tex('mascot-idle', `${ART_BASE}/mascot/mascot-idle.svg`, 160, 160),
  cheer: tex('mascot-cheer', `${ART_BASE}/mascot/mascot-cheer.svg`, 160, 160),
  shock: tex('mascot-shock', `${ART_BASE}/mascot/mascot-shock.svg`, 160, 160),
};

// Flat list for preload + tests. Every entry must exist on disk.
export const ASSET_FILES = [
  ...Object.values(TILES),
  ...Object.values(TILE_EXTRAS),
  ...Object.values(BACKGROUNDS),
  ...Object.values(UI),
  ...Object.values(ICONS),
  ...Object.values(MASCOT),
];

export const ASSET_KEYS = ASSET_FILES.map((a) => a.key);

// Texture key for a board tile exponent (2..2048). Falls back to top tier.
export function tileTexture(exponent) {
  const value = 2 ** exponent;
  const clamped = Math.min(Math.max(value, 2), 2048);
  return TILES[clamped].key;
}

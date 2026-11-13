export const GAME_W = 480;
export const GAME_H = 800;

// Visual identity v2 (AIH-18 brief / AIH-19): deep gradient night-sky, cyan + gold.
export const PALETTE = {
  bgTop: 0x0b1020,
  bgBottom: 0x1a2238,
  panel: 0x161d30,
  panelEdge: 0x2c3856,
  cellEmpty: 0x131a2b,
  cellEmptyEdge: 0x222c44,
  cyan: 0x22d3ee,
  cyanDim: 0x0e7490,
  gold: 0xe9c46a,
  goldDeep: 0xb8933f,
  white: 0xffffff,
  black: 0x05070d,
};

export const COLORS = {
  bg: PALETTE.bgTop,
  bgBottom: PALETTE.bgBottom,
  boardBg: 0x12172a,
  cellEmpty: 0x131a2b,
  textLight: '#f5f7fa',
  textDim: '#9aa5b1',
  accent: PALETTE.cyan,
  gold: '#e9c46a',
  cyan: '#22d3ee',
};

export const TILE_TEXT_COLORS = {
  dark: '#2a3140',
  light: '#ffffff',
};

// Tile gradients (top -> bottom) per exponent 1..11. Tier 256/512/1024/2048
// get distinct hues so the board reads at a glance (old build reused 0xff007f).
export const TILE_GRADIENTS = [
  [0x9aa5b1, 0x6b7684], // placeholder 2^0 (unused)
  [0x3b4a6b, 0x24314d], // 2
  [0x2e6f95, 0x1b4a69], // 4
  [0x1f8a99, 0x0f5c6b], // 8
  [0x1fb0b8, 0x0e7d88], // 16
  [0x22d3ee, 0x0e8fa8], // 32
  [0x4f8dff, 0x2c5bd6], // 64
  [0x8b6bff, 0x5b3fd6], // 128
  [0xd16bff, 0x8e3fc4], // 256 (violet)
  [0xff7ab8, 0xd6406f], // 512 (rose)
  [0xf4a261, 0xc9622b], // 1024 (amber)
  [0xe9c46a, 0xb8933f], // 2048 (gold)
];

// Subtle glow emitted by high tiers (used for tile outer glow).
export const TILE_GLOW = {
  8: 0xff7ab8,
  9: 0xff7ab8,
  10: 0xf4a261,
  11: 0xe9c46a,
};

export const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';

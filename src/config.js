export const GAME_W = 480;
export const GAME_H = 800;

// Visual identity v3 (AIH-24 pass 2): bright daylight-sky with neon accents.
// Pass 1 was too dark (#0b1020 near-black). Base lifted far above black,
// cyan + gold accents kept for brand continuity, contrast raised.
export const PALETTE = {
  bgTop: 0x4f7fd6,
  bgBottom: 0x8fd0ef,
  panel: 0x2a3f66,
  panelEdge: 0x5f83c4,
  cellEmpty: 0x3f5a86,
  cellEmptyEdge: 0x6f92c9,
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
  boardBg: 0x33497a,
  cellEmpty: 0x3f5a86,
  textLight: '#ffffff',
  textDim: '#dbe6f5',
  accent: PALETTE.cyan,
  gold: '#ffd45e',
  cyan: '#22d3ee',
};

export const TILE_TEXT_COLORS = {
  dark: '#1c2740',
  light: '#ffffff',
};

// Tile gradients (top -> bottom) per exponent 1..11. Brighter, saturated hues
// with a clear top-to-bottom falloff so tiles pop against the sky background.
export const TILE_GRADIENTS = [
  [0xbfd3e8, 0x8fb2d9], // placeholder 2^0 (unused)
  [0xa9c8ef, 0x6f9fe0], // 2
  [0x8ce4f4, 0x3fb8d6], // 4
  [0x6fe8c4, 0x22b891], // 8
  [0x5cf0d2, 0x1fc9ad], // 16
  [0x4fe0f5, 0x14b4cf], // 32
  [0x7aa8ff, 0x3f6fe0], // 64
  [0xa08cff, 0x6b52d8], // 128
  [0xd08aff, 0x9a4fd6], // 256 (violet)
  [0xff9ecb, 0xf0548e], // 512 (rose)
  [0xffb877, 0xe07b2e], // 1024 (amber-orange)
  [0xffe07a, 0xe0a92e], // 2048 (gold)
];

// Subtle glow emitted by high tiers (used for tile outer glow).
export const TILE_GLOW = {
  8: 0xff7ab8,
  9: 0xff7ab8,
  10: 0xf4a261,
  11: 0xe9c46a,
};

export const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';

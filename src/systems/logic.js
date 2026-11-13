export const BOARD_SIZE = 5;
export const MAX_TILE = 11; // 2^11 = 2048 highest design tier

// Colors per tier (index = exponent). Visual identity v3 (AIH-24 pass 2):
// brighter, higher-contrast tiles on a bright sky. 256/512/1024/2048 keep
// distinct hues (old build reused 0xff007f).
export const TIER_COLORS = [
  0x9aa5b1, // placeholder 2^0 (unused)
  0x8fb2d9, // 2   (soft sky blue)
  0x5fd0e8, // 4   (aqua)
  0x33d6a6, // 8   (mint green)
  0x2ee6c8, // 16  (teal mint)
  0x22d3ee, // 32  (cyan)
  0x4f8dff, // 64  (blue)
  0x7c6bff, // 128 (indigo)
  0xb36bff, // 256 (violet)
  0xff77b0, // 512 (rose)
  0xff9e5c, // 1024 (amber-orange)
  0xffd45e, // 2048 (gold)
];

// SVG icon paths (CC0, in public/assets/svg/) used for HUD buttons on web.
// Node tests import this module directly, so this must not touch Phaser.
export const ICONS = {
  pause: 'assets/svg/pause.svg',
  mute: 'assets/svg/volume-mute.svg',
  sound: 'assets/svg/volume.svg',
};

// Twist 1 (Chain Reaction): score multipliers by chain depth within one move.
// Depth 1 = base merge (x1.0), depth 2 = x1.5, depth 3 = x2.0, depth 4+ = x3.0.
export function comboMultiplier(chainDepth) {
  if (chainDepth <= 1) return 1;
  if (chainDepth === 2) return 1.5;
  if (chainDepth === 3) return 2;
  return 3;
}

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function cloneBoard(b) {
  return b.map((row) => row.slice());
}

// Collapse a line (array of exponents, 0 = empty) toward index 0 and merge equal neighbors.
// Twist 1: after a merge produces value V, if the next tile toward the direction is also V,
// it automatically merges again within the same move (Chain Reaction).
// Returns { result, gained, merged, chains } where merged lists result indices that were merged,
// and chains lists { index, value, depth } for every merge (depth = position in the chain).
export function collapseLine(line) {
  const values = line.filter((v) => v > 0);
  const result = [];
  const merged = [];
  const chains = [];
  let gained = 0;
  let i = 0;

  while (i < values.length) {
    const v = values[i];
    if (i + 1 < values.length && values[i + 1] === v) {
      // Chain: keep merging while the next tile equals the running value.
      // GDD §2.1: every merge step scores its new tile value times the multiplier
      // for that step's depth (base x1.0, chain 2 x1.5, chain 3 x2.0, chain 4+ x3.0).
      let depth = 1;
      let current = v + 1;
      gained += 2 ** current * comboMultiplier(depth);
      let j = i + 2;
      while (j < values.length && values[j] === current) {
        depth++;
        current += 1;
        gained += 2 ** current * comboMultiplier(depth);
        j++;
      }
      const idx = result.length;
      result.push(current);
      merged.push(idx);
      chains.push({ index: idx, value: 2 ** current, depth });
      i = j;
    } else {
      result.push(v);
      i++;
    }
  }

  while (result.length < line.length) result.push(0);
  return { result, gained, merged, chains };
}

export function move(board, dir) {
  const size = board.length;
  const out = emptyBoard();
  let gained = 0;
  let changed = false;
  const mergedCells = [];
  const combos = [];
  let maxChain = 0;

  const getLine = (i) => {
    const line = [];
    for (let j = 0; j < size; j++) {
      if (dir === 'left') line.push(board[i][j]);
      else if (dir === 'right') line.push(board[i][size - 1 - j]);
      else if (dir === 'up') line.push(board[j][i]);
      else if (dir === 'down') line.push(board[size - 1 - j][i]);
    }
    return line;
  };

  const posFor = (i, j) => {
    if (dir === 'left') return [i, j];
    if (dir === 'right') return [i, size - 1 - j];
    if (dir === 'up') return [j, i];
    return [size - 1 - j, i];
  };

  const setLine = (i, line, mergedIdx, chains) => {
    for (let j = 0; j < size; j++) {
      const [r, c] = posFor(i, j);
      out[r][c] = line[j];
    }
    for (const idx of mergedIdx) {
      const [r, c] = posFor(i, idx);
      mergedCells.push({ r, c, value: 2 ** line[idx] });
    }
    for (const ch of chains) {
      if (ch.depth > 1) {
        const [r, c] = posFor(i, ch.index);
        combos.push({ r, c, value: ch.value, depth: ch.depth });
        maxChain = Math.max(maxChain, ch.depth);
      }
    }
  };

  for (let i = 0; i < size; i++) {
    const before = getLine(i);
    const { result, gained: g, merged, chains } = collapseLine(before);
    gained += g;
    setLine(i, result, merged, chains);
    if (result.some((v, j) => v !== before[j])) changed = true;
  }

  return { board: out, gained, changed, mergedCells, combos, maxChain };
}

export function emptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[r].length; c++)
      if (board[r][c] === 0) cells.push({ r, c });
  return cells;
}

// Difficulty curve (AIH-4 GDD §3). Returns the spawn weight for a 4-tile (exponent 2),
// the rest default to a 2-tile (exponent 1). Phase 3 additionally spawns a 8-tile at 5%.
export function spawnPhase(score) {
  if (score < 500) return { p4: 0.1, p8: 0 };
  if (score < 2000) return { p4: 0.2, p8: 0 };
  return { p4: 0.25, p8: 0.05 };
}

export function spawnTile(board, rng = Math.random, score = 0) {
  const empties = emptyCells(board);
  if (empties.length === 0) return null;
  const { r, c } = empties[Math.floor(rng() * empties.length)];
  const { p4, p8 } = spawnPhase(score);
  const roll = rng();
  board[r][c] = roll < p8 ? 3 : roll < p8 + p4 ? 2 : 1;
  return { r, c };
}

export function hasMoves(board) {
  for (const dir of ['left', 'right', 'up', 'down']) {
    if (move(board, dir).changed) return true;
  }
  return false;
}

export function isGameOver(board) {
  return !hasMoves(board);
}

export function maxTile(board) {
  let m = 0;
  for (const row of board) for (const v of row) m = Math.max(m, v);
  return m;
}

export function createGame(rng = Math.random) {
  const board = emptyBoard();
  spawnTile(board, rng, 0);
  spawnTile(board, rng, 0);
  return {
    board,
    score: 0,
    over: false,
    best: loadBest(),
    rng,
  };
}

const BEST_KEY = 'aih-game-a.best';

export function loadBest() {
  try {
    const v = globalThis.localStorage?.getItem(BEST_KEY);
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    globalThis.localStorage?.setItem(BEST_KEY, String(score));
  } catch {
    /* storage unavailable */
  }
}

// Apply a move + spawn. Returns new state (immutable-ish: replaces board).
export function applyMove(state, dir) {
  if (state.over) return { state, moved: false };
  const res = move(state.board, dir);
  if (!res.changed) return { state, moved: false };

  const board = cloneBoard(res.board);
  const score = state.score + Math.round(res.gained);
  spawnTile(board, state.rng ?? Math.random, score);
  const best = Math.max(state.best, score);
  const over = isGameOver(board);
  if (best > state.best) saveBest(best);

  return {
    moved: true,
    state: { ...state, board, score, best, over },
    mergedCells: res.mergedCells,
    combos: res.combos,
    maxChain: res.maxChain,
  };
}

export function cloneBoardPublic(b) {
  return cloneBoard(b);
}
export { emptyBoard, cloneBoard };

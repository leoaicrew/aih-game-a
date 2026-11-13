export const BOARD_SIZE = 5;
export const MAX_TILE = 7; // 2^7 = 128 highest merge tier

// Colors per tier (index = exponent). Tweak with design later.
export const TIER_COLORS = [
  0x9aa5b1, // placeholder 2^0 (unused)
  0xf2e8cf, // 2
  0xe9c46a, // 4
  0xf4a261, // 8
  0xe76f51, // 16
  0x2a9d8f, // 32
  0x457b9d, // 64
  0x7b2cbf, // 128
];

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function cloneBoard(b) {
  return b.map((row) => row.slice());
}

// Collapse a line (array of exponents, 0 = empty) toward index 0 and merge equal neighbors.
// Returns { result, gained, merged } where merged is a list of result indices that were merged.
export function collapseLine(line) {
  const values = line.filter((v) => v > 0);
  const result = [];
  const merged = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      const v = values[i] + 1;
      result.push(v);
      merged.push(result.length - 1);
      gained += 2 ** v;
      i++;
    } else {
      result.push(values[i]);
    }
  }
  while (result.length < line.length) result.push(0);
  return { result, gained, merged };
}

export function move(board, dir) {
  const size = board.length;
  const out = emptyBoard();
  let gained = 0;
  let changed = false;
  const mergedCells = [];

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

  const setLine = (i, line, mergedIdx) => {
    for (let j = 0; j < size; j++) {
      const v = line[j];
      let r, c;
      if (dir === 'left') [r, c] = [i, j];
      else if (dir === 'right') [r, c] = [i, size - 1 - j];
      else if (dir === 'up') [r, c] = [j, i];
      else if (dir === 'down') [r, c] = [size - 1 - j, i];
      out[r][c] = v;
      if (mergedIdx.includes(j)) mergedCells.push({ r, c, value: 2 ** v });
    }
  };

  for (let i = 0; i < size; i++) {
    const before = getLine(i);
    const { result, gained: g, merged } = collapseLine(before);
    gained += g;
    setLine(i, result, merged);
    if (result.some((v, j) => v !== before[j])) changed = true;
  }

  return { board: out, gained, changed, mergedCells };
}

export function emptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[r].length; c++)
      if (board[r][c] === 0) cells.push({ r, c });
  return cells;
}

export function spawnTile(board, rng = Math.random) {
  const empties = emptyCells(board);
  if (empties.length === 0) return null;
  const { r, c } = empties[Math.floor(rng() * empties.length)];
  board[r][c] = rng() < 0.9 ? 1 : 2; // 90% a "2", 10% a "4" (exponent 1/2)
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
  spawnTile(board, rng);
  spawnTile(board, rng);
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
  spawnTile(board, state.rng ?? Math.random);
  const score = state.score + res.gained;
  const best = Math.max(state.best, score);
  const over = isGameOver(board);
  if (best > state.best) saveBest(best);

  return {
    moved: true,
    state: { ...state, board, score, best, over },
    mergedCells: res.mergedCells,
  };
}

export function cloneBoardPublic(b) {
  return cloneBoard(b);
}
export { emptyBoard, cloneBoard };

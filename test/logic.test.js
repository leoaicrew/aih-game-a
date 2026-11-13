import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collapseLine,
  move,
  isGameOver,
  hasMoves,
  createGame,
  applyMove,
  maxTile,
  BOARD_SIZE,
} from '../src/systems/logic.js';

test('collapseLine merges equal neighbors and sums score', () => {
  const { result, gained, merged } = collapseLine([1, 1, 0, 0, 0]);
  assert.deepEqual(result, [2, 0, 0, 0, 0]);
  assert.equal(gained, 4);
  assert.deepEqual(merged, [0]);
});

test('collapseLine does not chain-merge three tiles', () => {
  const { result } = collapseLine([1, 1, 1, 0, 0]);
  assert.deepEqual(result, [2, 1, 0, 0, 0]);
});

test('collapseLine merges pairs left to right', () => {
  const { result } = collapseLine([1, 1, 1, 1, 0]);
  assert.deepEqual(result, [2, 2, 0, 0, 0]);
});

test('collapseLine keeps distinct tiles', () => {
  const { result, gained } = collapseLine([1, 2, 3, 0, 0]);
  assert.deepEqual(result, [1, 2, 3, 0, 0]);
  assert.equal(gained, 0);
});

test('move right collapses toward the right edge', () => {
  const board = [
    [1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  const { board: out, gained, changed } = move(board, 'right');
  assert.equal(changed, true);
  assert.equal(gained, 4);
  assert.equal(out[0][4], 2);
});

test('move up merges vertically', () => {
  const board = [
    [0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0],
    [2, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  const { board: out, gained } = move(board, 'up');
  assert.equal(out[0][0], 3);
  assert.equal(gained, 8);
});

test('move reports no change when blocked', () => {
  const board = [
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
  ];
  const { changed } = move(board, 'left');
  assert.equal(changed, false);
});

test('full checkerboard with no equal neighbors is game over', () => {
  const board = [
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 2],
  ];
  // bottom-right has a 2,2 pair plus others; adjacent duplicates exist -> not over
  assert.equal(hasMoves(board), true);

  const trulyDead = [
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
  ];
  // checkerboard of 1/2 has NO adjacent equal and no empties => over
  assert.equal(isGameOver(trulyDead), true);
});

test('createGame spawns two tiles on an empty board', () => {
  const state = createGame(() => 0.5);
  const filled = state.board.flat().filter((v) => v > 0).length;
  assert.equal(filled, 2);
  assert.equal(state.board.length, BOARD_SIZE);
  assert.equal(state.over, false);
});

test('applyMove increments score and spawns a tile on a valid move', () => {
  const state = {
    board: [
      [1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    score: 0,
    best: 0,
    over: false,
    rng: () => 0,
  };
  const { state: next, moved } = applyMove(state, 'left');
  assert.equal(moved, true);
  assert.equal(next.score, 4);
  const filled = next.board.flat().filter((v) => v > 0).length;
  assert.equal(filled, 2); // merged tile + one spawn
});

test('applyMove with no change keeps state', () => {
  const board = [
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
    [2, 1, 2, 1, 2],
    [1, 2, 1, 2, 1],
  ];
  const state = { board, score: 10, best: 10, over: false, rng: () => 0 };
  const { moved, state: next } = applyMove(state, 'left');
  assert.equal(moved, false);
  assert.equal(next.score, 10);
});

test('maxTile returns highest exponent', () => {
  const board = [
    [1, 2, 0, 0, 0],
    [0, 3, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  assert.equal(maxTile(board), 3);
});

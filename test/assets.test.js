import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ASSET_FILES,
  TILES,
  TILE_EXTRAS,
  BACKGROUNDS,
  UI,
  ICONS,
  MASCOT,
  TIER_NUMBERS,
  tileTexture,
} from '../src/assets.js';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf-8');

// The art set lives in public/ so Vite copies it verbatim to dist/assets/...
// asset.url is relative to the site root (e.g. assets/art/tiles/tile-2.svg).
const publicPath = (url) => path.join(root, 'public', url);

describe('Bộ asset 2D thật (AIH-21, commit e9cf8f8)', () => {
  test('AS01: manifest có đủ 37 file asset', () => {
    assert.equal(ASSET_FILES.length, 37, `cần 37 asset, đang có ${ASSET_FILES.length}`);
  });

  test('AS02: mọi file trong manifest tồn tại trên đĩa (không 404)', () => {
    for (const asset of ASSET_FILES) {
      const full = publicPath(asset.url);
      assert.ok(fs.existsSync(full), `thiếu file: public/${asset.url}`);
      const svg = read(path.join('public', asset.url));
      assert.ok(/^<svg[\s>]/i.test(svg.trim()), `không phải SVG hợp lệ: ${asset.url}`);
    }
  });

  test('AS03: đủ 11 tile 2..2048 + empty/selected/flash', () => {
    assert.deepEqual(TIER_NUMBERS, [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]);
    for (const v of TIER_NUMBERS) assert.ok(TILES[v], `thiếu tile ${v}`);
    for (const k of ['empty', 'selected', 'flash']) assert.ok(TILE_EXTRAS[k], `thiếu tile ${k}`);
  });

  test('AS04: đủ 2 background, 8 UI, 10 icon, 3 mascot', () => {
    assert.equal(Object.keys(BACKGROUNDS).length, 2);
    assert.equal(Object.keys(UI).length, 8);
    assert.equal(Object.keys(ICONS).length, 10);
    assert.equal(Object.keys(MASCOT).length, 3);
  });

  test('AS05: key texture không trùng nhau', () => {
    const keys = ASSET_FILES.map((a) => a.key);
    assert.equal(new Set(keys).size, keys.length, 'có key asset trùng');
  });

  test('AS06: tileTexture map exponent -> texture, clamp 2..2048', () => {
    assert.equal(tileTexture(1), TILES[2].key);
    assert.equal(tileTexture(3), TILES[8].key);
    assert.equal(tileTexture(11), TILES[2048].key);
    assert.equal(tileTexture(99), TILES[2048].key, 'clamp về 2048');
  });

  test('AS07: BootScene preload toàn bộ ASSET_FILES', () => {
    const boot = read('src/scenes/BootScene.js');
    assert.ok(boot.includes('ASSET_FILES'), 'BootScene dùng manifest');
    assert.ok(/load\.svg\(/.test(boot), 'nạp bằng load.svg');
    assert.ok(/loaderror/.test(boot), 'ghi nhận lỗi nạp (QA 404)');
  });

  test('AS08: Menu/Game dùng background + mascot + HUD icon thật', () => {
    const menu = read('src/scenes/MenuScene.js');
    assert.ok(menu.includes('BACKGROUNDS.menu'), 'menu nền SVG');
    assert.ok(menu.includes('MASCOT.idle'), 'mascot idle ở menu');
    const game = read('src/scenes/GameScene.js');
    assert.ok(game.includes('BACKGROUNDS.main'), 'màn chơi nền SVG');
    assert.ok(game.includes('tileTexture'), 'tile dùng texture SVG');
    assert.ok(game.includes('TILE_EXTRAS.empty'), 'ô trống dùng art');
    assert.ok(game.includes('MASCOT.cheer') && game.includes('MASCOT.shock'), 'mascot cheer/shock');
    assert.ok(game.includes('ICONS.pause') && game.includes('ICONS.volume'), 'HUD icon thật');
  });

  test('AS09: nút dùng UI kit SVG (btn primary/secondary + pressed)', () => {
    const button = read('src/ui/button.js');
    assert.ok(button.includes('UI'), 'button import UI kit');
    assert.ok(button.includes('btnSecondaryPressed') || button.includes('btnSecondary'), 'secondary art');
    const menu = read('src/scenes/MenuScene.js');
    assert.ok(/art:\s*'secondary'/.test(menu), 'nút phụ dùng art secondary');
  });

  test('AS10: license asset ghi CC0 / tự tạo', () => {
    const lic = read('public/assets/art/ART_LICENSES.md');
    assert.ok(/CC0/i.test(lic), 'giấy phép CC0');
    assert.ok(/tự tạo|0 VNĐ/i.test(lic), 'nguồn tự tạo / 0 chi phí');
    const credits = read('public/CREDITS.txt');
    assert.ok(/AIH-21/.test(credits), 'CREDITS ghi bộ asset AIH-21');
  });
});

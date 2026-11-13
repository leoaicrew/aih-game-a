import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TIER_COLORS } from '../src/systems/logic.js';
import { COLORS, TILE_GRADIENTS } from '../src/config.js';
import { sounds } from '../src/systems/audio.js';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf-8');

describe('Visual identity v3 — bright daylight (AIH-24 pass 2)', () => {
  test('UI01: nền gradient SÁNG (v3) + accent cyan #22d3ee + gold #ffd45e', () => {
    // AIH-24: pass 1 was near-black (#0b1020); v3 lifts the base far brighter.
    assert.equal(COLORS.bg, 0x4f7fd6, 'nền trên phải sáng #4f7fd6');
    assert.equal(COLORS.bgBottom, 0x8fd0ef, 'nền dưới phải sáng #8fd0ef');
    assert.equal(COLORS.accent, 0x22d3ee, 'accent cyan #22d3ee');
    assert.equal(COLORS.gold, '#ffd45e', 'accent vàng #ffd45e');

    // Brightness guard: mean of the gradient stops must be clearly above black.
    const mean = (c) => ((c >> 16 & 255) + (c >> 8 & 255) + (c & 255)) / 3;
    assert.ok(mean(COLORS.bg) > 90, `nền trên quá tối: ${mean(COLORS.bg)}`);
    assert.ok(mean(COLORS.bgBottom) > 120, `nền dưới quá tối: ${mean(COLORS.bgBottom)}`);

    const main = read('src/main.js');
    assert.ok(main.includes('#4f7fd6'), 'backgroundColor Phaser sáng = #4f7fd6');
    assert.ok(main.includes('Scale.FIT') && main.includes('480') && main.includes('800'), 'giữ Scale.FIT 480x800');

    const visuals = read('src/ui/visuals.js');
    assert.ok(/addGradientBackground/.test(visuals), 'có helper nền gradient');
    assert.ok(/addVignette/.test(visuals), 'có vignette');
    assert.ok(/addGlow/.test(visuals), 'có glow');
    assert.ok(/drawPanel/.test(visuals), 'có panel viền + bóng');
  });

  test('UI02: tier 256/512/1024/2048 khác màu nhau (không còn trùng 0xff007f)', () => {
    const tiers = [TIER_COLORS[8], TIER_COLORS[9], TIER_COLORS[10], TIER_COLORS[11]];
    const uniq = new Set(tiers);
    assert.equal(uniq.size, 4, '4 tier cao phải có 4 màu khác nhau');
    assert.ok(!TIER_COLORS.includes(0xff007f), 'bỏ màu neon trùng 0xff007f');
    assert.equal(TILE_GRADIENTS.length, 12, 'đủ gradient cho exponent 0..11');
    assert.equal(new Set(TILE_GRADIENTS.slice(8).map((g) => g[0])).size, 4, 'gradient cao cấp khác nhau');
    // Every tile tier must be bright enough to read on a light sky.
    const mean = (c) => ((c >> 16 & 255) + (c >> 8 & 255) + (c & 255)) / 3;
    for (let i = 1; i < TIER_COLORS.length; i++) {
      assert.ok(mean(TIER_COLORS[i]) > 110, `tier ${2 ** i} quá tối (${mean(TIER_COLORS[i])})`);
    }
  });

  test('UI03: tile không còn blur filter + không nhúng số trong SVG (nhoè fix)', () => {
    const grid = read('src/scenes/GameScene.js');
    // Procedural fallback (no-art) still draws a bevel tile.
    assert.ok(/bevel/i.test(grid), 'có khối bevel fallback');
    assert.ok(grid.includes('tileGradient'), 'fallback tile dùng gradient theo tier');
    // Real SVG tile files must be crisp: no blur filters, engine draws the number.
    const tilesDir = path.join(root, 'public/assets/art/tiles');
    const files = fs.readdirSync(tilesDir)
      .filter((f) => /^tile-\d+\.svg$/.test(f));
    assert.ok(files.length >= 11, 'đủ 11 tile số SVG');
    for (const f of files) {
      const svg = fs.readFileSync(path.join(tilesDir, f), 'utf-8');
      assert.ok(!/feGaussianBlur|feDropShadow/.test(svg), `${f} không được có blur filter (gây nhoè)`);
      assert.ok(!/<text[\s>]/.test(svg), `${f} không nhúng số (engine vẽ số, tránh trùng/nhoè)`);
    }
  });
});

describe('Game feel / juice (>=10 tween có chủ đích)', () => {
  test('FX01: Fx kit có >= 10 hiệu ứng tween riêng biệt', () => {
    const fxSrc = read('src/ui/fx.js');
    const methodRe = /^  ([a-zA-Z]+)\([^)]*\) \{/gm;
    const skip = new Set(['constructor', 'register', 'tween', 'musicActive']);
    const methods = [...fxSrc.matchAll(methodRe)]
      .map((m) => m[1])
      .filter((n) => !skip.has(n));
    const effects = methods.filter((n) => {
      const body = fxSrc.split(`  ${n}(`)[1] ?? '';
      return /this\.tween\(|cameras\.main\.(shake|fadeIn)/.test(body);
    });
    assert.ok(effects.length >= 10, `cần >=10 hiệu ứng, đang có ${effects.length}: ${effects.join(', ')}`);
  });

  test('FX02: các hiệu ứng bắt buộc có mặt (spawn/merge/shake/burst/confetti/counter/pop/float/fade/overlay)', () => {
    const fxSrc = read('src/ui/fx.js');
    const required = [
      'spawnPop', 'mergeBounce', 'flash', 'boardShake', 'burst',
      'confetti', 'countScore', 'scorePop', 'float', 'fadeIn', 'overlayIn',
    ];
    for (const name of required) {
      assert.ok(fxSrc.includes(`${name}(`), `thiếu hiệu ứng ${name}`);
    }
    const button = read('src/ui/button.js');
    assert.ok(/pointerover/.test(button) && /tweens\.add/.test(button), 'nút hover/press dùng tween mượt');
    const menu = read('src/scenes/MenuScene.js');
    assert.ok(menu.includes('fx.pulse') || menu.includes('pulse('), 'menu có CTA pulse');
    assert.ok(menu.includes('fx.float'), 'logo float');
    const game = read('src/scenes/GameScene.js');
    assert.ok(game.includes('boardShake'), 'board shake khi combo');
    assert.ok(game.includes('confetti'), 'confetti khi kỷ lục');
    assert.ok(game.includes('burst'), 'particle nổ khi gộp');
    assert.ok(game.includes('countScore'), 'score counter chạy số');
  });

  test('FX03: GameScene dùng fx.showX ở luồng chơi (spawn pop, merge bounce)', () => {
    const game = read('src/scenes/GameScene.js');
    assert.ok(/fx\.spawnPop/.test(game), 'spawn pop khi renderBoard');
    assert.ok(/fx\.mergeBounce/.test(game), 'merge bounce khi gộp');
    assert.ok(/fx\.flash/.test(game), 'merge flash');
    assert.ok(/fx\.overlayIn/.test(game), 'overlay slide-in (pause/howto/gameover)');
    assert.ok(/fx\.fadeIn/.test(game), 'scene fade');
  });
});

describe('Audio: nhạc nền + SFX (WebAudio, 0 asset)', () => {
  test('AU01: audio manager có nhạc nền loop + SFX menu/record', () => {
    for (const m of ['startMusic', 'stopMusic', 'scheduleMusicStep', 'playMenu', 'playRecord', 'playMerge', 'playCombo', 'playGameOver']) {
      assert.equal(typeof sounds[m], 'function', `thiếu sounds.${m}()`);
    }
    assert.equal(sounds.musicPlaying, false, 'nhạc chưa tự chạy khi chưa có tương tác');
  });

  test('AU02: mute tắt cả nhạc nền (stopMusic) và bật lại khi unmute', () => {
    const src = read('src/systems/audio.js');
    assert.ok(/toggleMute/.test(src), 'có toggleMute');
    assert.ok(/if \(this\.muted\) this\.stopMusic\(\)/.test(src), 'mute -> stopMusic');
    assert.ok(/startMusic\(\)/.test(src.split('toggleMute()')[1] ?? ''), 'unmute -> startMusic');
  });

  test('AU03: GameScene bật nhạc nền và menu có SFX, không tải file audio từ mạng', () => {
    const game = read('src/scenes/GameScene.js');
    assert.ok(/sounds\.startMusic\(\)/.test(game), 'GameScene khởi động nhạc nền');
    const menu = read('src/scenes/MenuScene.js');
    assert.ok(/sounds\.playMenu\(\)/.test(menu), 'menu có SFX');
    const fxOn = ['mp3', 'ogg', 'wav'];
    for (const file of ['src/scenes/MenuScene.js', 'src/scenes/GameScene.js', 'src/systems/audio.js']) {
      const c = read(file).toLowerCase();
      for (const ext of fxOn) assert.ok(!c.includes(`.${ext}`), `${file} không được nạp file .${ext}`);
    }
  });

  test('AU04: CREDITS.txt có mục âm nhạc + giấy phép rõ ràng', () => {
    const credits = read('public/CREDITS.txt');
    assert.ok(/nhạc nền|âm nhạc/i.test(credits), 'CREDITS phải có mục âm nhạc');
    assert.ok(/Web Audio/i.test(credits), 'ghi rõ nhạc sinh bằng Web Audio');
    assert.ok(/0 file|CC0|không bên thứ ba/i.test(credits), 'ghi license/nguồn');
  });
});

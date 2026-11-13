import Phaser from 'phaser';
import { BOARD_SIZE } from '../systems/logic.js';
import { GAME_W, GAME_H, COLORS, TILE_TEXT_COLORS, PALETTE, FONT } from '../config.js';
import { makeButton, makeIconButton } from '../ui/button.js';
import {
  TIER_COLORS,
  createGame,
  applyMove,
  comboMultiplier,
} from '../systems/logic.js';
import { sounds } from '../systems/audio.js';
import Fx from '../ui/fx.js';
import { addGradientBackground, addGlow, addVignette, drawPanel } from '../ui/visuals.js';
import { BACKGROUNDS, TILE_EXTRAS, ICONS, MASCOT, tileTexture } from '../assets.js';

const BOARD_PX = 430;
const MARGIN = (GAME_W - BOARD_PX) / 2;
const GAP = 10;
const CELL = (BOARD_PX - GAP * (BOARD_SIZE + 1)) / BOARD_SIZE;
const BOARD_TOP = 210;

// Board origin, used for board shake (v2) and tile glows.
export const BOARD_LAYOUT = { BOARD_PX, MARGIN, GAP, CELL, BOARD_TOP };

const DIRS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
};

// Tile bevel: gradient body (top -> bottom), bright top edge, dark bottom edge.
// Distinct glow for 256/512/1024/2048 so the board reads at a glance.
function tileGradient(exponent) {
  const idx = Math.min(exponent, TIER_COLORS.length - 1);
  const top = TIER_COLORS[idx];
  const bottom = Phaser.Display.Color.ValueToColor(top).darken(28).color;
  return { top, bottom };
}

// DEF-02: shrink font as tile digits grow so 1024/2048 stay inside the cell.
function tileFontSize(value) {
  return value >= 1000 ? 30 : value >= 100 ? 38 : value >= 10 ? 44 : 46;
}

function tileLabel(exponent) {
  const value = 2 ** exponent;
  const textColor = exponent <= 1 ? TILE_TEXT_COLORS.dark : TILE_TEXT_COLORS.light;
  return { value, textColor };
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.showHowTo = data?.showHowTo ?? false;
  }

  create() {
    this.fx = new Fx(this);
    this.cameras.main.setBackgroundColor('#4f7fd6');
    // Gradient first as the fallback base, then the bright SVG background on
    // top (AIH-24: previously the opaque gradient was painted OVER the SVG,
    // which is why the screen read as near-black).
    addGradientBackground(this);
    if (this.textures.exists(BACKGROUNDS.main.key)) {
      this.add.image(GAME_W / 2, GAME_H / 2, BACKGROUNDS.main.key).setDisplaySize(GAME_W, GAME_H);
    }
    addGlow(this, GAME_W / 2, BOARD_TOP + BOARD_PX / 2, 300, PALETTE.cyan, 0.18);
    addVignette(this);

    this.game = createGame();
    this.tileSprites = new Map(); // key "r,c" -> container (visual)
    this.locked = false;
    this.paused = false;
    this.prevScore = 0;

    this.buildHeader();
    this.buildBoard();
    this.renderBoard(true);
    this.bindInput();
    this.fx.fadeIn(300);

    sounds.startMusic();

    if (this.showHowTo) this.showHowToOverlay();
  }

  cellXY(r, c) {
    return {
      x: MARGIN + GAP + c * (CELL + GAP) + CELL / 2,
      y: BOARD_TOP + GAP + r * (CELL + GAP) + CELL / 2,
    };
  }

  buildHeader() {
    // Score card
    drawPanel(this, 118, 60, 208, 92, 18, { fill: 0x24375e, edge: 0x5f83c4 });
    this.add.text(28, 22, 'ĐIỂM', { fontFamily: FONT, fontSize: '15px', color: '#22d3ee', letterSpacing: 2 });
    this.scoreText = this.add
      .text(28, 42, '0', {
        fontFamily: FONT,
        fontSize: '42px',
        color: '#f5f7fa',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)
      .setShadow(0, 2, '#000000', 6, false, true);

    // Best card
    drawPanel(this, GAME_W - 118, 60, 208, 92, 18, { fill: 0x24375e, edge: 0x5f83c4 });
    this.add
      .text(GAME_W - 28, 22, 'KỶ LỤC', { fontFamily: FONT, fontSize: '15px', color: '#e9c46a', letterSpacing: 2 })
      .setOrigin(1, 0);
    this.bestText = this.add
      .text(GAME_W - 28, 42, `${this.game.best}`, {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#e9c46a',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.pauseBtn = makeIconButton(this, GAME_W - 62, 160, '❚❚', () => this.togglePause(), {
      sfx: sounds, size: 48, fontSize: '18px', fill: 0x24375e,
      texture: ICONS.pause.key, iconSize: 28,
    });
    this.muteBtn = makeIconButton(this, GAME_W - 122, 160, sounds.muted ? '🔇' : '🔊', () => this.toggleMute(), {
      sfx: sounds, size: 48, fill: 0x24375e,
      texture: (sounds.muted ? ICONS.mute : ICONS.volume).key, iconSize: 28,
    });
    void this.pauseBtn;

    this.add
      .text(GAME_W / 2, 160, 'VUỐT ĐỂ TRƯỢT', {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#dbe6f5',
        letterSpacing: 3,
      })
      .setOrigin(0.5);
  }

  toggleMute() {
    const muted = sounds.toggleMute();
    this.muteBtn?.setIcon?.((muted ? ICONS.mute : ICONS.volume).key);
    if (!muted) sounds.playClick();
  }

  buildBoard() {
    // Outer frame with shadow.
    drawPanel(this, GAME_W / 2, BOARD_TOP + BOARD_PX / 2, BOARD_PX + 16, BOARD_PX + 16, 24, {
      fill: COLORS.boardBg,
      edge: 0x2c3856,
      shadowAlpha: 0.6,
    });

    const hasEmptyArt = this.textures.exists(TILE_EXTRAS.empty.key);
    if (!hasEmptyArt) {
      this.cellGraphics = this.add.graphics();
    }
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const { x, y } = this.cellXY(r, c);
        if (hasEmptyArt) {
          this.add.image(x, y, TILE_EXTRAS.empty.key).setDisplaySize(CELL, CELL);
        } else {
          this.cellGraphics.fillStyle(COLORS.cellEmpty, 1);
          this.cellGraphics.fillRoundedRect(x - CELL / 2, y - CELL / 2, CELL, CELL, 12);
          this.cellGraphics.lineStyle(1, 0x2a3550, 0.9);
          this.cellGraphics.strokeRoundedRect(x - CELL / 2, y - CELL / 2, CELL, CELL, 12);
        }
      }
    }
  }

  makeTile(exponent) {
    const container = this.add.container(0, 0);
    const size = CELL;
    const texKey = tileTexture(exponent);
    const hasArt = this.textures.exists(texKey);

    if (hasArt) {
      // Real bevel tile SVG (AIH-21) as the body, value glyph on top.
      const img = this.add.image(0, 0, texKey).setDisplaySize(size, size);
      const { value, textColor } = tileLabel(exponent);
      const text = this.add
        .text(0, 0, String(value), {
          fontFamily: FONT,
          fontSize: `${tileFontSize(value)}px`,
          color: textColor,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setShadow(0, 2, '#000000', 4, false, true);
      container.add([img, text]);
      container.tileBody = img;
      return container;
    }

    const { top, bottom } = tileGradient(exponent);
    const g = this.add.graphics();

    // drop shadow
    g.fillStyle(PALETTE.black, 0.5);
    g.fillRoundedRect(-size / 2, -size / 2 + 5, size, size, 12);

    // gradient body via stacked bands
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(top),
        Phaser.Display.Color.ValueToColor(bottom),
        bands - 1,
        i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      const bh = size / bands;
      const by = -size / 2 + i * bh;
      if (i === 0) g.fillRoundedRect(-size / 2, by, size, bh + 12, { tl: 12, tr: 12, bl: 0, br: 0 });
      else if (i === bands - 1) g.fillRoundedRect(-size / 2, by, size, bh, { tl: 0, tr: 0, bl: 12, br: 12 });
      else g.fillRect(-size / 2, by, size, bh + 1);
    }

    // bevel: bright top edge + dark bottom inner shadow
    g.lineStyle(3, 0xffffff, 0.4);
    g.beginPath();
    g.moveTo(-size / 2 + 12, -size / 2 + 3);
    g.lineTo(size / 2 - 12, -size / 2 + 3);
    g.strokePath();
    g.lineStyle(3, PALETTE.black, 0.28);
    g.beginPath();
    g.moveTo(-size / 2 + 12, size / 2 - 4);
    g.lineTo(size / 2 - 12, size / 2 - 4);
    g.strokePath();

    // high-tier outer glow
    if (exponent >= 8) {
      g.lineStyle(2, top, 0.6);
      g.strokeRoundedRect(-size / 2 - 2, -size / 2 - 2, size + 4, size + 4, 14);
    }

    const value = 2 ** exponent;
    // DEF-02: shrink font as tile digits grow so 1024/2048 stay inside the cell.
    const fontSize =
      value >= 1000 ? 30 : value >= 100 ? 38 : value >= 10 ? 44 : 46;
    const textColor =
      exponent <= 1 ? TILE_TEXT_COLORS.dark : TILE_TEXT_COLORS.light;
    const text = this.add
      .text(0, 0, String(value), {
        fontFamily: FONT,
        fontSize: `${fontSize}px`,
        color: textColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 4, false, true);

    container.add([g, text]);
    return container;
  }

  renderBoard(instant = false) {
    const board = this.game.board;
    this.tileSprites.forEach((sprite) => sprite.destroy());
    this.tileSprites.clear();

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const exp = board[r][c];
        if (exp === 0) continue;
        const { x, y } = this.cellXY(r, c);
        const sprite = this.makeTile(exp);
        sprite.setPosition(x, y);
        if (!instant) this.fx.spawnPop(sprite);
        this.tileSprites.set(`${r},${c}`, sprite);
      }
    }

    const prev = this.prevScore ?? 0;
    if (this.game.score !== prev) {
      this.fx.countScore(this.scoreText, prev, this.game.score);
      this.fx.scorePop(this.scoreText);
    } else {
      this.scoreText.setText(String(this.game.score));
    }
    this.prevScore = this.game.score;
    this.bestText.setText(String(this.game.best));
  }

  bindInput() {
    this.input.keyboard.on('keydown', (e) => {
      const dir = DIRS[e.key];
      if (dir) {
        e.preventDefault?.();
        this.doMove(dir);
      } else if (e.key === 'Escape' || e.key === 'p') {
        this.togglePause();
      }
    });

    let startX = 0;
    let startY = 0;
    let tracking = false;

    this.input.on('pointerdown', (p) => {
      startX = p.x;
      startY = p.y;
      tracking = true;
    });

    this.input.on('pointerup', (p) => {
      if (!tracking) return;
      tracking = false;
      const dx = p.x - startX;
      const dy = p.y - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 24) return;
      if (absX > absY) this.doMove(dx > 0 ? 'right' : 'left');
      else this.doMove(dy > 0 ? 'down' : 'up');
    });
  }

  doMove(dir) {
    if (this.locked || this.game.over || this.paused) return;
    const { state, moved, mergedCells, combos, maxChain } = applyMove(
      this.game,
      dir,
    );
    if (!moved) return;

    this.game = state;
    this.locked = true;
    this.renderBoard();

    sounds.playSlide();

    if (mergedCells?.length) {
      const topTier = Math.max(...mergedCells.map((c) => c.value));
      for (const cell of mergedCells) this.popCell(cell.r, cell.c, topTier);
      sounds.playMerge(Math.log2(topTier || 2));
    }

    if (combos?.length && maxChain > 1) {
      sounds.playCombo(maxChain);
      this.fx.boardShake(maxChain >= 3 ? 0.008 : 0.005, 180);
      // Show the strongest chain's feedback once per move.
      const strongest = combos.reduce((a, b) => (b.depth > a.depth ? b : a));
      this.showComboBurst(strongest.r, strongest.c, strongest.depth);
      this.cheerMascot();
    }

    this.time.delayedCall(140, () => {
      this.locked = false;
      if (this.game.over) {
        sounds.playGameOver();
        this.time.delayedCall(220, () => this.showGameOver());
      }
    });
  }

  showComboBurst(r, c, depth) {
    const { x, y } = this.cellXY(r, c);
    const mult = comboMultiplier(depth);
    const label = depth >= 4 ? `MEGA COMBO x${mult}!` : `COMBO x${mult}!`;

    const starKey = ICONS.comboStar.key;
    const star = this.textures.exists(starKey)
      ? this.add.image(x, y - CELL * 0.55, starKey).setDisplaySize(40, 40).setOrigin(0.5).setDepth(900)
      : this.add
        .text(x, y - CELL * 0.55, '★', {
          fontFamily: FONT,
          fontSize: '32px',
          color: '#e9c46a',
        })
        .setOrigin(0.5)
        .setDepth(900);

    const text = this.add
      .text(x, y - CELL * 0.2, label, {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#ffd45e',
        fontStyle: 'bold',
        stroke: '#24375e',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(900);

    for (const t of [star, text]) {
      this.fx.popIn(t);
      this.fx.rise(t);
    }
  }

  popCell(r, c, exponent = 2) {
    const { x, y } = this.cellXY(r, c);
    if (this.textures.exists(TILE_EXTRAS.flash.key)) {
      const burstArt = this.add.image(x, y, TILE_EXTRAS.flash.key).setDisplaySize(CELL * 1.3, CELL * 1.3).setDepth(820);
      this.fx.tween({
        targets: burstArt,
        alpha: 0,
        scale: 1.5,
        duration: 280,
        ease: 'Quad.Out',
        onComplete: () => burstArt.destroy(),
      });
    }
    const color = TIER_COLORS[Math.min(exponent, TIER_COLORS.length - 1)];
    this.fx.flash(x, y, color);
    this.fx.burst(x, y, color);
    const sprite = this.tileSprites.get(`${r},${c}`);
    if (sprite) this.fx.mergeBounce(sprite);
  }

  // Mascot "Stacky" cheer pop on a strong combo (real SVG, AIH-21).
  cheerMascot() {
    if (!this.textures.exists(MASCOT.cheer.key)) return;
    if (!this.mascot) {
      this.mascot = this.add
        .image(MARGIN + CELL * 0.5, BOARD_TOP - 6, MASCOT.idle.key)
        .setOrigin(0.5)
        .setScale(0.34)
        .setDepth(950);
    }
    this.mascot.setTexture(MASCOT.cheer.key).setDisplaySize(96, 96);
    this.fx.popIn(this.mascot);
    this.mascotTween?.remove?.();
    this.mascotTween = this.time.delayedCall(900, () => {
      this.mascot?.setTexture(MASCOT.idle.key).setDisplaySize(96, 96);
    });
  }

  togglePause() {
    if (this.game.over) return;
    this.paused = !this.paused;
    if (this.paused) {
      const layer = this.add.container(0, 0).setDepth(1000);
      const dim = this.add
        .rectangle(0, 0, GAME_W, GAME_H, 0x05070d, 0.78)
        .setOrigin(0)
        .setInteractive({ useHandCursor: false });
      const card = this.add.container(0, 0);
      drawPanel(this, GAME_W / 2, GAME_H * 0.45, 360, 380, 28, { fill: 0x1e2f52, edge: 0x4f6fa8 });
      const title = this.add
        .text(GAME_W / 2, GAME_H * 0.31, 'TẠM DỪNG', {
          fontFamily: FONT,
          fontSize: '42px',
          color: '#f5f7fa',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const resume = makeButton(this, GAME_W / 2, GAME_H * 0.45, 'TIẾP TỤC', () =>
        this.togglePause(),
      { sfx: sounds });
      const quit = makeButton(
        this,
        GAME_W / 2,
        GAME_H * 0.45 + 96,
        'VỀ MENU',
        () => this.scene.start('Menu'),
        { sfx: sounds, fill: PALETTE.panelEdge, fillBottom: 0x2a3f66, textColor: '#f5f7fa', fontSize: '24px', height: 64 },
      );
      card.add([title, resume, quit]);
      layer.add([dim, card]);
      this.pausePanel = layer;
      this.fx.overlayIn(card);
    } else {
      this.pausePanel?.destroy();
      this.pausePanel = null;
    }
  }

  showHowToOverlay() {
    const layer = this.add.container(0, 0).setDepth(2000);
    const dim = this.add
      .rectangle(0, 0, GAME_W, GAME_H, 0x05070d, 0.84)
      .setOrigin(0)
      .setInteractive();
    const card = this.add.container(0, 0);
    drawPanel(this, GAME_W / 2, GAME_H * 0.5, 400, 600, 28, { fill: 0x1e2f52, edge: 0x4f6fa8 });
    const title = this.add
      .text(GAME_W / 2, GAME_H * 0.27, 'CÁCH CHƠI', {
        fontFamily: FONT,
        fontSize: '38px',
        color: '#22d3ee',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const body = this.add
      .text(
        GAME_W / 2,
        GAME_H * 0.53,
        'Vuốt hoặc dùng phím mũi tên\nđể trượt các ô số.\nHai ô cùng số chạm nhau\nsẽ gộp thành số gấp đôi.\n\n★ CHUỖI COMBO:\nÔ vừa gộp chạm ô cùng số\nsẽ gộp tiếp ngay trong lượt!\nCombo càng sâu, điểm càng cao\n(x1.5 → x2 → x3).\n\nMục tiêu: gộp tới 2048!\nBàn đầy, hết nước đi là thua.',
        {
          fontFamily: FONT,
          fontSize: '19px',
          color: '#d5dbe8',
          align: 'center',
          lineSpacing: 6,
        },
      )
      .setOrigin(0.5);
    const ok = makeButton(this, GAME_W / 2, GAME_H * 0.84, 'ĐÃ HIỂU', () => {
      layer.destroy();
    }, { sfx: sounds });
    card.add([title, body, ok]);
    layer.add([dim, card]);
    this.fx.overlayIn(card);
  }

  showGameOver() {
    const layer = this.add.container(0, 0).setDepth(1500);
    const dim = this.add
      .rectangle(0, 0, GAME_W, GAME_H, 0x05070d, 0.8)
      .setOrigin(0)
      .setInteractive();
    const card = this.add.container(0, 0);
    drawPanel(this, GAME_W / 2, GAME_H * 0.48, 380, 460, 28, { fill: 0x1e2f52, edge: 0x4f6fa8 });
    const isBest = this.game.score >= this.game.best && this.game.score > 0;
    const title = this.add
      .text(GAME_W / 2, GAME_H * 0.315, 'KẾT THÚC', {
        fontFamily: FONT,
        fontSize: '46px',
        color: '#f5f7fa',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 3, '#000000', 10, false, true);
    const score = this.add
      .text(GAME_W / 2, GAME_H * 0.4, `ĐIỂM  ${this.game.score}`, {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#e9c46a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const best = this.add
      .text(
        GAME_W / 2,
        GAME_H * 0.47,
        isBest ? '★ KỶ LỤC MỚI ★' : `Kỷ lục: ${this.game.best}`,
        {
          fontFamily: FONT,
          fontSize: '22px',
          color: isBest ? '#22d3ee' : '#9aa5b1',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    const again = makeButton(this, GAME_W / 2, GAME_H * 0.58, 'CHƠI LẠI', () => {
      this.cameras.main.fadeOut(180, 5, 7, 13);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
    }, { sfx: sounds });
    const menu = makeButton(
      this,
      GAME_W / 2,
      GAME_H * 0.58 + 92,
      'VỀ MENU',
      () => this.scene.start('Menu'),
      { sfx: sounds, fill: PALETTE.panelEdge, fillBottom: 0x2a3f66, textColor: '#f5f7fa', fontSize: '24px', height: 64 },
    );
    card.add([title, score, best, again, menu]);
    layer.add([dim, card]);
    this.fx.overlayIn(card);

    // Mascot reaction: cheer on new record, shock on a normal loss.
    const mascotKey = (isBest ? MASCOT.cheer : MASCOT.shock).key;
    if (this.textures.exists(mascotKey)) {
      const mascot = this.add
        .image(GAME_W / 2, GAME_H * 0.235, mascotKey)
        .setOrigin(0.5)
        .setDisplaySize(96, 96);
      card.add(mascot);
      if (isBest) this.fx.float(mascot, 5, 1400);
      this.fx.popIn(mascot);
    }

    if (isBest) {
      sounds.playRecord();
      this.fx.confetti(70);
      this.fx.scorePop(score);
    }
  }
}

import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, TILE_TEXT_COLORS } from '../config.js';
import { makeButton } from '../ui/button.js';
import {
  BOARD_SIZE,
  TIER_COLORS,
  createGame,
  applyMove,
  comboMultiplier,
} from '../systems/logic.js';
import { sounds } from '../systems/audio.js';

const BOARD_PX = 420;
const MARGIN = (GAME_W - BOARD_PX) / 2;
const GAP = 10;
const CELL = (BOARD_PX - GAP * (BOARD_SIZE + 1)) / BOARD_SIZE;
const BOARD_TOP = 300;

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

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.showHowTo = data?.showHowTo ?? false;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.game = createGame();
    this.tileSprites = new Map(); // key "r,c" -> container (visual)
    this.locked = false;

    this.buildHeader();
    this.buildBoard();
    this.renderBoard(true);
    this.bindInput();

    if (this.showHowTo) this.showHowToOverlay();
  }

  cellXY(r, c) {
    return {
      x: MARGIN + GAP + c * (CELL + GAP) + CELL / 2,
      y: BOARD_TOP + GAP + r * (CELL + GAP) + CELL / 2,
    };
  }

  buildHeader() {
    this.scoreText = this.add
      .text(MARGIN, 40, '0', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        color: COLORS.textLight,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    this.add.text(MARGIN, 18, 'ĐIỂM', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: COLORS.textDim,
    });

    this.bestText = this.add
      .text(GAME_W - MARGIN, 40, `${this.game.best}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: COLORS.textDim,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    this.add
      .text(GAME_W - MARGIN, 18, 'KỶ LỤC', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: COLORS.textDim,
      })
      .setOrigin(1, 0);

    makeButton(
      this,
      GAME_W - MARGIN - 40,
      130,
      '☰',
      () => this.togglePause(),
      { width: 64, height: 56, fontSize: '26px', fill: 0x2a3140, radius: 14 },
    );

    this.muteBtn = makeButton(
      this,
      GAME_W - MARGIN - 116,
      130,
      sounds.muted ? '🔇' : '🔊',
      () => this.toggleMute(),
      { width: 64, height: 56, fontSize: '24px', fill: 0x2a3140, radius: 14 },
    );
  }

  toggleMute() {
    const muted = sounds.toggleMute();
    const label = this.muteBtn.list?.[1];
    if (label) label.setText(muted ? '🔇' : '🔊');
    if (!muted) sounds.playClick();
  }

  buildBoard() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.boardBg, 1);
    g.fillRoundedRect(MARGIN, BOARD_TOP, BOARD_PX, BOARD_PX, 16);

    this.cellGraphics = this.add.graphics();
    this.cellGraphics.fillStyle(COLORS.cellEmpty, 1);
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const { x, y } = this.cellXY(r, c);
        this.cellGraphics.fillRoundedRect(
          x - CELL / 2,
          y - CELL / 2,
          CELL,
          CELL,
          10,
        );
      }
    }
  }

  makeTile(exponent) {
    const container = this.add.container(0, 0);
    const size = CELL;
    const color = TIER_COLORS[Math.min(exponent, TIER_COLORS.length - 1)];
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 10);

    const value = 2 ** exponent;
    // DEF-02: shrink font as tile digits grow so 1024/2048 stay inside the cell.
    const fontSize =
      value >= 1000 ? 30 : value >= 100 ? 38 : value >= 10 ? 44 : 46;
    const textColor =
      exponent <= 1 ? TILE_TEXT_COLORS.dark : TILE_TEXT_COLORS.light;
    const text = this.add
      .text(0, 0, String(value), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${fontSize}px`,
        color: textColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

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
        if (!instant) {
          sprite.setScale(0.2);
          sprite.setAlpha(0);
          this.tweens.add({
            targets: sprite,
            scale: 1,
            alpha: 1,
            duration: 120,
            ease: 'Back.Out',
          });
        }
        this.tileSprites.set(`${r},${c}`, sprite);
      }
    }
    this.scoreText.setText(String(this.game.score));
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
      for (const cell of mergedCells) this.popCell(cell.r, cell.c);
      sounds.playMerge(Math.log2(topTier || 2));
    }

    if (combos?.length && maxChain > 1) {
      sounds.playCombo(maxChain);
      // Show the strongest chain's feedback once per move.
      const strongest = combos.reduce((a, b) => (b.depth > a.depth ? b : a));
      this.showComboBurst(strongest.r, strongest.c, strongest.depth);
    }

    this.time.delayedCall(140, () => {
      this.locked = false;
      if (this.game.over) {
        sounds.playGameOver();
        this.showGameOver();
      }
    });
  }

  showComboBurst(r, c, depth) {
    const { x, y } = this.cellXY(r, c);
    const mult = comboMultiplier(depth);
    const label = depth >= 4 ? `MEGA COMBO x${mult}!` : `COMBO x${mult}!`;

    const star = this.add
      .text(x, y - CELL * 0.55, '★', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: '#e9c46a',
      })
      .setOrigin(0.5)
      .setDepth(900);

    const text = this.add
      .text(x, y - CELL * 0.2, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#e9c46a',
        fontStyle: 'bold',
        stroke: '#161a23',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(900);

    const targets = [star, text];
    for (const t of targets) {
      t.setScale(0.2).setAlpha(0);
      this.tweens.add({
        targets: t,
        scale: { from: 0.2, to: 1.3 },
        alpha: 1,
        duration: 160,
        ease: 'Back.Out',
        yoyo: true,
        hold: 260,
        onComplete: () => t.destroy(),
      });
    }
  }

  popCell(r, c) {
    const sprite = this.tileSprites.get(`${r},${c}`);
    if (!sprite) return;
    this.tweens.add({
      targets: sprite,
      scale: { from: 1.18, to: 1 },
      duration: 160,
      ease: 'Quad.Out',
    });
  }

  togglePause() {
    if (this.game.over) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausePanel = this.add.container(0, 0).setDepth(1000);
      const dim = this.add
        .rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.72)
        .setOrigin(0)
        .setInteractive({ useHandCursor: false });
      const title = this.add
        .text(GAME_W / 2, GAME_H * 0.35, 'TẠM DỪNG', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '44px',
          color: COLORS.textLight,
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const resume = makeButton(this, GAME_W / 2, GAME_H * 0.5, 'TIẾP TỤC', () =>
        this.togglePause(),
      );
      const quit = makeButton(
        this,
        GAME_W / 2,
        GAME_H * 0.5 + 96,
        'VỀ MENU',
        () => this.scene.start('Menu'),
        { fill: 0x2a3140, fontSize: '24px', height: 60 },
      );
      this.pausePanel.add([dim, title, resume, quit]);
    } else {
      this.pausePanel?.destroy();
      this.pausePanel = null;
    }
  }

  showHowToOverlay() {
    const layer = this.add.container(0, 0).setDepth(2000);
    const dim = this.add
      .rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.82)
      .setOrigin(0)
      .setInteractive();
    const title = this.add
      .text(GAME_W / 2, GAME_H * 0.28, 'CÁCH CHƠI', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        color: COLORS.textLight,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const body = this.add
      .text(
        GAME_W / 2,
        GAME_H * 0.52,
        'Vuốt hoặc dùng phím mũi tên\nđể trượt các ô số.\nHai ô cùng số chạm nhau\nsẽ gộp thành số gấp đôi.\n\n★ CHUỖI COMBO:\nÔ vừa gộp chạm ô cùng số\nsẽ gộp tiếp ngay trong lượt!\nCombo càng sâu, điểm càng cao\n(x1.5 → x2 → x3).\n\nMục tiêu: gộp tới 2048!\nBàn đầy, hết nước đi là thua.',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          color: COLORS.textLight,
          align: 'center',
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5);
    const ok = makeButton(this, GAME_W / 2, GAME_H * 0.85, 'ĐÃ HIỂU', () =>
      layer.destroy(),
    );
    layer.add([dim, title, body, ok]);
  }

  showGameOver() {
    const layer = this.add.container(0, 0).setDepth(1500);
    const dim = this.add
      .rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.78)
      .setOrigin(0)
      .setInteractive();
    const isBest = this.game.score >= this.game.best && this.game.score > 0;
    const title = this.add
      .text(GAME_W / 2, GAME_H * 0.3, 'KẾT THÚC', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        color: COLORS.textLight,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const score = this.add
      .text(GAME_W / 2, GAME_H * 0.42, `Điểm: ${this.game.score}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: '#e9c46a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const best = this.add
      .text(
        GAME_W / 2,
        GAME_H * 0.5,
        isBest ? 'KỶ LỤC MỚI!' : `Kỷ lục: ${this.game.best}`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          color: COLORS.textDim,
        },
      )
      .setOrigin(0.5);
    const again = makeButton(this, GAME_W / 2, GAME_H * 0.65, 'CHƠI LẠI', () =>
      this.scene.restart(),
    );
    const menu = makeButton(
      this,
      GAME_W / 2,
      GAME_H * 0.65 + 96,
      'VỀ MENU',
      () => this.scene.start('Menu'),
      { fill: 0x2a3140, fontSize: '24px', height: 60 },
    );
    layer.add([dim, title, score, best, again, menu]);
  }
}

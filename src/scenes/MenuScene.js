import Phaser from 'phaser';
import { GAME_W, GAME_H, PALETTE, FONT } from '../config.js';
import { addGradientBackground, addGlow, addVignette } from '../ui/visuals.js';
import { makeButton } from '../ui/button.js';
import { loadBest } from '../systems/logic.js';
import { sounds } from '../systems/audio.js';
import Fx from '../ui/fx.js';

// Lobby-style menu: gradient sky, glowing logo card drawn from tiles,
// chunky CTA with idle pulse, record + credits line.
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.fx = new Fx(this);
    this.cameras.main.setBackgroundColor('#0b1020');
    addGradientBackground(this);
    addGlow(this, GAME_W / 2, 250, 260, PALETTE.cyan, 0.30);
    addGlow(this, GAME_W / 2, 660, 230, PALETTE.gold, 0.14);
    addVignette(this);
    this.fx.fadeIn();

    sounds.playMenu();

    // Logo: two stacked tiles (2 and 4) with a soft float.
    const logo = this.add.container(GAME_W / 2, 190);
    const tileA = this.makeLogoTile(-52, 14, 96, 0x22d3ee, 0x0e8fa8, '2');
    const tileB = this.makeLogoTile(46, -14, 96, 0xe9c46a, 0xb8933f, '4', '#2a2140');
    logo.add([tileA, tileB]);
    this.fx.float(logo, 9, 2400);

    this.add
      .text(GAME_W / 2, 318, 'MERGE STACK', {
        fontFamily: FONT,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#f5f7fa',
        stroke: '#22d3ee',
        strokeThickness: 1,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, '#000000', 12, false, true);

    this.add
      .text(GAME_W / 2, 366, 'GỘP · CHUỖI · BÙNG NỔ', {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#22d3ee',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const play = makeButton(this, GAME_W / 2, 470, 'CHƠI NGAY', () => {
      this.cameras.main.fadeOut(220, 5, 7, 13);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
    }, { sfx: sounds, width: 300, height: 84, fontSize: '32px' });
    this.fx.pulse(play, 1.03, 1500);

    makeButton(
      this,
      GAME_W / 2,
      582,
      'HƯỚNG DẪN',
      () => this.scene.start('Game', { showHowTo: true }),
      { sfx: sounds, fill: PALETTE.panelEdge, fillBottom: 0x1b2337, textColor: '#f5f7fa', width: 240, height: 64, fontSize: '24px' },
    );

    const best = loadBest();
    if (best > 0) {
      this.add
        .text(GAME_W / 2, 668, `KỶ LỤC  ${best}`, {
          fontFamily: FONT,
          fontSize: '24px',
          color: '#e9c46a',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setShadow(0, 2, '#000000', 6, false, true);
    }

    this.add
      .text(GAME_W / 2, GAME_H - 22, 'AIH Games · CC0 · chơi offline', {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#5a6472',
      })
      .setOrigin(0.5);
  }

  makeLogoTile(x, y, size, top, bottom, glyph, textColor = '#ffffff') {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black, 0.5);
    g.fillRoundedRect(-size / 2 + 4, -size / 2 + 8, size, size, 20);
    const bands = 10;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(top),
        Phaser.Display.Color.ValueToColor(bottom),
        bands - 1,
        i,
      );
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      const bh = size / bands;
      const by = -size / 2 + i * bh;
      if (i === 0) g.fillRoundedRect(-size / 2, by, size, bh + 18, { tl: 20, tr: 20, bl: 0, br: 0 });
      else if (i === bands - 1) g.fillRoundedRect(-size / 2, by, size, bh, { tl: 0, tr: 0, bl: 20, br: 20 });
      else g.fillRect(-size / 2, by, size, bh + 1);
      void t;
    }
    g.lineStyle(3, 0xffffff, 0.35);
    g.beginPath();
    g.moveTo(-size / 2 + 20, -size / 2 + 3);
    g.lineTo(size / 2 - 20, -size / 2 + 3);
    g.strokePath();
    const txt = this.add
      .text(0, 0, glyph, { fontFamily: FONT, fontSize: `${Math.round(size * 0.48)}px`, color: textColor, fontStyle: 'bold' })
      .setOrigin(0.5);
    c.add([g, txt]);
    return c;
  }
}

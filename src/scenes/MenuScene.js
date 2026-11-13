import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import { makeButton } from '../ui/button.js';
import { loadBest } from '../systems/logic.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(GAME_W / 2, GAME_H * 0.28, 'MERGE\nSTACK', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '64px',
        color: COLORS.textLight,
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, GAME_H * 0.44, 'Gộp số • xếp khối', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);

    makeButton(this, GAME_W / 2, GAME_H * 0.6, 'CHƠI', () => {
      this.scene.start('Game');
    });

    makeButton(
      this,
      GAME_W / 2,
      GAME_H * 0.6 + 100,
      'HƯỚNG DẪN',
      () => this.scene.start('Game', { showHowTo: true }),
      { fill: 0x2a3140, fontSize: '24px', height: 60 },
    );

    const best = loadBest();
    if (best > 0) {
      this.add
        .text(GAME_W / 2, GAME_H * 0.86, `Kỷ lục: ${best}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          color: COLORS.textDim,
        })
        .setOrigin(0.5);
    }

    this.add
      .text(GAME_W / 2, GAME_H - 24, 'Prototype — AIH Games', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#5a6472',
      })
      .setOrigin(0.5);
  }
}

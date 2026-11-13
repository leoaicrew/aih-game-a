import Phaser from 'phaser';
import { ASSET_FILES } from '../assets.js';
import { FONT } from '../config.js';

// Preloads the real 2D art set (37 SVG, CC0 — AIH-21) before the menu opens.
// If any asset fails (404 / bad SVG) we still continue so the game is playable
// with the procedural fallbacks, but we record the failure for QA.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
    this.failed = [];
  }

  preload() {
    const label = this.add
      .text(240, 400, 'ĐANG TẢI…', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#22d3ee',
      })
      .setOrigin(0.5);
    this.load.on('loaderror', (file) => this.failed.push(file?.src ?? 'unknown'));
    this.load.once('complete', () => label.destroy());

    for (const asset of ASSET_FILES) {
      this.load.svg(asset.key, asset.url, { width: asset.width, height: asset.height });
    }
  }

  create() {
    if (this.failed.length) {
      // eslint-disable-next-line no-console
      console.warn('[assets] failed to load:', this.failed);
    }
    if (typeof window !== 'undefined') {
      window.__AIH_ASSETS__ = {
        failed: this.failed.slice(),
        loaded: ASSET_FILES.length - this.failed.length,
        total: ASSET_FILES.length,
      };
    }
    this.scene.start('Menu');
  }
}

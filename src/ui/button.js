import Phaser from 'phaser';
import { COLORS } from '../config.js';

// Simple rounded-rect button drawn with Graphics + Text. Returns a Container.
export function makeButton(scene, x, y, label, onClick, opts = {}) {
  const w = opts.width ?? 260;
  const h = opts.height ?? 72;
  const fill = opts.fill ?? COLORS.accent;
  const radius = opts.radius ?? 18;

  const container = scene.add.container(x, y);

  const g = scene.add.graphics();
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.lineStyle(2, 0xffffff, 0.08);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: opts.fontSize ?? '28px',
      color: COLORS.textLight,
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  container.add([g, text]);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });

  container.on('pointerover', () => container.setScale(1.04));
  container.on('pointerout', () => container.setScale(1));
  container.on('pointerdown', () => container.setScale(0.96));
  container.on('pointerup', () => {
    container.setScale(1.04);
    onClick?.();
  });

  return container;
}

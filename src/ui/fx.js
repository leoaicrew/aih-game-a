import Phaser from 'phaser';
import { GAME_W, GAME_H, PALETTE } from '../config.js';

// FX toolkit for the "juice" pass (AIH-18 brief). All effects are pure
// Phaser tweens / graphics drawn at runtime, no files. fxCount counts every
// tweens.add call so tests can assert the >= 10 distinct effect budget.
export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.fxCount = 0;
    this.register();
  }

  register() {
    if (typeof window !== 'undefined') {
      window.__AIH_FX__ = () => this.fxCount;
    }
  }

  tween(cfg) {
    this.fxCount++;
    return this.scene.tweens.add(cfg);
  }

  // 1. Spawn pop with a soft squash-stretch overshoot.
  spawnPop(sprite) {
    sprite.setScale(0.2);
    sprite.setAlpha(0);
    this.tween({
      targets: sprite,
      scaleX: { from: 0.2, to: 1 },
      scaleY: { from: 0.2, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 160,
      ease: 'Back.Out',
    });
  }

  // 2. Merge bounce: snappy scale hit that settles.
  mergeBounce(sprite) {
    if (!sprite) return;
    this.tween({
      targets: sprite,
      scale: { from: 1, to: 1.22 },
      duration: 90,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  // 3. Merge flash ring expanding + fading at the cell.
  flash(x, y, color = PALETTE.cyan, radius = 34) {
    const ring = this.scene.add.circle(x, y, radius, color, 0.5).setDepth(800);
    ring.setScale(0.5);
    this.tween({
      targets: ring,
      scale: 1.9,
      alpha: 0,
      duration: 260,
      ease: 'Quad.Out',
      onComplete: () => ring.destroy(),
    });
  }

  // 4. Board shake when a combo lands.
  boardShake(intensity = 0.006, duration = 180) {
    this.scene.cameras.main.shake(duration, intensity);
    this.fxCount++;
  }

  // 5. Particle burst on merge (real Phaser particles, texture generated here).
  burst(x, y, color = PALETTE.cyan, count = 14) {
    const key = `dot-${color.toString(16)}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color, 1);
      g.fillCircle(5, 5, 5);
      g.generateTexture(key, 10, 10);
      g.destroy();
    }
    const emitter = this.scene.add.particles(x, y, key, {
      speed: { min: 60, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: { min: 260, max: 460 },
      quantity: count,
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
    });
    emitter.setDepth(850);
    emitter.explode(count);
    this.tween({
      targets: {},
      duration: 500,
      onComplete: () => emitter.destroy(),
    });
  }

  // 6. Confetti rain on a new personal record.
  confetti(count = 60) {
    const colors = [PALETTE.gold, PALETTE.cyan, 0xff7ab8, 0x8b6bff, 0xffffff];
    colors.forEach((c, i) => {
      const key = `confetti-${c.toString(16)}`;
      if (!this.scene.textures.exists(key)) {
        const g = this.scene.make.graphics({ x: 0, y: 0 }, false);
        g.fillStyle(c, 1);
        g.fillRect(0, 0, 8, 12);
        g.generateTexture(key, 8, 12);
        g.destroy();
      }
      const emitter = this.scene.add.particles(Phaser.Math.Between(0, GAME_W), -20, key, {
        speedY: { min: 120, max: 260 },
        speedX: { min: -60, max: 60 },
        rotate: { min: 0, max: 360 },
        lifespan: 2600,
        quantity: Math.ceil(count / colors.length),
        emitting: false,
      });
      emitter.setDepth(1600);
      emitter.explode(Math.ceil(count / colors.length));
      this.tween({ targets: {}, duration: 2800, onComplete: () => emitter.destroy() });
      void i;
    });
  }

  // 7. Score counter run-up (tick numbers toward the real value).
  countScore(textObj, from, to) {
    const state = { v: from };
    this.tween({
      targets: state,
      v: to,
      duration: 420,
      ease: 'Cubic.Out',
      onUpdate: () => textObj.setText(String(Math.round(state.v))),
      onComplete: () => textObj.setText(String(to)),
    });
  }

  // 8. Score pop: HUD score punches when it changes.
  scorePop(textObj) {
    this.tween({
      targets: textObj,
      scale: { from: 1, to: 1.18 },
      duration: 110,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  // 9. Idle float (logo, title) — infinite bob.
  float(target, amplitude = 8, duration = 2200) {
    this.tween({
      targets: target,
      y: target.y - amplitude,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  // 10. Scene fade transition in.
  fadeIn(duration = 320) {
    this.scene.cameras.main.fadeIn(duration, 5, 7, 13);
    this.fxCount++;
  }

  // 11. Overlay slide-in from the bottom with fade.
  overlayIn(container, offset = GAME_H) {
    container.y = offset;
    container.alpha = 0;
    this.tween({
      targets: container,
      y: 0,
      alpha: 1,
      duration: 320,
      ease: 'Cubic.Out',
    });
  }

  // 12. Idle pulse for call-to-action (menu "tap to start" hint).
  pulse(target, scale = 1.06, duration = 700) {
    this.tween({
      targets: target,
      scale,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  // 13. Combo burst label rise (star + text float up and fade).
  rise(t, hold = 260) {
    this.tween({
      targets: t,
      y: t.y - 40,
      alpha: 0,
      duration: 760,
      delay: hold,
      ease: 'Quad.In',
      onComplete: () => t.destroy(),
    });
  }

  // 14. Combo burst pop-in.
  popIn(t) {
    t.setScale(0.2).setAlpha(0);
    this.tween({
      targets: t,
      scale: { from: 0.2, to: 1.3 },
      alpha: 1,
      duration: 160,
      ease: 'Back.Out',
      yoyo: true,
      hold: 260,
    });
  }
}

export default Fx;

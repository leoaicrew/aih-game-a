import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b1020',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800,
  },
  render: {
    antialias: true,
    powerPreference: 'low-power',
  },
  scene: [BootScene, MenuScene, GameScene],
};

const game = new Phaser.Game(config);

// Debug/QA hook: lets the headless smoke test (and devtools) inspect scene state.
if (typeof window !== 'undefined') {
  window.__AIH__ = game;
}

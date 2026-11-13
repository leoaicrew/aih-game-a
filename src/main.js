import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#161a23',
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

new Phaser.Game(config);

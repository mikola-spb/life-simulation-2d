import Phaser from 'phaser';
import GameConfig from './config.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';

/**
 * Main game initialization
 * Sets up Phaser with responsive scaling and cross-platform support
 */

// Calculate responsive dimensions
function getGameDimensions() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = GameConfig.width / GameConfig.height;

  let gameWidth = GameConfig.width;
  let gameHeight = GameConfig.height;

  // Scale to fit screen while maintaining aspect ratio
  if (width / height > aspectRatio) {
    gameHeight = height;
    gameWidth = height * aspectRatio;
  } else {
    gameWidth = width;
    gameHeight = width / aspectRatio;
  }

  return { width: Math.floor(gameWidth), height: Math.floor(gameHeight) };
}

const dimensions = getGameDimensions();

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: '#2d2d2d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GameConfig.gravity },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: dimensions.width,
    height: dimensions.height
  },
  scene: [BootScene, GameScene],
  render: {
    pixelArt: true,
    antialias: false
  }
};

// Initialize game
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  const newDimensions = getGameDimensions();
  game.scale.resize(newDimensions.width, newDimensions.height);
});

// Remove loading screen once game is ready
game.events.once('ready', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.transition = 'opacity 0.5s';
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
});

export default game;
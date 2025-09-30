import Phaser from 'phaser';
import Player from '../entities/Player.js';
import InputController from '../systems/InputController.js';
import SaveSystem from '../systems/SaveSystem.js';

/**
 * GameScene - Main game scene where gameplay happens
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.inputController = null;
    this.saveSystem = null;
    this.autoSaveTimer = null;
  }

  create() {
    // Initialize systems
    this.saveSystem = new SaveSystem();
    this.inputController = new InputController(this);

    // Create world boundaries
    this.physics.world.setBounds(0, 0, 1600, 1200);

    // Create a simple ground/environment
    this.createEnvironment();

    // Create player
    const startX = 400;
    const startY = 300;
    this.player = new Player(this, startX, startY);

    // Try to load saved game
    this.loadGame();

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.setBounds(0, 0, 1600, 1200);

    // Add UI instructions
    this.addInstructions();

    // Set up auto-save (every 30 seconds)
    this.autoSaveTimer = this.time.addEvent({
      delay: 30000,
      callback: this.autoSave,
      callbackScope: this,
      loop: true
    });

    // Save game on page unload
    window.addEventListener('beforeunload', () => {
      this.saveGame();
    });

    // Add keyboard shortcuts
    this.input.keyboard.on('keydown-S', () => {
      if (this.input.keyboard.checkDown(this.input.keyboard.addKey('CTRL'))) {
        this.saveGame();
      }
    });
  }

  /**
   * Create simple environment with visual boundaries
   */
  createEnvironment() {
    // Create ground grid
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x555555, 0.5);

    const gridSize = 100;
    const worldWidth = 1600;
    const worldHeight = 1200;

    // Vertical lines
    for (let x = 0; x <= worldWidth; x += gridSize) {
      graphics.lineBetween(x, 0, x, worldHeight);
    }

    // Horizontal lines
    for (let y = 0; y <= worldHeight; y += gridSize) {
      graphics.lineBetween(0, y, worldWidth, y);
    }

    // Draw world boundaries
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRect(0, 0, worldWidth, worldHeight);

    // Add some placeholder objects for collision testing
    this.createObstacles();
  }

  /**
   * Create simple obstacles for testing collision
   */
  createObstacles() {
    const obstacles = [
      { x: 300, y: 300, width: 100, height: 100, color: 0x8b4513 },
      { x: 800, y: 400, width: 150, height: 80, color: 0x8b4513 },
      { x: 1200, y: 600, width: 120, height: 120, color: 0x8b4513 },
      { x: 600, y: 800, width: 200, height: 60, color: 0x8b4513 }
    ];

    obstacles.forEach(obs => {
      const obstacle = this.add.rectangle(obs.x, obs.y, obs.width, obs.height, obs.color);
      this.physics.add.existing(obstacle, true); // true = static body
      this.physics.add.collider(this.player.sprite, obstacle);
    });
  }

  /**
   * Add on-screen instructions
   */
  addInstructions() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const instructionText = isTouchDevice
      ? 'Touch left side of screen to move'
      : 'Use WASD or Arrow Keys to move\nCtrl+S to save manually';

    const instructions = this.add.text(16, 16, instructionText, {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });
    instructions.setScrollFactor(0);
    instructions.setDepth(100);

    // Add save indicator
    this.saveIndicator = this.add.text(16, 80, '', {
      font: '14px Arial',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.saveIndicator.setScrollFactor(0);
    this.saveIndicator.setDepth(100);
    this.saveIndicator.setVisible(false);
  }

  /**
   * Update game state
   */
  update() {
    if (!this.player || !this.inputController) {
      return;
    }

    // Get input direction
    const direction = this.inputController.update();

    // Move player based on input
    if (direction.x !== 0 || direction.y !== 0) {
      this.player.move(direction.x, direction.y);
    } else {
      this.player.stop();
    }

    // Update player
    this.player.update();
  }

  /**
   * Save current game state
   */
  saveGame() {
    const gameState = {
      player: this.player.getSaveData(),
      timestamp: Date.now()
    };

    const success = this.saveSystem.save(gameState);

    if (success) {
      this.showSaveIndicator('Game Saved!');
    } else {
      this.showSaveIndicator('Save Failed!', 0xff0000);
    }
  }

  /**
   * Load saved game state
   */
  loadGame() {
    const gameState = this.saveSystem.load();

    if (gameState && gameState.player) {
      this.player.loadSaveData(gameState.player);
      console.log('Game loaded from save');
    }
  }

  /**
   * Auto-save callback
   */
  autoSave() {
    this.saveGame();
  }

  /**
   * Show save indicator feedback
   */
  showSaveIndicator(text, color = 0x00ff00) {
    if (!this.saveIndicator) return;

    this.saveIndicator.setText(text);
    this.saveIndicator.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.saveIndicator.setVisible(true);

    // Hide after 2 seconds
    this.time.delayedCall(2000, () => {
      this.saveIndicator.setVisible(false);
    });
  }

  /**
   * Clean up scene
   */
  shutdown() {
    // Save game on shutdown
    this.saveGame();

    // Clean up resources
    if (this.inputController) {
      this.inputController.destroy();
    }
    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove();
    }
  }
}
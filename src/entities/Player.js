import Phaser from 'phaser';
import GameConfig from '../config.js';
import Appearance from './Appearance.js';
import SpriteGenerator from '../utils/SpriteGenerator.js';

/**
 * Player Entity
 * Handles player character creation, movement, and animations
 */
export default class Player {
  constructor(scene, x, y, appearanceConfig = null) {
    this.scene = scene;

    // Create appearance
    this.appearance = appearanceConfig ? new Appearance(appearanceConfig) : new Appearance();

    // Create layered character sprite using SpriteGenerator
    this.sprite = SpriteGenerator.createCharacter(scene, x, y, this.appearance);
    scene.physics.add.existing(this.sprite);

    // Configure physics
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setSize(GameConfig.player.size, GameConfig.player.size + 16);

    // Player state
    this.speed = GameConfig.player.speed;
    this.isMoving = false;
    this.direction = { x: 0, y: 0 };

    // Create direction indicator
    this.directionIndicator = SpriteGenerator.createDirectionIndicator(scene, x, y);
  }

  /**
   * Update player position and state
   */
  update() {
    // Update direction indicator position
    this.directionIndicator.x = this.sprite.x;
    this.directionIndicator.y = this.sprite.y - 30;

    // Rotate direction indicator based on movement
    if (this.isMoving) {
      const angle = Math.atan2(this.direction.y, this.direction.x);
      this.directionIndicator.rotation = angle + Math.PI / 2;
    }
  }

  /**
   * Move player in specified direction
   * @param {number} x - X direction (-1 to 1)
   * @param {number} y - Y direction (-1 to 1)
   */
  move(x, y) {
    this.direction.x = x;
    this.direction.y = y;

    // Normalize diagonal movement
    const length = Math.sqrt(x * x + y * y);
    if (length > 0) {
      this.direction.x /= length;
      this.direction.y /= length;
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // Apply velocity
    this.sprite.body.setVelocity(
      this.direction.x * this.speed,
      this.direction.y * this.speed
    );
  }

  /**
   * Stop player movement
   */
  stop() {
    this.sprite.body.setVelocity(0, 0);
    this.isMoving = false;
  }

  /**
   * Get player position
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Set player position
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  /**
   * Update character appearance
   * @param {Appearance} appearance
   */
  updateAppearance(appearance) {
    this.appearance = appearance;
    SpriteGenerator.updateAppearance(this.sprite, appearance);
  }

  /**
   * Get player data for saving
   * @returns {object}
   */
  getSaveData() {
    return {
      x: this.sprite.x,
      y: this.sprite.y,
      appearance: this.appearance.getSaveData()
    };
  }

  /**
   * Load player data from save
   * @param {object} data
   */
  loadSaveData(data) {
    if (data.x !== undefined && data.y !== undefined) {
      this.setPosition(data.x, data.y);
    }
    if (data.appearance) {
      this.appearance.loadSaveData(data.appearance);
      this.updateAppearance(this.appearance);
    }
  }

  /**
   * Clean up player resources
   */
  destroy() {
    this.sprite.destroy();
    this.directionIndicator.destroy();
  }
}
import Appearance from './Appearance.js';
import SpriteGenerator from '../utils/SpriteGenerator.js';

/**
 * NPC Entity
 * Non-player character with AI behavior and dialog support
 */
export default class NPC {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.name = config.name || 'NPC';
    this.npcId = config.id || this.name.toLowerCase().replace(/\s+/g, '_');

    // Create appearance
    this.appearance = config.appearance instanceof Appearance
      ? config.appearance
      : new Appearance(config.appearance);

    // Create layered character sprite using SpriteGenerator
    this.sprite = SpriteGenerator.createCharacter(scene, x, y, this.appearance);
    scene.physics.add.existing(this.sprite);

    // Configure physics (static by default, can be dynamic for wandering NPCs)
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setSize(32, 48);
    this.sprite.body.setImmovable(true); // NPCs don't get pushed by player

    // Dialog data
    this.dialog = config.dialog || [];

    // Behavior system
    this.behavior = config.behavior || 'idle'; // idle, wander
    this.wanderSpeed = config.wanderSpeed || 50;
    this.wanderChangeInterval = config.wanderChangeInterval || 3000; // ms
    this.wanderTimer = 0;
    this.wanderDirection = { x: 0, y: 0 };
    this.wanderBounds = config.wanderBounds || null; // Optional bounds for wander area

    // State
    this.isInteracting = false;
  }

  /**
   * Update NPC behavior
   * @param {number} time - Current game time
   * @param {number} delta - Time since last frame
   */
  update(time, delta) {
    if (this.isInteracting) {
      // Stop moving during interaction
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    switch (this.behavior) {
      case 'wander':
        this.updateWanderBehavior(time, delta);
        break;
      case 'idle':
      default:
        this.sprite.body.setVelocity(0, 0);
        break;
    }
  }

  /**
   * Update wander behavior
   * @param {number} time
   * @param {number} delta
   */
  updateWanderBehavior(time, delta) {
    this.wanderTimer += delta;

    // Change direction periodically
    if (this.wanderTimer >= this.wanderChangeInterval) {
      this.wanderTimer = 0;
      this.chooseNewWanderDirection();
    }

    // Apply movement
    if (this.wanderDirection.x !== 0 || this.wanderDirection.y !== 0) {
      this.sprite.body.setVelocity(
        this.wanderDirection.x * this.wanderSpeed,
        this.wanderDirection.y * this.wanderSpeed
      );
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    // Check wander bounds
    if (this.wanderBounds) {
      const pos = this.getPosition();
      if (pos.x < this.wanderBounds.x ||
          pos.x > this.wanderBounds.x + this.wanderBounds.width ||
          pos.y < this.wanderBounds.y ||
          pos.y > this.wanderBounds.y + this.wanderBounds.height) {
        // Turn around if outside bounds
        this.wanderDirection.x *= -1;
        this.wanderDirection.y *= -1;
      }
    }
  }

  /**
   * Choose a new random wander direction
   */
  chooseNewWanderDirection() {
    const directions = [
      { x: 0, y: 0 },   // Idle
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 },  // Left
      { x: 0, y: 1 },   // Down
      { x: 0, y: -1 },  // Up
      { x: 0.7, y: 0.7 },   // Diagonal down-right
      { x: -0.7, y: 0.7 },  // Diagonal down-left
      { x: 0.7, y: -0.7 },  // Diagonal up-right
      { x: -0.7, y: -0.7 }  // Diagonal up-left
    ];

    const chosen = directions[Math.floor(Math.random() * directions.length)];
    this.wanderDirection = { ...chosen };
  }

  /**
   * Start interaction (called when player interacts)
   */
  startInteraction() {
    this.isInteracting = true;
    this.sprite.body.setVelocity(0, 0);
  }

  /**
   * End interaction
   */
  endInteraction() {
    this.isInteracting = false;
  }

  /**
   * Get NPC position
   * @returns {{x: number, y: number}}
   */
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Set NPC position
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  /**
   * Get dialog data
   * @returns {array}
   */
  getDialog() {
    return this.dialog;
  }

  /**
   * Set dialog data
   * @param {array} dialog
   */
  setDialog(dialog) {
    this.dialog = dialog;
  }

  /**
   * Get NPC name
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Get NPC ID
   * @returns {string}
   */
  getId() {
    return this.npcId;
  }

  /**
   * Set behavior
   * @param {string} behavior - 'idle' or 'wander'
   */
  setBehavior(behavior) {
    this.behavior = behavior;
  }

  /**
   * Get behavior
   * @returns {string}
   */
  getBehavior() {
    return this.behavior;
  }

  /**
   * Check if NPC is near a position
   * @param {object} position - {x, y}
   * @param {number} distance - Detection distance
   * @returns {boolean}
   */
  isNearPosition(position, distance = 60) {
    const npcPos = this.getPosition();
    const dx = npcPos.x - position.x;
    const dy = npcPos.y - position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < distance;
  }

  /**
   * Clean up NPC resources
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}

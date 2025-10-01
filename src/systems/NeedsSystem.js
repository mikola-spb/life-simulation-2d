import GameConfig from '../config.js';

/**
 * NeedsSystem - Manages player's needs (hunger, energy) and applies consequences
 *
 * Handles:
 * - Time-based degradation of needs
 * - Speed penalties when needs are low
 * - Save/load state
 */
export default class NeedsSystem {
  /**
   * Create a new needs system
   * @param {Phaser.Scene} scene - The game scene
   * @param {Player} player - The player entity
   */
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // Need values (0-100, 100 is full)
    this.hunger = GameConfig.needs.maxValue;
    this.energy = GameConfig.needs.maxValue;

    // Cache config values for performance
    this.hungerDecayRate = GameConfig.needs.hungerDecayRate;
    this.energyDecayRate = GameConfig.needs.energyDecayRate;
    this.lowThreshold = GameConfig.needs.lowThreshold;
    this.speedPenalty = GameConfig.needs.speedPenalty;
    this.maxValue = GameConfig.needs.maxValue;
    this.minValue = GameConfig.needs.minValue;

    // Track base player speed (unmodified)
    this.basePlayerSpeed = this.player.speed;

    // Current speed modifier (1.0 = normal, 0.7 = 30% slower)
    this.currentSpeedModifier = 1.0;
  }

  /**
   * Update needs system - degrade needs and apply consequences
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update (ms)
   */
  update(time, delta) {
    // Convert delta from milliseconds to seconds
    const deltaSeconds = delta / 1000;

    // Degrade needs over time
    this.hunger -= this.hungerDecayRate * deltaSeconds;
    this.energy -= this.energyDecayRate * deltaSeconds;

    // Clamp values to valid range
    this.hunger = Math.max(this.minValue, Math.min(this.maxValue, this.hunger));
    this.energy = Math.max(this.minValue, Math.min(this.maxValue, this.energy));

    // Apply consequences based on current needs
    this.applyConsequences();
  }

  /**
   * Apply consequences for low needs
   * Low hunger and/or low energy reduce player speed
   */
  applyConsequences() {
    let speedModifier = 1.0;

    // Check if hunger is low
    const isHungry = this.hunger < this.lowThreshold;
    // Check if energy is low
    const isTired = this.energy < this.lowThreshold;

    // Apply stacking penalties
    if (isHungry) {
      speedModifier -= this.speedPenalty;
    }
    if (isTired) {
      speedModifier -= this.speedPenalty;
    }

    // Update player speed if modifier changed
    if (speedModifier !== this.currentSpeedModifier) {
      this.currentSpeedModifier = speedModifier;
      this.player.speed = this.basePlayerSpeed * speedModifier;
    }
  }

  /**
   * Add hunger (e.g., from eating food)
   * @param {number} amount - Amount to add
   */
  addHunger(amount) {
    this.hunger = Math.min(this.maxValue, this.hunger + amount);
  }

  /**
   * Add energy (e.g., from sleeping)
   * @param {number} amount - Amount to add
   */
  addEnergy(amount) {
    this.energy = Math.min(this.maxValue, this.energy + amount);
  }

  /**
   * Remove hunger (for testing or specific game events)
   * @param {number} amount - Amount to remove
   */
  removeHunger(amount) {
    this.hunger = Math.max(this.minValue, this.hunger - amount);
  }

  /**
   * Remove energy (for testing or specific game events)
   * @param {number} amount - Amount to remove
   */
  removeEnergy(amount) {
    this.energy = Math.max(this.minValue, this.energy - amount);
  }

  /**
   * Get current hunger value
   * @returns {number} Hunger (0-100)
   */
  getHunger() {
    return this.hunger;
  }

  /**
   * Get current energy value
   * @returns {number} Energy (0-100)
   */
  getEnergy() {
    return this.energy;
  }

  /**
   * Check if hunger is low (below threshold)
   * @returns {boolean}
   */
  isHungry() {
    return this.hunger < this.lowThreshold;
  }

  /**
   * Check if energy is low (below threshold)
   * @returns {boolean}
   */
  isTired() {
    return this.energy < this.lowThreshold;
  }

  /**
   * Get current speed modifier
   * @returns {number} Speed modifier (1.0 = normal, 0.4 = 60% slower)
   */
  getSpeedModifier() {
    return this.currentSpeedModifier;
  }

  /**
   * Get save data
   * @returns {object}
   */
  getSaveData() {
    return {
      hunger: this.hunger,
      energy: this.energy
    };
  }

  /**
   * Load save data
   * @param {object} data
   */
  loadSaveData(data) {
    if (data.hunger !== undefined) {
      this.hunger = Math.max(this.minValue, Math.min(this.maxValue, data.hunger));
    }
    if (data.energy !== undefined) {
      this.energy = Math.max(this.minValue, Math.min(this.maxValue, data.energy));
    }
    // Reapply consequences after loading
    this.applyConsequences();
  }

  /**
   * Reset needs to full (for testing or game events)
   */
  reset() {
    this.hunger = this.maxValue;
    this.energy = this.maxValue;
    this.currentSpeedModifier = 1.0;
    this.player.speed = this.basePlayerSpeed;
  }
}

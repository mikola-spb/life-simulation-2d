import Phaser from 'phaser';
import GameConfig from '../config.js';

/**
 * NeedsUI - Visual UI for displaying player needs (hunger, energy)
 *
 * Creates bars showing:
 * - Hunger level with icon
 * - Energy level with icon
 * - Color coding based on thresholds (green > yellow > red)
 */
export default class NeedsUI {
  /**
   * Create needs UI
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;

    // Configuration
    this.barWidth = 150;
    this.barHeight = 20;
    this.barSpacing = 8;
    this.x = 16; // Left padding
    this.y = 50; // Below instructions

    // Color thresholds
    this.colors = {
      high: 0x00ff00,    // Green (>60%)
      medium: 0xffff00,  // Yellow (30-60%)
      low: 0xff0000      // Red (<30%)
    };
    this.backgroundColor = 0x333333;

    // Create container for UI elements
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0); // Fixed to camera
    this.container.setDepth(100); // Above game world

    // Create UI elements
    this.createHungerBar();
    this.createEnergyBar();
  }

  /**
   * Create hunger bar UI
   */
  createHungerBar() {
    const y = this.y;

    // Icon/Label
    this.hungerLabel = this.scene.add.text(this.x, y, '🍖 Hunger:', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.hungerLabel.setScrollFactor(0);
    this.hungerLabel.setDepth(100);

    // Background bar
    this.hungerBgBar = this.scene.add.rectangle(
      this.x + 90,
      y + 8,
      this.barWidth,
      this.barHeight,
      this.backgroundColor
    );
    this.hungerBgBar.setOrigin(0, 0.5);
    this.hungerBgBar.setScrollFactor(0);
    this.hungerBgBar.setDepth(100);

    // Foreground bar (actual value)
    this.hungerBar = this.scene.add.rectangle(
      this.x + 90,
      y + 8,
      this.barWidth,
      this.barHeight,
      this.colors.high
    );
    this.hungerBar.setOrigin(0, 0.5);
    this.hungerBar.setScrollFactor(0);
    this.hungerBar.setDepth(101);

    // Percentage text
    this.hungerText = this.scene.add.text(this.x + 250, y, '100%', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.hungerText.setScrollFactor(0);
    this.hungerText.setDepth(100);

    // Add to container
    this.container.add([this.hungerLabel, this.hungerBgBar, this.hungerBar, this.hungerText]);
  }

  /**
   * Create energy bar UI
   */
  createEnergyBar() {
    const y = this.y + this.barHeight + this.barSpacing + 8;

    // Icon/Label
    this.energyLabel = this.scene.add.text(this.x, y, '⚡ Energy:', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.energyLabel.setScrollFactor(0);
    this.energyLabel.setDepth(100);

    // Background bar
    this.energyBgBar = this.scene.add.rectangle(
      this.x + 90,
      y + 8,
      this.barWidth,
      this.barHeight,
      this.backgroundColor
    );
    this.energyBgBar.setOrigin(0, 0.5);
    this.energyBgBar.setScrollFactor(0);
    this.energyBgBar.setDepth(100);

    // Foreground bar (actual value)
    this.energyBar = this.scene.add.rectangle(
      this.x + 90,
      y + 8,
      this.barWidth,
      this.barHeight,
      this.colors.high
    );
    this.energyBar.setOrigin(0, 0.5);
    this.energyBar.setScrollFactor(0);
    this.energyBar.setDepth(101);

    // Percentage text
    this.energyText = this.scene.add.text(this.x + 250, y, '100%', {
      font: '14px Arial',
      fill: '#ffffff'
    });
    this.energyText.setScrollFactor(0);
    this.energyText.setDepth(100);

    // Add to container
    this.container.add([this.energyLabel, this.energyBgBar, this.energyBar, this.energyText]);
  }

  /**
   * Update UI with current need values
   * @param {number} hunger - Hunger value (0-100)
   * @param {number} energy - Energy value (0-100)
   */
  update(hunger, energy) {
    this.updateHungerBar(hunger);
    this.updateEnergyBar(energy);
  }

  /**
   * Update hunger bar
   * @param {number} value - Hunger value (0-100)
   */
  updateHungerBar(value) {
    // Clamp value
    const clampedValue = Math.max(0, Math.min(100, value));

    // Calculate bar width
    const width = (clampedValue / 100) * this.barWidth;
    this.hungerBar.width = width;

    // Update color based on threshold
    const color = this.getColorForValue(clampedValue);
    this.hungerBar.setFillStyle(color);

    // Update percentage text
    this.hungerText.setText(`${Math.round(clampedValue)}%`);
  }

  /**
   * Update energy bar
   * @param {number} value - Energy value (0-100)
   */
  updateEnergyBar(value) {
    // Clamp value
    const clampedValue = Math.max(0, Math.min(100, value));

    // Calculate bar width
    const width = (clampedValue / 100) * this.barWidth;
    this.energyBar.width = width;

    // Update color based on threshold
    const color = this.getColorForValue(clampedValue);
    this.energyBar.setFillStyle(color);

    // Update percentage text
    this.energyText.setText(`${Math.round(clampedValue)}%`);
  }

  /**
   * Get color based on value
   * @param {number} value - Need value (0-100)
   * @returns {number} Color hex value
   */
  getColorForValue(value) {
    if (value > 60) {
      return this.colors.high;    // Green
    } else if (value >= 30) {
      return this.colors.medium;  // Yellow
    } else {
      return this.colors.low;     // Red
    }
  }

  /**
   * Show the UI
   */
  show() {
    this.container.setVisible(true);
  }

  /**
   * Hide the UI
   */
  hide() {
    this.container.setVisible(false);
  }

  /**
   * Check if UI is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.container.visible;
  }

  /**
   * Clean up UI resources
   */
  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

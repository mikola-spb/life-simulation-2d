import Phaser from 'phaser';

/**
 * TimeUI - Visual UI for displaying current game time and day
 *
 * Shows:
 * - Current day number
 * - Current time (HH:MM format)
 * - Positioned in top-right corner
 */
export default class TimeUI {
  /**
   * Create time UI
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;

    // Configuration
    this.padding = 20; // Right/top padding from screen edge
    this.fontSize = 18;
    this.fontFamily = 'Arial';

    // Colors
    this.textColor = '#ffffff';
    this.backgroundColor = '#000000';
    this.backgroundAlpha = 0.7;

    // Create container for UI elements
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0); // Fixed to camera
    this.container.setDepth(100); // Above game world

    // Create UI elements
    this.createTimeDisplay();

    // Position in top-right corner
    this.updatePosition();
  }

  /**
   * Create time display UI
   */
  createTimeDisplay() {
    // Create text element
    this.timeText = this.scene.add.text(0, 0, 'Day 1 - 08:00', {
      font: `bold ${this.fontSize}px ${this.fontFamily}`,
      fill: this.textColor,
      backgroundColor: this.backgroundColor,
      padding: { x: 12, y: 8 }
    });
    this.timeText.setOrigin(1, 0); // Top-right origin for right alignment
    this.timeText.setScrollFactor(0);
    this.timeText.setDepth(100);
    this.timeText.setAlpha(this.backgroundAlpha);

    // Add to container
    this.container.add(this.timeText);
  }

  /**
   * Update position based on camera size
   * Position in top-right corner
   */
  updatePosition() {
    const camera = this.scene.cameras.main;
    const x = camera.width - this.padding;
    const y = this.padding;

    // Update text position
    if (this.timeText) {
      this.timeText.setPosition(x, y);
    }
  }

  /**
   * Update UI with current time
   * @param {number} day - Current day number
   * @param {string} timeString - Formatted time string (e.g., "08:30")
   */
  update(day, timeString) {
    if (this.timeText) {
      this.timeText.setText(`Day ${day} - ${timeString}`);
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
    this.timeText = null;
  }
}

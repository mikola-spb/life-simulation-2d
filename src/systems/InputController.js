import Phaser from 'phaser';

/**
 * InputController
 * Unified input handling for keyboard, mouse, and touch controls
 */
export default class InputController {
  constructor(scene) {
    this.scene = scene;

    // Input state
    this.direction = { x: 0, y: 0 };

    // Keyboard controls
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Virtual joystick for touch controls
    this.joystick = null;
    this.joystickBase = null;
    this.joystickThumb = null;
    this.joystickActive = false;
    this.joystickRadius = 50;

    // Check if device supports touch
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (this.isTouchDevice) {
      this.setupVirtualJoystick();
    }
  }

  /**
   * Set up virtual joystick for touch devices
   */
  setupVirtualJoystick() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Create joystick graphics
    this.joystickBase = this.scene.add.circle(
      100,
      height - 100,
      this.joystickRadius,
      0x000000,
      0.3
    );
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(1000);
    this.joystickBase.setVisible(false);

    this.joystickThumb = this.scene.add.circle(
      100,
      height - 100,
      this.joystickRadius / 2,
      0x4a9eff,
      0.8
    );
    this.joystickThumb.setScrollFactor(0);
    this.joystickThumb.setDepth(1001);
    this.joystickThumb.setVisible(false);

    // Touch input handlers
    this.scene.input.on('pointerdown', this.onTouchStart, this);
    this.scene.input.on('pointermove', this.onTouchMove, this);
    this.scene.input.on('pointerup', this.onTouchEnd, this);
  }

  /**
   * Handle touch start
   */
  onTouchStart(pointer) {
    if (pointer.x < this.scene.cameras.main.width / 2) {
      // Left side of screen - joystick
      this.joystickActive = true;
      this.joystickBase.setPosition(pointer.x, pointer.y);
      this.joystickThumb.setPosition(pointer.x, pointer.y);
      this.joystickBase.setVisible(true);
      this.joystickThumb.setVisible(true);
    }
  }

  /**
   * Handle touch move
   */
  onTouchMove(pointer) {
    if (this.joystickActive) {
      const dx = pointer.x - this.joystickBase.x;
      const dy = pointer.y - this.joystickBase.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.joystickRadius) {
        // Limit thumb to joystick radius
        const angle = Math.atan2(dy, dx);
        this.joystickThumb.x = this.joystickBase.x + Math.cos(angle) * this.joystickRadius;
        this.joystickThumb.y = this.joystickBase.y + Math.sin(angle) * this.joystickRadius;
      } else {
        this.joystickThumb.setPosition(pointer.x, pointer.y);
      }

      // Calculate direction
      this.direction.x = (this.joystickThumb.x - this.joystickBase.x) / this.joystickRadius;
      this.direction.y = (this.joystickThumb.y - this.joystickBase.y) / this.joystickRadius;
    }
  }

  /**
   * Handle touch end
   */
  onTouchEnd() {
    if (this.joystickActive) {
      this.joystickActive = false;
      this.joystickBase.setVisible(false);
      this.joystickThumb.setVisible(false);
      this.direction.x = 0;
      this.direction.y = 0;
    }
  }

  /**
   * Update input state
   * Called every frame to check keyboard and touch input
   */
  update() {
    // If joystick is active, use its direction
    if (this.joystickActive) {
      return this.direction;
    }

    // Otherwise, check keyboard input
    let x = 0;
    let y = 0;

    // Arrow keys or WASD
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      x = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      x = 1;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      y = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      y = 1;
    }

    this.direction.x = x;
    this.direction.y = y;

    return this.direction;
  }

  /**
   * Get current input direction
   * @returns {{x: number, y: number}}
   */
  getDirection() {
    return this.direction;
  }

  /**
   * Check if interact key was just pressed
   * @returns {boolean}
   */
  isInteractPressed() {
    return Phaser.Input.Keyboard.JustDown(this.interactKey);
  }

  /**
   * Clean up input controller
   */
  destroy() {
    if (this.joystickBase) {
      this.joystickBase.destroy();
    }
    if (this.joystickThumb) {
      this.joystickThumb.destroy();
    }
    this.scene.input.off('pointerdown', this.onTouchStart, this);
    this.scene.input.off('pointermove', this.onTouchMove, this);
    this.scene.input.off('pointerup', this.onTouchEnd, this);
  }
}
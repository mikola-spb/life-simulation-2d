import Phaser from 'phaser';

/**
 * SpriteGenerator
 * Utility for creating programmatic character sprites
 * This is a placeholder until proper sprite assets are created
 */
export default class SpriteGenerator {
  /**
   * Create a layered character sprite
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Appearance} appearance
   * @returns {Phaser.GameObjects.Container}
   */
  static createCharacter(scene, x, y, appearance) {
    const container = scene.add.container(x, y);

    // Character dimensions
    const width = 32;
    const height = 48;

    // Layer 1: Body (legs/pants)
    const legs = scene.add.rectangle(0, height / 4, width * 0.6, height / 2, appearance.pantsColor);
    legs.setStrokeStyle(2, 0x000000);

    // Layer 2: Torso (shirt)
    const torso = scene.add.rectangle(0, 0, width * 0.8, height / 2.5, appearance.shirtColor);
    torso.setStrokeStyle(2, 0x000000);

    // Layer 3: Head (skin)
    const head = scene.add.circle(0, -height / 3, width * 0.4, appearance.skinTone);
    head.setStrokeStyle(2, 0x000000);

    // Layer 4: Hair
    const hair = scene.add.ellipse(0, -height / 2.5, width * 0.45, height / 4, appearance.hairColor);
    hair.setStrokeStyle(2, 0x000000);

    // Layer 5: Eyes
    const leftEye = scene.add.circle(-width * 0.15, -height / 3, 3, 0x000000);
    const rightEye = scene.add.circle(width * 0.15, -height / 3, 3, 0x000000);

    // Add all layers to container (order matters for z-index)
    container.add([legs, torso, head, hair, leftEye, rightEye]);

    return container;
  }

  /**
   * Update character appearance
   * @param {Phaser.GameObjects.Container} container
   * @param {Appearance} appearance
   */
  static updateAppearance(container, appearance) {
    if (!container || !container.list) return;

    const [legs, torso, head, hair] = container.list;

    if (legs) legs.setFillStyle(appearance.pantsColor);
    if (torso) torso.setFillStyle(appearance.shirtColor);
    if (head) head.setFillStyle(appearance.skinTone);
    if (hair) hair.setFillStyle(appearance.hairColor);
  }

  /**
   * Create a direction indicator for the character
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @returns {Phaser.GameObjects.Triangle}
   */
  static createDirectionIndicator(scene, x, y) {
    return scene.add.triangle(
      x,
      y - 30,
      0, 0,
      -5, 10,
      5, 10,
      0xffffff
    );
  }
}

import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Player Interaction
 * Verifies player movement and input handling in the browser
 */

test.describe('Player Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to fully initialize
    await page.waitForTimeout(2000);
  });

  test('should move player with keyboard input', async ({ page }) => {
    // Get initial player position
    const initialPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (!scene || !scene.player) return null;
      return scene.player.getPosition();
    });

    expect(initialPosition).not.toBeNull();
    expect(initialPosition.x).toBeDefined();
    expect(initialPosition.y).toBeDefined();

    // Simulate key press (move right)
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500); // Wait for movement
    await page.keyboard.up('ArrowRight');

    // Get new position
    const newPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (!scene || !scene.player) return null;
      return scene.player.getPosition();
    });

    // Player should have moved to the right
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
  });

  test('should move player with WASD keys', async ({ page }) => {
    // Get initial player position
    const initialPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Simulate W key (move up)
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');

    // Get new position
    const newPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Player should have moved up (y decreased)
    expect(newPosition.y).toBeLessThan(initialPosition.y);
  });

  test('should handle diagonal movement', async ({ page }) => {
    const initialPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Press both keys for diagonal movement
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('ArrowDown');

    const newPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Player should have moved both right and down
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBeGreaterThan(initialPosition.y);
  });

  test('should stop player when no keys are pressed', async ({ page }) => {
    // Move player
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');

    // Wait a bit after releasing key
    await page.waitForTimeout(200);

    // Check that player has stopped
    const isMoving = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.isMoving;
    });

    expect(isMoving).toBe(false);
  });

  test('should respect world boundaries', async ({ page }) => {
    // Try to move player far to the left (should hit boundary)
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    await page.waitForTimeout(1000);

    const position = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Player should not be at negative coordinates (world boundary at 0)
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
  });

  test('should update player direction indicator', async ({ page }) => {
    // Get initial state
    const initialState = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        position: scene.player.getPosition(),
        directionIndicator: scene.player.directionIndicator
      };
    });

    expect(initialState.directionIndicator).toBeDefined();

    // Move player to trigger direction update
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowUp');

    // Direction indicator should still exist and be updated
    const hasIndicator = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.directionIndicator !== undefined;
    });

    expect(hasIndicator).toBe(true);
  });
});

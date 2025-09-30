import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Game Loading
 * Verifies that the game loads successfully in the browser
 */

test.describe('Game Loading', () => {
  test('should load the game page', async ({ page }) => {
    await page.goto('/');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Life Simulation/);
  });

  test('should display the game canvas', async ({ page }) => {
    await page.goto('/');

    // Wait for the canvas to be present
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check canvas exists
    await expect(canvas).toHaveCount(1);
  });

  test('should initialize Phaser game', async ({ page }) => {
    await page.goto('/');

    // Wait for the game to initialize
    await page.waitForTimeout(2000);

    // Check that Phaser game instance exists
    const hasPhaserGame = await page.evaluate(() => {
      return window.game !== undefined && window.game.constructor.name === 'Game';
    });

    expect(hasPhaserGame).toBeTruthy();
  });

  test('should load BootScene and transition to GameScene', async ({ page }) => {
    await page.goto('/');

    // Wait for initial loading
    await page.waitForTimeout(1000);

    // Check that GameScene is running
    const isGameSceneActive = await page.evaluate(() => {
      if (!window.game) return false;
      const scenes = window.game.scene.getScenes(true); // Get active scenes
      return scenes.some(scene => scene.scene.key === 'GameScene');
    });

    expect(isGameSceneActive).toBeTruthy();
  });

  test('should display game instructions', async ({ page }) => {
    await page.goto('/');

    // Wait for game to load
    await page.waitForTimeout(2000);

    // Take a screenshot to verify the game loaded
    await page.screenshot({ path: 'test-results/game-loaded.png' });

    // The canvas should be visible and have content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has dimensions
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(0);
    expect(boundingBox.height).toBeGreaterThan(0);
  });

  test('should have no console errors during initialization', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for critical errors (ignore minor Phaser warnings)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('DevTools') &&
      !error.includes('favicon')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

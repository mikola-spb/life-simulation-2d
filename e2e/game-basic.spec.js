import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Basic Game Functionality (Phase 1)
 * Tests critical browser features: loading, rendering, basic interaction, and save/load
 */

test.describe('Phase 1: Basic Game Functionality', () => {
  test('Phase 1: Game loads successfully in browser', async ({ page }) => {
    // Navigate to the game
    await page.goto('/');

    // Check page loaded with correct title
    await expect(page).toHaveTitle(/Life Simulation/);

    // Wait for canvas to appear
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verify canvas is rendered
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox.width).toBeGreaterThan(0);
    expect(boundingBox.height).toBeGreaterThan(0);

    console.log('✅ Game loaded successfully');
  });

  test('Phase 1: Game initializes and starts rendering', async ({ page }) => {
    await page.goto('/');

    // Wait for canvas
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Wait for game to initialize
    await page.waitForFunction(() => window.game !== undefined, { timeout: 10000 });

    // Check that game object exists
    const gameExists = await page.evaluate(() => {
      return typeof window.game !== 'undefined';
    });

    expect(gameExists).toBe(true);

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });

    console.log('✅ Game initialized successfully');
  });

  test('Phase 1: Player can move with keyboard input', async ({ page }) => {
    await page.goto('/');

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });

    // Wait additional time for scene to fully load
    await page.waitForTimeout(2000);

    // Get initial player position
    const initialPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (!scene || !scene.player) {
        console.error('Scene or player not found');
        return null;
      }
      return {
        x: scene.player.sprite.x,
        y: scene.player.sprite.y
      };
    });

    expect(initialPosition).not.toBeNull();
    console.log('Initial position:', initialPosition);

    // Press arrow key to move right
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000); // Hold key for 1 second
    await page.keyboard.up('ArrowRight');

    // Wait for movement to register
    await page.waitForTimeout(500);

    // Get new position
    const newPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        x: scene.player.sprite.x,
        y: scene.player.sprite.y
      };
    });

    console.log('New position:', newPosition);

    // Player should have moved to the right
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);

    console.log('✅ Player movement works');
  });

  test('Phase 1: Game can save state to localStorage', async ({ page }) => {
    await page.goto('/');

    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Move player to create a saveable state
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);

    // Get position before save
    const positionBeforeSave = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        x: scene.player.sprite.x,
        y: scene.player.sprite.y
      };
    });

    console.log('Position before save:', positionBeforeSave);

    // Trigger manual save
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(1000);

    // Check localStorage has save data
    const saveData = await page.evaluate(() => {
      return localStorage.getItem('lifesim_save_v1');
    });

    expect(saveData).not.toBeNull();

    const parsedSave = JSON.parse(saveData);
    console.log('Save data:', parsedSave);

    expect(parsedSave.version).toBe('1.0.0');
    expect(parsedSave.data.player).toBeDefined();

    console.log('✅ Save system works');
  });

  test('Phase 1: Game loads saved state from localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Wait for game ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Move to a specific position
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);

    // Get position and save
    const savedPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        x: scene.player.sprite.x,
        y: scene.player.sprite.y
      };
    });

    console.log('Saved position:', savedPosition);

    // Save the game
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();

    // Wait for game to load again
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check loaded position
    const loadedPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        x: scene.player.sprite.x,
        y: scene.player.sprite.y
      };
    });

    console.log('Loaded position:', loadedPosition);

    // Positions should match (allow small variance for physics)
    expect(Math.abs(loadedPosition.x - savedPosition.x)).toBeLessThan(5);
    expect(Math.abs(loadedPosition.y - savedPosition.y)).toBeLessThan(5);

    console.log('✅ Load system works');
  });
});

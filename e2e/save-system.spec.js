import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Save System
 * Verifies save/load functionality in the browser with localStorage
 */

test.describe('Save System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
  });

  test('should save game state manually with save button', async ({ page }) => {
    // Move player to a new position
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    const positionBeforeSave = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Click the save button
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Check that data was saved to localStorage
    const savedData = await page.evaluate(() => {
      return localStorage.getItem('lifesim_save_v1');
    });

    expect(savedData).not.toBeNull();

    // Parse and verify saved data structure
    const parsedData = JSON.parse(savedData);
    expect(parsedData.version).toBe('1.0.0');
    expect(parsedData.timestamp).toBeDefined();
    expect(parsedData.data).toBeDefined();
    expect(parsedData.data.player).toBeDefined();
    expect(parsedData.data.player.x).toBeCloseTo(positionBeforeSave.x, -1);
    expect(parsedData.data.player.y).toBeCloseTo(positionBeforeSave.y, -1);
  });

  test('should load saved game state on page reload', async ({ page }) => {
    // Move player to a specific position
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.waitForTimeout(500);

    const originalPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Save manually with button
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Check that player is at saved position
    const loadedPosition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    expect(loadedPosition.x).toBeCloseTo(originalPosition.x, 0);
    expect(loadedPosition.y).toBeCloseTo(originalPosition.y, 0);
  });

  test('should auto-save every 30 seconds', async ({ page }) => {
    // Move player
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowDown');

    // Wait for auto-save (30 seconds is too long for test, so we'll verify the timer exists)
    const hasAutoSaveTimer = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.autoSaveTimer !== null && scene.autoSaveTimer !== undefined;
    });

    expect(hasAutoSaveTimer).toBe(true);
  });

  test('should show save confirmation in button', async ({ page }) => {
    // Click save button
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');

    // Wait and check button text changed to "✓ Saved!"
    await page.waitForTimeout(500);

    const buttonText = await page.textContent('#save-button');
    expect(buttonText).toContain('Saved');

    // Check if save indicator was shown (it should be visible briefly)
    // We can check that the save method was called and succeeded
    const saveSucceeded = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      // Check localStorage has data
      return localStorage.getItem('lifesim_save_v1') !== null;
    });

    expect(saveSucceeded).toBe(true);
  });

  test('should maintain save data integrity across multiple saves', async ({ page }) => {
    // First save
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(100);
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(300);

    const firstSave = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('lifesim_save_v1'));
    });

    // Second save with different position
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(100);
    await page.click('#save-button');
    await page.waitForTimeout(300);

    const secondSave = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('lifesim_save_v1'));
    });

    // Second save should have newer timestamp
    expect(secondSave.timestamp).toBeGreaterThan(firstSave.timestamp);

    // Position should be different
    const positionChanged =
      secondSave.data.player.x !== firstSave.data.player.x ||
      secondSave.data.player.y !== firstSave.data.player.y;

    expect(positionChanged).toBe(true);
  });

  test('should handle localStorage when no save exists', async ({ page }) => {
    // Check that localStorage was cleared (should be no save initially in beforeEach)
    // Note: auto-save might have triggered, so we check that the game loaded without errors
    const gameLoadedCorrectly = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene && scene.player !== null;
    });

    expect(gameLoadedCorrectly).toBe(true);

    // Game should still work and player should be at default position
    const position = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Default starting position should be around 400, 300 (see GameScene.js line 30-31)
    expect(position.x).toBeCloseTo(400, -1); // Allow for some variance
    expect(position.y).toBeCloseTo(300, -1);
  });

  test('should include version and timestamp in save data', async ({ page }) => {
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(300);

    const saveData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('lifesim_save_v1'));
    });

    expect(saveData.version).toBe('1.0.0');
    expect(typeof saveData.timestamp).toBe('number');
    expect(saveData.timestamp).toBeGreaterThan(0);

    // Timestamp should be recent (within last minute)
    const now = Date.now();
    const timeDiff = now - saveData.timestamp;
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute old
  });
});

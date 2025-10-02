import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
});

test.describe('New Game Feature', () => {
  test('should display new game button in UI', async ({ page }) => {
    const newGameButton = page.locator('#new-game-button');
    await expect(newGameButton).toBeVisible();

    const buttonText = await newGameButton.textContent();
    expect(buttonText).toContain('New Game');
  });

  test('should show confirmation dialog when clicking new game', async ({ page }) => {
    // Setup dialog listener before clicking
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure you want to start a new game?');
      expect(dialog.message()).toContain('All progress will be lost');
      await dialog.dismiss(); // Dismiss to avoid actually resetting
    });

    // Click new game button
    await page.click('#new-game-button');

    // Wait a bit for dialog to be handled
    await page.waitForTimeout(500);
  });

  test('should reset game state when confirmed', async ({ page }) => {
    // First, make some progress: move player and save
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(500, 500);
    });

    await page.waitForTimeout(200);

    // Save the game
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Get current player position
    const positionBeforeReset = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    expect(positionBeforeReset.x).toBe(500);
    expect(positionBeforeReset.y).toBe(500);

    // Click new game and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.click('#new-game-button');

    // Wait for scene to restart
    await page.waitForTimeout(1000);

    // Verify player is at starting position (not 500, 500)
    const positionAfterReset = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Position should be different from saved position
    const positionChanged =
      positionAfterReset.x !== positionBeforeReset.x ||
      positionAfterReset.y !== positionBeforeReset.y;

    expect(positionChanged).toBe(true);
  });

  test('should clear saved data when starting new game', async ({ page }) => {
    // Save some game data
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(600, 600);
      scene.saveGame();
    });

    await page.waitForTimeout(500);

    // Verify save exists
    const saveExistsBefore = await page.evaluate(() => {
      return localStorage.getItem('lifesim_save_v1') !== null;
    });
    expect(saveExistsBefore).toBe(true);

    // Click new game and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.click('#new-game-button');

    // Wait for reset
    await page.waitForTimeout(1000);

    // Verify save is cleared
    const saveExistsAfter = await page.evaluate(() => {
      return localStorage.getItem('lifesim_save_v1') !== null;
    });
    expect(saveExistsAfter).toBe(false);
  });


  test('should reset location to home', async ({ page }) => {
    // Move to different location
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('shop', { x: 400, y: 400 });
    });

    // Wait for transition
    await page.waitForTimeout(1000);

    // Verify we're in shop
    const locationBefore = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(locationBefore).toBe('shop');

    // Save the game
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Click new game and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.click('#new-game-button');

    // Wait for reset
    await page.waitForTimeout(1000);

    // Verify we're back in home
    const locationAfter = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(locationAfter).toBe('home');
  });

  test('should not reset if user cancels confirmation', async ({ page }) => {
    // Make some progress
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(700, 700);
      scene.saveGame();
    });

    await page.waitForTimeout(500);

    const positionBefore = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    // Click new game but dismiss/cancel
    page.on('dialog', dialog => dialog.dismiss());
    await page.click('#new-game-button');

    // Wait a bit
    await page.waitForTimeout(1000);

    // Verify position hasn't changed
    const positionAfter = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    expect(positionAfter.x).toBe(positionBefore.x);
    expect(positionAfter.y).toBe(positionBefore.y);
  });

  test('new game button should have correct styling', async ({ page }) => {
    const newGameButton = page.locator('#new-game-button');

    const styles = await newGameButton.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        top: computed.top,
        right: computed.right,
        background: computed.background,
        cursor: computed.cursor
      };
    });

    expect(styles.position).toBe('fixed');
    expect(styles.top).toBe('20px');
    expect(styles.right).toBe('160px'); // Left of save button
    expect(styles.cursor).toBe('pointer');
  });

  test('should maintain game functionality after new game', async ({ page }) => {
    // Start new game
    page.on('dialog', dialog => dialog.accept());
    await page.click('#new-game-button');

    // Wait for reset
    await page.waitForTimeout(1000);

    // Test that player can still move
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const initialPos = scene.player.getPosition();
      scene.player.setPosition(initialPos.x + 100, initialPos.y + 100);
    });

    await page.waitForTimeout(200);

    const playerMoved = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const pos = scene.player.getPosition();
      return pos.x !== 0 && pos.y !== 0; // Player should have moved
    });

    expect(playerMoved).toBe(true);

    // Test that save still works
    await page.click('#save-button');
    await page.waitForTimeout(500);

    const saveExists = await page.evaluate(() => {
      return localStorage.getItem('lifesim_save_v1') !== null;
    });

    expect(saveExists).toBe(true);
  });
});

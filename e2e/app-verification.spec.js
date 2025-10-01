import { test, expect } from '@playwright/test';

test.describe('App Verification', () => {
  test('app loads without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3002');

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Check for errors
    if (errors.length > 0) {
      console.log('JavaScript Errors:', errors);
    }

    expect(errors.length).toBe(0);
  });

  test('game object exists and is initialized', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    const gameInfo = await page.evaluate(() => {
      return {
        gameExists: !!window.game,
        gameReadyFlag: window.gameReady,
        hasScene: !!(window.game && window.game.scene),
        gameSceneActive: window.game?.scene?.getScene('GameScene')?.scene?.isActive() || false
      };
    });

    console.log('Game Info:', gameInfo);

    expect(gameInfo.gameExists).toBe(true);
    expect(gameInfo.gameReadyFlag).toBe(true);
    expect(gameInfo.hasScene).toBe(true);
  });

  test('save button is visible', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Check if save button exists
    const saveButton = await page.locator('#save-button');
    await expect(saveButton).toBeVisible({ timeout: 10000 });

    console.log('Save button found and visible');
  });

  test('player can be accessed from game scene', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    const playerInfo = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        playerExists: !!scene.player,
        playerHasSprite: !!(scene.player && scene.player.sprite),
        playerPosition: scene.player ? { x: scene.player.sprite.x, y: scene.player.sprite.y } : null
      };
    });

    console.log('Player Info:', playerInfo);

    expect(playerInfo.playerExists).toBe(true);
    expect(playerInfo.playerHasSprite).toBe(true);
  });
});

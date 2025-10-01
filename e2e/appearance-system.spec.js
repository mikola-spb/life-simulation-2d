import { test, expect } from '@playwright/test';

test.describe('Appearance System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:3000');

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
  });

  test('player should have an appearance object', async ({ page }) => {
    const hasAppearance = await page.evaluate(() => {
      const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
      return scene && scene.player && scene.player.appearance !== undefined;
    });

    expect(hasAppearance).toBe(true);
  });

  test('player appearance should have customizable properties', async ({ page }) => {
    const appearanceProperties = await page.evaluate(() => {
      const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
      if (!scene || !scene.player || !scene.player.appearance) return null;

      const appearance = scene.player.appearance;
      return {
        hasSkinTone: typeof appearance.skinTone === 'number',
        hasHairColor: typeof appearance.hairColor === 'number',
        hasShirtColor: typeof appearance.shirtColor === 'number',
        hasPantsColor: typeof appearance.pantsColor === 'number'
      };
    });

    expect(appearanceProperties).not.toBeNull();
    expect(appearanceProperties.hasSkinTone).toBe(true);
    expect(appearanceProperties.hasHairColor).toBe(true);
    expect(appearanceProperties.hasShirtColor).toBe(true);
    expect(appearanceProperties.hasPantsColor).toBe(true);
  });

  test('player sprite should be a container with layers', async ({ page }) => {
    const spriteInfo = await page.evaluate(() => {
      const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
      if (!scene || !scene.player) return null;

      const sprite = scene.player.sprite;
      return {
        type: sprite.type,
        hasLayers: sprite.list && sprite.list.length > 0,
        layerCount: sprite.list ? sprite.list.length : 0
      };
    });

    expect(spriteInfo).not.toBeNull();
    expect(spriteInfo.type).toBe('Container');
    expect(spriteInfo.hasLayers).toBe(true);
    expect(spriteInfo.layerCount).toBeGreaterThan(3); // Should have multiple layers
  });

  test('player appearance should be saved and loaded', async ({ page }) => {
    // Define a custom appearance to save
    const customAppearance = {
      skinTone: 0x111111,
      hairColor: 0x222222,
      shirtColor: 0x333333,
      pantsColor: 0x444444
    };

    // Change appearance and save
    await page.evaluate((appearance) => {
      const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
      const newAppearance = new (scene.player.appearance.constructor)(appearance);
      scene.player.updateAppearance(newAppearance);
    }, customAppearance);

    // Trigger save with button
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Check appearance was restored
    const loadedAppearance = await page.evaluate(() => {
      const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
      if (!scene || !scene.player) return null;
      return scene.player.appearance.getSaveData();
    });

    // The loaded appearance should match what we saved
    expect(loadedAppearance).toEqual(customAppearance);
  });

  test('player can update appearance dynamically', async ({ page }) => {
    const appearanceChanged = await page.evaluate(() => {
      const scene = window.game.scene.scenes.find(s => s.scene.key === 'GameScene');
      if (!scene || !scene.player) return false;

      const originalColor = scene.player.appearance.shirtColor;

      // Create new appearance with different color
      const newAppearance = new (scene.player.appearance.constructor)({
        skinTone: scene.player.appearance.skinTone,
        hairColor: scene.player.appearance.hairColor,
        shirtColor: 0xff0000, // Red
        pantsColor: scene.player.appearance.pantsColor
      });

      scene.player.updateAppearance(newAppearance);

      return scene.player.appearance.shirtColor !== originalColor &&
             scene.player.appearance.shirtColor === 0xff0000;
    });

    expect(appearanceChanged).toBe(true);
  });
});

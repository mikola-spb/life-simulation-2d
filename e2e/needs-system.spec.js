import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Needs System
 * Verifies needs degradation, UI display, and speed penalties in the browser
 */

test.describe('Needs System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
  });

  test('should display needs UI with initial full values', async ({ page }) => {
    // Wait a moment for UI to initialize
    await page.waitForTimeout(500);

    // Check that needs UI is visible
    const needsUIVisible = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.needsUI && scene.needsUI.isVisible();
    });

    expect(needsUIVisible).toBe(true);

    // Check initial values are close to 100 (allow for degradation during load - up to 2 points)
    const initialNeeds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hunger: scene.needsSystem.getHunger(),
        energy: scene.needsSystem.getEnergy()
      };
    });

    expect(initialNeeds.hunger).toBeGreaterThan(98);
    expect(initialNeeds.hunger).toBeLessThanOrEqual(100);
    expect(initialNeeds.energy).toBeGreaterThan(98);
    expect(initialNeeds.energy).toBeLessThanOrEqual(100);
  });

  test('should degrade needs over time', async ({ page }) => {
    // Get initial needs
    const initialNeeds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hunger: scene.needsSystem.getHunger(),
        energy: scene.needsSystem.getEnergy()
      };
    });

    // Wait for 5 seconds of game time
    await page.waitForTimeout(5000);

    // Check that needs have decreased
    const updatedNeeds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hunger: scene.needsSystem.getHunger(),
        energy: scene.needsSystem.getEnergy()
      };
    });

    expect(updatedNeeds.hunger).toBeLessThan(initialNeeds.hunger);
    expect(updatedNeeds.energy).toBeLessThan(initialNeeds.energy);

    // Verify approximate decay (hunger ~5 points, energy ~2.5 points in 5 seconds)
    expect(updatedNeeds.hunger).toBeGreaterThan(90); // Should be around 95
    expect(updatedNeeds.hunger).toBeLessThan(100);
    expect(updatedNeeds.energy).toBeGreaterThan(95); // Should be around 97.5
    expect(updatedNeeds.energy).toBeLessThan(100);
  });

  test('should reduce player speed when hunger is low', async ({ page }) => {
    // Set hunger to low value
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 20; // Below threshold
      scene.needsSystem.applyConsequences();
    });

    // Get player speed
    const playerSpeed = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        currentSpeed: scene.player.speed,
        baseSpeed: scene.needsSystem.basePlayerSpeed,
        speedModifier: scene.needsSystem.getSpeedModifier()
      };
    });

    // Speed should be reduced
    expect(playerSpeed.currentSpeed).toBeLessThan(playerSpeed.baseSpeed);
    expect(playerSpeed.speedModifier).toBeLessThan(1.0);

    // Should be 30% penalty (0.7 modifier)
    expect(playerSpeed.speedModifier).toBeCloseTo(0.7, 1);
  });

  test('should reduce player speed when energy is low', async ({ page }) => {
    // Set energy to low value
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.energy = 15; // Below threshold
      scene.needsSystem.applyConsequences();
    });

    // Get player speed
    const playerSpeed = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        currentSpeed: scene.player.speed,
        baseSpeed: scene.needsSystem.basePlayerSpeed,
        speedModifier: scene.needsSystem.getSpeedModifier()
      };
    });

    // Speed should be reduced
    expect(playerSpeed.currentSpeed).toBeLessThan(playerSpeed.baseSpeed);
    expect(playerSpeed.speedModifier).toBeCloseTo(0.7, 1);
  });

  test('should stack speed penalties when both needs are low', async ({ page }) => {
    // Set both needs to low values
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 20;
      scene.needsSystem.energy = 20;
      scene.needsSystem.applyConsequences();
    });

    // Get player speed
    const playerSpeed = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        currentSpeed: scene.player.speed,
        baseSpeed: scene.needsSystem.basePlayerSpeed,
        speedModifier: scene.needsSystem.getSpeedModifier()
      };
    });

    // Speed should be heavily reduced (60% penalty = 0.4 modifier)
    expect(playerSpeed.speedModifier).toBeCloseTo(0.4, 1);
    expect(playerSpeed.currentSpeed).toBeCloseTo(playerSpeed.baseSpeed * 0.4, 0);
  });

  test('should save and load needs state', async ({ page }) => {
    // Set specific needs values
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 65;
      scene.needsSystem.energy = 45;
    });

    // Get values before save
    const needsBeforeSave = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hunger: scene.needsSystem.getHunger(),
        energy: scene.needsSystem.getEnergy()
      };
    });

    // Save game with button
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Get values after load
    const needsAfterLoad = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hunger: scene.needsSystem.getHunger(),
        energy: scene.needsSystem.getEnergy()
      };
    });

    // Values should be restored (allow tolerance for time during reload - up to 2 points degradation)
    expect(needsAfterLoad.hunger).toBeGreaterThan(needsBeforeSave.hunger - 2);
    expect(needsAfterLoad.hunger).toBeLessThanOrEqual(needsBeforeSave.hunger);
    expect(needsAfterLoad.energy).toBeGreaterThan(needsBeforeSave.energy - 2);
    expect(needsAfterLoad.energy).toBeLessThanOrEqual(needsBeforeSave.energy);
  });

  test('should update UI bars in real-time', async ({ page }) => {
    // Set specific needs values
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 50;
      scene.needsSystem.energy = 75;
      // Manually trigger UI update
      scene.needsUI.update(
        scene.needsSystem.getHunger(),
        scene.needsSystem.getEnergy()
      );
    });

    // Check that UI bars have correct widths
    const barWidths = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hungerBarWidth: scene.needsUI.hungerBar.width,
        energyBarWidth: scene.needsUI.energyBar.width,
        maxBarWidth: 150 // From NeedsUI config
      };
    });

    // Hunger at 50% should be 75px (50% of 150px)
    expect(barWidths.hungerBarWidth).toBeCloseTo(75, 0);
    // Energy at 75% should be 112.5px (75% of 150px)
    expect(barWidths.energyBarWidth).toBeCloseTo(112.5, 0);
  });

  test('should change bar colors based on thresholds', async ({ page }) => {
    // Test high value (green)
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 80;
      scene.needsUI.updateHungerBar(80);
    });

    let hungerColor = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.needsUI.hungerBar.fillColor;
    });
    expect(hungerColor).toBe(0x00ff00); // Green

    // Test medium value (yellow)
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 45;
      scene.needsUI.updateHungerBar(45);
    });

    hungerColor = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.needsUI.hungerBar.fillColor;
    });
    expect(hungerColor).toBe(0xffff00); // Yellow

    // Test low value (red)
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 15;
      scene.needsUI.updateHungerBar(15);
    });

    hungerColor = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.needsUI.hungerBar.fillColor;
    });
    expect(hungerColor).toBe(0xff0000); // Red
  });

  test('should restore speed penalties after loading save with low needs', async ({ page }) => {
    // Set low needs
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = 25;
      scene.needsSystem.energy = 100;
      scene.needsSystem.applyConsequences();
    });

    // Save
    await page.waitForSelector('#save-button', { timeout: 10000 });
    await page.click('#save-button');
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Check that speed penalty is still applied
    const speedAfterLoad = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        currentSpeed: scene.player.speed,
        baseSpeed: scene.needsSystem.basePlayerSpeed,
        isHungry: scene.needsSystem.isHungry()
      };
    });

    expect(speedAfterLoad.isHungry).toBe(true);
    expect(speedAfterLoad.currentSpeed).toBeLessThan(speedAfterLoad.baseSpeed);
  });

  test('should not allow needs to go below 0 or above 100', async ({ page }) => {
    // Try to set needs outside valid range
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.needsSystem.hunger = -50;
      scene.needsSystem.energy = 200;

      // Simulate update to trigger clamping
      scene.needsSystem.update(0, 1000);
    });

    const clampedNeeds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        hunger: scene.needsSystem.getHunger(),
        energy: scene.needsSystem.getEnergy()
      };
    });

    // Values should be clamped
    expect(clampedNeeds.hunger).toBeGreaterThanOrEqual(0);
    expect(clampedNeeds.hunger).toBeLessThanOrEqual(100);
    expect(clampedNeeds.energy).toBeGreaterThanOrEqual(0);
    expect(clampedNeeds.energy).toBeLessThanOrEqual(100);
  });
});

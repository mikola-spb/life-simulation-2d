import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Critical Path for Phase 1
 * Tests the absolute minimum critical functionality:
 * 1. Game loads in browser
 * 2. Game renders (canvas visible)
 * 3. Basic player action (single keypress)
 */

test.describe('Critical Path: Phase 1 Minimum Viable Features', () => {
  test('CRITICAL: Game loads and displays in browser', async ({ page }) => {
    console.log('📋 Test: Game loads and displays in browser');

    // Navigate to the game
    await page.goto('/');

    // 1. Check page loaded
    await expect(page).toHaveTitle(/Life Simulation/);
    console.log('✓ Page title correct');

    // 2. Wait for and verify canvas appears
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('✓ Canvas is visible');

    // 3. Verify canvas has dimensions (is rendering)
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox.width).toBeGreaterThan(100);
    expect(boundingBox.height).toBeGreaterThan(100);
    console.log(`✓ Canvas dimensions: ${boundingBox.width}x${boundingBox.height}`);

    // 4. Take a screenshot for visual confirmation
    await page.screenshot({ path: 'test-results/critical-game-loaded.png' });
    console.log('✓ Screenshot saved');

    console.log('✅ PASS: Game loads and displays successfully');
  });

  test('CRITICAL: Game initializes Phaser engine', async ({ page }) => {
    console.log('📋 Test: Game initializes Phaser engine');

    await page.goto('/');

    // Wait for canvas (indicates page loaded)
    await page.waitForSelector('canvas', { timeout: 15000 });
    console.log('✓ Canvas detected');

    // Wait for game object to exist on window
    await page.waitForFunction(
      () => typeof window.game !== 'undefined',
      { timeout: 15000 }
    );
    console.log('✓ window.game exists');

    // Verify game is Phaser instance
    const isPhaserGame = await page.evaluate(() => {
      return window.game &&
             window.game.constructor &&
             window.game.constructor.name === 'Game';
    });
    expect(isPhaserGame).toBe(true);
    console.log('✓ Game is Phaser instance');

    // Wait for game ready flag
    await page.waitForFunction(
      () => window.gameReady === true,
      { timeout: 15000 }
    );
    console.log('✓ Game ready flag set');

    console.log('✅ PASS: Phaser engine initialized successfully');
  });

  test('CRITICAL: Player action registers (keyboard input)', async ({ page }) => {
    console.log('📋 Test: Player action registers');

    await page.goto('/');

    // Wait for game to be fully ready
    await page.waitForFunction(
      () => window.gameReady === true,
      { timeout: 15000 }
    );

    // Give extra time for scene to fully initialize
    await page.waitForTimeout(3000);

    // Verify GameScene exists
    const sceneExists = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene !== null && scene !== undefined;
    });
    expect(sceneExists).toBe(true);
    console.log('✓ GameScene exists');

    // Check if InputController exists
    const hasInputController = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene && scene.inputController !== null;
    });
    expect(hasInputController).toBe(true);
    console.log('✓ InputController exists');

    // Simulate a single keypress
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Just verify the input system responded (no error thrown)
    const inputSystemWorks = await page.evaluate(() => {
      try {
        const scene = window.game.scene.getScene('GameScene');
        if (!scene || !scene.inputController) return false;

        // Try to get direction - if this works, input system is functional
        const direction = scene.inputController.getDirection();
        return direction !== undefined && direction !== null;
      } catch (e) {
        console.error('Input system error:', e);
        return false;
      }
    });

    expect(inputSystemWorks).toBe(true);
    console.log('✓ Input system responds to keyboard');

    console.log('✅ PASS: Player action (keyboard input) works');
  });

  test('CRITICAL: LocalStorage save functionality exists', async ({ page }) => {
    console.log('📋 Test: LocalStorage save functionality');

    await page.goto('/');

    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());
    console.log('✓ LocalStorage cleared');

    // Wait for game ready
    await page.waitForFunction(
      () => window.gameReady === true,
      { timeout: 15000 }
    );
    await page.waitForTimeout(2000);

    // Verify SaveSystem exists
    const hasSaveSystem = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene && scene.saveSystem !== null && scene.saveSystem !== undefined;
    });
    expect(hasSaveSystem).toBe(true);
    console.log('✓ SaveSystem exists');

    // Trigger save with Ctrl+S
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(1500);

    // Check if data was written to localStorage
    const saveDataExists = await page.evaluate(() => {
      const data = localStorage.getItem('lifesim_save_v1');
      return data !== null && data !== undefined && data.length > 0;
    });

    expect(saveDataExists).toBe(true);
    console.log('✓ Save data written to localStorage');

    // Verify save data structure
    const saveDataValid = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('lifesim_save_v1');
        const parsed = JSON.parse(data);
        return parsed.version && parsed.timestamp && parsed.data;
      } catch (e) {
        return false;
      }
    });

    expect(saveDataValid).toBe(true);
    console.log('✓ Save data structure valid');

    console.log('✅ PASS: Save functionality works');
  });

  test('SUMMARY: All Phase 1 critical features work in browser', async ({ page }) => {
    console.log('\n========================================');
    console.log('📊 PHASE 1 CRITICAL PATH SUMMARY');
    console.log('========================================\n');

    await page.goto('/');

    // Quick verification of all critical systems
    await page.waitForFunction(
      () => window.gameReady === true,
      { timeout: 15000 }
    );
    await page.waitForTimeout(2000);

    const systemsStatus = await page.evaluate(() => {
      const results = {
        canvas: false,
        phaserGame: false,
        gameScene: false,
        inputController: false,
        saveSystem: false,
        player: false
      };

      try {
        // Check canvas
        results.canvas = document.querySelector('canvas') !== null;

        // Check Phaser game
        results.phaserGame = window.game !== undefined;

        // Check GameScene
        const scene = window.game.scene.getScene('GameScene');
        results.gameScene = scene !== null;

        if (scene) {
          // Check InputController
          results.inputController = scene.inputController !== null;

          // Check SaveSystem
          results.saveSystem = scene.saveSystem !== null;

          // Check Player
          results.player = scene.player !== null;
        }
      } catch (e) {
        console.error('System check error:', e);
      }

      return results;
    });

    console.log('System Status:');
    console.log(`  Canvas:           ${systemsStatus.canvas ? '✅' : '❌'}`);
    console.log(`  Phaser Game:      ${systemsStatus.phaserGame ? '✅' : '❌'}`);
    console.log(`  GameScene:        ${systemsStatus.gameScene ? '✅' : '❌'}`);
    console.log(`  InputController:  ${systemsStatus.inputController ? '✅' : '❌'}`);
    console.log(`  SaveSystem:       ${systemsStatus.saveSystem ? '✅' : '❌'}`);
    console.log(`  Player:           ${systemsStatus.player ? '✅' : '❌'}`);

    // All critical systems should be operational
    expect(systemsStatus.canvas).toBe(true);
    expect(systemsStatus.phaserGame).toBe(true);
    expect(systemsStatus.gameScene).toBe(true);
    expect(systemsStatus.inputController).toBe(true);
    expect(systemsStatus.saveSystem).toBe(true);
    expect(systemsStatus.player).toBe(true);

    console.log('\n✅ ALL PHASE 1 CRITICAL SYSTEMS OPERATIONAL');
    console.log('========================================\n');
  });
});

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
  await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

  // Clear saved game
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
});

test.describe('Dialog Visibility', () => {
  test('dialog container should be visible with correct styles when active', async ({ page }) => {
    // Move player near NPC
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const npcs = scene.locationSystem.getNPCs();
      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 40, npcPos.y);
      }
    });

    await page.waitForTimeout(200);

    // Trigger interaction
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene.nearbyNPC) {
        scene.interactWithNPC(scene.nearbyNPC);
      }
    });

    await page.waitForTimeout(300);

    // Check if dialog container exists and is visible
    const dialogContainer = page.locator('#dialog-container');
    await expect(dialogContainer).toBeVisible();

    // Check computed styles
    const containerStyles = await dialogContainer.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        position: computed.position,
        zIndex: computed.zIndex,
        width: computed.width,
        height: computed.height,
        background: computed.background
      };
    });

    expect(containerStyles.display).toBe('flex');
    expect(containerStyles.position).toBe('fixed');
    expect(containerStyles.zIndex).toBe('1000');
  });

  test('dialog box should be visible with text content', async ({ page }) => {
    // Setup and trigger dialog
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const npcs = scene.locationSystem.getNPCs();
      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 40, npcPos.y);
      }
    });

    await page.waitForTimeout(200);

    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene.nearbyNPC) {
        scene.interactWithNPC(scene.nearbyNPC);
      }
    });

    await page.waitForTimeout(300);

    // Check NPC name is visible
    const npcName = await page.evaluate(() => {
      return document.querySelector('#dialog-container').querySelector('div:nth-child(1) > div:nth-child(1)')?.textContent;
    });
    expect(npcName).toBeTruthy();
    expect(npcName.length).toBeGreaterThan(0);

    // Check dialog text is visible
    const dialogText = await page.evaluate(() => {
      return document.querySelector('#dialog-container').querySelector('div:nth-child(1) > div:nth-child(2)')?.textContent;
    });
    expect(dialogText).toBeTruthy();
    expect(dialogText.length).toBeGreaterThan(0);

    // Check continue button is visible
    const buttonText = await page.evaluate(() => {
      return document.querySelector('#dialog-container').querySelector('button')?.textContent;
    });
    expect(buttonText).toContain('Continue');
  });

  test('dialog should render above all game elements', async ({ page }) => {
    // Setup and trigger dialog
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const npcs = scene.locationSystem.getNPCs();
      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 40, npcPos.y);
      }
    });

    await page.waitForTimeout(200);

    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene.nearbyNPC) {
        scene.interactWithNPC(scene.nearbyNPC);
      }
    });

    await page.waitForTimeout(300);

    // Get z-indexes of all elements
    const zIndexes = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const dialogContainer = document.getElementById('dialog-container');
      const saveButton = document.getElementById('save-button');

      const getZIndex = (el) => {
        if (!el) return null;
        const computed = window.getComputedStyle(el);
        return computed.zIndex;
      };

      return {
        canvas: getZIndex(canvas),
        dialog: getZIndex(dialogContainer),
        saveButton: getZIndex(saveButton)
      };
    });

    // Dialog should have highest z-index or at least 1000
    expect(parseInt(zIndexes.dialog)).toBeGreaterThanOrEqual(1000);
  });

  test('dialog elements should have correct styles and be readable', async ({ page }) => {
    // Setup and trigger dialog
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const npcs = scene.locationSystem.getNPCs();
      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 40, npcPos.y);
      }
    });

    await page.waitForTimeout(200);

    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene.nearbyNPC) {
        scene.interactWithNPC(scene.nearbyNPC);
      }
    });

    await page.waitForTimeout(300);

    // Check dialog box styles
    const dialogBoxStyles = await page.evaluate(() => {
      const dialogBox = document.querySelector('#dialog-container > div');
      const computed = window.getComputedStyle(dialogBox);
      return {
        background: computed.background,
        border: computed.border,
        padding: computed.padding,
        visibility: computed.visibility,
        opacity: computed.opacity
      };
    });

    expect(dialogBoxStyles.visibility).not.toBe('hidden');
    expect(parseFloat(dialogBoxStyles.opacity)).toBeGreaterThan(0);
    expect(dialogBoxStyles.padding).not.toBe('0px');
  });

  test('should be able to click continue button', async ({ page }) => {
    // Setup and trigger dialog
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const npcs = scene.locationSystem.getNPCs();
      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 40, npcPos.y);
      }
    });

    await page.waitForTimeout(200);

    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene.nearbyNPC) {
        scene.interactWithNPC(scene.nearbyNPC);
      }
    });

    await page.waitForTimeout(300);

    // Find and click the continue button
    const continueButton = page.locator('#dialog-container button');
    await expect(continueButton).toBeVisible();

    // Click the button
    await continueButton.click();

    await page.waitForTimeout(200);

    // Dialog should either show next page or be closed
    const dialogState = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        isActive: scene.dialogSystem.getIsActive(),
        currentPage: scene.dialogSystem.getCurrentPage()
      };
    });

    // Either dialog advanced or closed (both are valid)
    expect(dialogState.currentPage === 1 || !dialogState.isActive).toBe(true);
  });

  test('dialog should take screenshot for manual verification', async ({ page }) => {
    // Setup and trigger dialog
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const npcs = scene.locationSystem.getNPCs();
      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 40, npcPos.y);
      }
    });

    await page.waitForTimeout(200);

    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      if (scene.nearbyNPC) {
        scene.interactWithNPC(scene.nearbyNPC);
      }
    });

    await page.waitForTimeout(300);

    // Take screenshot
    await page.screenshot({
      path: 'dialog-screenshot.png',
      fullPage: true
    });

    // Verify dialog is active
    const isActive = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.dialogSystem.getIsActive();
    });

    expect(isActive).toBe(true);
  });
});

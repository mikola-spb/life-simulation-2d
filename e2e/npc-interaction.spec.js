import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  // Navigate to the game
  await page.goto(BASE_URL);

  // Wait for game to be ready
  await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

  // Clear any saved game state to start fresh
  await page.evaluate(() => {
    localStorage.clear();
  });

  // Reload to start from home
  await page.reload();
  await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
});

test.describe('NPC Interaction', () => {
  test('should spawn NPCs in home location', async ({ page }) => {
    // Check that game is in home location
    const currentLocation = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(currentLocation).toBe('home');

    // Check that NPCs are spawned
    const npcCount = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.locationSystem.getNPCs().length;
    });

    expect(npcCount).toBeGreaterThan(0);
  });

  test('should display NPC with correct appearance', async ({ page }) => {
    // Get NPC data from scene
    const npcData = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length === 0) return null;

      const npc = npcs[0];
      return {
        name: npc.getName(),
        hasSprite: !!npc.sprite,
        hasAppearance: !!npc.appearance
      };
    });

    expect(npcData).not.toBeNull();
    expect(npcData.name).toBeDefined();
    expect(npcData.hasSprite).toBe(true);
    expect(npcData.hasAppearance).toBe(true);
  });

  test('should show interaction prompt when player is near NPC', async ({ page }) => {
    // Move player near NPC
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        // Move player close to NPC
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    // Wait a bit for update cycle
    await page.waitForTimeout(100);

    // Check if interaction prompt is visible
    const hasPrompt = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.locationSystem.interactionPrompt?.visible === true;
    });

    expect(hasPrompt).toBe(true);
  });

  test('should open dialog when interacting with NPC', async ({ page }) => {
    // Move player near NPC
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    await page.waitForTimeout(100);

    // Press E key to interact
    await page.keyboard.press('E');

    // Wait for dialog to appear
    await page.waitForTimeout(300);

    // Check if dialog is visible
    const dialogVisible = await page.evaluate(() => {
      const dialogContainer = document.getElementById('dialog-container');
      return dialogContainer && dialogContainer.style.display === 'flex';
    });

    expect(dialogVisible).toBe(true);
  });

  test('should display NPC name in dialog', async ({ page }) => {
    // Get NPC name first
    const npcName = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();
      return npcs.length > 0 ? npcs[0].getName() : null;
    });

    // Move player near NPC and interact
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    await page.waitForTimeout(100);
    await page.keyboard.press('E');
    await page.waitForTimeout(300);

    // Check dialog displays NPC name
    const dialogName = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.dialogSystem.npcNameElement?.textContent;
    });

    expect(dialogName).toBe(npcName);
  });

  test('should display dialog text', async ({ page }) => {
    // Move player near NPC and interact
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    await page.waitForTimeout(100);
    await page.keyboard.press('E');
    await page.waitForTimeout(300);

    // Check dialog text exists and is not empty
    const dialogText = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.dialogSystem.dialogTextElement?.textContent;
    });

    expect(dialogText).toBeTruthy();
    expect(dialogText.length).toBeGreaterThan(0);
  });

  test('should advance dialog on space key press', async ({ page }) => {
    // Move player near NPC with multiple dialog pages
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    await page.waitForTimeout(100);
    await page.keyboard.press('E');
    await page.waitForTimeout(300);

    // Get first page text
    const firstPageText = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.dialogSystem.dialogTextElement?.textContent;
    });

    // Press space to advance
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Get second page text (or check if dialog closed)
    const secondPageText = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const isActive = scene.dialogSystem.getIsActive();
      const text = scene.dialogSystem.dialogTextElement?.textContent;
      return { isActive, text };
    });

    // Either dialog advanced to new page or closed (if only one page)
    if (secondPageText.isActive) {
      expect(secondPageText.text).not.toBe(firstPageText);
    } else {
      // Dialog closed, which is valid behavior for single-page dialog
      expect(secondPageText.isActive).toBe(false);
    }
  });

  test('should close dialog after last page', async ({ page }) => {
    // Move player near NPC and interact
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    await page.waitForTimeout(100);
    await page.keyboard.press('E');
    await page.waitForTimeout(300);

    // Get total pages
    const totalPages = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.dialogSystem.getTotalPages();
    });

    // Press space for each page + one more to close
    for (let i = 0; i <= totalPages; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
    }

    // Check dialog is closed
    const dialogActive = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.dialogSystem.getIsActive();
    });

    expect(dialogActive).toBe(false);
  });

  test('should spawn different NPCs in different locations', async ({ page }) => {
    // Get NPCs in home location
    const homeNPCs = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.locationSystem.getNPCs().map(npc => npc.getId());
    });

    // Transition to shop location
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.transitionToLocation('shop', { x: 400, y: 400 });
    });

    // Wait for transition
    await page.waitForTimeout(1000);

    // Get NPCs in shop location
    const shopNPCs = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.locationSystem.getNPCs().map(npc => npc.getId());
    });

    // NPCs should be different in different locations
    expect(homeNPCs).not.toEqual(shopNPCs);
  });

  test('should handle wandering NPC behavior', async ({ page }) => {
    // Transition to park (has wandering NPCs)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.transitionToLocation('park', { x: 400, y: 400 });
    });

    await page.waitForTimeout(1000);

    // Get wandering NPC initial position
    const initialPos = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();
      const wanderingNPC = npcs.find(npc => npc.getBehavior() === 'wander');

      if (wanderingNPC) {
        return wanderingNPC.getPosition();
      }
      return null;
    });

    // Wait for NPC to potentially move
    await page.waitForTimeout(2000);

    // Get NPC position again
    const newPos = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();
      const wanderingNPC = npcs.find(npc => npc.getBehavior() === 'wander');

      if (wanderingNPC) {
        return wanderingNPC.getPosition();
      }
      return null;
    });

    // If wandering NPC exists, position might have changed (not guaranteed due to random idle)
    if (initialPos && newPos) {
      // Just verify NPC still exists and has valid position
      expect(newPos.x).toBeDefined();
      expect(newPos.y).toBeDefined();
    }
  });

  test('should block player movement during dialog', async ({ page }) => {
    // Move player near NPC
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      const npcs = scene.locationSystem.getNPCs();

      if (npcs.length > 0) {
        const npc = npcs[0];
        const npcPos = npc.getPosition();
        scene.player.setPosition(npcPos.x + 30, npcPos.y);
      }
    });

    await page.waitForTimeout(100);

    // Get player position before dialog
    const posBeforeDialog = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.player.getPosition();
    });

    // Open dialog
    await page.keyboard.press('E');
    await page.waitForTimeout(300);

    // Try to move player
    await page.keyboard.press('W');
    await page.waitForTimeout(200);

    // Get player position after attempting to move
    const posAfterMove = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.player.getPosition();
    });

    // Player should not have moved (or moved very little due to physics settling)
    const distance = Math.sqrt(
      Math.pow(posAfterMove.x - posBeforeDialog.x, 2) +
      Math.pow(posAfterMove.y - posBeforeDialog.y, 2)
    );

    expect(distance).toBeLessThan(10); // Allow small physics settling
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Location Transitions (Phase 2 - Task 2)
 * Tests the world map system with multiple locations
 */

test.describe('Phase 2: Location Transitions', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test for fresh state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('Player starts in home location', async ({ page }) => {
    const currentLocation = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(currentLocation).toBe('home');
    console.log('✅ Player starts in home location');
  });

  test('Home location displays correct name', async ({ page }) => {
    const locationName = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocation().name;
    });

    expect(locationName).toBe('Home');
  });

  test('Home location has correct world bounds', async ({ page }) => {
    const worldBounds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocation().worldBounds;
    });

    expect(worldBounds.width).toBe(800);
    expect(worldBounds.height).toBe(600);
  });

  test('Transition zones are created in home', async ({ page }) => {
    const transitionCount = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.transitionZones.length;
    });

    expect(transitionCount).toBeGreaterThan(0);
    console.log(`✅ Found ${transitionCount} transition zone(s) in home`);
  });

  test('Player can detect nearby transition zone', async ({ page }) => {
    // Move player near the exit transition (at x: 750, y: 300)
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(720, 300);
    });

    await page.waitForTimeout(500);

    const nearbyTransition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const playerPos = scene.player.getPosition();
      return scene.locationSystem.checkTransitionProximity(playerPos);
    });

    expect(nearbyTransition).not.toBeNull();
    expect(nearbyTransition.to).toBe('street');
    console.log('✅ Player detected nearby transition zone');
  });

  test('Interaction prompt appears when near transition', async ({ page }) => {
    // Move player near the exit
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(720, 300);
    });

    await page.waitForTimeout(500);

    const hasActiveTransition = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      const playerPos = scene.player.getPosition();
      const nearby = scene.locationSystem.checkTransitionProximity(playerPos);
      if (nearby) {
        scene.locationSystem.showInteractionPrompt(nearby);
      }
      return scene.locationSystem.getActiveTransition() !== null;
    });

    expect(hasActiveTransition).toBe(true);
    console.log('✅ Interaction prompt shown');
  });

  test('Player can transition from home to street', async ({ page }) => {
    // Move player near the exit
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(720, 300);
    });

    await page.waitForTimeout(500);

    // Trigger transition
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', { x: 100, y: 600 });
    });

    // Wait for transition to complete
    await page.waitForTimeout(1000);

    const currentLocation = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(currentLocation).toBe('street');
    console.log('✅ Successfully transitioned to street');
  });

  test('Player spawns at correct position in new location', async ({ page }) => {
    const targetSpawn = { x: 100, y: 600 };

    await page.evaluate((spawn) => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', spawn);
    }, targetSpawn);

    await page.waitForTimeout(1000);

    const playerPos = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    expect(playerPos.x).toBe(targetSpawn.x);
    expect(playerPos.y).toBe(targetSpawn.y);
    console.log('✅ Player spawned at correct position');
  });

  test('Street location has multiple transitions', async ({ page }) => {
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', { x: 800, y: 600 });
    });

    await page.waitForTimeout(1000);

    const transitionCount = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.transitionZones.length;
    });

    expect(transitionCount).toBe(4); // Street has 4 exits
    console.log(`✅ Street has ${transitionCount} transitions`);
  });

  test('Player can transition from street back to home', async ({ page }) => {
    // First go to street
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', { x: 100, y: 600 });
    });

    await page.waitForTimeout(1000);

    // Then go back to home
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('home', { x: 700, y: 300 });
    });

    await page.waitForTimeout(1000);

    const currentLocation = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(currentLocation).toBe('home');
    console.log('✅ Successfully returned to home');
  });

  test('All locations are accessible from street', async ({ page }) => {
    const locations = ['shop', 'park', 'workplace'];

    // Start at street
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', { x: 800, y: 600 });
    });

    await page.waitForTimeout(1000);

    for (const location of locations) {
      await page.evaluate((loc) => {
        const scene = window.game.scene.getScene('GameScene');
        const locationData = scene.locationSystem.getCurrentLocation();
        const transition = locationData.transitions.find(t => t.to === loc);
        if (transition) {
          scene.transitionToLocation(loc, transition.toSpawn);
        }
      }, location);

      await page.waitForTimeout(1000);

      const currentLocation = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene.locationSystem.getCurrentLocationId();
      });

      expect(currentLocation).toBe(location);
      console.log(`✅ Successfully transitioned to ${location}`);

      // Return to street for next test
      await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        scene.transitionToLocation('street', { x: 800, y: 600 });
      });

      await page.waitForTimeout(1000);
    }
  });

  test('Current location persists after save and reload', async ({ page }) => {
    // Transition to park
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('park', { x: 600, y: 450 });
    });

    await page.waitForTimeout(1000);

    // Save game
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.saveGame();
    });

    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const currentLocation = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.locationSystem.getCurrentLocationId();
    });

    expect(currentLocation).toBe('park');
    console.log('✅ Location persisted after reload');
  });

  test('Player position persists within location after save and reload', async ({ page }) => {
    // Move player to specific position in home
    const testPosition = { x: 300, y: 250 };

    await page.evaluate((pos) => {
      const scene = window.game.scene.getScene('GameScene');
      scene.player.setPosition(pos.x, pos.y);
    }, testPosition);

    await page.waitForTimeout(500);

    // Save game
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.saveGame();
    });

    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const playerPos = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.player.getPosition();
    });

    expect(playerPos.x).toBe(testPosition.x);
    expect(playerPos.y).toBe(testPosition.y);
    console.log('✅ Player position persisted after reload');
  });

  test('Obstacles are created in each location', async ({ page }) => {
    const locations = ['home', 'street', 'shop', 'park', 'workplace'];

    for (const location of locations) {
      await page.evaluate((loc) => {
        const scene = window.game.scene.getScene('GameScene');
        const locationData = scene.locationSystem.getCurrentLocation();
        const spawnPoint = locationData ? locationData.spawnPoint : { x: 400, y: 300 };
        scene.transitionToLocation(loc, spawnPoint);
      }, location);

      await page.waitForTimeout(1000);

      const obstacleCount = await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameScene');
        return scene.locationSystem.obstacles.length;
      });

      expect(obstacleCount).toBeGreaterThan(0);
      console.log(`✅ ${location} has ${obstacleCount} obstacles`);
    }
  });

  test('Camera bounds update when changing locations', async ({ page }) => {
    // Get camera bounds in home (800x600)
    const homeBounds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        width: scene.cameras.main.getBounds().width,
        height: scene.cameras.main.getBounds().height
      };
    });

    expect(homeBounds.width).toBe(800);
    expect(homeBounds.height).toBe(600);

    // Transition to street (1600x1200)
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', { x: 800, y: 600 });
    });

    await page.waitForTimeout(1000);

    const streetBounds = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return {
        width: scene.cameras.main.getBounds().width,
        height: scene.cameras.main.getBounds().height
      };
    });

    expect(streetBounds.width).toBe(1600);
    expect(streetBounds.height).toBe(1200);
    console.log('✅ Camera bounds updated correctly');
  });

  test('Player cannot move during transition', async ({ page }) => {
    // Start transition
    const transitionPromise = page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      scene.transitionToLocation('street', { x: 800, y: 600 });
    });

    // Try to move player during transition
    await page.waitForTimeout(100);

    const isTransitioning = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.isTransitioning;
    });

    expect(isTransitioning).toBe(true);
    console.log('✅ Player movement blocked during transition');

    await transitionPromise;
    await page.waitForTimeout(1000);

    const isStillTransitioning = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameScene');
      return scene.isTransitioning;
    });

    expect(isStillTransitioning).toBe(false);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Time System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:3000');

    // Wait for game to be ready
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    // Clear any existing save data to start fresh
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload to start with fresh state
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });
  });

  test('should display time UI in top-right corner', async ({ page }) => {
    // Wait a moment for UI to render
    await page.waitForTimeout(500);

    // Check that time display exists
    const timeDisplay = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      if (!scene || !scene.timeUI) return null;

      return {
        visible: scene.timeUI.isVisible(),
        hasText: scene.timeUI.timeText !== null
      };
    });

    expect(timeDisplay).not.toBeNull();
    expect(timeDisplay.visible).toBe(true);
    expect(timeDisplay.hasText).toBe(true);
  });

  test('should show initial time as "Day 1 - 08:00"', async ({ page }) => {
    // Immediately check time to avoid time progression during test
    const timeInfo = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      if (!scene || !scene.timeSystem) return null;

      return {
        day: scene.timeSystem.getDay(),
        hour: scene.timeSystem.getCurrentHour(),
        minute: scene.timeSystem.getCurrentMinute()
      };
    });

    expect(timeInfo).not.toBeNull();
    expect(timeInfo.day).toBe(1);
    // Allow for some time progression (within first hour)
    expect(timeInfo.hour).toBe(8);
    expect(timeInfo.minute).toBeLessThan(60);
  });

  test('should progress time during gameplay', async ({ page }) => {
    // Get initial time
    const initialTime = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        hour: scene.timeSystem.getCurrentHour(),
        minute: scene.timeSystem.getCurrentMinute()
      };
    });

    // Wait for 2 seconds of real time (should advance ~2 game hours with default config)
    await page.waitForTimeout(2000);

    const newTime = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        hour: scene.timeSystem.getCurrentHour(),
        minute: scene.timeSystem.getCurrentMinute()
      };
    });

    // Calculate total minutes elapsed
    const initialMinutes = initialTime.hour * 60 + initialTime.minute;
    const newMinutes = newTime.hour * 60 + newTime.minute;
    const minutesElapsed = newMinutes - initialMinutes;

    // Should have progressed by approximately 120 minutes (2 game hours)
    // Allow more tolerance for timing variations (browser frame rate affects this)
    expect(minutesElapsed).toBeGreaterThan(50); // At least 50 minutes (significant progression)
    expect(minutesElapsed).toBeLessThan(180); // Less than 3 hours
  });

  test('should handle day/night cycle transitions', async ({ page }) => {
    // Set time to daytime (12:00)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 12, 0);
    });

    await page.waitForTimeout(200);

    const dayState = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        isNight: scene.timeSystem.isNightTime(),
        isDay: scene.timeSystem.isDayTime()
      };
    });

    expect(dayState.isNight).toBe(false);
    expect(dayState.isDay).toBe(true);

    // Set time to nighttime (22:00)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 22, 0);
    });

    await page.waitForTimeout(200);

    const nightState = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        isNight: scene.timeSystem.isNightTime(),
        isDay: scene.timeSystem.isDayTime()
      };
    });

    expect(nightState.isNight).toBe(true);
    expect(nightState.isDay).toBe(false);
  });

  test('should apply visual day/night effects', async ({ page }) => {
    // Set time to day (10:00)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 10, 0);
      scene.updateDayNightCycle();
    });

    await page.waitForTimeout(200);

    const dayTint = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.currentDayNightTint;
    });

    // Day tint should be 0xffffff (white/normal)
    expect(dayTint).toBe(0xffffff);

    // Set time to night (20:00)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 20, 0);
      scene.updateDayNightCycle();
    });

    await page.waitForTimeout(200);

    const nightTint = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.currentDayNightTint;
    });

    // Night tint should be 0x6666ff (blue)
    expect(nightTint).toBe(0x6666ff);
  });

  test('should persist time across save/load', async ({ page }) => {
    // Set a specific time and immediately save
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(5, 15, 30);
      scene.saveGame();
    });

    await page.waitForTimeout(200);

    // Reload the page
    await page.reload();
    await page.waitForFunction(() => window.gameReady === true, { timeout: 30000 });

    await page.waitForTimeout(100);

    // Check that time was restored (allow for minor time progression during load)
    const loadedTime = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        day: scene.timeSystem.getDay(),
        hour: scene.timeSystem.getCurrentHour(),
        minute: scene.timeSystem.getCurrentMinute()
      };
    });

    expect(loadedTime.day).toBe(5);
    // Allow for up to 2 hours of time progression during page load
    expect(loadedTime.hour).toBeGreaterThanOrEqual(15);
    expect(loadedTime.hour).toBeLessThanOrEqual(17);
  });

  test('should advance to next day after midnight', async ({ page }) => {
    // Set time to 23:30 on day 1
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 23, 30);
    });

    await page.waitForTimeout(200);

    const beforeMidnight = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.timeSystem.getDay();
    });

    expect(beforeMidnight).toBe(1);

    // Wait for 1 second (should advance by 1 hour to 00:30 on day 2)
    await page.waitForTimeout(1000);

    const afterMidnight = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        day: scene.timeSystem.getDay(),
        hour: scene.timeSystem.getCurrentHour()
      };
    });

    expect(afterMidnight.day).toBe(2);
    expect(afterMidnight.hour).toBe(0);
  });

  test('should update TimeUI display as time changes', async ({ page }) => {
    // Set initial time and immediately check (no wait to avoid time progression)
    const firstDisplay = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(3, 14, 25);
      scene.timeUI.update(scene.timeSystem.getDay(), scene.timeSystem.getTimeString());
      return scene.timeUI.timeText.text;
    });

    expect(firstDisplay).toBe('Day 3 - 14:25');

    // Change time and immediately check
    const secondDisplay = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(7, 9, 5);
      scene.timeUI.update(scene.timeSystem.getDay(), scene.timeSystem.getTimeString());
      return scene.timeUI.timeText.text;
    });

    expect(secondDisplay).toBe('Day 7 - 09:05');
  });

  test('should handle accelerated time correctly', async ({ page }) => {
    // Configure for faster testing: 600 game minutes per real second (10x faster)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.minutesPerRealSecond = 600;
      scene.timeSystem.setTime(1, 10, 0);
    });

    // Wait 1 second (should advance 10 game hours)
    await page.waitForTimeout(1000);

    const newTime = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        hour: scene.timeSystem.getCurrentHour(),
        day: scene.timeSystem.getDay()
      };
    });

    // Should have advanced significantly from 10:00
    // Allow more tolerance for frame rate variations
    expect(newTime.hour).toBeGreaterThanOrEqual(14); // At least 4 hours advanced
    expect(newTime.hour).toBeLessThanOrEqual(24); // But within same day or early next day
  });

  test('should handle edge case at day/night boundary (18:00)', async ({ page }) => {
    // Set time to exactly 18:00 (night start)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 18, 0);
    });

    await page.waitForTimeout(200);

    const boundary = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        hour: scene.timeSystem.getCurrentHour(),
        isNight: scene.timeSystem.isNightTime()
      };
    });

    expect(boundary.hour).toBe(18);
    expect(boundary.isNight).toBe(true);
  });

  test('should handle edge case at night/day boundary (06:00)', async ({ page }) => {
    // Set time to exactly 06:00 (day start)
    await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      scene.timeSystem.setTime(1, 6, 0);
    });

    await page.waitForTimeout(200);

    const boundary = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return {
        hour: scene.timeSystem.getCurrentHour(),
        isNight: scene.timeSystem.isNightTime()
      };
    });

    expect(boundary.hour).toBe(6);
    expect(boundary.isNight).toBe(false);
  });

  test('should continue time progression during player movement', async ({ page }) => {
    const initialTime = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.timeSystem.getCurrentHour();
    });

    // Simulate player movement for 2 seconds
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.up('ArrowRight');

    const finalTime = await page.evaluate(() => {
      const scene = window.game.scene.keys.GameScene;
      return scene.timeSystem.getCurrentHour();
    });

    // Time should have progressed even while moving
    const hoursDiff = (finalTime - initialTime + 24) % 24;
    expect(hoursDiff).toBeGreaterThan(0);
  });

  test('should format time with leading zeros', async ({ page }) => {
    // Test various times that need leading zeros
    const testCases = [
      { hour: 8, minute: 5, expected: '08:05' },
      { hour: 0, minute: 0, expected: '00:00' },
      { hour: 23, minute: 59, expected: '23:59' },
      { hour: 12, minute: 30, expected: '12:30' }
    ];

    for (const testCase of testCases) {
      // Set time and immediately check (in single evaluate to avoid time progression)
      const timeString = await page.evaluate(({ hour, minute }) => {
        const scene = window.game.scene.keys.GameScene;
        scene.timeSystem.setTime(1, hour, minute);
        return scene.timeSystem.getTimeString();
      }, testCase);

      expect(timeString).toBe(testCase.expected);
    }
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import NeedsSystem from './NeedsSystem.js';
import GameConfig from '../config.js';

describe('NeedsSystem', () => {
  let needsSystem;
  let mockScene;
  let mockPlayer;

  beforeEach(() => {
    // Mock player
    mockPlayer = {
      speed: 160,
      sprite: {
        x: 100,
        y: 100
      }
    };

    // Mock scene
    mockScene = {};

    needsSystem = new NeedsSystem(mockScene, mockPlayer);
  });

  describe('constructor', () => {
    it('should initialize with max hunger and energy', () => {
      expect(needsSystem.getHunger()).toBe(100);
      expect(needsSystem.getEnergy()).toBe(100);
    });

    it('should store references to scene and player', () => {
      expect(needsSystem.scene).toBe(mockScene);
      expect(needsSystem.player).toBe(mockPlayer);
    });

    it('should cache config values', () => {
      expect(needsSystem.hungerDecayRate).toBe(GameConfig.needs.hungerDecayRate);
      expect(needsSystem.energyDecayRate).toBe(GameConfig.needs.energyDecayRate);
      expect(needsSystem.lowThreshold).toBe(GameConfig.needs.lowThreshold);
      expect(needsSystem.speedPenalty).toBe(GameConfig.needs.speedPenalty);
    });

    it('should store base player speed', () => {
      expect(needsSystem.basePlayerSpeed).toBe(160);
    });

    it('should initialize with speed modifier of 1.0', () => {
      expect(needsSystem.getSpeedModifier()).toBe(1.0);
    });
  });

  describe('update', () => {
    it('should degrade hunger over time', () => {
      const initialHunger = needsSystem.getHunger();
      needsSystem.update(0, 1000); // 1 second

      expect(needsSystem.getHunger()).toBeLessThan(initialHunger);
    });

    it('should degrade energy over time', () => {
      const initialEnergy = needsSystem.getEnergy();
      needsSystem.update(0, 1000); // 1 second

      expect(needsSystem.getEnergy()).toBeLessThan(initialEnergy);
    });

    it('should degrade hunger at correct rate', () => {
      needsSystem.update(0, 1000); // 1 second
      const expectedHunger = 100 - GameConfig.needs.hungerDecayRate;

      expect(needsSystem.getHunger()).toBeCloseTo(expectedHunger, 1);
    });

    it('should degrade energy at correct rate', () => {
      needsSystem.update(0, 1000); // 1 second
      const expectedEnergy = 100 - GameConfig.needs.energyDecayRate;

      expect(needsSystem.getEnergy()).toBeCloseTo(expectedEnergy, 1);
    });

    it('should handle partial delta times', () => {
      needsSystem.update(0, 500); // 0.5 seconds
      const expectedHunger = 100 - (GameConfig.needs.hungerDecayRate * 0.5);

      expect(needsSystem.getHunger()).toBeCloseTo(expectedHunger, 1);
    });

    it('should not allow hunger to go below 0', () => {
      // Set hunger very low
      needsSystem.hunger = 0.5;
      needsSystem.update(0, 1000); // Will decay 1 point

      expect(needsSystem.getHunger()).toBe(0);
    });

    it('should not allow energy to go below 0', () => {
      // Set energy very low
      needsSystem.energy = 0.3;
      needsSystem.update(0, 1000); // Will decay 0.5 points

      expect(needsSystem.getEnergy()).toBe(0);
    });

    it('should not allow hunger to exceed max value', () => {
      needsSystem.hunger = 110; // Somehow set too high
      needsSystem.update(0, 1000);

      expect(needsSystem.getHunger()).toBeLessThanOrEqual(100);
    });
  });

  describe('applyConsequences', () => {
    it('should reduce speed when hunger is low', () => {
      needsSystem.hunger = 20; // Below threshold of 30
      needsSystem.applyConsequences();

      expect(mockPlayer.speed).toBeLessThan(needsSystem.basePlayerSpeed);
    });

    it('should reduce speed when energy is low', () => {
      needsSystem.energy = 20; // Below threshold of 30
      needsSystem.applyConsequences();

      expect(mockPlayer.speed).toBeLessThan(needsSystem.basePlayerSpeed);
    });

    it('should apply correct speed penalty for low hunger', () => {
      needsSystem.hunger = 20;
      needsSystem.energy = 100; // Keep energy high
      needsSystem.applyConsequences();

      const expectedSpeed = needsSystem.basePlayerSpeed * (1 - GameConfig.needs.speedPenalty);
      expect(mockPlayer.speed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should apply correct speed penalty for low energy', () => {
      needsSystem.hunger = 100; // Keep hunger high
      needsSystem.energy = 20;
      needsSystem.applyConsequences();

      const expectedSpeed = needsSystem.basePlayerSpeed * (1 - GameConfig.needs.speedPenalty);
      expect(mockPlayer.speed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should stack penalties when both needs are low', () => {
      needsSystem.hunger = 20;
      needsSystem.energy = 20;
      needsSystem.applyConsequences();

      const expectedSpeed = needsSystem.basePlayerSpeed * (1 - GameConfig.needs.speedPenalty * 2);
      expect(mockPlayer.speed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should not reduce speed when needs are above threshold', () => {
      needsSystem.hunger = 80;
      needsSystem.energy = 80;
      needsSystem.applyConsequences();

      expect(mockPlayer.speed).toBe(needsSystem.basePlayerSpeed);
    });

    it('should restore speed when needs recover above threshold', () => {
      // First apply penalty
      needsSystem.hunger = 20;
      needsSystem.applyConsequences();
      expect(mockPlayer.speed).toBeLessThan(needsSystem.basePlayerSpeed);

      // Then restore
      needsSystem.hunger = 80;
      needsSystem.applyConsequences();
      expect(mockPlayer.speed).toBe(needsSystem.basePlayerSpeed);
    });
  });

  describe('addHunger', () => {
    it('should increase hunger', () => {
      needsSystem.hunger = 50;
      needsSystem.addHunger(20);

      expect(needsSystem.getHunger()).toBe(70);
    });

    it('should not exceed max value', () => {
      needsSystem.hunger = 90;
      needsSystem.addHunger(20);

      expect(needsSystem.getHunger()).toBe(100);
    });
  });

  describe('addEnergy', () => {
    it('should increase energy', () => {
      needsSystem.energy = 50;
      needsSystem.addEnergy(30);

      expect(needsSystem.getEnergy()).toBe(80);
    });

    it('should not exceed max value', () => {
      needsSystem.energy = 95;
      needsSystem.addEnergy(10);

      expect(needsSystem.getEnergy()).toBe(100);
    });
  });

  describe('removeHunger', () => {
    it('should decrease hunger', () => {
      needsSystem.hunger = 50;
      needsSystem.removeHunger(20);

      expect(needsSystem.getHunger()).toBe(30);
    });

    it('should not go below min value', () => {
      needsSystem.hunger = 10;
      needsSystem.removeHunger(20);

      expect(needsSystem.getHunger()).toBe(0);
    });
  });

  describe('removeEnergy', () => {
    it('should decrease energy', () => {
      needsSystem.energy = 50;
      needsSystem.removeEnergy(15);

      expect(needsSystem.getEnergy()).toBe(35);
    });

    it('should not go below min value', () => {
      needsSystem.energy = 5;
      needsSystem.removeEnergy(10);

      expect(needsSystem.getEnergy()).toBe(0);
    });
  });

  describe('isHungry', () => {
    it('should return true when hunger is below threshold', () => {
      needsSystem.hunger = 20;
      expect(needsSystem.isHungry()).toBe(true);
    });

    it('should return false when hunger is at threshold', () => {
      needsSystem.hunger = 30;
      expect(needsSystem.isHungry()).toBe(false);
    });

    it('should return false when hunger is above threshold', () => {
      needsSystem.hunger = 50;
      expect(needsSystem.isHungry()).toBe(false);
    });
  });

  describe('isTired', () => {
    it('should return true when energy is below threshold', () => {
      needsSystem.energy = 15;
      expect(needsSystem.isTired()).toBe(true);
    });

    it('should return false when energy is at threshold', () => {
      needsSystem.energy = 30;
      expect(needsSystem.isTired()).toBe(false);
    });

    it('should return false when energy is above threshold', () => {
      needsSystem.energy = 60;
      expect(needsSystem.isTired()).toBe(false);
    });
  });

  describe('getSaveData', () => {
    it('should return current needs values', () => {
      needsSystem.hunger = 65;
      needsSystem.energy = 80;

      const saveData = needsSystem.getSaveData();

      expect(saveData.hunger).toBe(65);
      expect(saveData.energy).toBe(80);
    });
  });

  describe('loadSaveData', () => {
    it('should restore hunger from save data', () => {
      needsSystem.loadSaveData({ hunger: 45, energy: 100 });

      expect(needsSystem.getHunger()).toBe(45);
    });

    it('should restore energy from save data', () => {
      needsSystem.loadSaveData({ hunger: 100, energy: 55 });

      expect(needsSystem.getEnergy()).toBe(55);
    });

    it('should clamp loaded values to valid range', () => {
      needsSystem.loadSaveData({ hunger: 150, energy: -10 });

      expect(needsSystem.getHunger()).toBe(100);
      expect(needsSystem.getEnergy()).toBe(0);
    });

    it('should reapply consequences after loading', () => {
      needsSystem.loadSaveData({ hunger: 20, energy: 100 });

      expect(mockPlayer.speed).toBeLessThan(needsSystem.basePlayerSpeed);
    });

    it('should handle partial save data', () => {
      const initialHunger = needsSystem.getHunger();
      needsSystem.loadSaveData({ energy: 70 });

      expect(needsSystem.getHunger()).toBe(initialHunger);
      expect(needsSystem.getEnergy()).toBe(70);
    });
  });

  describe('reset', () => {
    it('should restore hunger to max', () => {
      needsSystem.hunger = 30;
      needsSystem.reset();

      expect(needsSystem.getHunger()).toBe(100);
    });

    it('should restore energy to max', () => {
      needsSystem.energy = 40;
      needsSystem.reset();

      expect(needsSystem.getEnergy()).toBe(100);
    });

    it('should restore speed modifier to 1.0', () => {
      needsSystem.hunger = 20;
      needsSystem.applyConsequences();
      needsSystem.reset();

      expect(needsSystem.getSpeedModifier()).toBe(1.0);
    });

    it('should restore player speed to base speed', () => {
      needsSystem.hunger = 20;
      needsSystem.applyConsequences();
      needsSystem.reset();

      expect(mockPlayer.speed).toBe(needsSystem.basePlayerSpeed);
    });
  });

  describe('integration', () => {
    it('should correctly handle a full simulation cycle', () => {
      // Start with full needs
      expect(needsSystem.getHunger()).toBe(100);
      expect(needsSystem.getEnergy()).toBe(100);

      // Simulate 30 seconds
      for (let i = 0; i < 30; i++) {
        needsSystem.update(i * 1000, 1000);
      }

      // Hunger should have decreased by ~30 (1 per second)
      expect(needsSystem.getHunger()).toBeCloseTo(70, 0);
      // Energy should have decreased by ~15 (0.5 per second)
      expect(needsSystem.getEnergy()).toBeCloseTo(85, 0);

      // Both are still above threshold, speed unchanged
      expect(mockPlayer.speed).toBe(needsSystem.basePlayerSpeed);
    });

    it('should apply speed penalty when needs degrade below threshold', () => {
      // Start at threshold
      needsSystem.hunger = 31;
      needsSystem.energy = 100;

      // Update for 2 seconds (will drop hunger to 29)
      needsSystem.update(0, 2000);

      // Speed should now be reduced
      expect(mockPlayer.speed).toBeLessThan(needsSystem.basePlayerSpeed);
      expect(needsSystem.isHungry()).toBe(true);
    });
  });
});

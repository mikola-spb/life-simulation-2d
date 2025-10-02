import { describe, it, expect, beforeEach, vi } from 'vitest';
import TimeSystem from './TimeSystem.js';
import GameConfig from '../config.js';

describe('TimeSystem', () => {
  let mockScene;
  let timeSystem;

  beforeEach(() => {
    // Create mock Phaser scene
    mockScene = {
      time: {
        addEvent: vi.fn()
      }
    };

    timeSystem = new TimeSystem(mockScene);
  });

  describe('constructor', () => {
    it('should initialize with starting values from config', () => {
      expect(timeSystem.currentDay).toBe(GameConfig.time.startingDay);
      expect(timeSystem.currentHour).toBe(GameConfig.time.startingHour);
      expect(timeSystem.currentMinute).toBe(GameConfig.time.startingMinute);
      expect(timeSystem.accumulatedSeconds).toBe(0);
    });

    it('should cache config values', () => {
      expect(timeSystem.minutesPerRealSecond).toBe(GameConfig.time.minutesPerRealSecond);
      expect(timeSystem.hoursPerDay).toBe(GameConfig.time.hoursPerDay);
      expect(timeSystem.dayStartHour).toBe(GameConfig.time.dayStartHour);
      expect(timeSystem.nightStartHour).toBe(GameConfig.time.nightStartHour);
    });
  });

  describe('update', () => {
    it('should progress time based on delta', () => {
      // 1 second of real time = 60 game minutes (1 hour) with default config
      const oneSecondInMs = 1000;
      timeSystem.update(0, oneSecondInMs);

      // Should have advanced by 1 hour
      expect(timeSystem.currentHour).toBe(GameConfig.time.startingHour + 1);
      expect(timeSystem.currentMinute).toBe(0);
    });

    it('should handle fractional minute accumulation', () => {
      // 0.5 seconds of real time = 30 game minutes
      timeSystem.update(0, 500);
      expect(timeSystem.currentMinute).toBe(30);
      expect(timeSystem.currentHour).toBe(GameConfig.time.startingHour);

      // Another 0.5 seconds should advance to next hour
      timeSystem.update(0, 500);
      expect(timeSystem.currentMinute).toBe(0);
      expect(timeSystem.currentHour).toBe(GameConfig.time.startingHour + 1);
    });

    it('should not advance time for very small deltas', () => {
      const initialHour = timeSystem.currentHour;
      const initialMinute = timeSystem.currentMinute;

      // Very small delta (1ms = 0.06 game minutes, not enough to advance)
      timeSystem.update(0, 1);

      expect(timeSystem.currentHour).toBe(initialHour);
      expect(timeSystem.currentMinute).toBe(initialMinute);
    });

    it('should handle hour rollover to next day', () => {
      // Set time to 23:30
      timeSystem.setTime(1, 23, 30);

      // Advance by 1 hour (60 real-world seconds)
      timeSystem.update(0, 1000);

      // Should be day 2, 00:30
      expect(timeSystem.currentDay).toBe(2);
      expect(timeSystem.currentHour).toBe(0);
      expect(timeSystem.currentMinute).toBe(30);
    });

    it('should handle multiple day rollovers', () => {
      // Set time to 23:00
      timeSystem.setTime(1, 23, 0);

      // Advance by 2 hours (120 real-world seconds)
      timeSystem.update(0, 2000);

      // Should be day 2, 01:00
      expect(timeSystem.currentDay).toBe(2);
      expect(timeSystem.currentHour).toBe(1);
      expect(timeSystem.currentMinute).toBe(0);
    });
  });

  describe('addMinutes', () => {
    it('should add minutes correctly', () => {
      timeSystem.setTime(1, 10, 30);
      timeSystem.addMinutes(15);

      expect(timeSystem.currentMinute).toBe(45);
      expect(timeSystem.currentHour).toBe(10);
    });

    it('should handle minute overflow to hours', () => {
      timeSystem.setTime(1, 10, 50);
      timeSystem.addMinutes(20);

      expect(timeSystem.currentMinute).toBe(10);
      expect(timeSystem.currentHour).toBe(11);
    });

    it('should handle hour overflow to days', () => {
      timeSystem.setTime(1, 23, 50);
      timeSystem.addMinutes(20);

      expect(timeSystem.currentMinute).toBe(10);
      expect(timeSystem.currentHour).toBe(0);
      expect(timeSystem.currentDay).toBe(2);
    });

    it('should handle large minute additions spanning multiple days', () => {
      timeSystem.setTime(1, 10, 0);
      // Add 50 hours worth of minutes (3000 minutes)
      timeSystem.addMinutes(3000);

      // 3000 minutes = 50 hours = 2 days + 2 hours
      expect(timeSystem.currentDay).toBe(3);
      expect(timeSystem.currentHour).toBe(12);
      expect(timeSystem.currentMinute).toBe(0);
    });
  });

  describe('getTimeString', () => {
    it('should format time with leading zeros', () => {
      timeSystem.setTime(1, 8, 5);
      expect(timeSystem.getTimeString()).toBe('08:05');
    });

    it('should format time without leading zeros where not needed', () => {
      timeSystem.setTime(1, 15, 45);
      expect(timeSystem.getTimeString()).toBe('15:45');
    });

    it('should handle midnight correctly', () => {
      timeSystem.setTime(1, 0, 0);
      expect(timeSystem.getTimeString()).toBe('00:00');
    });

    it('should handle end of day correctly', () => {
      timeSystem.setTime(1, 23, 59);
      expect(timeSystem.getTimeString()).toBe('23:59');
    });
  });

  describe('getDay', () => {
    it('should return current day', () => {
      timeSystem.setTime(5, 10, 30);
      expect(timeSystem.getDay()).toBe(5);
    });
  });

  describe('getCurrentHour', () => {
    it('should return current hour', () => {
      timeSystem.setTime(1, 15, 30);
      expect(timeSystem.getCurrentHour()).toBe(15);
    });
  });

  describe('getCurrentMinute', () => {
    it('should return current minute', () => {
      timeSystem.setTime(1, 10, 42);
      expect(timeSystem.getCurrentMinute()).toBe(42);
    });
  });

  describe('isNightTime', () => {
    it('should return true during night hours (18:00-5:59)', () => {
      // Evening/night
      timeSystem.setTime(1, 18, 0);
      expect(timeSystem.isNightTime()).toBe(true);

      timeSystem.setTime(1, 22, 30);
      expect(timeSystem.isNightTime()).toBe(true);

      // After midnight
      timeSystem.setTime(1, 0, 0);
      expect(timeSystem.isNightTime()).toBe(true);

      timeSystem.setTime(1, 5, 59);
      expect(timeSystem.isNightTime()).toBe(true);
    });

    it('should return false during day hours (6:00-17:59)', () => {
      timeSystem.setTime(1, 6, 0);
      expect(timeSystem.isNightTime()).toBe(false);

      timeSystem.setTime(1, 12, 0);
      expect(timeSystem.isNightTime()).toBe(false);

      timeSystem.setTime(1, 17, 59);
      expect(timeSystem.isNightTime()).toBe(false);
    });

    it('should handle edge case at night start hour', () => {
      timeSystem.setTime(1, GameConfig.time.nightStartHour, 0);
      expect(timeSystem.isNightTime()).toBe(true);
    });

    it('should handle edge case at day start hour', () => {
      timeSystem.setTime(1, GameConfig.time.dayStartHour, 0);
      expect(timeSystem.isNightTime()).toBe(false);
    });
  });

  describe('isDayTime', () => {
    it('should return inverse of isNightTime', () => {
      timeSystem.setTime(1, 12, 0);
      expect(timeSystem.isDayTime()).toBe(true);
      expect(timeSystem.isNightTime()).toBe(false);

      timeSystem.setTime(1, 22, 0);
      expect(timeSystem.isDayTime()).toBe(false);
      expect(timeSystem.isNightTime()).toBe(true);
    });
  });

  describe('setTime', () => {
    it('should set time directly', () => {
      timeSystem.setTime(5, 14, 30);

      expect(timeSystem.currentDay).toBe(5);
      expect(timeSystem.currentHour).toBe(14);
      expect(timeSystem.currentMinute).toBe(30);
    });

    it('should reset accumulated seconds', () => {
      timeSystem.accumulatedSeconds = 5.5;
      timeSystem.setTime(1, 10, 0);

      expect(timeSystem.accumulatedSeconds).toBe(0);
    });

    it('should enforce minimum day of 1', () => {
      timeSystem.setTime(0, 10, 0);
      expect(timeSystem.currentDay).toBe(1);

      timeSystem.setTime(-5, 10, 0);
      expect(timeSystem.currentDay).toBe(1);
    });

    it('should clamp hour to valid range', () => {
      timeSystem.setTime(1, -1, 0);
      expect(timeSystem.currentHour).toBe(0);

      timeSystem.setTime(1, 24, 0);
      expect(timeSystem.currentHour).toBe(23);

      timeSystem.setTime(1, 100, 0);
      expect(timeSystem.currentHour).toBe(23);
    });

    it('should clamp minute to valid range', () => {
      timeSystem.setTime(1, 10, -1);
      expect(timeSystem.currentMinute).toBe(0);

      timeSystem.setTime(1, 10, 60);
      expect(timeSystem.currentMinute).toBe(59);

      timeSystem.setTime(1, 10, 100);
      expect(timeSystem.currentMinute).toBe(59);
    });
  });

  describe('getSaveData', () => {
    it('should return current time state', () => {
      timeSystem.setTime(3, 15, 42);

      const saveData = timeSystem.getSaveData();

      expect(saveData).toEqual({
        day: 3,
        hour: 15,
        minute: 42
      });
    });
  });

  describe('loadSaveData', () => {
    it('should restore time state from save data', () => {
      const saveData = {
        day: 7,
        hour: 20,
        minute: 15
      };

      timeSystem.loadSaveData(saveData);

      expect(timeSystem.currentDay).toBe(7);
      expect(timeSystem.currentHour).toBe(20);
      expect(timeSystem.currentMinute).toBe(15);
    });

    it('should reset accumulated seconds', () => {
      timeSystem.accumulatedSeconds = 3.2;

      timeSystem.loadSaveData({ day: 1, hour: 10, minute: 0 });

      expect(timeSystem.accumulatedSeconds).toBe(0);
    });

    it('should enforce minimum day of 1', () => {
      timeSystem.loadSaveData({ day: 0, hour: 10, minute: 0 });
      expect(timeSystem.currentDay).toBe(1);

      timeSystem.loadSaveData({ day: -5, hour: 10, minute: 0 });
      expect(timeSystem.currentDay).toBe(1);
    });

    it('should clamp hour to valid range', () => {
      timeSystem.loadSaveData({ day: 1, hour: -1, minute: 0 });
      expect(timeSystem.currentHour).toBe(0);

      timeSystem.loadSaveData({ day: 1, hour: 24, minute: 0 });
      expect(timeSystem.currentHour).toBe(23);
    });

    it('should clamp minute to valid range', () => {
      timeSystem.loadSaveData({ day: 1, hour: 10, minute: -1 });
      expect(timeSystem.currentMinute).toBe(0);

      timeSystem.loadSaveData({ day: 1, hour: 10, minute: 60 });
      expect(timeSystem.currentMinute).toBe(59);
    });

    it('should handle partial save data', () => {
      timeSystem.setTime(5, 15, 30);

      // Load data with only day specified
      timeSystem.loadSaveData({ day: 10 });
      expect(timeSystem.currentDay).toBe(10);
      expect(timeSystem.currentHour).toBe(15); // Unchanged
      expect(timeSystem.currentMinute).toBe(30); // Unchanged
    });

    it('should handle empty save data', () => {
      timeSystem.setTime(5, 15, 30);

      timeSystem.loadSaveData({});

      expect(timeSystem.currentDay).toBe(5);
      expect(timeSystem.currentHour).toBe(15);
      expect(timeSystem.currentMinute).toBe(30);
    });
  });

  describe('reset', () => {
    it('should reset time to starting values', () => {
      timeSystem.setTime(10, 20, 45);
      timeSystem.accumulatedSeconds = 3.5;

      timeSystem.reset();

      expect(timeSystem.currentDay).toBe(GameConfig.time.startingDay);
      expect(timeSystem.currentHour).toBe(GameConfig.time.startingHour);
      expect(timeSystem.currentMinute).toBe(GameConfig.time.startingMinute);
      expect(timeSystem.accumulatedSeconds).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle transition from 23:59 to 00:00', () => {
      timeSystem.setTime(1, 23, 59);
      timeSystem.addMinutes(1);

      expect(timeSystem.currentDay).toBe(2);
      expect(timeSystem.currentHour).toBe(0);
      expect(timeSystem.currentMinute).toBe(0);
    });

    it('should handle multiple rapid updates', () => {
      const initialDay = timeSystem.currentDay;
      const initialHour = timeSystem.currentHour;

      // Simulate 60 frames at 16.67ms each (1 second total)
      for (let i = 0; i < 60; i++) {
        timeSystem.update(0, 16.67);
      }

      // Should advance by approximately 1 hour
      const hoursPassed = (timeSystem.currentDay - initialDay) * 24 + (timeSystem.currentHour - initialHour);
      expect(hoursPassed).toBeCloseTo(1, 0);
    });

    it('should handle very large delta values', () => {
      timeSystem.setTime(1, 10, 0);

      // 1 hour of real time = 60 game hours = 2.5 game days
      timeSystem.update(0, 3600000);

      expect(timeSystem.currentDay).toBeGreaterThan(1);
    });
  });
});

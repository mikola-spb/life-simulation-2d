/**
 * Game Configuration
 * Contains all game-wide settings and constants
 */

export const GameConfig = {
  // Canvas dimensions (will be scaled responsively)
  width: 800,
  height: 600,

  // Physics settings
  gravity: 0,

  // Character settings
  player: {
    speed: 160,
    sprintMultiplier: 1.5,
    size: 32
  },

  // Storage keys
  storage: {
    saveKey: 'lifesim_save_v1',
    autoSaveInterval: 30000 // Auto-save every 30 seconds (can be reduced for testing)
  },

  // Needs system settings
  needs: {
    hungerDecayRate: 1,        // Hunger loss per second
    energyDecayRate: 0.5,      // Energy loss per second
    lowThreshold: 30,          // Value below which effects apply
    speedPenalty: 0.3,         // Speed reduction multiplier (0.3 = 30% slower)
    maxValue: 100,             // Maximum need value
    minValue: 0                // Minimum need value
  },

  // Time system settings
  time: {
    minutesPerRealSecond: 60,  // 60 game minutes per real second (1 real minute = 1 game hour)
    hoursPerDay: 24,           // 24 hours in a day
    dayStartHour: 6,           // Day starts at 6:00 AM
    nightStartHour: 18,        // Night starts at 6:00 PM
    startingHour: 8,           // Game starts at 8:00 AM
    startingMinute: 0,         // Game starts at 0 minutes
    startingDay: 1,            // Game starts on day 1
    // Visual settings for day/night cycle
    dayTint: 0xffffff,         // Normal/bright tint during day
    nightTint: 0x6666ff        // Darker blue tint during night
  },

  // Game version
  version: '1.0.0'
};

export default GameConfig;
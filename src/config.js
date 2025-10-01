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

  // Game version
  version: '1.0.0'
};

export default GameConfig;
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

  // Game version
  version: '1.0.0'
};

export default GameConfig;
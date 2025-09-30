import GameConfig from '../config.js';

/**
 * SaveSystem
 * Handles saving and loading game state to local storage
 */
export default class SaveSystem {
  constructor() {
    this.saveKey = GameConfig.storage.saveKey;
  }

  /**
   * Save game state to local storage
   * @param {object} gameState - The game state to save
   * @returns {boolean} Success status
   */
  save(gameState) {
    try {
      const saveData = {
        version: GameConfig.version,
        timestamp: Date.now(),
        data: gameState
      };

      const serialized = JSON.stringify(saveData);
      localStorage.setItem(this.saveKey, serialized);

      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from local storage
   * @returns {object|null} The loaded game state or null if no save exists
   */
  load() {
    try {
      const serialized = localStorage.getItem(this.saveKey);

      if (!serialized) {
        console.log('No save data found');
        return null;
      }

      const saveData = JSON.parse(serialized);

      // Version check
      if (saveData.version !== GameConfig.version) {
        console.warn('Save data version mismatch. Migration may be needed.');
        // In the future, implement migration logic here
      }

      console.log('Game loaded successfully');
      return saveData.data;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if a save exists
   * @returns {boolean}
   */
  hasSave() {
    return localStorage.getItem(this.saveKey) !== null;
  }

  /**
   * Delete save data
   * @returns {boolean} Success status
   */
  deleteSave() {
    try {
      localStorage.removeItem(this.saveKey);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Get save metadata without loading full state
   * @returns {object|null}
   */
  getSaveMetadata() {
    try {
      const serialized = localStorage.getItem(this.saveKey);

      if (!serialized) {
        return null;
      }

      const saveData = JSON.parse(serialized);

      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        date: new Date(saveData.timestamp).toLocaleString()
      };
    } catch (error) {
      console.error('Failed to get save metadata:', error);
      return null;
    }
  }

  /**
   * Export save data as JSON string (for backup)
   * @returns {string|null}
   */
  exportSave() {
    try {
      const serialized = localStorage.getItem(this.saveKey);
      return serialized;
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  /**
   * Import save data from JSON string (for restore)
   * @param {string} saveDataString
   * @returns {boolean} Success status
   */
  importSave(saveDataString) {
    try {
      // Validate JSON
      JSON.parse(saveDataString);

      localStorage.setItem(this.saveKey, saveDataString);
      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
}
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SaveSystem from './SaveSystem.js';

describe('SaveSystem', () => {
  let saveSystem;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem(key) {
        return this.store[key] || null;
      },
      setItem(key, value) {
        this.store[key] = value;
      },
      removeItem(key) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      }
    };

    global.localStorage = mockLocalStorage;
    saveSystem = new SaveSystem();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('constructor', () => {
    it('should initialize with correct save key', () => {
      expect(saveSystem.saveKey).toBe('lifesim_save_v1');
    });
  });

  describe('save', () => {
    it('should save game state successfully', () => {
      const gameState = {
        player: { x: 100, y: 200 }
      };

      const result = saveSystem.save(gameState);

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem('lifesim_save_v1')).toBeTruthy();
    });

    it('should include version and timestamp in save data', () => {
      const gameState = {
        player: { x: 100, y: 200 }
      };

      saveSystem.save(gameState);
      const savedData = JSON.parse(mockLocalStorage.getItem('lifesim_save_v1'));

      expect(savedData.version).toBe('1.0.0');
      expect(savedData.timestamp).toBeDefined();
      expect(typeof savedData.timestamp).toBe('number');
      expect(savedData.data).toEqual(gameState);
    });

    it('should handle save errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      vi.spyOn(mockLocalStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      const result = saveSystem.save({ player: { x: 1, y: 1 } });

      expect(result).toBe(false);
    });
  });

  describe('load', () => {
    it('should load saved game state', () => {
      const gameState = {
        player: { x: 100, y: 200 }
      };

      saveSystem.save(gameState);
      const loaded = saveSystem.load();

      expect(loaded).toEqual(gameState);
    });

    it('should return null when no save exists', () => {
      const loaded = saveSystem.load();

      expect(loaded).toBeNull();
    });

    it('should handle corrupted save data', () => {
      mockLocalStorage.setItem('lifesim_save_v1', 'invalid json');

      const loaded = saveSystem.load();

      expect(loaded).toBeNull();
    });

    it('should warn on version mismatch', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const oldSaveData = {
        version: '0.9.0',
        timestamp: Date.now(),
        data: { player: { x: 1, y: 1 } }
      };

      mockLocalStorage.setItem('lifesim_save_v1', JSON.stringify(oldSaveData));
      saveSystem.load();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('version mismatch')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('hasSave', () => {
    it('should return true when save exists', () => {
      saveSystem.save({ player: { x: 1, y: 1 } });

      expect(saveSystem.hasSave()).toBe(true);
    });

    it('should return false when no save exists', () => {
      expect(saveSystem.hasSave()).toBe(false);
    });
  });

  describe('deleteSave', () => {
    it('should delete existing save', () => {
      saveSystem.save({ player: { x: 1, y: 1 } });
      expect(saveSystem.hasSave()).toBe(true);

      const result = saveSystem.deleteSave();

      expect(result).toBe(true);
      expect(saveSystem.hasSave()).toBe(false);
    });

    it('should handle delete errors', () => {
      vi.spyOn(mockLocalStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Delete failed');
      });

      const result = saveSystem.deleteSave();

      expect(result).toBe(false);
    });
  });

  describe('getSaveMetadata', () => {
    it('should return metadata without full game state', () => {
      const gameState = {
        player: { x: 100, y: 200 }
      };

      saveSystem.save(gameState);
      const metadata = saveSystem.getSaveMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.date).toBeDefined();
      expect(metadata.data).toBeUndefined();
    });

    it('should return null when no save exists', () => {
      const metadata = saveSystem.getSaveMetadata();

      expect(metadata).toBeNull();
    });
  });

  describe('exportSave', () => {
    it('should export save data as string', () => {
      const gameState = {
        player: { x: 100, y: 200 }
      };

      saveSystem.save(gameState);
      const exported = saveSystem.exportSave();

      expect(typeof exported).toBe('string');
      expect(exported).toBeTruthy();

      const parsed = JSON.parse(exported);
      expect(parsed.data).toEqual(gameState);
    });

    it('should return null when no save exists', () => {
      const exported = saveSystem.exportSave();

      expect(exported).toBeNull();
    });
  });

  describe('importSave', () => {
    it('should import valid save data', () => {
      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        data: { player: { x: 50, y: 75 } }
      };

      const result = saveSystem.importSave(JSON.stringify(saveData));

      expect(result).toBe(true);

      const loaded = saveSystem.load();
      expect(loaded).toEqual(saveData.data);
    });

    it('should reject invalid JSON', () => {
      const result = saveSystem.importSave('invalid json');

      expect(result).toBe(false);
    });
  });

  describe('integration', () => {
    it('should handle complete save/load cycle', () => {
      const originalState = {
        player: { x: 123, y: 456 },
        timestamp: Date.now()
      };

      // Save
      const saveResult = saveSystem.save(originalState);
      expect(saveResult).toBe(true);

      // Check metadata
      const metadata = saveSystem.getSaveMetadata();
      expect(metadata.version).toBe('1.0.0');

      // Load
      const loadedState = saveSystem.load();
      expect(loadedState).toEqual(originalState);

      // Export
      const exported = saveSystem.exportSave();
      expect(exported).toBeTruthy();

      // Delete
      const deleteResult = saveSystem.deleteSave();
      expect(deleteResult).toBe(true);

      // Import back
      const importResult = saveSystem.importSave(exported);
      expect(importResult).toBe(true);

      // Verify imported data
      const reloadedState = saveSystem.load();
      expect(reloadedState).toEqual(originalState);
    });
  });
});
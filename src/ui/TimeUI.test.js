import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing TimeUI
vi.mock('phaser', () => ({
  default: {}
}));

import TimeUI from './TimeUI.js';

describe('TimeUI', () => {
  let mockScene;
  let mockContainer;
  let mockText;
  let mockCamera;
  let timeUI;

  beforeEach(() => {
    // Create mock text object
    mockText = {
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      destroy: vi.fn()
    };

    // Create mock container
    mockContainer = {
      add: vi.fn(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      visible: true
    };

    // Create mock camera
    mockCamera = {
      width: 800,
      height: 600
    };

    // Create mock scene
    mockScene = {
      add: {
        container: vi.fn().mockReturnValue(mockContainer),
        text: vi.fn().mockReturnValue(mockText)
      },
      cameras: {
        main: mockCamera
      }
    };

    timeUI = new TimeUI(mockScene);
  });

  describe('constructor', () => {
    it('should create a container', () => {
      expect(mockScene.add.container).toHaveBeenCalledWith(0, 0);
      expect(mockContainer.setScrollFactor).toHaveBeenCalledWith(0);
      expect(mockContainer.setDepth).toHaveBeenCalledWith(100);
    });

    it('should create time display text', () => {
      expect(mockScene.add.text).toHaveBeenCalled();
      expect(mockText.setOrigin).toHaveBeenCalledWith(1, 0);
      expect(mockText.setScrollFactor).toHaveBeenCalledWith(0);
      expect(mockText.setDepth).toHaveBeenCalledWith(100);
    });

    it('should add text to container', () => {
      expect(mockContainer.add).toHaveBeenCalledWith(mockText);
    });

    it('should position text in top-right corner', () => {
      // Default padding is 20
      const expectedX = 800 - 20; // camera.width - padding
      const expectedY = 20; // padding
      expect(mockText.setPosition).toHaveBeenCalledWith(expectedX, expectedY);
    });
  });

  describe('updatePosition', () => {
    it('should update text position based on camera size', () => {
      mockCamera.width = 1024;
      mockCamera.height = 768;

      timeUI.updatePosition();

      const expectedX = 1024 - 20; // camera.width - padding
      const expectedY = 20; // padding
      expect(mockText.setPosition).toHaveBeenCalledWith(expectedX, expectedY);
    });

    it('should handle different padding values', () => {
      timeUI.padding = 50;
      mockCamera.width = 800;

      timeUI.updatePosition();

      const expectedX = 800 - 50;
      const expectedY = 50;
      expect(mockText.setPosition).toHaveBeenCalledWith(expectedX, expectedY);
    });
  });

  describe('update', () => {
    it('should update text with formatted time string', () => {
      timeUI.update(1, '08:30');

      expect(mockText.setText).toHaveBeenCalledWith('Day 1 - 08:30');
    });

    it('should handle different day numbers', () => {
      timeUI.update(15, '14:45');

      expect(mockText.setText).toHaveBeenCalledWith('Day 15 - 14:45');
    });

    it('should handle midnight time', () => {
      timeUI.update(3, '00:00');

      expect(mockText.setText).toHaveBeenCalledWith('Day 3 - 00:00');
    });

    it('should handle end of day time', () => {
      timeUI.update(7, '23:59');

      expect(mockText.setText).toHaveBeenCalledWith('Day 7 - 23:59');
    });

    it('should not crash if text is null', () => {
      timeUI.timeText = null;

      expect(() => {
        timeUI.update(1, '08:00');
      }).not.toThrow();
    });
  });

  describe('show', () => {
    it('should make container visible', () => {
      timeUI.show();

      expect(mockContainer.setVisible).toHaveBeenCalledWith(true);
    });
  });

  describe('hide', () => {
    it('should make container invisible', () => {
      timeUI.hide();

      expect(mockContainer.setVisible).toHaveBeenCalledWith(false);
    });
  });

  describe('isVisible', () => {
    it('should return true when container is visible', () => {
      mockContainer.visible = true;

      expect(timeUI.isVisible()).toBe(true);
    });

    it('should return false when container is invisible', () => {
      mockContainer.visible = false;

      expect(timeUI.isVisible()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should destroy container', () => {
      timeUI.destroy();

      expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should null out references', () => {
      timeUI.destroy();

      expect(timeUI.container).toBeNull();
      expect(timeUI.timeText).toBeNull();
    });

    it('should handle being called when container is already null', () => {
      timeUI.container = null;

      expect(() => {
        timeUI.destroy();
      }).not.toThrow();
    });

    it('should not crash if called multiple times', () => {
      timeUI.destroy();

      expect(() => {
        timeUI.destroy();
      }).not.toThrow();
    });
  });

  describe('configuration', () => {
    it('should use correct padding value', () => {
      expect(timeUI.padding).toBe(20);
    });

    it('should use correct font size', () => {
      expect(timeUI.fontSize).toBe(18);
    });

    it('should use correct font family', () => {
      expect(timeUI.fontFamily).toBe('Arial');
    });

    it('should use correct colors', () => {
      expect(timeUI.textColor).toBe('#ffffff');
      expect(timeUI.backgroundColor).toBe('#000000');
    });

    it('should use correct alpha', () => {
      expect(timeUI.backgroundAlpha).toBe(0.7);
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid consecutive updates', () => {
      for (let i = 0; i < 100; i++) {
        const minute = String(i % 60).padStart(2, '0');
        timeUI.update(1, `08:${minute}`);
      }

      // Should have been called 100 times (initial + 100 updates)
      expect(mockText.setText).toHaveBeenCalled();
    });

    it('should maintain state after show/hide cycles', () => {
      timeUI.update(5, '12:30');
      timeUI.hide();
      timeUI.show();

      // Text should still have the last update
      const lastCall = mockText.setText.mock.calls[mockText.setText.mock.calls.length - 1];
      expect(lastCall[0]).toBe('Day 5 - 12:30');
    });
  });
});

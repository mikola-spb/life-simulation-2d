import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before importing NeedsUI
vi.mock('phaser', () => ({
  default: {}
}));

import NeedsUI from './NeedsUI.js';

describe('NeedsUI', () => {
  let needsUI;
  let mockScene;
  let mockContainer;
  let mockHungerBar;
  let mockEnergyBar;
  let mockHungerText;
  let mockEnergyText;

  beforeEach(() => {
    // Mock game objects
    mockHungerBar = {
      width: 150,
      setFillStyle: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis()
    };

    mockEnergyBar = {
      width: 150,
      setFillStyle: vi.fn(),
      setOrigin: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis()
    };

    mockHungerText = {
      setText: vi.fn(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis()
    };

    mockEnergyText = {
      setText: vi.fn(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis()
    };

    mockContainer = {
      add: vi.fn(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
      visible: true
    };

    // Mock scene
    mockScene = {
      add: {
        container: vi.fn().mockReturnValue(mockContainer),
        text: vi.fn()
          .mockReturnValueOnce({ setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }) // hunger label
          .mockReturnValueOnce(mockHungerText) // hunger text
          .mockReturnValueOnce({ setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }) // energy label
          .mockReturnValueOnce(mockEnergyText), // energy text
        rectangle: vi.fn()
          .mockReturnValueOnce({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }) // hunger bg
          .mockReturnValueOnce(mockHungerBar) // hunger bar
          .mockReturnValueOnce({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }) // energy bg
          .mockReturnValueOnce(mockEnergyBar) // energy bar
      }
    };

    needsUI = new NeedsUI(mockScene);
  });

  describe('constructor', () => {
    it('should create a container', () => {
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(needsUI.container).toBe(mockContainer);
    });

    it('should set container to fixed scroll factor', () => {
      expect(mockContainer.setScrollFactor).toHaveBeenCalledWith(0);
    });

    it('should set container depth above game world', () => {
      expect(mockContainer.setDepth).toHaveBeenCalledWith(100);
    });

    it('should create hunger and energy bars', () => {
      expect(needsUI.hungerBar).toBeDefined();
      expect(needsUI.energyBar).toBeDefined();
    });

    it('should create percentage text elements', () => {
      expect(needsUI.hungerText).toBeDefined();
      expect(needsUI.energyText).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update both hunger and energy bars', () => {
      const updateHungerSpy = vi.spyOn(needsUI, 'updateHungerBar');
      const updateEnergySpy = vi.spyOn(needsUI, 'updateEnergyBar');

      needsUI.update(80, 60);

      expect(updateHungerSpy).toHaveBeenCalledWith(80);
      expect(updateEnergySpy).toHaveBeenCalledWith(60);
    });
  });

  describe('updateHungerBar', () => {
    it('should update bar width based on value', () => {
      needsUI.updateHungerBar(50);

      expect(mockHungerBar.width).toBe(75); // 50% of 150px
    });

    it('should update percentage text', () => {
      needsUI.updateHungerBar(75);

      expect(mockHungerText.setText).toHaveBeenCalledWith('75%');
    });

    it('should set green color for high values (>60)', () => {
      needsUI.updateHungerBar(80);

      expect(mockHungerBar.setFillStyle).toHaveBeenCalledWith(0x00ff00);
    });

    it('should set yellow color for medium values (30-60)', () => {
      needsUI.updateHungerBar(45);

      expect(mockHungerBar.setFillStyle).toHaveBeenCalledWith(0xffff00);
    });

    it('should set red color for low values (<30)', () => {
      needsUI.updateHungerBar(15);

      expect(mockHungerBar.setFillStyle).toHaveBeenCalledWith(0xff0000);
    });

    it('should clamp values above 100', () => {
      needsUI.updateHungerBar(150);

      expect(mockHungerBar.width).toBe(150); // Max width
      expect(mockHungerText.setText).toHaveBeenCalledWith('100%');
    });

    it('should clamp values below 0', () => {
      needsUI.updateHungerBar(-10);

      expect(mockHungerBar.width).toBe(0);
      expect(mockHungerText.setText).toHaveBeenCalledWith('0%');
    });

    it('should round percentage text to whole numbers', () => {
      needsUI.updateHungerBar(66.7);

      expect(mockHungerText.setText).toHaveBeenCalledWith('67%');
    });
  });

  describe('updateEnergyBar', () => {
    it('should update bar width based on value', () => {
      needsUI.updateEnergyBar(25);

      expect(mockEnergyBar.width).toBe(37.5); // 25% of 150px
    });

    it('should update percentage text', () => {
      needsUI.updateEnergyBar(90);

      expect(mockEnergyText.setText).toHaveBeenCalledWith('90%');
    });

    it('should set green color for high values', () => {
      needsUI.updateEnergyBar(70);

      expect(mockEnergyBar.setFillStyle).toHaveBeenCalledWith(0x00ff00);
    });

    it('should set yellow color for medium values', () => {
      needsUI.updateEnergyBar(50);

      expect(mockEnergyBar.setFillStyle).toHaveBeenCalledWith(0xffff00);
    });

    it('should set red color for low values', () => {
      needsUI.updateEnergyBar(10);

      expect(mockEnergyBar.setFillStyle).toHaveBeenCalledWith(0xff0000);
    });
  });

  describe('getColorForValue', () => {
    it('should return green for values > 60', () => {
      expect(needsUI.getColorForValue(61)).toBe(0x00ff00);
      expect(needsUI.getColorForValue(100)).toBe(0x00ff00);
    });

    it('should return yellow for values between 30 and 60', () => {
      expect(needsUI.getColorForValue(30)).toBe(0xffff00);
      expect(needsUI.getColorForValue(45)).toBe(0xffff00);
      expect(needsUI.getColorForValue(60)).toBe(0xffff00);
    });

    it('should return red for values < 30', () => {
      expect(needsUI.getColorForValue(29)).toBe(0xff0000);
      expect(needsUI.getColorForValue(0)).toBe(0xff0000);
    });
  });

  describe('show', () => {
    it('should set container visibility to true', () => {
      needsUI.show();

      expect(mockContainer.setVisible).toHaveBeenCalledWith(true);
    });
  });

  describe('hide', () => {
    it('should set container visibility to false', () => {
      needsUI.hide();

      expect(mockContainer.setVisible).toHaveBeenCalledWith(false);
    });
  });

  describe('isVisible', () => {
    it('should return container visibility', () => {
      mockContainer.visible = true;
      expect(needsUI.isVisible()).toBe(true);

      mockContainer.visible = false;
      expect(needsUI.isVisible()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should destroy container', () => {
      needsUI.destroy();

      expect(mockContainer.destroy).toHaveBeenCalled();
    });

    it('should set container to null', () => {
      needsUI.destroy();

      expect(needsUI.container).toBeNull();
    });

    it('should handle being called when container is null', () => {
      needsUI.container = null;

      expect(() => needsUI.destroy()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle exact threshold values correctly', () => {
      // At 60, should be yellow (not green)
      needsUI.updateHungerBar(60);
      expect(mockHungerBar.setFillStyle).toHaveBeenCalledWith(0xffff00);

      // At 30, should be yellow (not red)
      needsUI.updateEnergyBar(30);
      expect(mockEnergyBar.setFillStyle).toHaveBeenCalledWith(0xffff00);
    });

    it('should handle zero values', () => {
      needsUI.update(0, 0);

      expect(mockHungerBar.width).toBe(0);
      expect(mockEnergyBar.width).toBe(0);
      expect(mockHungerText.setText).toHaveBeenCalledWith('0%');
      expect(mockEnergyText.setText).toHaveBeenCalledWith('0%');
    });

    it('should handle full values', () => {
      needsUI.update(100, 100);

      expect(mockHungerBar.width).toBe(150);
      expect(mockEnergyBar.width).toBe(150);
      expect(mockHungerText.setText).toHaveBeenCalledWith('100%');
      expect(mockEnergyText.setText).toHaveBeenCalledWith('100%');
    });
  });
});

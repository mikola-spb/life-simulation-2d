import { describe, it, expect, beforeEach } from 'vitest';
import Appearance from './Appearance.js';

describe('Appearance', () => {
  describe('constructor', () => {
    it('should create appearance with default values', () => {
      const appearance = new Appearance();

      expect(appearance.skinTone).toBe(Appearance.DEFAULTS.skinTone);
      expect(appearance.hairColor).toBe(Appearance.DEFAULTS.hairColor);
      expect(appearance.shirtColor).toBe(Appearance.DEFAULTS.shirtColor);
      expect(appearance.pantsColor).toBe(Appearance.DEFAULTS.pantsColor);
    });

    it('should create appearance with custom values', () => {
      const config = {
        skinTone: 0xd4a574,
        hairColor: 0xffd700,
        shirtColor: 0xff4a4a,
        pantsColor: 0x1a1a1a
      };

      const appearance = new Appearance(config);

      expect(appearance.skinTone).toBe(config.skinTone);
      expect(appearance.hairColor).toBe(config.hairColor);
      expect(appearance.shirtColor).toBe(config.shirtColor);
      expect(appearance.pantsColor).toBe(config.pantsColor);
    });

    it('should use defaults for missing values', () => {
      const config = {
        skinTone: 0xd4a574
      };

      const appearance = new Appearance(config);

      expect(appearance.skinTone).toBe(config.skinTone);
      expect(appearance.hairColor).toBe(Appearance.DEFAULTS.hairColor);
      expect(appearance.shirtColor).toBe(Appearance.DEFAULTS.shirtColor);
      expect(appearance.pantsColor).toBe(Appearance.DEFAULTS.pantsColor);
    });
  });

  describe('getSaveData', () => {
    it('should return all appearance properties', () => {
      const config = {
        skinTone: 0xd4a574,
        hairColor: 0xffd700,
        shirtColor: 0xff4a4a,
        pantsColor: 0x1a1a1a
      };

      const appearance = new Appearance(config);
      const saveData = appearance.getSaveData();

      expect(saveData).toEqual({
        skinTone: config.skinTone,
        hairColor: config.hairColor,
        shirtColor: config.shirtColor,
        pantsColor: config.pantsColor
      });
    });
  });

  describe('loadSaveData', () => {
    it('should load all appearance properties', () => {
      const appearance = new Appearance();
      const saveData = {
        skinTone: 0xd4a574,
        hairColor: 0xffd700,
        shirtColor: 0xff4a4a,
        pantsColor: 0x1a1a1a
      };

      appearance.loadSaveData(saveData);

      expect(appearance.skinTone).toBe(saveData.skinTone);
      expect(appearance.hairColor).toBe(saveData.hairColor);
      expect(appearance.shirtColor).toBe(saveData.shirtColor);
      expect(appearance.pantsColor).toBe(saveData.pantsColor);
    });

    it('should load partial appearance data', () => {
      const appearance = new Appearance();
      const originalHairColor = appearance.hairColor;
      const saveData = {
        skinTone: 0xd4a574,
        shirtColor: 0xff4a4a
      };

      appearance.loadSaveData(saveData);

      expect(appearance.skinTone).toBe(saveData.skinTone);
      expect(appearance.hairColor).toBe(originalHairColor); // unchanged
      expect(appearance.shirtColor).toBe(saveData.shirtColor);
    });
  });

  describe('clone', () => {
    it('should create a copy of the appearance', () => {
      const original = new Appearance({
        skinTone: 0xd4a574,
        hairColor: 0xffd700,
        shirtColor: 0xff4a4a,
        pantsColor: 0x1a1a1a
      });

      const clone = original.clone();

      expect(clone).not.toBe(original);
      expect(clone.skinTone).toBe(original.skinTone);
      expect(clone.hairColor).toBe(original.hairColor);
      expect(clone.shirtColor).toBe(original.shirtColor);
      expect(clone.pantsColor).toBe(original.pantsColor);
    });
  });

  describe('randomize', () => {
    it('should create appearance with valid option values', () => {
      const appearance = Appearance.randomize();

      // Check that each property matches one of the valid options
      const skinToneValues = Object.values(Appearance.OPTIONS.skinTones);
      const hairColorValues = Object.values(Appearance.OPTIONS.hairColors);
      const shirtColorValues = Object.values(Appearance.OPTIONS.shirtColors);
      const pantsColorValues = Object.values(Appearance.OPTIONS.pantsColors);

      expect(skinToneValues).toContain(appearance.skinTone);
      expect(hairColorValues).toContain(appearance.hairColor);
      expect(shirtColorValues).toContain(appearance.shirtColor);
      expect(pantsColorValues).toContain(appearance.pantsColor);
    });

    it('should create different appearances on multiple calls', () => {
      // Generate multiple appearances and check for variation
      const appearances = Array.from({ length: 20 }, () => Appearance.randomize());

      // Check that not all appearances are identical (very unlikely if randomization works)
      const uniqueSkinTones = new Set(appearances.map(a => a.skinTone));
      const uniqueHairColors = new Set(appearances.map(a => a.hairColor));

      // With 20 random appearances, we should see some variation
      expect(uniqueSkinTones.size).toBeGreaterThan(1);
      expect(uniqueHairColors.size).toBeGreaterThan(1);
    });
  });

  describe('OPTIONS', () => {
    it('should have all required option categories', () => {
      expect(Appearance.OPTIONS.skinTones).toBeDefined();
      expect(Appearance.OPTIONS.hairColors).toBeDefined();
      expect(Appearance.OPTIONS.shirtColors).toBeDefined();
      expect(Appearance.OPTIONS.pantsColors).toBeDefined();
    });

    it('should have multiple options in each category', () => {
      expect(Object.keys(Appearance.OPTIONS.skinTones).length).toBeGreaterThan(1);
      expect(Object.keys(Appearance.OPTIONS.hairColors).length).toBeGreaterThan(1);
      expect(Object.keys(Appearance.OPTIONS.shirtColors).length).toBeGreaterThan(1);
      expect(Object.keys(Appearance.OPTIONS.pantsColors).length).toBeGreaterThan(1);
    });

    it('should use valid hex color values', () => {
      const allColors = [
        ...Object.values(Appearance.OPTIONS.skinTones),
        ...Object.values(Appearance.OPTIONS.hairColors),
        ...Object.values(Appearance.OPTIONS.shirtColors),
        ...Object.values(Appearance.OPTIONS.pantsColors)
      ];

      allColors.forEach(color => {
        expect(color).toBeGreaterThanOrEqual(0x000000);
        expect(color).toBeLessThanOrEqual(0xffffff);
      });
    });
  });
});

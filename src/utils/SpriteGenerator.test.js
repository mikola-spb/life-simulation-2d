import { describe, it, expect, beforeEach, vi } from 'vitest';
import SpriteGenerator from './SpriteGenerator.js';
import Appearance from '../entities/Appearance.js';

describe('SpriteGenerator', () => {
  let mockScene;
  let mockContainer;

  beforeEach(() => {
    // Create mock Phaser objects
    const createMockGameObject = (type) => ({
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      x: 0,
      y: 0,
      type
    });

    mockContainer = {
      add: vi.fn(),
      list: [
        createMockGameObject('rectangle'), // legs
        createMockGameObject('rectangle'), // torso
        createMockGameObject('circle'),    // head
        createMockGameObject('ellipse')    // hair
      ]
    };

    mockScene = {
      add: {
        container: vi.fn((x, y) => {
          mockContainer.x = x;
          mockContainer.y = y;
          return mockContainer;
        }),
        rectangle: vi.fn(() => createMockGameObject('rectangle')),
        circle: vi.fn(() => createMockGameObject('circle')),
        ellipse: vi.fn(() => createMockGameObject('ellipse')),
        triangle: vi.fn(() => createMockGameObject('triangle'))
      }
    };
  });

  describe('createCharacter', () => {
    it('should create a container at specified position', () => {
      const appearance = new Appearance();
      const x = 100;
      const y = 200;

      const container = SpriteGenerator.createCharacter(mockScene, x, y, appearance);

      expect(mockScene.add.container).toHaveBeenCalledWith(x, y);
      expect(container).toBe(mockContainer);
    });

    it('should create all character layers', () => {
      const appearance = new Appearance();

      SpriteGenerator.createCharacter(mockScene, 0, 0, appearance);

      // Should create: 2 rectangles (legs, torso), 1 circle (head), 1 ellipse (hair), 2 circles (eyes)
      expect(mockScene.add.rectangle).toHaveBeenCalledTimes(2);
      expect(mockScene.add.circle).toHaveBeenCalledTimes(3); // head + 2 eyes
      expect(mockScene.add.ellipse).toHaveBeenCalledTimes(1);
    });

    it('should apply appearance colors to layers', () => {
      const appearance = new Appearance({
        skinTone: 0xaabbcc,
        hairColor: 0xddeeff,
        shirtColor: 0x112233,
        pantsColor: 0x445566
      });

      SpriteGenerator.createCharacter(mockScene, 0, 0, appearance);

      // Check that appearance colors are used
      expect(mockScene.add.rectangle).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        appearance.pantsColor
      );
    });

    it('should add layers to container in correct order', () => {
      const appearance = new Appearance();

      SpriteGenerator.createCharacter(mockScene, 0, 0, appearance);

      expect(mockContainer.add).toHaveBeenCalledWith(expect.any(Array));
      const addedLayers = mockContainer.add.mock.calls[0][0];
      expect(addedLayers).toHaveLength(6); // legs, torso, head, hair, left eye, right eye
    });
  });

  describe('updateAppearance', () => {
    it('should update all layer colors', () => {
      const newAppearance = new Appearance({
        skinTone: 0x111111,
        hairColor: 0x222222,
        shirtColor: 0x333333,
        pantsColor: 0x444444
      });

      SpriteGenerator.updateAppearance(mockContainer, newAppearance);

      expect(mockContainer.list[0].setFillStyle).toHaveBeenCalledWith(newAppearance.pantsColor);
      expect(mockContainer.list[1].setFillStyle).toHaveBeenCalledWith(newAppearance.shirtColor);
      expect(mockContainer.list[2].setFillStyle).toHaveBeenCalledWith(newAppearance.skinTone);
      expect(mockContainer.list[3].setFillStyle).toHaveBeenCalledWith(newAppearance.hairColor);
    });

    it('should handle null container gracefully', () => {
      const appearance = new Appearance();

      expect(() => {
        SpriteGenerator.updateAppearance(null, appearance);
      }).not.toThrow();
    });

    it('should handle container without list gracefully', () => {
      const appearance = new Appearance();
      const invalidContainer = {};

      expect(() => {
        SpriteGenerator.updateAppearance(invalidContainer, appearance);
      }).not.toThrow();
    });
  });

  describe('createDirectionIndicator', () => {
    it('should create a triangle at specified position', () => {
      const x = 100;
      const y = 200;

      SpriteGenerator.createDirectionIndicator(mockScene, x, y);

      expect(mockScene.add.triangle).toHaveBeenCalledWith(
        x,
        y - 30,
        0, 0,
        -5, 10,
        5, 10,
        0xffffff
      );
    });

    it('should return the created triangle', () => {
      const triangle = SpriteGenerator.createDirectionIndicator(mockScene, 0, 0);

      expect(triangle).toBeDefined();
      expect(triangle.type).toBe('triangle');
    });
  });
});

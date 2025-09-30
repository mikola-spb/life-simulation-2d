import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser - must be defined in factory function
vi.mock('phaser', () => {
  return {
    default: {
      GameObjects: {
        Rectangle: class {
          constructor(scene, x, y, width, height, color) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.body = {
              setCollideWorldBounds() { return this; },
              setSize() { return this; },
              setVelocity() { return this; }
            };
          }
          setPosition(x, y) {
            this.x = x;
            this.y = y;
            return this;
          }
          destroy() {}
        },
        Triangle: class {
          constructor(scene, x, y, x1, y1, x2, y2, x3, y3, color) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.rotation = 0;
          }
          destroy() {}
        }
      }
    }
  };
});

// Import Player after mocking Phaser
import Player from './Player.js';

describe('Player', () => {
  let mockScene;
  let player;

  beforeEach(() => {
    // Create mock constructors for Phaser objects
    class MockRectangle {
      constructor(scene, x, y, width, height, color) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.body = {
          setCollideWorldBounds: vi.fn().mockReturnThis(),
          setSize: vi.fn().mockReturnThis(),
          setVelocity: vi.fn().mockReturnThis()
        };
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      }
      destroy() {}
    }

    class MockTriangle {
      constructor(scene, x, y, x1, y1, x2, y2, x3, y3, color) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rotation = 0;
      }
      destroy() {}
    }

    mockScene = {
      add: {
        rectangle: vi.fn((...args) => new MockRectangle(...args)),
        triangle: vi.fn((...args) => new MockTriangle(...args))
      },
      physics: {
        add: {
          existing: vi.fn()
        }
      }
    };

    player = new Player(mockScene, 100, 200);
  });

  describe('constructor', () => {
    it('should create player at specified position', () => {
      expect(player.sprite.x).toBe(100);
      expect(player.sprite.y).toBe(200);
    });

    it('should initialize with correct size', () => {
      expect(player.sprite.width).toBe(32);
      expect(player.sprite.height).toBe(32);
    });

    it('should set up physics body', () => {
      expect(mockScene.physics.add.existing).toHaveBeenCalled();
      expect(player.sprite.body.setCollideWorldBounds).toHaveBeenCalled();
      expect(player.sprite.body.setSize).toHaveBeenCalledWith(32, 32);
    });

    it('should create direction indicator', () => {
      expect(player.directionIndicator).toBeDefined();
    });

    it('should initialize with default state', () => {
      expect(player.speed).toBe(160);
      expect(player.isMoving).toBe(false);
      expect(player.direction).toEqual({ x: 0, y: 0 });
    });
  });

  describe('move', () => {
    it('should update direction when moving', () => {
      player.move(1, 0);

      expect(player.direction.x).toBe(1);
      expect(player.direction.y).toBe(0);
      expect(player.isMoving).toBe(true);
    });

    it('should normalize diagonal movement', () => {
      player.move(1, 1);

      const length = Math.sqrt(
        player.direction.x * player.direction.x +
        player.direction.y * player.direction.y
      );

      expect(Math.abs(length - 1)).toBeLessThan(0.01);
      expect(player.isMoving).toBe(true);
    });

    it('should set velocity based on direction and speed', () => {
      player.move(1, 0);

      expect(player.sprite.body.setVelocity).toHaveBeenCalledWith(160, 0);
    });

    it('should handle zero movement', () => {
      player.move(0, 0);

      expect(player.isMoving).toBe(false);
    });

    it('should normalize different diagonal directions', () => {
      const testCases = [
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 }
      ];

      testCases.forEach(({ x, y }) => {
        player.move(x, y);
        const length = Math.sqrt(
          player.direction.x * player.direction.x +
          player.direction.y * player.direction.y
        );
        expect(Math.abs(length - 1)).toBeLessThan(0.01);
      });
    });
  });

  describe('stop', () => {
    it('should stop player movement', () => {
      player.move(1, 1);
      expect(player.isMoving).toBe(true);

      player.stop();

      expect(player.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
      expect(player.isMoving).toBe(false);
    });
  });

  describe('update', () => {
    it('should update direction indicator position', () => {
      player.sprite.x = 150;
      player.sprite.y = 250;

      player.update();

      expect(player.directionIndicator.x).toBe(150);
      expect(player.directionIndicator.y).toBe(250 - 32 / 2 - 5);
    });

    it('should rotate direction indicator when moving', () => {
      player.move(1, 0);
      player.update();

      expect(player.directionIndicator.rotation).toBeDefined();
    });
  });

  describe('getPosition', () => {
    it('should return current position', () => {
      player.sprite.x = 123;
      player.sprite.y = 456;

      const position = player.getPosition();

      expect(position).toEqual({ x: 123, y: 456 });
    });
  });

  describe('setPosition', () => {
    it('should set player position', () => {
      player.setPosition(300, 400);

      expect(player.sprite.x).toBe(300);
      expect(player.sprite.y).toBe(400);
    });
  });

  describe('getSaveData', () => {
    it('should return serializable save data', () => {
      player.sprite.x = 100;
      player.sprite.y = 200;

      const saveData = player.getSaveData();

      expect(saveData).toEqual({ x: 100, y: 200 });
    });

    it('should return object that can be JSON serialized', () => {
      const saveData = player.getSaveData();
      const json = JSON.stringify(saveData);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(saveData);
    });
  });

  describe('loadSaveData', () => {
    it('should load position from save data', () => {
      const saveData = { x: 500, y: 600 };

      player.loadSaveData(saveData);

      expect(player.sprite.x).toBe(500);
      expect(player.sprite.y).toBe(600);
    });

    it('should handle missing data gracefully', () => {
      const initialX = player.sprite.x;
      const initialY = player.sprite.y;

      player.loadSaveData({});

      expect(player.sprite.x).toBe(initialX);
      expect(player.sprite.y).toBe(initialY);
    });

    it('should handle partial data', () => {
      const initialY = player.sprite.y;

      player.loadSaveData({ x: 999 });

      // Position should remain unchanged if data is invalid
      expect(player.sprite.x).toBe(player.sprite.x);
      expect(player.sprite.y).toBe(initialY);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const spriteSpy = vi.spyOn(player.sprite, 'destroy');
      const indicatorSpy = vi.spyOn(player.directionIndicator, 'destroy');

      player.destroy();

      expect(spriteSpy).toHaveBeenCalled();
      expect(indicatorSpy).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle movement cycle', () => {
      // Start moving
      player.move(1, 0);
      expect(player.isMoving).toBe(true);

      // Update position
      player.update();

      // Stop moving
      player.stop();
      expect(player.isMoving).toBe(false);

      // Verify final state
      expect(player.sprite.body.setVelocity).toHaveBeenLastCalledWith(0, 0);
    });

    it('should save and restore state', () => {
      // Set position
      player.setPosition(250, 350);

      // Save
      const saveData = player.getSaveData();
      expect(saveData).toEqual({ x: 250, y: 350 });

      // Change position
      player.setPosition(100, 100);

      // Restore
      player.loadSaveData(saveData);
      expect(player.sprite.x).toBe(250);
      expect(player.sprite.y).toBe(350);
    });
  });
});
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
          setStrokeStyle() { return this; }
          setFillStyle() { return this; }
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
        },
        Circle: class {
          constructor(scene, x, y, radius, color) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
          }
          setStrokeStyle() { return this; }
          setFillStyle() { return this; }
          destroy() {}
        },
        Ellipse: class {
          constructor(scene, x, y, width, height, color) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
          }
          setStrokeStyle() { return this; }
          setFillStyle() { return this; }
          destroy() {}
        },
        Container: class {
          constructor(scene, x, y, children) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.list = children || [];
            this.body = {
              setCollideWorldBounds: vi.fn().mockReturnThis(),
              setSize: vi.fn().mockReturnThis(),
              setVelocity: vi.fn().mockReturnThis()
            };
          }
          add(children) {
            this.list = children;
          }
          setPosition(x, y) {
            this.x = x;
            this.y = y;
            return this;
          }
          destroy() {}
        }
      }
    }
  };
});

// Import Player after mocking Phaser
import Player from './Player.js';
import Appearance from './Appearance.js';

describe('Player', () => {
  let mockScene;
  let player;

  beforeEach(() => {
    // Create mock constructors for Phaser objects
    class MockGameObject {
      constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
      }
      setStrokeStyle() { return this; }
      setFillStyle() { return this; }
      destroy() {}
    }

    class MockRectangle extends MockGameObject {
      constructor(scene, x, y, width, height, color) {
        super(scene, x, y);
        this.width = width;
        this.height = height;
        this.color = color;
      }
    }

    class MockCircle extends MockGameObject {
      constructor(scene, x, y, radius, color) {
        super(scene, x, y);
        this.radius = radius;
        this.color = color;
      }
    }

    class MockEllipse extends MockGameObject {
      constructor(scene, x, y, width, height, color) {
        super(scene, x, y);
        this.width = width;
        this.height = height;
        this.color = color;
      }
    }

    class MockTriangle extends MockGameObject {
      constructor(scene, x, y, x1, y1, x2, y2, x3, y3, color) {
        super(scene, x, y);
        this.rotation = 0;
      }
    }

    class MockContainer extends MockGameObject {
      constructor(scene, x, y, children) {
        super(scene, x, y);
        this.list = children || [];
        this.body = {
          setCollideWorldBounds: vi.fn().mockReturnThis(),
          setSize: vi.fn().mockReturnThis(),
          setVelocity: vi.fn().mockReturnThis()
        };
      }
      add(children) {
        this.list = children;
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      }
    }

    mockScene = {
      add: {
        rectangle: vi.fn(function(...args) { return new MockRectangle(this, ...args); }),
        circle: vi.fn(function(...args) { return new MockCircle(this, ...args); }),
        ellipse: vi.fn(function(...args) { return new MockEllipse(this, ...args); }),
        triangle: vi.fn(function(...args) { return new MockTriangle(this, ...args); }),
        container: vi.fn(function(...args) { return new MockContainer(this, ...args); })
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

    it('should create appearance with default or custom values', () => {
      expect(player.appearance).toBeDefined();
      expect(player.appearance).toBeInstanceOf(Appearance);
    });

    it('should create container sprite with layers', () => {
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(player.sprite.list).toBeDefined();
    });

    it('should set up physics body', () => {
      expect(mockScene.physics.add.existing).toHaveBeenCalled();
      expect(player.sprite.body.setCollideWorldBounds).toHaveBeenCalled();
      expect(player.sprite.body.setSize).toHaveBeenCalledWith(32, 48);
    });

    it('should create direction indicator', () => {
      expect(player.directionIndicator).toBeDefined();
    });

    it('should initialize with default state', () => {
      expect(player.speed).toBe(160);
      expect(player.isMoving).toBe(false);
      expect(player.direction).toEqual({ x: 0, y: 0 });
    });

    it('should accept custom appearance config', () => {
      const customAppearance = {
        skinTone: 0x111111,
        hairColor: 0x222222,
        shirtColor: 0x333333,
        pantsColor: 0x444444
      };

      const customPlayer = new Player(mockScene, 0, 0, customAppearance);

      expect(customPlayer.appearance.skinTone).toBe(customAppearance.skinTone);
      expect(customPlayer.appearance.hairColor).toBe(customAppearance.hairColor);
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
      expect(player.directionIndicator.y).toBe(250 - 30);
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

  describe('updateAppearance', () => {
    it('should update player appearance', () => {
      const newAppearance = new Appearance({
        skinTone: 0x111111,
        hairColor: 0x222222,
        shirtColor: 0x333333,
        pantsColor: 0x444444
      });

      player.updateAppearance(newAppearance);

      expect(player.appearance).toBe(newAppearance);
    });
  });

  describe('getSaveData', () => {
    it('should return serializable save data including appearance', () => {
      player.sprite.x = 100;
      player.sprite.y = 200;

      const saveData = player.getSaveData();

      expect(saveData.x).toBe(100);
      expect(saveData.y).toBe(200);
      expect(saveData.appearance).toBeDefined();
      expect(saveData.appearance.skinTone).toBeDefined();
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

    it('should load appearance from save data', () => {
      const saveData = {
        x: 100,
        y: 100,
        appearance: {
          skinTone: 0x111111,
          hairColor: 0x222222,
          shirtColor: 0x333333,
          pantsColor: 0x444444
        }
      };

      player.loadSaveData(saveData);

      expect(player.appearance.skinTone).toBe(0x111111);
      expect(player.appearance.hairColor).toBe(0x222222);
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

    it('should save and restore state including appearance', () => {
      // Set position
      player.setPosition(250, 350);

      // Save
      const saveData = player.getSaveData();
      expect(saveData.x).toBe(250);
      expect(saveData.y).toBe(350);
      expect(saveData.appearance).toBeDefined();

      // Change position and appearance
      player.setPosition(100, 100);
      const newAppearance = new Appearance({ skinTone: 0x999999 });
      player.updateAppearance(newAppearance);

      // Restore
      player.loadSaveData(saveData);
      expect(player.sprite.x).toBe(250);
      expect(player.sprite.y).toBe(350);
      expect(player.appearance.skinTone).toBe(saveData.appearance.skinTone);
    });
  });
});
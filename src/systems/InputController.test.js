import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser Input system - must be defined in factory function
vi.mock('phaser', () => {
  return {
    default: {
      Input: {
        Keyboard: {
          KeyCodes: {
            W: 87,
            A: 65,
            S: 83,
            D: 68,
            UP: 38,
            DOWN: 40,
            LEFT: 37,
            RIGHT: 39
          }
        }
      }
    }
  };
});

import InputController from './InputController.js';

describe('InputController', () => {
  let mockScene;
  let inputController;
  let mockCursors;
  let mockWASD;

  beforeEach(() => {
    mockCursors = {
      up: { isDown: false },
      down: { isDown: false },
      left: { isDown: false },
      right: { isDown: false }
    };

    mockWASD = {
      up: { isDown: false },
      down: { isDown: false },
      left: { isDown: false },
      right: { isDown: false }
    };

    mockScene = {
      cameras: {
        main: {
          width: 800,
          height: 600
        }
      },
      input: {
        keyboard: {
          createCursorKeys: vi.fn(() => mockCursors),
          addKey: vi.fn((keyCode) => ({ isDown: false }))
        },
        on: vi.fn(),
        off: vi.fn()
      },
      add: {
        circle: vi.fn(() => ({
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          x: 0,
          y: 0
        }))
      }
    };

    // Mock window for touch detection
    global.navigator = { maxTouchPoints: 0 };
    delete global.window.ontouchstart;
  });

  describe('constructor', () => {
    it('should initialize input controller', () => {
      inputController = new InputController(mockScene);

      expect(inputController.scene).toBe(mockScene);
      expect(inputController.direction).toEqual({ x: 0, y: 0 });
    });

    it('should set up keyboard controls', () => {
      inputController = new InputController(mockScene);

      expect(mockScene.input.keyboard.createCursorKeys).toHaveBeenCalled();
      expect(inputController.cursors).toBeDefined();
      expect(inputController.wasd).toBeDefined();
    });

    it('should not create joystick on non-touch devices', () => {
      inputController = new InputController(mockScene);

      expect(inputController.isTouchDevice).toBe(false);
      expect(inputController.joystickBase).toBeNull();
      expect(inputController.joystickThumb).toBeNull();
    });

    it('should create joystick on touch devices', () => {
      global.window.ontouchstart = {};
      inputController = new InputController(mockScene);

      expect(inputController.isTouchDevice).toBe(true);
      expect(mockScene.add.circle).toHaveBeenCalled();
    });
  });

  describe('update - keyboard input', () => {
    beforeEach(() => {
      inputController = new InputController(mockScene);
    });

    it('should return zero direction when no keys pressed', () => {
      const direction = inputController.update();

      expect(direction).toEqual({ x: 0, y: 0 });
    });

    it('should detect arrow key up', () => {
      mockCursors.up.isDown = true;

      const direction = inputController.update();

      expect(direction.y).toBe(-1);
      expect(direction.x).toBe(0);
    });

    it('should detect arrow key down', () => {
      mockCursors.down.isDown = true;

      const direction = inputController.update();

      expect(direction.y).toBe(1);
      expect(direction.x).toBe(0);
    });

    it('should detect arrow key left', () => {
      mockCursors.left.isDown = true;

      const direction = inputController.update();

      expect(direction.x).toBe(-1);
      expect(direction.y).toBe(0);
    });

    it('should detect arrow key right', () => {
      mockCursors.right.isDown = true;

      const direction = inputController.update();

      expect(direction.x).toBe(1);
      expect(direction.y).toBe(0);
    });

    it('should detect WASD up', () => {
      inputController.wasd.up.isDown = true;

      const direction = inputController.update();

      expect(direction.y).toBe(-1);
    });

    it('should detect WASD down', () => {
      inputController.wasd.down.isDown = true;

      const direction = inputController.update();

      expect(direction.y).toBe(1);
    });

    it('should detect WASD left', () => {
      inputController.wasd.left.isDown = true;

      const direction = inputController.update();

      expect(direction.x).toBe(-1);
    });

    it('should detect WASD right', () => {
      inputController.wasd.right.isDown = true;

      const direction = inputController.update();

      expect(direction.x).toBe(1);
    });

    it('should handle diagonal input', () => {
      mockCursors.up.isDown = true;
      mockCursors.right.isDown = true;

      const direction = inputController.update();

      expect(direction).toEqual({ x: 1, y: -1 });
    });

    it('should prioritize right over left', () => {
      mockCursors.left.isDown = true;
      mockCursors.right.isDown = true;

      const direction = inputController.update();

      expect(direction.x).toBe(1);
    });

    it('should prioritize down over up', () => {
      mockCursors.up.isDown = true;
      mockCursors.down.isDown = true;

      const direction = inputController.update();

      expect(direction.y).toBe(1);
    });

    it('should mix arrow keys and WASD', () => {
      mockCursors.up.isDown = true;
      inputController.wasd.right.isDown = true;

      const direction = inputController.update();

      expect(direction).toEqual({ x: 1, y: -1 });
    });
  });

  describe('virtual joystick', () => {
    beforeEach(() => {
      global.window.ontouchstart = {};
      inputController = new InputController(mockScene);
    });

    it('should initialize joystick components', () => {
      expect(inputController.joystickBase).toBeDefined();
      expect(inputController.joystickThumb).toBeDefined();
      expect(inputController.joystickRadius).toBe(50);
    });

    it('should activate joystick on touch start (left side)', () => {
      const mockPointer = { x: 100, y: 300 };

      inputController.onTouchStart(mockPointer);

      expect(inputController.joystickActive).toBe(true);
    });

    it('should not activate joystick on touch start (right side)', () => {
      const mockPointer = { x: 700, y: 300 };

      inputController.onTouchStart(mockPointer);

      expect(inputController.joystickActive).toBe(false);
    });

    it('should calculate direction on touch move', () => {
      inputController.joystickActive = true;
      inputController.joystickBase = { x: 100, y: 300 };
      inputController.joystickThumb = { x: 100, y: 300 };

      const mockPointer = { x: 130, y: 280 };
      inputController.onTouchMove(mockPointer);

      expect(inputController.direction.x).toBeCloseTo(0.6, 1);
      expect(inputController.direction.y).toBeCloseTo(-0.4, 1);
    });

    it('should clamp joystick thumb to radius', () => {
      inputController.joystickActive = true;
      inputController.joystickBase = { x: 100, y: 300 };
      inputController.joystickThumb = { x: 100, y: 300 };

      // Touch far away from base
      const mockPointer = { x: 200, y: 400 };
      inputController.onTouchMove(mockPointer);

      const dx = inputController.joystickThumb.x - inputController.joystickBase.x;
      const dy = inputController.joystickThumb.y - inputController.joystickBase.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      expect(distance).toBeLessThanOrEqual(inputController.joystickRadius + 0.01);
    });

    it('should deactivate joystick on touch end', () => {
      inputController.joystickActive = true;
      inputController.direction = { x: 0.5, y: 0.5 };

      inputController.onTouchEnd();

      expect(inputController.joystickActive).toBe(false);
      expect(inputController.direction).toEqual({ x: 0, y: 0 });
    });

    it('should return joystick direction when active', () => {
      inputController.joystickActive = true;
      inputController.direction = { x: 0.7, y: -0.3 };

      const direction = inputController.update();

      expect(direction).toEqual({ x: 0.7, y: -0.3 });
    });
  });

  describe('getDirection', () => {
    beforeEach(() => {
      inputController = new InputController(mockScene);
    });

    it('should return current direction', () => {
      inputController.direction = { x: 1, y: -1 };

      const direction = inputController.getDirection();

      expect(direction).toEqual({ x: 1, y: -1 });
    });
  });

  describe('destroy', () => {
    it('should clean up joystick resources on touch device', () => {
      global.window.ontouchstart = {};
      inputController = new InputController(mockScene);

      const baseDestroySpy = vi.spyOn(inputController.joystickBase, 'destroy');
      const thumbDestroySpy = vi.spyOn(inputController.joystickThumb, 'destroy');

      inputController.destroy();

      expect(baseDestroySpy).toHaveBeenCalled();
      expect(thumbDestroySpy).toHaveBeenCalled();
      expect(mockScene.input.off).toHaveBeenCalled();
    });

    it('should handle destroy on non-touch device', () => {
      inputController = new InputController(mockScene);

      expect(() => inputController.destroy()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should handle continuous input updates', () => {
      inputController = new InputController(mockScene);

      // No input
      let direction = inputController.update();
      expect(direction).toEqual({ x: 0, y: 0 });

      // Press key
      mockCursors.right.isDown = true;
      direction = inputController.update();
      expect(direction.x).toBe(1);

      // Release key
      mockCursors.right.isDown = false;
      direction = inputController.update();
      expect(direction).toEqual({ x: 0, y: 0 });
    });

    it('should prioritize joystick over keyboard', () => {
      global.window.ontouchstart = {};
      inputController = new InputController(mockScene);

      // Set keyboard input
      mockCursors.up.isDown = true;

      // Activate joystick
      inputController.joystickActive = true;
      inputController.direction = { x: 0.5, y: 0.5 };

      // Should return joystick direction, not keyboard
      const direction = inputController.update();
      expect(direction).toEqual({ x: 0.5, y: 0.5 });
    });
  });
});
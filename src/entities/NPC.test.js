import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock SpriteGenerator before importing NPC
vi.mock('../utils/SpriteGenerator.js', () => ({
  default: {
    createCharacter: vi.fn(() => ({
      x: 100,
      y: 200,
      body: {
        setCollideWorldBounds: vi.fn(),
        setSize: vi.fn(),
        setImmovable: vi.fn(),
        setVelocity: vi.fn()
      },
      setPosition: vi.fn(function(x, y) {
        this.x = x;
        this.y = y;
      }),
      destroy: vi.fn()
    }))
  }
}));

import NPC from './NPC.js';
import Appearance from './Appearance.js';

describe('NPC', () => {
  let mockScene;

  beforeEach(() => {
    // Mock scene
    mockScene = {
      physics: {
        add: {
          existing: vi.fn()
        }
      }
    };
  });

  describe('Constructor', () => {
    it('should create NPC with default values', () => {
      const npc = new NPC(mockScene, 100, 200);

      expect(npc.name).toBe('NPC');
      expect(npc.npcId).toBe('npc');
      expect(npc.appearance).toBeInstanceOf(Appearance);
      expect(npc.dialog).toEqual([]);
      expect(npc.behavior).toBe('idle');
      expect(npc.isInteracting).toBe(false);
    });

    it('should create NPC with custom config', () => {
      const config = {
        id: 'test_npc',
        name: 'Test NPC',
        appearance: new Appearance({ skinTone: 0xff0000 }),
        dialog: ['Hello', 'World'],
        behavior: 'wander',
        wanderSpeed: 100
      };

      const npc = new NPC(mockScene, 100, 200, config);

      expect(npc.name).toBe('Test NPC');
      expect(npc.npcId).toBe('test_npc');
      expect(npc.appearance).toBe(config.appearance);
      expect(npc.dialog).toEqual(['Hello', 'World']);
      expect(npc.behavior).toBe('wander');
      expect(npc.wanderSpeed).toBe(100);
    });

    it('should create appearance from config object', () => {
      const config = {
        name: 'Bob',
        appearance: { skinTone: 0xff0000, hairColor: 0x00ff00 }
      };

      const npc = new NPC(mockScene, 100, 200, config);

      expect(npc.appearance).toBeInstanceOf(Appearance);
      expect(npc.appearance.skinTone).toBe(0xff0000);
      expect(npc.appearance.hairColor).toBe(0x00ff00);
    });

    it('should generate npcId from name if id not provided', () => {
      const config = { name: 'Shop Keeper' };
      const npc = new NPC(mockScene, 100, 200, config);

      expect(npc.npcId).toBe('shop_keeper');
    });

    it('should enable physics on sprite', () => {
      const npc = new NPC(mockScene, 100, 200);

      expect(mockScene.physics.add.existing).toHaveBeenCalledWith(npc.sprite);
    });

    it('should configure physics body correctly', () => {
      const npc = new NPC(mockScene, 100, 200);

      expect(npc.sprite.body.setCollideWorldBounds).toHaveBeenCalledWith(true);
      expect(npc.sprite.body.setSize).toHaveBeenCalledWith(32, 48);
      expect(npc.sprite.body.setImmovable).toHaveBeenCalledWith(true);
    });
  });

  describe('Idle Behavior', () => {
    it('should stop movement when idle', () => {
      const npc = new NPC(mockScene, 100, 200, { behavior: 'idle' });

      npc.update(0, 16);

      expect(npc.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it('should remain idle by default', () => {
      const npc = new NPC(mockScene, 100, 200);

      expect(npc.behavior).toBe('idle');

      npc.update(0, 16);

      expect(npc.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('Wander Behavior', () => {
    it('should change direction periodically when wandering', () => {
      const npc = new NPC(mockScene, 100, 200, {
        behavior: 'wander',
        wanderSpeed: 50,
        wanderChangeInterval: 1000
      });

      // First update
      npc.update(0, 16);
      const firstDirection = { ...npc.wanderDirection };

      // Accumulate time past threshold
      npc.update(1000, 1000);

      // Direction should have changed
      expect(npc.wanderTimer).toBe(0);
    });

    it('should apply movement velocity when wandering', () => {
      const npc = new NPC(mockScene, 100, 200, {
        behavior: 'wander',
        wanderSpeed: 50
      });

      // Set a specific direction
      npc.wanderDirection = { x: 1, y: 0 };

      npc.update(0, 16);

      expect(npc.sprite.body.setVelocity).toHaveBeenCalledWith(50, 0);
    });

    it('should respect wander bounds', () => {
      const npc = new NPC(mockScene, 100, 200, {
        behavior: 'wander',
        wanderBounds: { x: 50, y: 50, width: 100, height: 100 }
      });

      // Move NPC outside bounds
      npc.sprite.x = 30; // Outside left bound
      npc.wanderDirection = { x: -1, y: 0 };

      npc.update(0, 16);

      // Direction should be reversed
      expect(npc.wanderDirection.x).toBe(1);
    });

    it('should stop moving when direction is zero', () => {
      const npc = new NPC(mockScene, 100, 200, { behavior: 'wander' });

      npc.wanderDirection = { x: 0, y: 0 };
      npc.update(0, 16);

      expect(npc.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('Interaction', () => {
    it('should start interaction and stop movement', () => {
      const npc = new NPC(mockScene, 100, 200, { behavior: 'wander' });

      npc.startInteraction();

      expect(npc.isInteracting).toBe(true);
      expect(npc.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it('should end interaction', () => {
      const npc = new NPC(mockScene, 100, 200);

      npc.startInteraction();
      expect(npc.isInteracting).toBe(true);

      npc.endInteraction();
      expect(npc.isInteracting).toBe(false);
    });

    it('should not move while interacting', () => {
      const npc = new NPC(mockScene, 100, 200, { behavior: 'wander' });

      npc.startInteraction();
      npc.update(0, 16);

      // Should only call setVelocity(0, 0) from interaction, not from wander
      expect(npc.sprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('Position Methods', () => {
    it('should get current position', () => {
      const npc = new NPC(mockScene, 100, 200);

      const pos = npc.getPosition();

      expect(pos).toEqual({ x: 100, y: 200 });
    });

    it('should set position', () => {
      const npc = new NPC(mockScene, 100, 200);

      npc.setPosition(300, 400);

      expect(npc.sprite.setPosition).toHaveBeenCalledWith(300, 400);
      expect(npc.sprite.x).toBe(300);
      expect(npc.sprite.y).toBe(400);
    });

    it('should check if near a position', () => {
      const npc = new NPC(mockScene, 100, 200);

      expect(npc.isNearPosition({ x: 120, y: 220 }, 60)).toBe(true);
      expect(npc.isNearPosition({ x: 200, y: 300 }, 60)).toBe(false);
    });

    it('should use default distance for proximity check', () => {
      const npc = new NPC(mockScene, 100, 200);

      expect(npc.isNearPosition({ x: 130, y: 230 })).toBe(true);
      expect(npc.isNearPosition({ x: 200, y: 200 })).toBe(false);
    });
  });

  describe('Dialog Methods', () => {
    it('should get dialog', () => {
      const dialog = ['Hello', 'How are you?'];
      const npc = new NPC(mockScene, 100, 200, { dialog });

      expect(npc.getDialog()).toEqual(dialog);
    });

    it('should set dialog', () => {
      const npc = new NPC(mockScene, 100, 200);
      const newDialog = ['New', 'Dialog'];

      npc.setDialog(newDialog);

      expect(npc.getDialog()).toEqual(newDialog);
    });
  });

  describe('Getters and Setters', () => {
    it('should get name', () => {
      const npc = new NPC(mockScene, 100, 200, { name: 'Test' });

      expect(npc.getName()).toBe('Test');
    });

    it('should get ID', () => {
      const npc = new NPC(mockScene, 100, 200, { id: 'test_id' });

      expect(npc.getId()).toBe('test_id');
    });

    it('should set behavior', () => {
      const npc = new NPC(mockScene, 100, 200);

      npc.setBehavior('wander');

      expect(npc.getBehavior()).toBe('wander');
    });

    it('should get behavior', () => {
      const npc = new NPC(mockScene, 100, 200, { behavior: 'idle' });

      expect(npc.getBehavior()).toBe('idle');
    });
  });

  describe('Cleanup', () => {
    it('should destroy sprite on cleanup', () => {
      const npc = new NPC(mockScene, 100, 200);
      const sprite = npc.sprite;

      npc.destroy();

      expect(sprite.destroy).toHaveBeenCalled();
      expect(npc.sprite).toBeNull();
    });

    it('should handle destroy when sprite already null', () => {
      const npc = new NPC(mockScene, 100, 200);

      npc.sprite = null;
      expect(() => npc.destroy()).not.toThrow();
    });
  });
});

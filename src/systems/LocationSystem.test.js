import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock NPC and SpriteGenerator to avoid Phaser imports
vi.mock('../entities/NPC.js', () => ({
  default: vi.fn()
}));

vi.mock('../utils/SpriteGenerator.js', () => ({
  default: {
    createCharacter: vi.fn()
  }
}));

import LocationSystem from './LocationSystem.js';
import { LOCATIONS } from '../data/locations.js';

describe('LocationSystem', () => {
  let mockScene;
  let locationSystem;

  beforeEach(() => {
    // Create a comprehensive mock scene
    mockScene = {
      add: {
        graphics: vi.fn(() => ({
          lineStyle: vi.fn(),
          lineBetween: vi.fn(),
          strokeRect: vi.fn(),
          destroy: vi.fn()
        })),
        rectangle: vi.fn(() => ({
          destroy: vi.fn(),
          setStrokeStyle: vi.fn(),
          body: {} // Mock physics body
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn(),
          setScrollFactor: vi.fn(),
          setDepth: vi.fn(),
          setVisible: vi.fn(),
          setText: vi.fn(),
          setColor: vi.fn(),
          setPosition: vi.fn(),
          destroy: vi.fn()
        }))
      },
      physics: {
        world: {
          setBounds: vi.fn()
        },
        add: {
          existing: vi.fn(),
          collider: vi.fn()
        }
      },
      cameras: {
        main: {
          setBounds: vi.fn(),
          width: 800,
          height: 600
        }
      }
    };

    locationSystem = new LocationSystem(mockScene);
  });

  describe('constructor', () => {
    it('should initialize with null location', () => {
      expect(locationSystem.currentLocation).toBeNull();
      expect(locationSystem.currentLocationId).toBeNull();
    });

    it('should initialize empty arrays', () => {
      expect(locationSystem.obstacles).toEqual([]);
      expect(locationSystem.transitionZones).toEqual([]);
    });

    it('should store scene reference', () => {
      expect(locationSystem.scene).toBe(mockScene);
    });
  });

  describe('loadLocation', () => {
    it('should load a valid location', () => {
      const spawnPoint = locationSystem.loadLocation('home');

      expect(spawnPoint).toBeDefined();
      expect(spawnPoint.x).toBe(LOCATIONS.home.spawnPoint.x);
      expect(spawnPoint.y).toBe(LOCATIONS.home.spawnPoint.y);
      expect(locationSystem.currentLocationId).toBe('home');
    });

    it('should return null for invalid location', () => {
      const spawnPoint = locationSystem.loadLocation('invalid_location');
      expect(spawnPoint).toBeNull();
    });

    it('should update world bounds', () => {
      locationSystem.loadLocation('home');

      expect(mockScene.physics.world.setBounds).toHaveBeenCalledWith(
        0,
        0,
        LOCATIONS.home.worldBounds.width,
        LOCATIONS.home.worldBounds.height
      );
    });

    it('should update camera bounds', () => {
      locationSystem.loadLocation('home');

      expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(
        0,
        0,
        LOCATIONS.home.worldBounds.width,
        LOCATIONS.home.worldBounds.height
      );
    });

    it('should create obstacles', () => {
      locationSystem.loadLocation('home');

      // Should create rectangles for obstacles
      expect(mockScene.add.rectangle).toHaveBeenCalled();
      expect(mockScene.physics.add.existing).toHaveBeenCalled();
      expect(locationSystem.obstacles.length).toBeGreaterThan(0);
    });

    it('should create transition zones', () => {
      locationSystem.loadLocation('home');

      expect(locationSystem.transitionZones.length).toBe(LOCATIONS.home.transitions.length);
    });

    it('should use custom spawn point if provided', () => {
      const customSpawn = { x: 100, y: 200 };
      const spawnPoint = locationSystem.loadLocation('home', customSpawn);

      expect(spawnPoint).toEqual(customSpawn);
    });

    it('should clean up previous location before loading new one', () => {
      // Load first location
      locationSystem.loadLocation('home');
      const firstObstacleCount = locationSystem.obstacles.length;

      // Load second location
      locationSystem.loadLocation('street');

      // Should have new obstacles, not accumulated
      expect(locationSystem.obstacles.length).not.toBe(firstObstacleCount);
    });
  });

  describe('getCurrentLocationId', () => {
    it('should return null initially', () => {
      expect(locationSystem.getCurrentLocationId()).toBeNull();
    });

    it('should return current location ID after loading', () => {
      locationSystem.loadLocation('street');
      expect(locationSystem.getCurrentLocationId()).toBe('street');
    });
  });

  describe('getCurrentLocation', () => {
    it('should return null initially', () => {
      expect(locationSystem.getCurrentLocation()).toBeNull();
    });

    it('should return current location data after loading', () => {
      locationSystem.loadLocation('park');
      const location = locationSystem.getCurrentLocation();

      expect(location).toBeDefined();
      expect(location.id).toBe('park');
      expect(location.name).toBe('Park');
    });
  });

  describe('createObstacleColliders', () => {
    it('should create colliders for all obstacles', () => {
      locationSystem.loadLocation('home');

      const mockPlayerSprite = { x: 100, y: 100 };
      locationSystem.createObstacleColliders(mockPlayerSprite);

      // Should have created colliders
      expect(mockScene.physics.add.collider).toHaveBeenCalled();
    });

    it('should handle null player sprite gracefully', () => {
      locationSystem.loadLocation('home');

      // Should not throw error
      expect(() => {
        locationSystem.createObstacleColliders(null);
      }).not.toThrow();
    });
  });

  describe('checkTransitionProximity', () => {
    beforeEach(() => {
      locationSystem.loadLocation('home');
    });

    it('should return transition when player is near', () => {
      // Home has a transition at x: 750, y: 300
      const playerPos = { x: 750, y: 300 };
      const nearbyTransition = locationSystem.checkTransitionProximity(playerPos);

      expect(nearbyTransition).not.toBeNull();
      expect(nearbyTransition.to).toBe('street');
    });

    it('should return null when player is far from transitions', () => {
      const playerPos = { x: 100, y: 100 };
      const nearbyTransition = locationSystem.checkTransitionProximity(playerPos);

      expect(nearbyTransition).toBeNull();
    });

    it('should detect proximity within threshold', () => {
      // Just within proximity distance (60 units)
      const playerPos = { x: 710, y: 300 }; // 40 units away
      const nearbyTransition = locationSystem.checkTransitionProximity(playerPos);

      expect(nearbyTransition).not.toBeNull();
    });

    it('should not detect when outside threshold', () => {
      // Just outside proximity distance
      const playerPos = { x: 680, y: 300 }; // 70 units away
      const nearbyTransition = locationSystem.checkTransitionProximity(playerPos);

      expect(nearbyTransition).toBeNull();
    });
  });

  describe('interaction prompt', () => {
    beforeEach(() => {
      locationSystem.loadLocation('street');
    });

    it('should show interaction prompt', () => {
      const transition = locationSystem.transitionZones[0];
      locationSystem.showInteractionPrompt(transition);

      expect(locationSystem.activeTransition).toBe(transition);
      expect(locationSystem.interactionPrompt).toBeDefined();
    });

    it('should hide interaction prompt', () => {
      const transition = locationSystem.transitionZones[0];
      locationSystem.showInteractionPrompt(transition);
      locationSystem.hideInteractionPrompt();

      expect(locationSystem.activeTransition).toBeNull();
    });

    it('should return active transition', () => {
      const transition = locationSystem.transitionZones[0];
      locationSystem.showInteractionPrompt(transition);

      expect(locationSystem.getActiveTransition()).toBe(transition);
    });

    it('should return null when no active transition', () => {
      expect(locationSystem.getActiveTransition()).toBeNull();
    });
  });

  describe('cleanupLocation', () => {
    it('should clean up all obstacles', () => {
      locationSystem.loadLocation('shop');

      const obstacleCount = locationSystem.obstacles.length;
      expect(obstacleCount).toBeGreaterThan(0);

      locationSystem.cleanupLocation();

      expect(locationSystem.obstacles.length).toBe(0);
    });

    it('should clean up all transition zones', () => {
      locationSystem.loadLocation('park');

      expect(locationSystem.transitionZones.length).toBeGreaterThan(0);

      locationSystem.cleanupLocation();

      expect(locationSystem.transitionZones.length).toBe(0);
    });

    it('should hide interaction prompt', () => {
      locationSystem.loadLocation('street');
      const transition = locationSystem.transitionZones[0];
      locationSystem.showInteractionPrompt(transition);

      locationSystem.cleanupLocation();

      expect(locationSystem.activeTransition).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clean up all resources', () => {
      locationSystem.loadLocation('workplace');
      const transition = locationSystem.transitionZones[0];
      locationSystem.showInteractionPrompt(transition);

      locationSystem.destroy();

      expect(locationSystem.obstacles.length).toBe(0);
      expect(locationSystem.transitionZones.length).toBe(0);
      expect(locationSystem.interactionPrompt).toBeNull();
    });
  });

  describe('all locations', () => {
    it('should successfully load all defined locations', () => {
      const locationIds = ['home', 'street', 'shop', 'park', 'workplace'];

      locationIds.forEach(id => {
        const spawnPoint = locationSystem.loadLocation(id);
        expect(spawnPoint).not.toBeNull();
        expect(locationSystem.getCurrentLocationId()).toBe(id);
      });
    });

    it('should have correct number of transitions for each location', () => {
      expect(LOCATIONS.home.transitions.length).toBe(1);
      expect(LOCATIONS.street.transitions.length).toBe(4);
      expect(LOCATIONS.shop.transitions.length).toBe(1);
      expect(LOCATIONS.park.transitions.length).toBe(1);
      expect(LOCATIONS.workplace.transitions.length).toBe(1);
    });

    it('should have valid transition destinations', () => {
      const locationIds = Object.keys(LOCATIONS);

      locationIds.forEach(id => {
        const location = LOCATIONS[id];
        location.transitions.forEach(transition => {
          expect(locationIds).toContain(transition.to);
        });
      });
    });
  });
});

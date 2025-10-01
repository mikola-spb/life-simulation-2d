import { getLocation, locationExists } from '../data/locations.js';
import { getNPCsForLocation } from '../data/npcs.js';
import NPC from '../entities/NPC.js';

/**
 * LocationSystem
 * Manages game locations, transitions, environment loading, and NPCs
 */
export default class LocationSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentLocation = null;
    this.currentLocationId = null;
    this.obstacles = [];
    this.transitionZones = [];
    this.activeTransition = null;
    this.interactionPrompt = null;
    this.npcs = []; // Array of NPC instances
  }

  /**
   * Load a location and create its environment
   * @param {string} locationId - The location to load
   * @param {object} spawnPoint - Optional custom spawn point {x, y}
   * @returns {object} Spawn point for player
   */
  loadLocation(locationId, spawnPoint = null) {
    // Validate location exists
    if (!locationExists(locationId)) {
      console.error(`Location ${locationId} does not exist`);
      return null;
    }

    // Clean up current location if exists
    if (this.currentLocation) {
      this.cleanupLocation();
    }

    // Load new location data
    const location = getLocation(locationId);
    this.currentLocation = location;
    this.currentLocationId = locationId;

    // Update world bounds
    this.scene.physics.world.setBounds(
      0,
      0,
      location.worldBounds.width,
      location.worldBounds.height
    );

    // Update camera bounds
    this.scene.cameras.main.setBounds(
      0,
      0,
      location.worldBounds.width,
      location.worldBounds.height
    );

    // Create environment visuals
    this.createEnvironment(location);

    // Create obstacles
    this.createObstacles(location.obstacles);

    // Create transition zones
    this.createTransitionZones(location.transitions);

    // Spawn NPCs for this location
    this.spawnNPCsForLocation(locationId);

    // Determine spawn point
    const finalSpawnPoint = spawnPoint || location.spawnPoint;

    console.log(`Loaded location: ${location.name} (${locationId})`);

    return finalSpawnPoint;
  }

  /**
   * Create environment visuals (grid, boundaries)
   * @param {object} location
   */
  createEnvironment(location) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0x555555, 0.5);

    const gridSize = 100;
    const width = location.worldBounds.width;
    const height = location.worldBounds.height;

    // Vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
      graphics.lineBetween(x, 0, x, height);
    }

    // Horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
      graphics.lineBetween(0, y, width, y);
    }

    // Draw world boundaries
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeRect(0, 0, width, height);

    // Add location name label
    const locationLabel = this.scene.add.text(
      width / 2,
      30,
      location.name,
      {
        font: 'bold 24px Arial',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }
    );
    locationLabel.setOrigin(0.5);
    locationLabel.setScrollFactor(0);
    locationLabel.setDepth(50);

    // Store for cleanup
    this.locationLabel = locationLabel;
    this.environmentGraphics = graphics;
  }

  /**
   * Create obstacle objects with physics
   * @param {array} obstacleData
   */
  createObstacles(obstacleData) {
    this.obstacles = [];

    obstacleData.forEach(obs => {
      const obstacle = this.scene.add.rectangle(
        obs.x,
        obs.y,
        obs.width,
        obs.height,
        obs.color
      );
      this.scene.physics.add.existing(obstacle, true); // true = static body
      this.obstacles.push(obstacle);

      // Add label if name exists
      if (obs.name) {
        const label = this.scene.add.text(
          obs.x,
          obs.y,
          obs.name,
          {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#00000080',
            padding: { x: 4, y: 2 }
          }
        );
        label.setOrigin(0.5);
        label.setDepth(10);
        this.obstacles.push(label); // Store for cleanup
      }
    });
  }

  /**
   * Create obstacle colliders (call after player is created)
   * @param {object} playerSprite - The player's sprite
   */
  createObstacleColliders(playerSprite) {
    if (!playerSprite) {
      console.error('Cannot create colliders: player sprite is null');
      return;
    }

    this.obstacles.forEach(obstacle => {
      // Only create colliders for physics-enabled objects (not text labels)
      if (obstacle.body) {
        this.scene.physics.add.collider(playerSprite, obstacle);
      }
    });
  }

  /**
   * Create transition zones
   * @param {array} transitionData
   */
  createTransitionZones(transitionData) {
    this.transitionZones = [];

    transitionData.forEach(trans => {
      // Create visual indicator
      const zone = this.scene.add.rectangle(
        trans.x,
        trans.y,
        trans.width,
        trans.height,
        0xffff00,
        0.3
      );
      zone.setStrokeStyle(2, 0xffff00);

      // Add label
      const label = this.scene.add.text(
        trans.x,
        trans.y - trans.height / 2 - 20,
        trans.label,
        {
          font: '14px Arial',
          fill: '#ffff00',
          backgroundColor: '#00000080',
          padding: { x: 8, y: 4 }
        }
      );
      label.setOrigin(0.5);
      label.setDepth(20);

      // Store transition data
      this.transitionZones.push({
        visual: zone,
        label: label,
        x: trans.x,
        y: trans.y,
        width: trans.width,
        height: trans.height,
        to: trans.to,
        toSpawn: trans.toSpawn,
        interactionLabel: trans.label,
        key: trans.key
      });
    });
  }

  /**
   * Spawn NPCs for a specific location
   * @param {string} locationId
   */
  spawnNPCsForLocation(locationId) {
    // Clean up existing NPCs first
    this.cleanupNPCs();

    // Get NPC data for this location
    const npcConfigs = getNPCsForLocation(locationId);

    // Create NPC instances
    npcConfigs.forEach(config => {
      const npc = new NPC(
        this.scene,
        config.position.x,
        config.position.y,
        config
      );
      this.npcs.push(npc);
    });

    console.log(`Spawned ${this.npcs.length} NPCs in ${locationId}`);
  }

  /**
   * Update all NPCs
   * @param {number} time
   * @param {number} delta
   */
  updateNPCs(time, delta) {
    this.npcs.forEach(npc => {
      npc.update(time, delta);
    });
  }

  /**
   * Get all NPCs in current location
   * @returns {array}
   */
  getNPCs() {
    return this.npcs;
  }

  /**
   * Check if player is near any NPC
   * @param {object} playerPosition - {x, y}
   * @param {number} distance - Detection distance
   * @returns {NPC|null} Nearest NPC if within distance, null otherwise
   */
  checkNPCProximity(playerPosition, distance = 60) {
    let nearestNPC = null;
    let nearestDistance = Infinity;

    this.npcs.forEach(npc => {
      if (npc.isNearPosition(playerPosition, distance)) {
        const npcPos = npc.getPosition();
        const dx = npcPos.x - playerPosition.x;
        const dy = npcPos.y - playerPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestNPC = npc;
        }
      }
    });

    return nearestNPC;
  }

  /**
   * Clean up NPCs
   */
  cleanupNPCs() {
    this.npcs.forEach(npc => {
      if (npc && npc.destroy) {
        npc.destroy();
      }
    });
    this.npcs = [];
  }

  /**
   * Check if player is near a transition zone
   * @param {object} playerPosition - {x, y}
   * @returns {object|null} Transition data if near, null otherwise
   */
  checkTransitionProximity(playerPosition) {
    const proximityDistance = 60; // How close player needs to be

    for (const transition of this.transitionZones) {
      const dx = playerPosition.x - transition.x;
      const dy = playerPosition.y - transition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < proximityDistance) {
        return transition;
      }
    }

    return null;
  }

  /**
   * Show interaction prompt
   * @param {object} transition
   */
  showInteractionPrompt(transition) {
    if (!this.interactionPrompt) {
      this.interactionPrompt = this.scene.add.text(
        0,
        0,
        '',
        {
          font: 'bold 16px Arial',
          fill: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 12, y: 8 }
        }
      );
      this.interactionPrompt.setScrollFactor(0);
      this.interactionPrompt.setDepth(100);
    }

    // Update prompt text and position
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const promptText = isTouchDevice
      ? `Tap to ${transition.interactionLabel}`
      : `Press ${transition.key} to ${transition.interactionLabel}`;

    this.interactionPrompt.setText(promptText);
    this.interactionPrompt.setPosition(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height - 60
    );
    this.interactionPrompt.setOrigin(0.5);
    this.interactionPrompt.setVisible(true);

    this.activeTransition = transition;
  }

  /**
   * Hide interaction prompt
   */
  hideInteractionPrompt() {
    if (this.interactionPrompt) {
      this.interactionPrompt.setVisible(false);
    }
    this.activeTransition = null;
  }

  /**
   * Get current active transition
   * @returns {object|null}
   */
  getActiveTransition() {
    return this.activeTransition;
  }

  /**
   * Get current location ID
   * @returns {string|null}
   */
  getCurrentLocationId() {
    return this.currentLocationId;
  }

  /**
   * Get current location data
   * @returns {object|null}
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Clean up current location resources
   */
  cleanupLocation() {
    // Destroy NPCs
    this.cleanupNPCs();

    // Destroy obstacles
    this.obstacles.forEach(obj => {
      if (obj && obj.destroy) {
        obj.destroy();
      }
    });
    this.obstacles = [];

    // Destroy transition zones
    this.transitionZones.forEach(trans => {
      if (trans.visual) trans.visual.destroy();
      if (trans.label) trans.label.destroy();
    });
    this.transitionZones = [];

    // Destroy environment graphics
    if (this.environmentGraphics) {
      this.environmentGraphics.destroy();
      this.environmentGraphics = null;
    }

    // Destroy location label
    if (this.locationLabel) {
      this.locationLabel.destroy();
      this.locationLabel = null;
    }

    // Hide interaction prompt
    this.hideInteractionPrompt();
  }

  /**
   * Clean up system resources
   */
  destroy() {
    this.cleanupLocation();

    if (this.interactionPrompt) {
      this.interactionPrompt.destroy();
      this.interactionPrompt = null;
    }
  }
}

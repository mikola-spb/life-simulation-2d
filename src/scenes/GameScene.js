import Phaser from 'phaser';
import GameConfig from '../config.js';
import Player from '../entities/Player.js';
import InputController from '../systems/InputController.js';
import SaveSystem from '../systems/SaveSystem.js';
import LocationSystem from '../systems/LocationSystem.js';
import DialogSystem from '../systems/DialogSystem.js';

/**
 * GameScene - Main game scene where gameplay happens
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null;
    this.inputController = null;
    this.saveSystem = null;
    this.locationSystem = null;
    this.dialogSystem = null;
    this.autoSaveTimer = null;
    this.obstacles = []; // Store obstacles for later collider setup (deprecated - now handled by LocationSystem)
    this.isTransitioning = false;
    this.nearbyNPC = null;
  }

  create() {
    // Initialize systems
    this.saveSystem = new SaveSystem();
    this.inputController = new InputController(this);
    this.locationSystem = new LocationSystem(this);
    this.dialogSystem = new DialogSystem(this);

    // Try to load saved game to get starting location
    const savedGameState = this.saveSystem.load();
    const startingLocationId = (savedGameState && savedGameState.currentLocationId)
      ? savedGameState.currentLocationId
      : 'home';

    // Load the starting location
    const spawnPoint = this.locationSystem.loadLocation(startingLocationId);

    // Create player at spawn point
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);

    // Create obstacle colliders (player exists now)
    this.locationSystem.createObstacleColliders(this.player.sprite);

    // Load saved player state (position and appearance)
    if (savedGameState && savedGameState.player) {
      this.player.loadSaveData(savedGameState.player);
    }

    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.sprite);

    // Add UI instructions
    this.addInstructions();

    // Set up auto-save (configurable interval, default 30 seconds)
    this.autoSaveTimer = this.time.addEvent({
      delay: GameConfig.storage.autoSaveInterval,
      callback: this.autoSave,
      callbackScope: this,
      loop: true
    });

    // Save game on page unload
    window.addEventListener('beforeunload', () => {
      this.saveGame();
    });

    // Add interaction key listener
    this.input.keyboard.on('keydown-E', () => {
      this.handleInteraction();
    });

    // Add UI save button
    this.addSaveButton();
  }

  /**
   * Add UI save button
   */
  addSaveButton() {
    // Create save button HTML element
    const saveButton = document.createElement('button');
    saveButton.id = 'save-button';
    saveButton.textContent = '💾 Save Game';
    saveButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.2s;
      z-index: 100;
    `;

    // Hover effects
    saveButton.onmouseover = () => {
      saveButton.style.transform = 'scale(1.05)';
      saveButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
    };
    saveButton.onmouseout = () => {
      saveButton.style.transform = 'scale(1)';
      saveButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    };

    // Click handler
    saveButton.onclick = () => {
      this.saveGame();
      // Visual feedback
      saveButton.textContent = '✓ Saved!';
      setTimeout(() => {
        saveButton.textContent = '💾 Save Game';
      }, 2000);
    };

    // Add to document
    document.body.appendChild(saveButton);

    // Store reference for cleanup
    this.saveButton = saveButton;
  }

  /**
   * Add on-screen instructions
   */
  addInstructions() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const instructionText = isTouchDevice
      ? 'Touch left side to move, tap NPCs to talk'
      : 'Use WASD/Arrow Keys to move, E to interact';

    const instructions = this.add.text(16, 16, instructionText, {
      font: '16px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });
    instructions.setScrollFactor(0);
    instructions.setDepth(100);

    // Add save indicator
    this.saveIndicator = this.add.text(16, 80, '', {
      font: '14px Arial',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.saveIndicator.setScrollFactor(0);
    this.saveIndicator.setDepth(100);
    this.saveIndicator.setVisible(false);
  }

  /**
   * Update game state
   */
  update(time, delta) {
    if (!this.player || !this.inputController || this.isTransitioning) {
      return;
    }

    // Update dialog system
    this.dialogSystem.update();

    // If dialog is active, block player movement and NPC interaction
    if (this.dialogSystem.getIsActive()) {
      return;
    }

    // Get input direction
    const direction = this.inputController.update();

    // Move player based on input
    if (direction.x !== 0 || direction.y !== 0) {
      this.player.move(direction.x, direction.y);
    } else {
      this.player.stop();
    }

    // Update player
    this.player.update();

    // Update NPCs
    this.locationSystem.updateNPCs(time, delta);

    // Check for nearby NPCs and transitions
    const playerPos = this.player.getPosition();

    // Priority 1: Check for nearby NPCs
    this.nearbyNPC = this.locationSystem.checkNPCProximity(playerPos);

    if (this.nearbyNPC) {
      // Show NPC interaction prompt
      this.showNPCInteractionPrompt(this.nearbyNPC);

      // Check for interaction input
      if (this.inputController.isInteractPressed()) {
        this.interactWithNPC(this.nearbyNPC);
      }
    } else {
      // Priority 2: Check for nearby transitions
      const nearbyTransition = this.locationSystem.checkTransitionProximity(playerPos);

      if (nearbyTransition) {
        this.locationSystem.showInteractionPrompt(nearbyTransition);
      } else {
        this.locationSystem.hideInteractionPrompt();
      }
    }
  }

  /**
   * Show NPC interaction prompt
   * @param {NPC} npc
   */
  showNPCInteractionPrompt(npc) {
    // Hide any existing transition prompts
    this.locationSystem.hideInteractionPrompt();

    // Show NPC-specific prompt using LocationSystem's interaction prompt
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const promptText = isTouchDevice
      ? `Tap to talk to ${npc.getName()}`
      : `Press E to talk to ${npc.getName()}`;

    this.locationSystem.showInteractionPrompt({
      interactionLabel: promptText,
      key: 'E'
    });
  }

  /**
   * Interact with an NPC
   * @param {NPC} npc
   */
  interactWithNPC(npc) {
    if (!npc || this.dialogSystem.getIsActive()) {
      return;
    }

    // Start NPC interaction state
    npc.startInteraction();

    // Show dialog
    const dialog = npc.getDialog();
    if (dialog && dialog.length > 0) {
      this.dialogSystem.show({
        npcName: npc.getName(),
        pages: dialog,
        onClose: () => {
          // End NPC interaction state
          npc.endInteraction();
          // Hide interaction prompt
          this.locationSystem.hideInteractionPrompt();
        }
      });
    }
  }

  /**
   * Handle interaction with active transition
   */
  handleInteraction() {
    if (this.isTransitioning) {
      return;
    }

    const activeTransition = this.locationSystem.getActiveTransition();
    if (activeTransition) {
      this.transitionToLocation(activeTransition.to, activeTransition.toSpawn);
    }
  }

  /**
   * Transition to a new location
   * @param {string} locationId
   * @param {object} spawnPoint - {x, y}
   */
  transitionToLocation(locationId, spawnPoint) {
    this.isTransitioning = true;

    // Fade out camera
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Load new location
      const newSpawnPoint = this.locationSystem.loadLocation(locationId, spawnPoint);

      // Move player to new spawn point
      this.player.setPosition(newSpawnPoint.x, newSpawnPoint.y);
      this.player.stop();

      // Recreate colliders for new location
      this.locationSystem.createObstacleColliders(this.player.sprite);

      // Auto-save after location change
      this.saveGame();

      // Fade in camera
      this.cameras.main.fadeIn(300, 0, 0, 0);

      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
      });
    });
  }

  /**
   * Save current game state
   */
  saveGame() {
    const gameState = {
      player: this.player.getSaveData(),
      currentLocationId: this.locationSystem.getCurrentLocationId(),
      timestamp: Date.now()
    };

    const success = this.saveSystem.save(gameState);

    if (success) {
      this.showSaveIndicator('Game Saved!');
    } else {
      this.showSaveIndicator('Save Failed!', 0xff0000);
    }
  }

  /**
   * Auto-save callback
   */
  autoSave() {
    this.saveGame();
  }

  /**
   * Show save indicator feedback
   */
  showSaveIndicator(text, color = 0x00ff00) {
    if (!this.saveIndicator) return;

    this.saveIndicator.setText(text);
    this.saveIndicator.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.saveIndicator.setVisible(true);

    // Hide after 2 seconds
    this.time.delayedCall(2000, () => {
      this.saveIndicator.setVisible(false);
    });
  }

  /**
   * Clean up scene
   */
  shutdown() {
    // Save game on shutdown
    this.saveGame();

    // Clean up resources
    if (this.inputController) {
      this.inputController.destroy();
    }
    if (this.locationSystem) {
      this.locationSystem.destroy();
    }
    if (this.dialogSystem) {
      this.dialogSystem.destroy();
    }
    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove();
    }
    if (this.saveButton && this.saveButton.parentNode) {
      this.saveButton.parentNode.removeChild(this.saveButton);
      this.saveButton = null;
    }
  }
}
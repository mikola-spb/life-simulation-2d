/**
 * DialogSystem
 * Manages NPC dialog UI and progression
 */
export default class DialogSystem {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.currentDialog = null;
    this.currentPage = 0;
    this.onCloseCallback = null;

    // HTML dialog elements
    this.dialogContainer = null;
    this.dialogBox = null;
    this.npcNameElement = null;
    this.dialogTextElement = null;
    this.continueButton = null;

    // Input handling
    this.spaceKey = null;
    this.enterKey = null;
    this.escapeKey = null;

    this.createDialogUI();
    this.setupInputHandlers();
  }

  /**
   * Create HTML dialog UI
   */
  createDialogUI() {
    // Create container overlay
    this.dialogContainer = document.createElement('div');
    this.dialogContainer.id = 'dialog-container';
    this.dialogContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: flex-end;
      z-index: 1000;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Create dialog box
    this.dialogBox = document.createElement('div');
    this.dialogBox.style.cssText = `
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      border: 4px solid #ffffff;
      border-radius: 12px;
      padding: 20px;
      max-width: 700px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
      margin-bottom: 20px;
    `;

    // Create NPC name element
    this.npcNameElement = document.createElement('div');
    this.npcNameElement.style.cssText = `
      font-family: Arial, sans-serif;
      font-size: 20px;
      font-weight: bold;
      color: #ffd700;
      margin-bottom: 12px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;

    // Create dialog text element
    this.dialogTextElement = document.createElement('div');
    this.dialogTextElement.style.cssText = `
      font-family: Arial, sans-serif;
      font-size: 18px;
      color: #ffffff;
      line-height: 1.6;
      margin-bottom: 16px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      min-height: 60px;
    `;

    // Create continue button
    this.continueButton = document.createElement('button');
    this.continueButton.style.cssText = `
      background: #ffd700;
      color: #000000;
      border: none;
      border-radius: 6px;
      padding: 12px 24px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      transition: all 0.2s;
    `;
    this.continueButton.textContent = 'Continue (Space)';
    this.continueButton.onmouseover = () => {
      this.continueButton.style.background = '#ffed4e';
      this.continueButton.style.transform = 'scale(1.05)';
    };
    this.continueButton.onmouseout = () => {
      this.continueButton.style.background = '#ffd700';
      this.continueButton.style.transform = 'scale(1)';
    };
    this.continueButton.onclick = () => this.nextPage();

    // Assemble dialog box
    this.dialogBox.appendChild(this.npcNameElement);
    this.dialogBox.appendChild(this.dialogTextElement);
    this.dialogBox.appendChild(this.continueButton);
    this.dialogContainer.appendChild(this.dialogBox);

    // Add to document
    document.body.appendChild(this.dialogContainer);
  }

  /**
   * Setup keyboard input handlers
   */
  setupInputHandlers() {
    if (this.scene.input && this.scene.input.keyboard) {
      this.spaceKey = this.scene.input.keyboard.addKey('SPACE');
      this.enterKey = this.scene.input.keyboard.addKey('ENTER');
      this.escapeKey = this.scene.input.keyboard.addKey('ESC');
    }
  }

  /**
   * Show dialog
   * @param {object} dialogData - {npcName, pages, onClose}
   */
  show(dialogData) {
    if (!dialogData || !dialogData.pages || dialogData.pages.length === 0) {
      console.warn('DialogSystem: Invalid dialog data');
      return;
    }

    this.isActive = true;
    this.currentDialog = dialogData;
    this.currentPage = 0;
    this.onCloseCallback = dialogData.onClose || null;

    // Update UI
    this.npcNameElement.textContent = dialogData.npcName || 'NPC';
    this.dialogTextElement.textContent = dialogData.pages[0];
    this.updateContinueButton();

    // Show dialog
    this.dialogContainer.style.display = 'flex';

    // Pause game (stop player movement)
    if (this.scene.player) {
      this.scene.player.stop();
    }
  }

  /**
   * Hide dialog
   */
  hide() {
    this.isActive = false;
    this.currentDialog = null;
    this.currentPage = 0;

    // Hide UI
    this.dialogContainer.style.display = 'none';

    // Call close callback if set
    if (this.onCloseCallback) {
      this.onCloseCallback();
      this.onCloseCallback = null;
    }
  }

  /**
   * Advance to next page or close dialog
   */
  nextPage() {
    if (!this.isActive || !this.currentDialog) {
      return;
    }

    this.currentPage++;

    if (this.currentPage >= this.currentDialog.pages.length) {
      // No more pages, close dialog
      this.hide();
    } else {
      // Show next page
      this.dialogTextElement.textContent = this.currentDialog.pages[this.currentPage];
      this.updateContinueButton();
    }
  }

  /**
   * Update continue button text based on current page
   */
  updateContinueButton() {
    if (!this.currentDialog) return;

    const isLastPage = this.currentPage >= this.currentDialog.pages.length - 1;
    this.continueButton.textContent = isLastPage ? 'Close (Space)' : 'Continue (Space)';
  }

  /**
   * Update method - called every frame
   * Handles keyboard input for dialog progression
   */
  update() {
    if (!this.isActive) {
      return;
    }

    // Check for space or enter key press
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.nextPage();
    } else if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.nextPage();
    } else if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.hide();
    }
  }

  /**
   * Check if dialog is currently active
   * @returns {boolean}
   */
  getIsActive() {
    return this.isActive;
  }

  /**
   * Get current page number
   * @returns {number}
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Get total number of pages in current dialog
   * @returns {number}
   */
  getTotalPages() {
    return this.currentDialog ? this.currentDialog.pages.length : 0;
  }

  /**
   * Clean up dialog system
   */
  destroy() {
    // Store reference before clearing
    const container = this.dialogContainer;

    // Hide dialog (but don't clear references yet)
    if (this.isActive) {
      this.isActive = false;
      this.currentDialog = null;
      this.currentPage = 0;

      if (this.dialogContainer) {
        this.dialogContainer.style.display = 'none';
      }

      if (this.onCloseCallback) {
        this.onCloseCallback();
        this.onCloseCallback = null;
      }
    }

    // Remove HTML elements
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    // Clear references
    this.dialogContainer = null;
    this.dialogBox = null;
    this.npcNameElement = null;
    this.dialogTextElement = null;
    this.continueButton = null;
    this.currentDialog = null;
  }
}

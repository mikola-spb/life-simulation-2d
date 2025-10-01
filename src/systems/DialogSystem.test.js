import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DialogSystem from './DialogSystem.js';

// Mock Phaser
global.Phaser = {
  Input: {
    Keyboard: {
      JustDown: vi.fn(() => false)
    }
  }
};

describe('DialogSystem', () => {
  let mockScene;
  let dialogSystem;
  let dialogContainer;

  beforeEach(() => {
    // Mock scene with input
    mockScene = {
      input: {
        keyboard: {
          addKey: vi.fn((key) => ({ key }))
        }
      },
      player: {
        stop: vi.fn()
      }
    };

    // Mock document methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    dialogSystem = new DialogSystem(mockScene);

    // Get reference to dialog container
    dialogContainer = dialogSystem.dialogContainer;
  });

  afterEach(() => {
    if (dialogSystem) {
      dialogSystem.destroy();
    }
  });

  describe('Constructor', () => {
    it('should initialize with inactive state', () => {
      expect(dialogSystem.getIsActive()).toBe(false);
      expect(dialogSystem.currentDialog).toBeNull();
      expect(dialogSystem.currentPage).toBe(0);
    });

    it('should create HTML dialog elements', () => {
      expect(dialogSystem.dialogContainer).toBeDefined();
      expect(dialogSystem.dialogBox).toBeDefined();
      expect(dialogSystem.npcNameElement).toBeDefined();
      expect(dialogSystem.dialogTextElement).toBeDefined();
      expect(dialogSystem.continueButton).toBeDefined();
    });

    it('should add dialog container to document', () => {
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should setup keyboard input handlers', () => {
      expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('SPACE');
      expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('ENTER');
      expect(mockScene.input.keyboard.addKey).toHaveBeenCalledWith('ESC');
    });

    it('should hide dialog container initially', () => {
      expect(dialogContainer.style.display).toBe('none');
    });
  });

  describe('Show Dialog', () => {
    it('should show dialog with valid data', () => {
      const dialogData = {
        npcName: 'Test NPC',
        pages: ['Hello', 'World']
      };

      dialogSystem.show(dialogData);

      expect(dialogSystem.getIsActive()).toBe(true);
      expect(dialogSystem.currentDialog).toBe(dialogData);
      expect(dialogSystem.currentPage).toBe(0);
      expect(dialogContainer.style.display).toBe('flex');
    });

    it('should display first page of dialog', () => {
      const dialogData = {
        npcName: 'Test NPC',
        pages: ['First page', 'Second page']
      };

      dialogSystem.show(dialogData);

      expect(dialogSystem.dialogTextElement.textContent).toBe('First page');
    });

    it('should display NPC name', () => {
      const dialogData = {
        npcName: 'Bob',
        pages: ['Hello']
      };

      dialogSystem.show(dialogData);

      expect(dialogSystem.npcNameElement.textContent).toBe('Bob');
    });

    it('should use default NPC name if not provided', () => {
      const dialogData = {
        pages: ['Hello']
      };

      dialogSystem.show(dialogData);

      expect(dialogSystem.npcNameElement.textContent).toBe('NPC');
    });

    it('should not show dialog with invalid data', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dialogSystem.show(null);

      expect(dialogSystem.getIsActive()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not show dialog with empty pages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      dialogSystem.show({ pages: [] });

      expect(dialogSystem.getIsActive()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should stop player movement when showing dialog', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Hello']
      };

      dialogSystem.show(dialogData);

      expect(mockScene.player.stop).toHaveBeenCalled();
    });
  });

  describe('Hide Dialog', () => {
    it('should hide dialog', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Hello']
      };

      dialogSystem.show(dialogData);
      dialogSystem.hide();

      expect(dialogSystem.getIsActive()).toBe(false);
      expect(dialogSystem.currentDialog).toBeNull();
      expect(dialogSystem.currentPage).toBe(0);
      expect(dialogContainer.style.display).toBe('none');
    });

    it('should call onClose callback when hiding', () => {
      const onClose = vi.fn();
      const dialogData = {
        npcName: 'Test',
        pages: ['Hello'],
        onClose
      };

      dialogSystem.show(dialogData);
      dialogSystem.hide();

      expect(onClose).toHaveBeenCalled();
    });

    it('should not error if no onClose callback', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Hello']
      };

      dialogSystem.show(dialogData);
      expect(() => dialogSystem.hide()).not.toThrow();
    });
  });

  describe('Next Page', () => {
    it('should advance to next page', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Page 1', 'Page 2', 'Page 3']
      };

      dialogSystem.show(dialogData);
      expect(dialogSystem.getCurrentPage()).toBe(0);

      dialogSystem.nextPage();
      expect(dialogSystem.getCurrentPage()).toBe(1);
      expect(dialogSystem.dialogTextElement.textContent).toBe('Page 2');
    });

    it('should close dialog after last page', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Page 1', 'Page 2']
      };

      dialogSystem.show(dialogData);
      dialogSystem.nextPage(); // Go to page 2
      dialogSystem.nextPage(); // Close dialog

      expect(dialogSystem.getIsActive()).toBe(false);
    });

    it('should not advance if dialog is not active', () => {
      dialogSystem.nextPage();

      expect(dialogSystem.currentPage).toBe(0);
    });

    it('should update continue button text', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Page 1', 'Page 2']
      };

      dialogSystem.show(dialogData);
      expect(dialogSystem.continueButton.textContent).toBe('Continue (Space)');

      dialogSystem.nextPage();
      expect(dialogSystem.continueButton.textContent).toBe('Close (Space)');
    });
  });

  describe('Page Information', () => {
    it('should get total pages', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['1', '2', '3']
      };

      dialogSystem.show(dialogData);

      expect(dialogSystem.getTotalPages()).toBe(3);
    });

    it('should return 0 total pages when no dialog active', () => {
      expect(dialogSystem.getTotalPages()).toBe(0);
    });

    it('should get current page number', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['1', '2', '3']
      };

      dialogSystem.show(dialogData);
      dialogSystem.nextPage();

      expect(dialogSystem.getCurrentPage()).toBe(1);
    });
  });

  describe('Update Method', () => {
    it('should not process input when dialog is inactive', () => {
      const JustDownSpy = vi.spyOn(global.Phaser.Input.Keyboard, 'JustDown');
      JustDownSpy.mockReturnValue(true);

      dialogSystem.update();

      // Should not have checked for key presses
      expect(JustDownSpy).not.toHaveBeenCalled();

      JustDownSpy.mockRestore();
    });

    it('should process space key when dialog is active', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Page 1', 'Page 2']
      };

      dialogSystem.show(dialogData);

      const JustDownSpy = vi.spyOn(global.Phaser.Input.Keyboard, 'JustDown');
      JustDownSpy.mockReturnValue(true);

      dialogSystem.update();

      expect(dialogSystem.getCurrentPage()).toBe(1);

      JustDownSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should remove HTML elements on destroy', () => {
      // Mock parentNode properly
      const mockParentNode = {
        removeChild: vi.fn()
      };
      Object.defineProperty(dialogContainer, 'parentNode', {
        value: mockParentNode,
        configurable: true
      });

      dialogSystem.destroy();

      expect(mockParentNode.removeChild).toHaveBeenCalledWith(dialogContainer);
    });

    it('should hide dialog on destroy', () => {
      const dialogData = {
        npcName: 'Test',
        pages: ['Hello']
      };

      dialogSystem.show(dialogData);

      // Store reference before destroy
      const wasActive = dialogSystem.isActive;

      dialogSystem.destroy();

      expect(wasActive).toBe(true);
      expect(dialogSystem.isActive).toBe(false);
    });

    it('should clean up references on destroy', () => {
      // Mock parentNode to prevent errors
      Object.defineProperty(dialogContainer, 'parentNode', {
        value: null,
        configurable: true
      });

      dialogSystem.destroy();

      expect(dialogSystem.dialogContainer).toBeNull();
      expect(dialogSystem.dialogBox).toBeNull();
      expect(dialogSystem.npcNameElement).toBeNull();
      expect(dialogSystem.dialogTextElement).toBeNull();
      expect(dialogSystem.continueButton).toBeNull();
      expect(dialogSystem.currentDialog).toBeNull();
    });
  });
});

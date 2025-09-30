# ADR-006: Scene Management - Boot and Game Scenes

## Status
Accepted

## Context
Phaser games require scene architecture to organize game flow:
- Asset loading
- Gameplay
- Menus (future)
- Pause screens (future)

Phase 1 needs minimal scene structure focusing on core gameplay while establishing extensible architecture.

## Decision
Implement **two-scene architecture** with BootScene for initialization and GameScene for gameplay.

## Consequences

### Positive
- **Separation of concerns**: Loading logic separate from gameplay
- **User feedback**: Loading screen prevents blank canvas during initialization
- **Extensible**: Easy to add MenuScene, PauseScene later
- **Clean transitions**: Phaser handles scene switching automatically
- **Memory management**: Can stop/restart scenes to free resources
- **Parallel development**: Scenes can be developed/tested independently

### Negative
- **Overhead**: Two files instead of one (minimal complexity increase)
- **Scene lifecycle**: Need to understand Phaser's init/preload/create/update cycle
- **State management**: Must decide what state lives in scenes vs global

### Neutral
- Standard Phaser pattern, well-documented
- Future phases will add more scenes

## Alternatives Considered

### Single Scene
```javascript
scene: [GameScene]
```
- **Pros**: Simpler, one file
- **Cons**: No loading feedback, harder to add menus later
- **Why rejected**: Poor UX during loading, not extensible

### Three Scenes (Boot, Menu, Game)
```javascript
scene: [BootScene, MenuScene, GameScene]
```
- **Pros**: Full game structure from start
- **Cons**: MenuScene not needed in Phase 1, premature complexity
- **Why rejected**: YAGNI (You Aren't Gonna Need It) principle

### Scene Manager Plugin
- **Pros**: Advanced scene orchestration
- **Cons**: Overkill for simple transitions
- **Why rejected**: Phaser's built-in scene management sufficient

## Implementation Details

### BootScene Responsibilities
```javascript
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load assets (future: sprites, audio, etc.)
    // Show loading bar
    this.createLoadingScreen();
  }

  create() {
    // Start game after assets loaded
    this.scene.start('GameScene');
  }

  createLoadingScreen() {
    // Visual feedback during loading
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    // ... loading bar implementation
  }
}
```

### GameScene Responsibilities
```javascript
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize game systems
    // Create player
    // Setup input
    // Load saved game
  }

  update(time, delta) {
    // Game loop
    // Update player
    // Update NPCs (future)
  }
}
```

### Scene Registration
```javascript
// In main.js
const config = {
  // ...
  scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
```

### Scene Transitions
```javascript
// Start another scene
this.scene.start('GameScene');

// Pause current scene and start another (overlay)
this.scene.pause();
this.scene.launch('PauseScene');

// Resume paused scene
this.scene.resume('GameScene');

// Stop scene
this.scene.stop('GameScene');
```

### Loading Screen Implementation
```html
<!-- In index.html -->
<div id="loading-screen">
  <div class="spinner"></div>
  <div id="loading-text">Loading...</div>
</div>
```

```javascript
// In main.js - removed when game ready
game.events.once('ready', () => {
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.style.transition = 'opacity 0.5s';
  loadingScreen.style.opacity = '0';
  setTimeout(() => loadingScreen.remove(), 500);
});
```

## Scene Lifecycle

### BootScene Flow
1. `constructor()` - Scene registered
2. `init()` - Initialize data (optional)
3. `preload()` - Load assets (with progress bar)
4. `create()` - Start GameScene
5. Scene ends

### GameScene Flow
1. `constructor()` - Scene registered
2. `init()` - Receive data from BootScene (optional)
3. `create()` - Setup game world, entities, systems
4. `update(time, delta)` - Called every frame (~60 FPS)
   - Update input
   - Update player
   - Update physics
   - Update AI (future)
5. `shutdown()` - Cleanup when scene stops (optional)

## State Management Strategy

### Scene-Local State
Stored in scene properties:
```javascript
class GameScene extends Phaser.Scene {
  create() {
    this.player = new Player(this, 400, 300);
    this.inputController = new InputController(this);
    this.saveSystem = new SaveSystem();
  }
}
```

### Global State (Future)
For data shared across scenes:
```javascript
// In main.js
game.registry.set('score', 0);
game.registry.set('playerName', 'Alice');

// Access in any scene
const score = this.registry.get('score');
```

### Persistent State
Handled by SaveSystem (localStorage):
- Player position
- Inventory (future)
- Progress (future)

## Future Scene Structure

Phase 2+:
```
BootScene (loading)
  └─> MenuScene (title screen)
      ├─> GameScene (gameplay)
      │   ├─> PauseScene (overlay)
      │   └─> InventoryScene (overlay)
      └─> SettingsScene (settings)
```

## Performance Considerations
- Each scene has independent update loop
- Inactive scenes don't consume CPU (unless paused, not stopped)
- Scene sleep/wake useful for background scenes
- Asset loading only in BootScene prevents stutter during gameplay

## Testing Strategy
- Unit test each scene's create() method
- Mock Phaser scene context
- Test scene transitions
- E2E tests verify actual loading/gameplay flow

## Known Limitations
- Currently BootScene has minimal loading (no assets yet)
- Loading bar shows but completes instantly (will be relevant in Phase 2 with sprite assets)
- No error handling for failed asset loading (future enhancement)

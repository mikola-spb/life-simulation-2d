# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform life simulation web game built with **Phaser 3**, targeting browsers on Android smartphones, tablets, macOS, and Windows. The game uses a **Progressive Web App (PWA)** approach with 2D graphics and responsive canvas scaling.

**Current Status**: Phase 1 (Foundation) completed. Core infrastructure is functional and tested.

## Essential Commands

### Development
```bash
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production (outputs to dist/)
npm run preview          # Preview production build locally
```

### Testing
```bash
# Unit Tests (Vitest)
npm test                 # Run all unit tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report

# E2E Browser Tests (Playwright)
npm run test:e2e         # Run E2E tests (auto-starts dev server)
npm run test:e2e:ui      # Interactive Playwright UI
npm run test:e2e:debug   # Debug mode with headed browser
npm run test:e2e:report  # View HTML test report
```

### Running Single Tests
```bash
# Unit test: specify file path
npx vitest src/entities/Player.test.js

# E2E test: use --grep flag
npx playwright test --grep "player can move"
```

## Architecture Overview

### Core Technology Stack
- **Game Engine**: Phaser 3.70+ (WebGL/Canvas rendering, Arcade Physics)
- **Build System**: Vite 5.0+ (fast HMR, ES6+ modules)
- **Testing**: Vitest (unit tests) + Playwright (E2E browser tests)
- **Module System**: ES6+ with explicit `.js` file extensions required

### System Architecture

The game follows a **component-based entity system** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│              Phaser 3 Game Engine                   │
│  ┌──────────────────────────────────────────────┐  │
│  │          Scene Management Layer               │  │
│  │   BootScene → GameScene → (Future Scenes)    │  │
│  └──────────────────────────────────────────────┘  │
│         ↓                    ↓                      │
│  ┌──────────────┐    ┌─────────────────────────┐  │
│  │   Entities   │    │   Systems (Singleton)    │  │
│  │   (Player,   │◄──►│   - InputController      │  │
│  │    NPCs)     │    │   - SaveSystem           │  │
│  └──────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Scene-Based Organization**: Each game state (loading, gameplay, menus) is a Phaser Scene
2. **Entity-System Separation**:
   - Entities (Player, NPCs) own their sprite and logic
   - Systems (Input, Save) provide cross-cutting functionality
3. **Unified Input Abstraction**: Single `InputController` handles keyboard + touch, exposing normalized API
4. **Configuration-Driven**: All game constants in `src/config.js`

### Critical Code Locations

**Main Entry Point**: `src/main.js`
- Initializes Phaser with responsive canvas
- Exposes `window.game` and `window.gameReady` for E2E testing
- Handles window resize events

**Game Configuration**: `src/config.js`
- Single source of truth for game constants
- Modify player speed, canvas size, save keys here

**Scene Initialization Order** (CRITICAL):
In `GameScene.create()`:
1. Initialize systems (SaveSystem, InputController)
2. Set world bounds
3. Create environment (obstacles stored in array, NO colliders yet)
4. **Create player FIRST** (this.player must exist)
5. Create obstacle colliders (requires this.player.sprite)
6. Setup camera, load saved state

**Why this order matters**: Collision setup requires player sprite to exist. Initialization order bug was game-breaking in Phase 1.

## Development Guidelines

### Module System Requirements
- **Always use `.js` extensions** in imports: `import Player from './Player.js'` ✅
- Without extension will fail: `import Player from './Player'` ❌
- Required for native browser ESM compatibility

### Testing Strategy
- **Unit tests**: Test logic in isolation (entities, systems, config)
- **E2E tests**: Test browser integration (rendering, input, save/load)
- **Manual testing**: Always test in actual browser, especially after scene changes

### File Structure Conventions
```
src/
├── entities/        # Game objects (Player, NPCs) - one class per file
├── scenes/          # Phaser scenes (BootScene, GameScene)
├── systems/         # Cross-cutting systems (InputController, SaveSystem)
├── config.js        # Game configuration constants
└── main.js          # Entry point and Phaser initialization
```

### Adding New Entities
1. Create class in `src/entities/YourEntity.js`
2. Constructor receives `(scene, x, y, ...config)`
3. Create sprite and enable physics: `scene.physics.add.existing(this.sprite)`
4. Implement `update(time, delta)` if needed
5. Implement `getSaveData()` and `loadSaveData(data)` for persistence

### Adding New Systems
1. Create class in `src/systems/YourSystem.js`
2. Keep systems stateless or singleton-like
3. Systems should not directly depend on entities (accept references)
4. Initialize in `GameScene.create()` before entities that need them

## Important Technical Details

### Cross-Platform Input
`InputController` normalizes all input sources:
- Desktop: WASD + Arrow keys
- Mobile: Touch with virtual joystick (auto-detected)
- API: `getMovement()` returns `{x, y}` normalized vector (-1 to 1)

### Save System
- Uses browser `localStorage` with JSON serialization
- Auto-save every 30 seconds
- Save key: `lifesim_save_v1` (configurable in config.js)
- Structure: `{version, timestamp, data: {player: {...}}}`

### Responsive Canvas
- Base resolution: 800x600 (4:3 aspect ratio)
- Scales to fit any screen (320px mobile → 4K desktop)
- Phaser.Scale.FIT mode maintains aspect ratio (letterboxing)
- World size (1600x1200) is larger than viewport - camera follows player

### Physics Configuration
- **Arcade Physics** (not Matter.js) - simple AABB collision
- **No gravity** (y: 0) for top-down perspective
- World bounds collision enabled
- Player uses velocity-based movement (not direct position changes)

## Documentation References

- **ADRs**: See `docs/adr/` for all architectural decisions with context and rationale
- **Development Plan**: `docs/development-plan.md` - 6-phase roadmap
- **Worklog**: `docs/worklog.md` - implementation log with challenges and solutions
- **Phase 1 Status**: `docs/phase1-ACTUAL-status.md` - current completion status

## Common Issues and Solutions

### Unit Tests Failing
- Ensure Phaser scene context is properly mocked
- Check that physics bodies are mocked with required properties
- Run `npm run test:ui` for interactive debugging

### E2E Tests Timing Out
- Tests wait for `window.gameReady === true` flag
- Default timeout: 30 seconds (configurable in playwright.config.js)
- Use `page.waitForFunction()` for game state checks
- Check dev server is running on port 3000

### Game Not Rendering
1. Check browser console for errors
2. Verify BootScene → GameScene transition
3. Check player initialization happens BEFORE collider setup
4. Enable physics debug: set `debug: true` in main.js arcade config

### Build Errors
- If "terser not found": `npm install terser --save-dev`
- If module not found: ensure `.js` extension in import
- Clear node_modules and reinstall if dependency issues persist

## Future Development (Phase 2+)

When implementing Phase 2 features:
1. Replace programmatic graphics with sprite assets (see ADR-002)
2. Add animation system using Phaser sprite sheets
3. Expand SaveSystem to include new game state (inventory, NPCs, etc.)
4. Add new scenes (MenuScene, InventoryScene) following existing pattern
5. Keep tests updated - add E2E tests for new critical user flows

## Version Information

- **Game Version**: 1.0.0
- **Phase**: Phase 1 (Foundation) - Completed
- **Node.js**: 16.0+
- **Target Browsers**: Chrome 70+, Safari 12+, Firefox 65+, Edge 79+

# Life Simulation Web Game

A cross-platform life simulation game built with Phaser 3, designed to work seamlessly on Android smartphones, tablets, MacBook, and Windows PC browsers.

## Overview

This is an open-world life simulation game where players have complete freedom to customize their character and make choices about their virtual life, balancing survival needs with economic success through various activities.

## Technology Stack

- **Game Engine**: Phaser 3.70+
- **Build System**: Vite 5.0+
- **Language**: JavaScript (ES6+ modules)
- **Graphics**: 2D with responsive scaling
- **Storage**: HTML5 LocalStorage

## Features (Phase 1)

- Responsive game canvas that scales to any device (320px mobile to 4K displays)
- Cross-platform input controls:
  - Desktop: WASD or Arrow Keys
  - Mobile: Touch controls with virtual joystick
- Basic character movement with collision detection
- Auto-save system with local storage
- Manual save with Ctrl+S
- Scene management system
- Physics-based movement with Phaser Arcade Physics

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16.0 or higher)
- **npm** (comes with Node.js)
- A modern web browser (Chrome 70+, Safari 12+, Firefox 65+, Edge 79+)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd renat-game-1
```

2. Install dependencies:
```bash
npm install
```

## Running the Game

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The game will automatically open in your default browser at `http://localhost:3000`

### Production Build

Build the game for production:

```bash
npm run build
```

The optimized files will be generated in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Controls

### Desktop
- **Movement**: WASD or Arrow Keys
- **Save Game**: Ctrl+S (also auto-saves every 30 seconds)

### Mobile/Touch Devices
- **Movement**: Touch and drag on the left side of the screen to use the virtual joystick
- **Auto-Save**: Game saves automatically every 30 seconds and on page close

## Project Structure

```
renat-game-1/
├── docs/               # Project documentation
│   ├── requirements.md
│   └── development-plan.md
├── src/                # Source code
│   ├── entities/       # Game entities (Player, NPCs, etc.)
│   │   └── Player.js
│   ├── scenes/         # Phaser scenes
│   │   ├── BootScene.js
│   │   └── GameScene.js
│   ├── systems/        # Game systems
│   │   ├── InputController.js
│   │   └── SaveSystem.js
│   ├── config.js       # Game configuration
│   └── main.js         # Main game entry point
├── public/             # Static assets
│   └── assets/
│       ├── sprites/
│       └── audio/
├── index.html          # HTML entry point
├── vite.config.js      # Vite configuration
└── package.json        # Project dependencies

```

## Game Systems

### Input System
- Unified input handling for keyboard, mouse, and touch
- Adaptive UI that detects device type
- Virtual joystick for touch devices with visual feedback

### Save System
- Automatic save every 30 seconds
- Save on page close/reload
- Manual save with Ctrl+S
- Data stored in browser's LocalStorage
- Save data includes player position and game state

### Character System
- Physics-based movement
- Collision detection with world boundaries and obstacles
- Direction indicator showing movement direction

## Testing

Run tests:
```bash
npm test
```

Note: Comprehensive tests will be added in future phases.

## Browser Compatibility

The game supports all modern browsers:
- Chrome/Edge (70+)
- Firefox (65+)
- Safari (12+)
- Mobile browsers on iOS and Android

## Development Roadmap

This is Phase 1 (Foundation) of the project. See `docs/development-plan.md` for the complete roadmap including:
- Phase 2: Core Gameplay (Character customization, world, NPCs)
- Phase 3: Economic System (Jobs, money, shopping)
- Phase 4: Survival System (Health, needs, consequences)
- Phase 5: World Expansion (Locations, relationships)
- Phase 6: Polish and Optimization

## Known Issues

- Player sprite is currently a simple colored rectangle (proper sprites coming in Phase 2)
- No animations yet (planned for Phase 2)
- Limited world content (more locations and features in future phases)

## Performance

Target performance metrics:
- 60 FPS on mid-range mobile devices (2019+)
- Load time < 3 seconds on 3G connection
- Total download size < 100MB

## Contributing

This is a development project. Contributions will be accepted after Phase 1 is complete.

## License

ISC

## Version

Current Version: 1.0.0 (Phase 1 - Foundation)

---

For more information, see:
- `docs/requirements.md` - Original game requirements
- `docs/development-plan.md` - Detailed development plan
- `docs/worklog.md` - Development log with decisions and rationale
# ADR-008: ES6+ Module System

## Status
Accepted

## Context
JavaScript offers multiple module systems:
1. **ES6 Modules** (ESM): `import`/`export`, native browser support
2. **CommonJS**: `require`/`module.exports`, Node.js default
3. **AMD**: `define`/`require`, legacy browser async loading
4. **UMD**: Universal, combines CommonJS and AMD
5. **Global namespace**: No modules, everything in `window`

Modern web development requires:
- Code organization and separation of concerns
- Dependency management
- Tree-shaking (dead code elimination)
- Browser and build tool support

## Decision
Use **ES6+ modules** (ESM) with explicit `.js` file extensions throughout the project.

## Consequences

### Positive
- **Native browser support**: No transpilation needed for modern browsers
- **Tree-shaking**: Vite can eliminate unused code
- **Static analysis**: Import errors caught at build time
- **Clear dependencies**: Explicit import statements show what code depends on
- **Modern syntax**: Latest JavaScript features
- **Standard**: Official ECMAScript specification
- **Future-proof**: Industry standard going forward
- **Better IDE support**: Autocomplete, refactoring, go-to-definition

### Negative
- **File extensions required**: Must write `import './file.js'` not `import './file'`
- **No circular dependencies**: Harder to create (but that's a good constraint)
- **Strict mode**: Always in strict mode (but that's best practice anyway)

### Neutral
- Vite handles bundling for production
- Development uses native browser ESM (fast HMR)

## Alternatives Considered

### CommonJS
```javascript
const Phaser = require('phaser');
module.exports = GameConfig;
```
- **Pros**: Node.js standard, no file extensions needed
- **Cons**: Not native in browsers, requires bundler always, no tree-shaking
- **Why rejected**: ES6 modules are superior for browser targets

### No Modules (Global Namespace)
```javascript
window.GameConfig = { /* ... */ };
```
- **Pros**: Simple, no imports needed
- **Cons**: Namespace pollution, no dependency tracking, load order critical
- **Why rejected**: Unmaintainable for projects beyond trivial size

### TypeScript
```typescript
import GameConfig from './config';
export default class Player { /* ... */ }
```
- **Pros**: Type safety, better IDE support, catches bugs early
- **Cons**: Adds build complexity, compilation step, learning curve
- **Why rejected**: Overkill for Phase 1, can add later if needed

## Implementation Details

### Package.json Configuration
```json
{
  "type": "module"
}
```
This enables ESM in Node.js scripts (for tooling).

### File Extension Requirement
```javascript
// ✅ Correct
import GameConfig from './config.js';
import Player from './entities/Player.js';

// ❌ Wrong - will fail
import GameConfig from './config';
import Player from './entities/Player';
```

**Why required**: Native browser ESM requires full file paths. While Vite can resolve without extensions in dev, keeping extensions ensures consistency and works everywhere.

### Export Patterns

#### Named Exports
```javascript
// config.js
export const GameConfig = { /* ... */ };
export const DEBUG_MODE = false;

// main.js
import { GameConfig, DEBUG_MODE } from './config.js';
```

#### Default Export
```javascript
// Player.js
export default class Player { /* ... */ }

// GameScene.js
import Player from '../entities/Player.js';
```

#### Mixed (Used in config.js)
```javascript
// config.js
export const GameConfig = { /* ... */ };
export default GameConfig;

// Both work:
import GameConfig from './config.js';           // default
import { GameConfig } from './config.js';       // named
```

### Import Patterns

#### Default Import
```javascript
import Phaser from 'phaser';
import Player from './entities/Player.js';
```

#### Named Import
```javascript
import { GameConfig } from './config.js';
```

#### Namespace Import
```javascript
import * as Utils from './utils.js';
Utils.clamp(value, 0, 100);
```

#### Side-Effect Import
```javascript
import './styles.css';  // Just execute, don't import values
```

### Project Structure
```
src/
├── main.js              # Entry point
├── config.js            # Game configuration
├── entities/
│   └── Player.js        # Player class
├── scenes/
│   ├── BootScene.js     # Boot scene
│   └── GameScene.js     # Game scene
└── systems/
    ├── InputController.js
    └── SaveSystem.js
```

Each file is a module with clear dependencies.

### Dependency Graph
```
main.js
├─> config.js
├─> scenes/BootScene.js
└─> scenes/GameScene.js
    ├─> config.js
    ├─> entities/Player.js
    │   └─> config.js
    ├─> systems/InputController.js
    └─> systems/SaveSystem.js
        └─> config.js
```

### Vite Build Process
```javascript
// Development: Native ESM
// browser loads main.js → loads imports → Vite serves files

// Production: Bundled
// vite build → Rollup bundles → Single minified JS file
```

### Benefits for Testing

#### Unit Tests (Vitest)
```javascript
import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/config.js';

describe('GameConfig', () => {
  it('has correct width', () => {
    expect(GameConfig.width).toBe(800);
  });
});
```

Vitest understands ESM natively.

#### Mocking
```javascript
import { vi } from 'vitest';

// Mock module
vi.mock('./SaveSystem.js', () => ({
  default: class MockSaveSystem {
    save() { return true; }
  }
}));
```

## Browser Compatibility

### Development (Native ESM)
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

All modern browsers (>95% global usage).

### Production (Bundled)
- Any browser Vite targets (configurable)
- Default: Browsers with native ESM support
- Can transpile to ES5 if needed (future, unlikely)

## Performance Characteristics

### Development
- **Fast HMR**: Change one file → Only reload that module
- **No bundling**: Browser loads modules directly
- **Instant startup**: No build step

### Production
- **Tree-shaking**: Unused exports eliminated
- **Minification**: Terser removes whitespace, renames variables
- **Bundling**: Single file (or code-split chunks)
- **Smaller bundles**: Only ship used code

Example:
```javascript
// config.js exports 10 values
export const GameConfig = { /* ... */ };
export const DEBUG_MODE = false;
export const unused1 = 'foo';
// ... 7 more unused exports

// main.js only imports one
import { GameConfig } from './config.js';

// Production bundle: Only GameConfig included, unused exports removed
```

## Migration Path

If TypeScript needed later:
1. Rename `.js` to `.ts`
2. Add type annotations gradually
3. Configure `tsconfig.json`
4. Vite supports TypeScript out of the box

File extensions remain `.js` in imports (TypeScript convention).

## Best Practices

### Always Use Explicit Extensions
```javascript
import Player from './entities/Player.js';  // ✅
import Player from './entities/Player';     // ❌
```

### Avoid Circular Dependencies
```javascript
// ❌ Bad: A imports B, B imports A
// A.js
import B from './B.js';

// B.js
import A from './A.js';
```

### Use Barrel Exports for Convenience (Future)
```javascript
// entities/index.js
export { default as Player } from './Player.js';
export { default as NPC } from './NPC.js';

// GameScene.js
import { Player, NPC } from '../entities/index.js';
```

### Keep Modules Focused
- One class per file
- Related utilities can share a module
- Config can export multiple constants

## Testing Strategy
- Verify imports resolve correctly
- Check for circular dependencies (none currently)
- Ensure production build succeeds
- Test tree-shaking effectiveness

## Known Limitations

### Must Use `.js` Extension
- Cannot omit file extension in imports
- Some developers find this verbose
- **Trade-off accepted**: Consistency and universal compatibility

### No Dynamic `require()`
- CommonJS allowed `require('./file-' + name + '.js')`
- ESM requires static import paths
- **Dynamic imports available**: `const module = await import('./file.js');`

### Top-Level `await` (Future)
- Can use `await` at module top level
- Not used in Phase 1
- Supported by Vite and modern browsers

## Conclusion

ES6 modules provide:
- ✅ Modern, standard approach
- ✅ Excellent tooling support
- ✅ Performance benefits (tree-shaking)
- ✅ Clean, maintainable code
- ✅ Future-proof

**Perfect choice for this project.**

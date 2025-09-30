# ADR-001: Build System - Vite over Webpack

## Status
Accepted

## Context
The project requires a modern build system that supports:
- Fast development server with Hot Module Replacement (HMR)
- ES6+ module bundling
- Production optimization (minification, tree-shaking)
- Easy configuration without extensive setup
- Good developer experience

Traditional choice would be Webpack, but newer alternatives like Vite offer potential improvements.

## Decision
Use **Vite 5.0+** as the build system instead of Webpack.

## Consequences

### Positive
- **Instant server start**: Vite uses native ES modules in development, eliminating bundling time
- **Fast HMR**: Updates are nearly instantaneous regardless of app size
- **Simple configuration**: Minimal config needed compared to Webpack's verbose setup
- **Modern by default**: Built-in support for ES6+, TypeScript, JSX without additional loaders
- **Optimized production builds**: Uses Rollup under the hood for efficient bundling
- **Better DX**: Clearer error messages and faster feedback loop

### Negative
- **Newer ecosystem**: Less mature than Webpack (though stable for production)
- **Browser compatibility**: Development mode requires modern browsers with ES modules support (production builds work everywhere)

### Neutral
- Migration path exists if Webpack becomes necessary later
- Both tools produce similar production bundles

## Alternatives Considered

### Webpack
- **Pros**: Industry standard, massive ecosystem, highly configurable
- **Cons**: Slow dev server startup, complex configuration, slower HMR
- **Why rejected**: Development speed is critical for iterative game development

### Parcel
- **Pros**: Zero-config, fast bundling
- **Cons**: Less control, occasional quirks with complex setups
- **Why rejected**: Vite offers better balance of speed and control

### Rollup (direct use)
- **Pros**: Excellent tree-shaking, clean output
- **Cons**: No dev server, requires manual HMR setup
- **Why rejected**: Vite provides Rollup's benefits with better DX

## Implementation Details
- Configuration file: `vite.config.js`
- Dev server runs on port 3000 (configurable)
- Production builds output to `dist/` directory
- Phaser 3 works seamlessly with Vite's module system

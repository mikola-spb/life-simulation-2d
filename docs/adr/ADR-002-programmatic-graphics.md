# ADR-002: Programmatic Graphics for Phase 1

## Status
Accepted

## Context
The game needs visual representation of entities (player, obstacles, NPCs). Two approaches are available:
1. Use sprite assets (PNG/JPG images)
2. Generate graphics programmatically using code

Phase 1 focuses on core functionality and architecture. The handwritten requirements don't specify visual fidelity, prioritizing gameplay mechanics instead.

## Decision
Use **programmatic graphics** (colored rectangles and shapes) for Phase 1, defer sprite assets to Phase 2.

## Consequences

### Positive
- **Faster prototyping**: No need to create, source, or load sprite assets
- **Zero asset management**: No file paths, loading delays, or asset pipeline complexity
- **Easier testing**: Graphics are deterministic and don't depend on external files
- **Clear architecture**: Forces proper separation between visual and logical layers
- **Instant rendering**: No texture loading time
- **Scalable**: Resolution-independent vector graphics
- **File size**: Smaller build output without asset files

### Negative
- **Visual appeal**: Game looks less polished than with proper sprites
- **Placeholder work**: Will need replacement in Phase 2
- **Limited visual variety**: Harder to differentiate entities without unique sprites
- **Animation constraints**: Programmatic animations are simpler than sprite sheets

### Neutral
- Architecture supports easy swap to sprite-based rendering in Phase 2
- Phaser's API is identical for both approaches

## Alternatives Considered

### Sprite Assets from Start
- **Pros**: Professional appearance, easier visual variety, better animations
- **Cons**: Requires asset creation/sourcing, adds loading complexity, slows Phase 1 development
- **Why rejected**: Premature optimization - functionality first, visuals later

### Placeholder Sprite Pack
- **Pros**: Realistic testing of asset loading, better visuals than pure programmatic
- **Cons**: Still requires asset pipeline setup, doesn't save much time
- **Why rejected**: Middle ground that doesn't solve core problem

## Implementation Details

### Current Graphics
- **Player**: Blue rectangle (32x32px, color: 0x4a9eff)
- **Obstacles**: Brown rectangles (varying sizes, color: 0x8b4513)
- **Ground**: Green background (color: 0x90ee90)

### Code Example
```javascript
// In Player.js constructor
this.sprite = scene.add.rectangle(x, y, size, size, 0x4a9eff);
scene.physics.add.existing(this.sprite);
```

### Migration Path to Phase 2
1. Replace `add.rectangle()` with `add.sprite()`
2. Add asset loading in BootScene
3. Update entity constructors to reference sprite keys
4. Add sprite sheet support for animations

### Testing Benefits
- Unit tests don't need to mock asset loading
- E2E tests can identify elements by color
- Faster test execution without asset loading delays

# ADR-007: Arcade Physics Engine

## Status
Accepted

## Context
The game requires physics simulation for:
- Player movement
- Collision detection (player vs obstacles, walls)
- Velocity-based movement
- Future: NPC movement, projectiles, item drops

Phaser 3 offers three physics engines:
1. **Arcade Physics**: Simple, fast, AABB collision
2. **Matter.js**: Complex, realistic physics with polygons, joints, constraints
3. **Impact Physics**: Tile-based collision, slopes

## Decision
Use **Arcade Physics** for the entire game.

## Consequences

### Positive
- **Performance**: Extremely fast, handles hundreds of bodies easily
- **Simplicity**: Easy to understand and debug
- **Battery friendly**: Low CPU usage on mobile devices
- **Adequate for top-down**: AABB collision sufficient for 2D top-down game
- **Built-in features**: Velocity, acceleration, drag, gravity, collisions
- **Well-documented**: Extensive Phaser examples and tutorials
- **Quick iteration**: Fast to prototype and test gameplay

### Negative
- **AABB only**: Axis-Aligned Bounding Boxes (rectangles), no complex shapes
- **No rotation physics**: Rotating bodies don't affect collision shape
- **No realistic physics**: No momentum conservation, joints, constraints
- **Circle approximation**: Circles are approximated with rectangles

### Neutral
- Perfect fit for this game genre (life simulation, not physics puzzle)
- Can mix physics engines if needed (unlikely)

## Alternatives Considered

### Matter.js
```javascript
physics: {
  default: 'matter',
  matter: {
    gravity: { y: 0 },
    debug: true
  }
}
```
- **Pros**: Realistic physics, complex shapes, joints, constraints
- **Cons**: Higher CPU usage, complex API, overkill for simple collisions
- **Why rejected**: Unnecessary complexity, worse mobile performance

### Impact Physics
- **Pros**: Excellent for tile-based games with slopes
- **Cons**: Requires specific tile format, less flexible
- **Why rejected**: Game world not tile-based

### Custom Physics
- **Pros**: Full control
- **Cons**: Reinventing the wheel, time-consuming, bug-prone
- **Why rejected**: Arcade Physics meets all requirements

### No Physics Engine
- **Pros**: Complete control, minimal overhead
- **Cons**: Manual collision detection, no velocity/acceleration helpers
- **Why rejected**: Too much low-level work

## Implementation Details

### Configuration
```javascript
physics: {
  default: 'arcade',
  arcade: {
    gravity: { y: 0 },  // Top-down game, no gravity
    debug: false        // Enable for visual collision boxes
  }
}
```

### Enabling Physics on Entities
```javascript
// Create visual sprite
this.sprite = scene.add.rectangle(x, y, 32, 32, 0x4a9eff);

// Enable physics body
scene.physics.add.existing(this.sprite);

// Configure physics properties
this.sprite.body.setCollideWorldBounds(true);
this.sprite.body.setMaxVelocity(speed, speed);
```

### Collision Setup
```javascript
// Collide player with obstacles
this.physics.add.collider(this.player.sprite, obstacleGroup);

// Check overlap (no physical collision, just detection)
this.physics.add.overlap(this.player.sprite, itemGroup, this.collectItem, null, this);
```

### Movement Pattern
```javascript
// Velocity-based movement (smooth, physics-integrated)
move(directionX, directionY, sprint) {
  const speed = sprint ?
    GameConfig.player.speed * GameConfig.player.sprintMultiplier :
    GameConfig.player.speed;

  this.sprite.body.setVelocity(
    directionX * speed,
    directionY * speed
  );
}

// Stop movement
stop() {
  this.sprite.body.setVelocity(0, 0);
}
```

### World Bounds
```javascript
// Define game world boundaries
this.physics.world.setBounds(0, 0, 1600, 1200);

// Entity stays within bounds
this.sprite.body.setCollideWorldBounds(true);
```

### Debug Mode
```javascript
// Enable during development
arcade: {
  gravity: { y: 0 },
  debug: true  // Shows collision boxes, velocity vectors
}
```

Debug visualization:
- Green boxes: Static bodies
- Blue boxes: Dynamic bodies
- Red lines: Velocity vectors
- Yellow boxes: Overlap areas

## Physics Properties Used

### Body Properties
- `velocity`: Current speed (x, y)
- `acceleration`: Rate of velocity change
- `maxVelocity`: Speed cap
- `drag`: Friction/air resistance (not used in Phase 1)
- `collideWorldBounds`: Stay within world
- `immovable`: Body doesn't move on collision (obstacles)

### Collision Detection
- **AABB (Axis-Aligned Bounding Box)**: Fast rectangle intersection test
- **Separating Axis Theorem**: Ensures bodies don't overlap
- **Continuous detection**: Prevents tunneling (fast objects passing through)

## Performance Characteristics

### Typical Frame Budget (60 FPS = 16.67ms)
- Physics update: ~0.5ms (50 bodies)
- Collision detection: ~1ms (20 colliders)
- Total physics: ~1.5ms (~10% of frame)

### Scalability
- 100 bodies: ~1ms
- 1000 bodies: ~10ms (still playable at 60 FPS)
- 10000 bodies: ~100ms (unplayable, but unrealistic for this game)

Phase 1: ~10 bodies (player + obstacles)
Future phases: ~100-200 bodies (NPCs + items)
Well within performance budget.

## Testing Strategy
- Unit tests mock physics bodies
- Verify velocity calculations
- Test collision setup
- E2E tests validate actual physics behavior in browser

## Known Limitations

### AABB Only
- Rotating rectangle still uses original axis-aligned box
- Diagonal walls require multiple small rectangles
- Circles are approximate (fine for this game)

### No Realistic Physics
- No momentum conservation (acceptable for game feel)
- No friction simulation (use drag instead)
- No joints/constraints (not needed)

### Collision Precision
- Fast-moving objects may tunnel through thin walls
- Solution: Limit max velocity or increase wall thickness

## Future Considerations

### Phase 2+
- More obstacles and colliders (architecture ready)
- Projectiles (bullets, thrown items)
- Particle effects (don't need physics, use emitters)

### Potential Optimizations
- Spatial partitioning (if >1000 bodies, unlikely)
- Collision groups (reduce collision checks)
- Body recycling (object pooling for projectiles)

None needed for current scope.

## Why This Is The Right Choice

For a top-down life simulation game:
- ✅ Simple rectangular collision (players, NPCs, buildings)
- ✅ Fast performance on mobile
- ✅ Easy to learn and maintain
- ✅ Adequate for gameplay requirements
- ❌ Don't need realistic physics
- ❌ Don't need complex shapes
- ❌ Don't need joints/constraints

**Arcade Physics is perfect for this project.**

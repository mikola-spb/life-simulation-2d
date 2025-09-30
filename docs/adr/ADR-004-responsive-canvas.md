# ADR-004: Responsive Canvas Strategy

## Status
Accepted

## Context
The game must work across devices with vastly different screen sizes:
- Mobile phones: 360x640 to 414x896 (portrait/landscape)
- Tablets: 768x1024 to 1024x1366
- Laptops: 1366x768 to 1920x1080
- Desktop monitors: 1920x1080 to 3840x2160 (4K)

Fixed canvas size would result in:
- Tiny game on large screens
- Clipped/unusable game on small screens
- Poor user experience across devices

## Decision
Implement **responsive canvas scaling** using Phaser's Scale.FIT mode with dynamic dimension calculation while maintaining a fixed aspect ratio based on a reference resolution.

## Consequences

### Positive
- **Universal compatibility**: Game works on any screen size
- **Maintained aspect ratio**: No distortion, consistent gameplay experience
- **Automatic centering**: Game always centered in viewport
- **Resize handling**: Adapts when window is resized or device rotated
- **Optimal screen usage**: Maximizes canvas size while maintaining aspect ratio
- **Consistent game logic**: Internal game coordinates remain stable (800x600)

### Negative
- **Letterboxing**: Black bars on sides (landscape screens) or top/bottom (portrait screens)
- **Variable pixel density**: Same game unit may appear different sizes on different screens
- **Touch target sizing**: Need to ensure buttons/controls are large enough on small screens

### Neutral
- Game world is larger than viewport (1600x1200), so camera follows player
- Aspect ratio locked at 4:3 (800:600)

## Alternatives Considered

### Fixed Canvas Size
```javascript
width: 800,
height: 600
```
- **Pros**: Simple, predictable
- **Cons**: Unusable on mobile, tiny on desktop
- **Why rejected**: Fails cross-platform requirement

### Full-Screen Stretch (Scale.RESIZE)
- **Pros**: Uses entire screen
- **Cons**: Distorts game, breaks gameplay (circles become ovals, speeds vary by axis)
- **Why rejected**: Unacceptable visual quality

### Multiple Resolutions (like native apps)
- **Pros**: Optimized for each device type
- **Cons**: Need different layouts/assets, complex maintenance
- **Why rejected**: Overkill for web game, increases dev time

### Zoom In/Out Based on Screen (Scale.EXPAND)
- **Pros**: No letterboxing
- **Cons**: Different amounts of game world visible on different devices (unfair gameplay)
- **Why rejected**: Inconsistent gameplay experience

## Implementation Details

### Reference Resolution
```javascript
const GameConfig = {
  width: 800,
  height: 600,
  // ...
};
```

### Dynamic Dimension Calculation
```javascript
function getGameDimensions() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = GameConfig.width / GameConfig.height;

  let gameWidth = GameConfig.width;
  let gameHeight = GameConfig.height;

  // Scale to fit screen while maintaining aspect ratio
  if (width / height > aspectRatio) {
    // Screen is wider - letterbox on sides
    gameHeight = height;
    gameWidth = height * aspectRatio;
  } else {
    // Screen is taller - letterbox top/bottom
    gameWidth = width;
    gameHeight = width / aspectRatio;
  }

  return { width: Math.floor(gameWidth), height: Math.floor(gameHeight) };
}
```

### Phaser Configuration
```javascript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: dimensions.width,
  height: dimensions.height
}
```

### Resize Handling
```javascript
window.addEventListener('resize', () => {
  const newDimensions = getGameDimensions();
  game.scale.resize(newDimensions.width, newDimensions.height);
});
```

### Camera Configuration
```javascript
// Game world is larger than viewport
this.cameras.main.setBounds(0, 0, 1600, 1200);
this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
```

### Touch Control Positioning
Virtual joystick uses fixed viewport coordinates:
```javascript
// Always 100px from bottom-left corner
const joystickX = 100;
const joystickY = this.cameras.main.height - 100;
```

## Testing Strategy
- Test on actual devices (phones, tablets, laptops, desktops)
- Test portrait and landscape orientations
- Test window resize during gameplay
- Test with browser zoom (Ctrl +/-)
- Verify touch controls remain accessible on small screens

## Known Limitations
- Black letterbox bars (acceptable trade-off)
- Minimum practical screen size: 360x640 (smaller may have usability issues)
- Maximum useful resolution: Game assets optimized for 1080p (upscaling on 4K may look soft)

## Future Enhancements
- High-DPI sprite assets for 4K displays
- Responsive UI scaling (larger buttons on mobile)
- Adjustable zoom level (accessibility feature)

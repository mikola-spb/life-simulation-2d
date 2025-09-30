# ADR-003: Unified Input Controller Architecture

## Status
Accepted

## Context
The game must support multiple platforms:
- Desktop: Keyboard input (WASD, Arrow keys)
- Mobile: Touch input (virtual joystick)
- Tablet: Both keyboard (if available) and touch

Traditional approach would create separate input handlers for each platform. This leads to:
- Code duplication
- Inconsistent behavior between platforms
- Complex platform detection logic scattered across codebase
- Difficult testing (need to mock multiple input systems)

## Decision
Implement a **unified InputController** class that abstracts input sources and provides a consistent API regardless of platform.

## Consequences

### Positive
- **Single API**: Game code always calls the same methods (`getMovement()`, `isSprintPressed()`)
- **Automatic platform detection**: Controller detects capabilities and activates appropriate input methods
- **Consistent behavior**: Movement logic identical across platforms
- **Easy testing**: Mock single InputController instead of multiple input systems
- **Future-proof**: Easy to add gamepad support or other input methods
- **Clean code**: No platform checks in game logic

### Negative
- **Abstraction overhead**: Slight complexity in input layer
- **Testing complexity**: Need to test multiple input modes in one class
- **Initialization order**: Must ensure Phaser scene is ready before controller setup

### Neutral
- Can still access platform-specific features when needed
- Virtual joystick only created when touch support detected

## Alternatives Considered

### Separate Input Classes per Platform
```javascript
if (isMobile) {
  inputController = new TouchInputController();
} else {
  inputController = new KeyboardInputController();
}
```
- **Pros**: Clear separation, easier to understand each platform
- **Cons**: Code duplication, inconsistent behavior risk, harder to maintain
- **Why rejected**: Violates DRY principle, increases maintenance burden

### Phaser's Built-in Input Only
- **Pros**: No custom code needed
- **Cons**: Game logic would need platform checks everywhere, no virtual joystick
- **Why rejected**: Leaks platform concerns into game logic

### Input Event System
- **Pros**: Decoupled, event-driven
- **Cons**: Overkill for simple movement, adds latency
- **Why rejected**: Unnecessary complexity for Phase 1

## Implementation Details

### API Design
```javascript
class InputController {
  constructor(scene) { /* ... */ }

  // Unified API used by game entities
  getMovement() // Returns { x, y } vector (-1 to 1)
  isSprintPressed() // Returns boolean

  // Internal methods (not called by game code)
  update() // Called each frame
  setupKeyboard() // Desktop input
  setupTouch() // Mobile input
  createVirtualJoystick() // Visual touch controls
}
```

### Platform Detection
```javascript
const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

### Movement Normalization
Both keyboard and touch inputs return normalized vectors:
```javascript
const length = Math.sqrt(x * x + y * y);
if (length > 0) {
  x /= length; // Normalize to prevent diagonal speed boost
  y /= length;
}
```

### Virtual Joystick Design
- Base: Semi-transparent gray circle (60px radius)
- Thumb: White circle (25px radius)
- Position: Bottom-left corner (100px from edges)
- Behavior: Thumb clamped to base radius, returns to center on release

### Integration Example
```javascript
// In GameScene
this.inputController = new InputController(this);

// In Player.update()
const movement = this.inputController.getMovement();
const sprint = this.inputController.isSprintPressed();
this.move(movement.x, movement.y, sprint);
```

### Testing Strategy
- Unit tests mock Phaser input objects
- Test keyboard input separately
- Test touch input separately
- Test movement normalization
- E2E tests validate actual input on real devices

## Future Enhancements
- Gamepad support (detect and integrate into same API)
- Customizable key bindings
- Input remapping UI
- Gesture support (swipe to dash, pinch to zoom)

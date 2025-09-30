# ADR-005: LocalStorage Save System

## Status
Accepted

## Context
The game requires persistent state storage:
- Player position
- Game progress (future: inventory, stats, achievements)
- User preferences (future: sound volume, language)

Storage must work across platforms (desktop and mobile browsers) without requiring server infrastructure in Phase 1.

## Decision
Implement save system using **browser localStorage** with JSON serialization, versioning, and auto-save functionality.

## Consequences

### Positive
- **No server required**: Fully client-side, works offline
- **Universal browser support**: localStorage available in all modern browsers
- **Simple API**: Key-value storage with string values
- **Persistent**: Survives browser restarts and system reboots
- **Per-domain isolation**: Saves don't conflict across different games/sites
- **Sufficient capacity**: 5-10MB limit adequate for game state (Phase 1 uses ~1KB)
- **Synchronous**: No async complexity for save/load operations
- **Fast**: Direct memory access, no network latency

### Negative
- **No cloud sync**: Saves tied to single browser on single device
- **User can delete**: Clearing browser data removes saves
- **Storage limits**: 5-10MB quota (adequate but finite)
- **Security**: Data stored unencrypted (acceptable for single-player game)
- **No version control**: Can't restore previous saves (single slot)

### Neutral
- Future cloud save requires server infrastructure (Phase 3+)
- Export/import feature provides manual backup capability

## Alternatives Considered

### IndexedDB
```javascript
const request = indexedDB.open('lifesim', 1);
request.onsuccess = (event) => { /* ... */ };
```
- **Pros**: Larger storage (50MB+), supports binary data, transactions
- **Cons**: Asynchronous API complexity, overkill for simple state
- **Why rejected**: localStorage sufficient for Phase 1 needs

### Server-Side Storage
- **Pros**: Cloud sync, backup, multi-device access
- **Cons**: Requires server infrastructure, authentication, increased complexity
- **Why rejected**: Out of scope for Phase 1, can add later

### Cookies
- **Pros**: Universal support
- **Cons**: 4KB limit (too small), sent with every HTTP request (overhead)
- **Why rejected**: Inadequate capacity, security concerns

### SessionStorage
- **Pros**: Same API as localStorage
- **Cons**: Cleared when browser tab closes
- **Why rejected**: Not persistent enough

## Implementation Details

### Save Data Structure
```javascript
{
  version: '1.0.0',        // Game version for migration
  timestamp: 1234567890,   // Unix timestamp
  data: {                  // Actual game state
    player: {
      x: 400,
      y: 300,
      // ... other player state
    }
    // ... future: inventory, stats, progress
  }
}
```

### SaveSystem API
```javascript
class SaveSystem {
  save(gameState)        // Returns boolean (success)
  load()                 // Returns gameState or null
  hasSave()              // Returns boolean
  deleteSave()           // Returns boolean (success)
  getSaveMetadata()      // Returns { version, timestamp, date }
  exportSave()           // Returns JSON string (backup)
  importSave(jsonString) // Returns boolean (restore)
}
```

### Auto-Save Implementation
```javascript
// In GameScene.create()
this.autoSaveTimer = this.time.addEvent({
  delay: 30000,              // 30 seconds
  callback: this.autoSave,
  callbackScope: this,
  loop: true
});

autoSave() {
  const gameState = {
    player: this.player.getSaveData()
  };
  this.saveSystem.save(gameState);
}
```

### Version Migration (Future)
```javascript
load() {
  const saveData = JSON.parse(localStorage.getItem(this.saveKey));

  if (saveData.version !== GameConfig.version) {
    // Migration logic here
    saveData.data = this.migrate(saveData.data, saveData.version);
  }

  return saveData.data;
}
```

### Error Handling
```javascript
save(gameState) {
  try {
    const serialized = JSON.stringify(saveData);
    localStorage.setItem(this.saveKey, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save:', error);
    // Possible errors:
    // - QuotaExceededError (storage full)
    // - SecurityError (private browsing)
    return false;
  }
}
```

### Storage Key
```javascript
const SAVE_KEY = 'lifesim_save_v1';
```
- Namespaced to avoid conflicts
- Version suffix allows future breaking changes

## Testing Strategy
- Unit tests use mock localStorage
- Test save/load roundtrip
- Test version mismatch handling
- Test storage quota exceeded
- Test invalid JSON handling
- Test missing save data
- Manual test: Clear browser data and verify

## Storage Usage
Phase 1 typical save:
```json
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "data": {
    "player": { "x": 400, "y": 300 }
  }
}
```
Size: ~100 bytes

Future phases may add:
- Inventory items
- NPC states
- World changes
- Achievement progress

Estimated Phase 6 save: ~10-50 KB (well within 5MB limit)

## Future Enhancements
- Multiple save slots (save_slot_1, save_slot_2, etc.)
- Cloud save with server sync
- Automatic save migration system
- Compressed saves (LZ-string)
- Save file encryption (for competitive/multiplayer)
- Save file validation (detect tampering)

## Known Limitations
- Private browsing may disable localStorage in some browsers
- Storage quota varies by browser and available disk space
- No backup if user clears browser data
- Manual export required for save transfer between devices

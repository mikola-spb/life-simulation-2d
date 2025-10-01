# E2E Test Recovery Plan

**Date**: 2025-10-01
**Status**: CRITICAL - Grey screen issue + 28/61 E2E tests failing

---

## Current Situation Analysis

### Application Status
- **Unit Tests**: ✅ 190/190 passing (100%)
- **Build**: ✅ Successful (335 KB gzipped)
- **E2E Tests**: ⚠️ 33/61 passing (54%)
- **Browser**: ❌ Grey screen reported (needs verification)

### Recent Changes (Last 3 Commits)
1. `e4680b4` - Fixed unit tests, added save button
2. `9b95241` - Added critical assessment
3. `29a3022` - Fixed E2E tests for save button

### Key Changes Made
- ✅ Removed Ctrl+S shortcut
- ✅ Added UI save button (#save-button)
- ✅ Fixed InputController tests
- ✅ Made auto-save interval configurable
- ⚠️ Updated instructions text

---

## Root Cause Analysis

### Why E2E Tests Are Failing

**Category 1: Save Button Not Found** (6 tests)
- Tests timeout waiting for `#save-button`
- **Hypothesis**: Button created in GameScene.create(), but tests might run before scene is ready
- **Solution**: Add proper wait conditions

**Category 2: Player Movement Not Working** (3 tests)
- Player position doesn't change when keys are pressed
- **Hypothesis 1**: Dialog system might be blocking movement
- **Hypothesis 2**: Input system not receiving events in tests
- **Hypothesis 3**: Physics not updating in test environment
- **Solution**: Debug with console logs, check DialogSystem.isActive

**Category 3: Game Initialization** (2 tests)
- `window.game.constructor.name === 'Game'` fails
- **Hypothesis**: Minification or test timing issue
- **Solution**: Check for `window.game && window.game.scene` instead

**Category 4: Location Transitions** (7 tests)
- Various transition failures
- **Hypothesis**: Related to movement blocking or timing
- **Solution**: Fix movement first, then retest

**Category 5: NPC Interaction** (5 tests)
- Dialog and NPC tests failing
- **Hypothesis**: Related to DialogSystem or proximity detection
- **Solution**: Verify NPCs spawn, check interaction prompts

**Category 6: Other** (5 tests)
- Appearance save/load, misc failures
- **Solution**: Address after core issues fixed

### Grey Screen Issue

**Possible Causes**:
1. JavaScript error preventing game initialization
2. Scene not transitioning from BootScene to GameScene
3. Canvas not being created
4. CSS issue hiding canvas
5. Save button creation error blocking everything

**Investigation Steps**:
1. Check browser console for errors
2. Verify `window.game` exists
3. Check if BootScene loads
4. Verify GameScene.create() completes
5. Check CSS for display issues

---

## Recovery Plan

### Phase 1: Verify Application Works ✅ PRIORITY
1. Start dev server manually
2. Open browser to localhost:3000
3. Check browser console for errors
4. Verify game loads and displays
5. Test basic player movement
6. Test save button click
7. **IF BROKEN**: Revert last commit and retry

### Phase 2: Fix Core Issues
1. **Fix Game Initialization Check**
   - Update tests to use `window.game && window.gameReady`
   - Remove `constructor.name` check (fragile)

2. **Fix Save Button Availability**
   - Add wait for `#save-button` in tests
   - Use `await page.waitForSelector('#save-button')`
   - Verify button created after GameScene loads

3. **Fix Player Movement**
   - Add console.log in GameScene.update() to verify it's called
   - Check if DialogSystem.isActive() is blocking
   - Verify InputController.getMovement() returns values
   - Add debugging test to check player.body.velocity

4. **Fix Location Transitions**
   - Verify LocationSystem properly initialized
   - Check transition zone detection
   - Add wait conditions for location changes

5. **Fix NPC Interactions**
   - Verify NPCs spawn in locations
   - Check proximity detection threshold
   - Verify dialog opens and closes properly

### Phase 3: Test Improvements
1. Add better wait conditions
2. Add retry logic for flaky tests
3. Increase timeouts where needed
4. Add setup/teardown for test isolation

---

## Implementation Tasks

### Task 1: Verify App Functionality
**Owner**: Manual testing first
**Actions**:
- Start dev server
- Open browser
- Document any errors
- Test all Phase 2 features manually

**Success Criteria**:
- Game loads without errors
- Player can move
- NPCs are visible
- Dialog works
- Save button works

### Task 2: Fix Game Initialization Tests
**Owner**: software-engineer agent
**Files**: `e2e/game-loading.spec.js`, `e2e/critical-path.spec.js`
**Changes**:
```javascript
// OLD (fragile)
window.game.constructor.name === 'Game'

// NEW (robust)
window.game && window.game.scene && window.game.scene.keys.GameScene
```

**Success Criteria**:
- Game loading tests pass
- No false failures

### Task 3: Add Proper Wait Conditions
**Owner**: software-engineer agent
**Files**: All E2E test files
**Changes**:
- Add `await page.waitForSelector('#save-button', { timeout: 10000 })`
- Add `await page.waitForFunction(() => window.gameReady === true)`
- Use `page.waitForLoadState('networkidle')` where needed

**Success Criteria**:
- Tests don't timeout
- Elements found reliably

### Task 4: Debug Player Movement
**Owner**: software-engineer agent
**Investigation**:
1. Add test to check `DialogSystem.isActive()`
2. Check if `InputController.getMovement()` returns non-zero
3. Verify `player.body.velocity` changes
4. Check if `scene.physics.world.isPaused`

**Success Criteria**:
- Identify why player doesn't move in tests
- Movement tests pass

### Task 5: Fix All Save System Tests
**Owner**: software-engineer agent
**Files**: `e2e/save-system.spec.js`
**Changes**:
- Add wait for save button
- Verify localStorage after button click
- Add retry for save confirmation check

**Success Criteria**:
- All 7 save system tests pass

---

## Testing Strategy

### Test Execution Order
1. Run single test file at a time
2. Fix issues in isolation
3. Verify fixes don't break other tests
4. Run full suite at end

### Commit Strategy
- Commit after each successful fix
- Message format: "Fix E2E: [category] - [issue] (X/61 passing)"
- Only commit if unit tests still pass
- Revert if app becomes non-functional

### Success Metrics
- Target: 55/61 tests passing (90%)
- Minimum: 50/61 tests passing (82%)
- All save system tests passing
- All movement tests passing
- App fully functional in browser

---

## Rollback Plan

If app is broken:
1. Check last 3 commits:
   - `29a3022` - E2E test updates
   - `e4680b4` - Save button + test fixes
   - `9b95241` - Assessment doc

2. Revert strategy:
   ```bash
   # If save button broke app
   git revert e4680b4

   # If config changes broke it
   git show e4680b4:src/config.js > src/config.js
   ```

3. Identify broken commit
4. Fix specific issue
5. Re-apply good changes

---

## Next Steps

1. ✅ Create this analysis document
2. ⏳ Start dev server and manually test app
3. ⏳ Document findings (working vs broken)
4. ⏳ Use software-engineer agent for systematic fixes
5. ⏳ Run E2E tests after each fix
6. ⏳ Commit when improvements confirmed
7. ⏳ Achieve 90% E2E pass rate

---

**Status**: Ready to execute Phase 1 (Verify App)

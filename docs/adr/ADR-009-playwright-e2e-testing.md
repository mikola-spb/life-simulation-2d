# ADR-009: Playwright for E2E Testing

## Status
Accepted

## Context
Web browser game requires end-to-end (E2E) testing to verify:
- Game loads successfully in real browsers
- Player can perform actions (movement, input)
- Save/load functionality works with real localStorage
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile device simulation

Unit tests (Vitest) verify individual components but don't catch:
- Integration issues
- Browser-specific bugs
- Canvas rendering problems
- Actual user interaction flows
- Performance on real devices

## Decision
Use **Playwright** as the E2E testing framework for browser-based testing.

## Consequences

### Positive
- **Multi-browser**: Tests on Chromium, Firefox, WebKit (Safari) with single API
- **Modern API**: Async/await, auto-waiting, no flaky timeouts
- **Auto-wait**: Waits for elements to be actionable (visible, enabled)
- **Device emulation**: Test mobile/tablet viewports, touch events
- **Screenshots/video**: Automatic capture on failure
- **Network control**: Mock API calls, test offline mode
- **Fast execution**: Parallel test execution
- **Great DX**: Excellent error messages, trace viewer for debugging
- **Active development**: Microsoft-backed, frequent updates
- **Built-in test runner**: No Jest/Mocha needed

### Negative
- **Browser downloads**: Requires downloading Chromium (~300MB), Firefox (~80MB), WebKit (~70MB)
- **Slower than unit tests**: E2E tests take seconds vs milliseconds
- **More brittle**: Can break on UI changes
- **Resource intensive**: Launches actual browsers

### Neutral
- Industry standard for modern web E2E testing
- Learning curve for those familiar with Selenium/Cypress

## Alternatives Considered

### Cypress
```javascript
describe('Game', () => {
  it('loads', () => {
    cy.visit('http://localhost:3000');
    cy.get('canvas').should('be.visible');
  });
});
```
- **Pros**: Popular, great DX, time-travel debugging, excellent docs
- **Cons**:
  - No WebKit/Safari support (Chromium and Firefox only)
  - Runs tests in iframe (can cause issues)
  - More opinionated architecture
  - Paid features for parallel execution, cross-browser
- **Why rejected**: Playwright offers Safari testing and better cross-browser support

### Selenium WebDriver
```javascript
const driver = new Builder().forBrowser('chrome').build();
await driver.get('http://localhost:3000');
```
- **Pros**: Industry standard for decades, supports all browsers
- **Cons**:
  - Verbose API
  - Manual waits needed (flaky tests)
  - Slower execution
  - Poor error messages
  - Outdated approach
- **Why rejected**: Playwright is modern evolution of Selenium

### Puppeteer
```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('http://localhost:3000');
```
- **Pros**: Fast, Chrome DevTools Protocol, Google-backed
- **Cons**: Chrome/Chromium only (no Firefox, Safari)
- **Why rejected**: Need cross-browser testing

### TestCafe
- **Pros**: No browser drivers, cross-browser
- **Cons**: Slower, injected JS can interfere with game code
- **Why rejected**: Playwright offers better performance and API

## Implementation Details

### Installation
```bash
npm install --save-dev @playwright/test
npx playwright install chromium  # Only Chromium for Phase 1
```

### Configuration (playwright.config.js)
```javascript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Future: Firefox, Safari, mobile devices
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Structure
```javascript
import { test, expect } from '@playwright/test';

test.describe('Game Loading', () => {
  test('should load game successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for loading screen to disappear
    await expect(page.locator('#loading-screen')).toBeHidden({ timeout: 10000 });

    // Verify canvas is visible
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
```

### Game Instance Exposure
```javascript
// In main.js - expose game for testing
if (typeof window !== 'undefined') {
  window.game = game;
  window.gameReady = false;
  game.events.once('ready', () => {
    window.gameReady = true;
  });
}
```

### Waiting for Game Ready
```javascript
test('player can move', async ({ page }) => {
  await page.goto('/');

  // Wait for game initialization
  await page.waitForFunction(() => window.gameReady === true, { timeout: 10000 });

  // Get player position
  const initialPos = await page.evaluate(() => {
    const scene = window.game.scene.keys.GameScene;
    return { x: scene.player.sprite.x, y: scene.player.sprite.y };
  });

  // Simulate input
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500); // Wait for movement

  // Verify position changed
  const newPos = await page.evaluate(() => {
    const scene = window.game.scene.keys.GameScene;
    return { x: scene.player.sprite.x, y: scene.player.sprite.y };
  });

  expect(newPos.x).toBeGreaterThan(initialPos.x);
});
```

### Test Organization
```
e2e/
├── critical-path.spec.js    # Must-pass tests for Phase 1
├── game-loading.spec.js     # Loading screen, canvas, initialization
├── game-basic.spec.js       # Basic game functionality
├── player-interaction.spec.js # Player movement, input
└── save-system.spec.js      # Save/load functionality
```

### Running Tests
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:debug    # Debug mode (headed browser)
npm run test:e2e:report   # View HTML report
```

### Auto-Wait Feature
```javascript
// ❌ Old way (Selenium) - manual waits, flaky
await driver.sleep(5000);
await driver.findElement(By.id('button')).click();

// ✅ Playwright - auto-waits for element to be actionable
await page.click('#button');
// Waits for: exists, visible, enabled, stable (not animating)
```

### Screenshot on Failure
Automatic for all test failures:
```
test-results/
└── game-loading-should-load-game-chromium/
    ├── test-failed-1.png
    └── trace.zip  (interactive trace viewer)
```

### Device Emulation (Future)
```javascript
// Test on iPhone 13
test('mobile gameplay', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['iPhone 13']
  });
  const page = await context.newPage();

  // Touch input automatically available
  await page.goto('/');
  await page.tap('.virtual-joystick');
});
```

## Test Categories

### Critical Path (5 tests)
- Game loads without errors
- Canvas renders
- Player can perform basic action
- Game systems respond
- Summary report

### Game Loading (3 tests)
- Loading screen appears and disappears
- Canvas renders with correct dimensions
- No console errors during load

### Player Interaction (4 tests)
- Keyboard input moves player
- Player stays within bounds
- Collisions work
- Input controller responds

### Save System (3 tests)
- Auto-save creates localStorage entry
- Save data has correct structure
- Load restores player position

## Performance Testing (Future)

Playwright can measure performance:
```javascript
test('game maintains 60 FPS', async ({ page }) => {
  await page.goto('/');

  const fps = await page.evaluate(() => {
    let frames = 0;
    const start = performance.now();

    return new Promise(resolve => {
      function count() {
        frames++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(count);
        } else {
          resolve(frames);
        }
      }
      requestAnimationFrame(count);
    });
  });

  expect(fps).toBeGreaterThan(50); // At least 50 FPS
});
```

## Cross-Browser Testing

### Current (Phase 1)
- Chromium only (fastest, most common)

### Future (Phase 2+)
```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
]
```

## CI/CD Integration

GitHub Actions example:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging Failed Tests

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```
Shows:
- Timeline of actions
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

### Debug Mode
```bash
npm run test:e2e:debug
```
- Opens headed browser
- Pauses execution
- Step through test
- Inspect elements

### UI Mode
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Watch mode
- Time travel debugging
- Inline screenshots

## Known Issues and Solutions

### Issue: Tests Timing Out
**Cause**: Game not loading fast enough
**Solution**: Increase timeout
```javascript
test('slow test', async ({ page }) => {
  test.setTimeout(30000); // 30 seconds
  await page.goto('/');
});
```

### Issue: Flaky Tests
**Cause**: Race conditions, animations
**Solution**: Use proper waits
```javascript
// ❌ Bad
await page.waitForTimeout(1000);

// ✅ Good
await page.waitForFunction(() => window.gameReady === true);
```

### Issue: Canvas Not Accessible
**Cause**: Playwright can't directly interact with canvas
**Solution**: Expose game instance, use page.evaluate()
```javascript
const playerPos = await page.evaluate(() => {
  const scene = window.game.scene.keys.GameScene;
  return { x: scene.player.sprite.x, y: scene.player.sprite.y };
});
```

## Testing Strategy

### Test Pyramid
```
     E2E (Playwright)     ← 15 tests (5-10 minutes)
         /\
        /  \
       /    \
      /      \
     /        \
    / Unit     \          ← 79 tests (5 seconds)
   /  (Vitest)  \
  /______________\
```

### When to Use E2E
- ✅ Critical user flows
- ✅ Browser-specific features
- ✅ Canvas/WebGL rendering
- ✅ Cross-browser compatibility
- ✅ Integration of multiple systems

### When NOT to Use E2E
- ❌ Testing individual functions (use unit tests)
- ❌ Testing internal logic (use unit tests)
- ❌ Every possible code path (too slow)

## Future Enhancements
- Visual regression testing (screenshots comparison)
- Performance budgets (FPS, memory usage)
- Accessibility testing (keyboard navigation, screen readers)
- Network throttling tests (slow 3G simulation)
- Offline mode testing (Service Worker)

## Conclusion

Playwright provides:
- ✅ Reliable cross-browser E2E testing
- ✅ Modern API with auto-waiting
- ✅ Excellent debugging tools
- ✅ Mobile device testing capability
- ✅ Active development and support

**Ideal choice for testing browser-based game.**

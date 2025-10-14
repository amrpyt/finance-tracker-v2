# E2E Testing with Playwright

**Project:** Finance Tracker v2.0  
**Created:** 2025-10-13  
**Status:** Active  

---

## Overview

End-to-end testing for Finance Tracker v2.0 Telegram bot using Playwright. Tests validate bot functionality via Convex HTTP endpoints and simulated Telegram webhook payloads.

---

## Test Strategy

### What We Test

1. **HTTP Endpoints** - Webhook registration, webhook handling
2. **Command Processing** - /start, /help command execution
3. **User Flows** - Onboarding, language selection, help access
4. **Error Handling** - Invalid payloads, concurrent requests
5. **Performance** - Response time targets (< 2s for /start, < 1s for /help)
6. **Regression** - All Epic 1 functionality after refactoring

### What We Don't Test (Unit Tests)

- Pure functions (regex patterns, message formatting)
- Database schemas
- Individual mutations/queries

---

## Setup

### Prerequisites

- Node.js 18+
- Playwright installed (`npm install`)
- Convex deployment (dev or prod)

### Environment Configuration

Set the Convex deployment URL:

```bash
# For dev testing
export CONVEX_SITE_URL=https://terrific-ocelot-625.convex.site

# For production testing (default)
export CONVEX_SITE_URL=https://giant-mouse-652.convex.site
```

If not set, defaults to production URL in `playwright.config.ts`.

---

## Running Tests

### All E2E Tests

```bash
npm run test:e2e
```

### Specific Test File

```bash
npx playwright test epic-1-regression.spec.ts
```

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Run All Tests (Unit + E2E)

```bash
npm run test:all
```

---

## Test Structure

```
tests/e2e/
├── README.md                      # This file
├── fixtures/
│   └── telegram-payloads.ts       # Mock Telegram webhook payloads
├── epic-1-regression.spec.ts      # Epic 1 regression suite
└── (future: epic-2-*.spec.ts)     # Epic 2+ tests
```

---

## Test Suites

### Epic 1 Regression Tests

**File:** `epic-1-regression.spec.ts`

**Coverage:**
- Story 1.1: Webhook Registration (2 tests)
- Story 1.3: User Onboarding (3 tests)
- Story 1.4: Help System (2 tests)
- Error Handling (3 tests)
- Performance (1 test)
- Command Router Refactoring (2 tests)

**Total:** 13 E2E tests

**Example:**
```bash
npx playwright test epic-1-regression.spec.ts
```

---

## Test Fixtures

### Telegram Payloads

Located in `fixtures/telegram-payloads.ts`:

```typescript
import {
  createStartCommandPayload,
  createHelpCommandPayload,
  createLanguageCallbackPayload,
  TEST_USER,
} from './fixtures/telegram-payloads';

// Use in tests
const payload = createStartCommandPayload();
await request.post('/telegram/webhook', { data: payload });
```

**Available Fixtures:**
- `createStartCommandPayload()` - /start command
- `createHelpCommandPayload()` - /help command
- `createLanguageCallbackPayload(lang)` - Language button press
- `createTextMessagePayload(text)` - Generic message
- `createInvalidPayload()` - Invalid structure
- `TEST_USER` - Consistent test user data

---

## Writing New Tests

### Example: Testing New Command

```typescript
import { test, expect } from '@playwright/test';
import { createTextMessagePayload } from './fixtures/telegram-payloads';

test.describe('Epic 2: Account Management', () => {
  
  test('should create cash account', async ({ request }) => {
    const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || 
      'https://giant-mouse-652.convex.site';
    
    // Send account creation message
    const payload = createTextMessagePayload('أنشئ حساب محفظة برصيد 500 جنيه');
    
    const response = await request.post(
      `${CONVEX_SITE_URL}/telegram/webhook`,
      { data: payload }
    );
    
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });
});
```

---

## Performance Testing

### Response Time Targets

| Command | Target | Test Threshold (E2E) |
|---------|--------|----------------------|
| /start  | < 2000ms | < 3000ms |
| /help   | < 1000ms | < 2000ms |
| Webhook | < 500ms | < 1000ms |

**Note:** E2E thresholds are more lenient due to network latency.

### Measuring Performance

Tests log response times to console:

```
/start response time: 402ms ✅
/help response time: 285ms ✅
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          CONVEX_SITE_URL: ${{ secrets.CONVEX_PROD_URL }}
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Tests

### View Test Report

```bash
npm run test:e2e:report
```

### Run in Debug Mode

```bash
npx playwright test --debug
```

### View Traces

```bash
npx playwright show-trace trace.zip
```

### Check Logs

All tests log to console. Check for:
- Request/response data
- Performance metrics
- Error messages

---

## Best Practices

### 1. Use Fixtures

Always use fixtures for Telegram payloads:

```typescript
// ✅ Good
const payload = createStartCommandPayload();

// ❌ Bad
const payload = { update_id: 1, message: { ... } };
```

### 2. Sequential Testing

Telegram bot tests should run sequentially (already configured):

```typescript
// In playwright.config.ts
fullyParallel: false,
workers: 1,
```

### 3. Wait Between Tests

Add delays between related tests:

```typescript
await new Promise(resolve => setTimeout(resolve, 500));
```

### 4. Unique Update IDs

Use timestamps for unique update IDs:

```typescript
const payload = createStartCommandPayload(Date.now());
```

### 5. Check Logs

Always check Convex logs when tests fail:

```bash
npx convex logs --history 20
```

---

## Troubleshooting

### Issue: Tests Failing with 404

**Cause:** Wrong CONVEX_SITE_URL

**Solution:**
```bash
# Check current URL
echo $CONVEX_SITE_URL

# Set correct URL
export CONVEX_SITE_URL=https://giant-mouse-652.convex.site
```

---

### Issue: Webhook Returns 500

**Cause:** Missing environment variables in Convex

**Solution:**
```bash
# Check Convex env vars
npx convex env list

# Set missing vars
npx convex env set TELEGRAM_BOT_TOKEN "your-token"
```

---

### Issue: Tests Timeout

**Cause:** Convex functions taking too long

**Solution:**
1. Check Convex dashboard for slow functions
2. Increase timeout in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 20000, // 20 seconds
}
```

---

### Issue: Concurrent Tests Fail

**Cause:** Race conditions with same test user

**Solution:**
- Use unique update IDs with timestamps
- Ensure `workers: 1` in config
- Add delays between tests

---

## Metrics & Reporting

### Test Execution

After running tests, view report:

```bash
npm run test:e2e:report
```

### Coverage

E2E tests cover:
- ✅ HTTP endpoint availability
- ✅ Command routing
- ✅ Error handling
- ✅ Performance targets
- ✅ Integration between layers
- ❌ Database operations (covered by unit tests)
- ❌ AI parsing logic (covered by unit tests)

---

## Maintenance

### When to Update Tests

1. **New Epic:** Create new test file `epic-X-regression.spec.ts`
2. **New Command:** Add test cases to appropriate epic file
3. **Refactoring:** Update fixtures if payload structure changes
4. **Performance:** Adjust thresholds if targets change

### Test Review Checklist

- [ ] All Epic 1 tests passing
- [ ] New tests added for new features
- [ ] Fixtures updated for new payload types
- [ ] Performance targets validated
- [ ] Documentation updated
- [ ] CI/CD pipeline passing

---

## Resources

- **Playwright Docs:** https://playwright.dev
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Convex HTTP Actions:** https://docs.convex.dev/http-actions
- **Epic 1 Retrospective:** `docs/retrospectives/epic-1-retro-2025-10-13.md`

---

## Status: ✅ Ready for Use

**Setup:** Complete  
**Tests:** 13 E2E tests covering Epic 1  
**CI/CD:** Ready for integration  
**Documentation:** Complete  

**Next Steps:**
- Add Epic 2 tests when stories are implemented
- Monitor performance metrics
- Expand fixtures for account management

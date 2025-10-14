/**
 * Playwright E2E Testing Configuration
 * 
 * Tests Telegram bot functionality via Convex HTTP endpoints
 * and direct API calls.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for Telegram bot to avoid race conditions
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 1, // Single worker for Telegram bot testing
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for Convex deployment */
    baseURL: process.env.CONVEX_SITE_URL || 'https://giant-mouse-652.convex.site',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Maximum time each action can take */
    actionTimeout: 10000,
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'api-tests',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

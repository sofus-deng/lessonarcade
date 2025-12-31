import { defineConfig, devices } from '@playwright/test';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
process.env.DATABASE_URL = databaseUrl;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['html', { open: 'never' }],
        ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
      ]
    : [['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:3100',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Allow CI to override with production server for better determinism
    command: process.env.PLAYWRIGHT_WEB_SERVER_CMD ?? 'pnpm dev:e2e',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    env: {
      // Mock Gemini Vertex AI for deterministic tests
      GEMINI_VERTEX_MOCK: '1',
      // Mock ElevenLabs signed URL for deterministic E2E tests
      E2E_ELEVENLABS_SIGNED_URL: 'https://mock-signed-url-e2e-test.com',
      // Configure Basic Auth for Studio routes during E2E tests
      STUDIO_BASIC_AUTH_USER: 'e2e',
      STUDIO_BASIC_AUTH_PASS: 'e2e',
      DATABASE_URL: databaseUrl,
    },
  },
});

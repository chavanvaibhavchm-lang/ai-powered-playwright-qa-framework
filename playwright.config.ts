import { defineConfig, devices } from '@playwright/test';

// Work around the observed bundled headed Chromium failure on Windows.
// CI uses bundled Chromium and never depends on a Windows path.
const desktop = {
  ...devices['Desktop Chrome'],
  channel: process.platform === 'win32' && !process.env.CI ? 'chrome' : undefined,
  viewport: { width: 1440, height: 900 },
};
const uiMatch = ['tests/login.spec.ts', 'tests/ui/**/*.spec.ts'];

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  grepInvert: process.env.INCLUDE_KNOWN_DEFECTS === '1' ? undefined : /@known-defect/,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/summary.json' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          application: 'SauceDemo + independent local companion service',
          ui_url: 'https://www.saucedemo.com',
          node_version: process.version,
          operating_system: process.platform,
          execution: process.env.CI ? 'CI' : 'Local',
        },
      },
    ],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', testMatch: uiMatch, testIgnore: '**/responsive/**', use: desktop },
    {
      name: 'mobile-chromium',
      testMatch: 'tests/ui/responsive/**/*.spec.ts',
      use: {
        ...desktop,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: 'api', testMatch: 'tests/api/**/*.spec.ts' },
    { name: 'ai', testMatch: 'tests/ai/**/*.spec.ts' },
    { name: 'accessibility', testMatch: 'tests/accessibility/**/*.spec.ts', use: desktop },
    {
      name: 'visual',
      testMatch: 'tests/visual/**/*.spec.ts',
      use: {
        ...desktop,
        locale: 'en-US',
        timezoneId: 'UTC',
        colorScheme: 'light',
      },
    },
    { name: 'examples', testMatch: 'tests/example.spec.ts', use: desktop },
    ...(process.env.CROSS_BROWSER === '1'
      ? [
          {
            name: 'firefox',
            testMatch: uiMatch,
            testIgnore: '**/responsive/**',
            use: devices['Desktop Firefox'],
          },
          {
            name: 'webkit',
            testMatch: uiMatch,
            testIgnore: '**/responsive/**',
            use: devices['Desktop Safari'],
          },
        ]
      : []),
  ],
  snapshotPathTemplate:
    '{testDir}/visual/baselines/{platform}/{projectName}/{testFilePath}/{arg}{ext}',
  outputDir: 'test-results',
});

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Configuration for Visual Regression & A11y Testing
 * - Visual Regression: 3 viewports × 2 browsers × 2 themes = 12 configs/page
 * - A11y: 3 viewports × 2 browsers = 6 configs/page (new design only)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  // Global setup/teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  
  // Project configurations for different browsers and viewports
  projects: [
    // === VISUAL REGRESSION PROJECTS ===
    // Chromium - Mobile, Tablet, Desktop - Light & Dark
    {
      name: 'vr-chromium-mobile-light',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'light',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-chromium-mobile-dark',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'dark',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-chromium-tablet-light',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-chromium-tablet-dark',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'dark',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-chromium-desktop-light',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-chromium-desktop-dark',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    
    // Firefox - Mobile, Tablet, Desktop - Light & Dark
    {
      name: 'vr-firefox-mobile-light',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'light',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-firefox-mobile-dark',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'dark',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-firefox-tablet-light',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-firefox-tablet-dark',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'dark',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-firefox-desktop-light',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    {
      name: 'vr-firefox-desktop-dark',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
        testIdAttribute: 'data-vr-test',
      },
      testMatch: /visual-regression\/vr-capture\.spec\.ts/,
    },
    
    // === A11Y GATE PROJECTS (new design system only) ===
    // Chromium - 3 viewports
    {
      name: 'a11y-chromium-mobile',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'light',
      },
      testMatch: /a11y\/a11y-scan\.spec\.ts/,
    },
    {
      name: 'a11y-chromium-tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
      },
      testMatch: /a11y\/a11y-scan\.spec\.ts/,
    },
    {
      name: 'a11y-chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      },
      testMatch: /a11y\/a11y-scan\.spec\.ts/,
    },
    
    // Firefox - 3 viewports
    {
      name: 'a11y-firefox-mobile',
      use: { 
        ...devices['iPhone 13'],
        viewport: { width: 375, height: 667 },
        colorScheme: 'light',
      },
      testMatch: /a11y\/a11y-scan\.spec\.ts/,
    },
    {
      name: 'a11y-firefox-tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
        colorScheme: 'light',
      },
      testMatch: /a11y\/a11y-scan\.spec\.ts/,
    },
    {
      name: 'a11y-firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      },
      testMatch: /a11y\/a11y-scan\.spec\.ts/,
    },
  ],
  
  // Output directories
  outputDir: 'test-results/',
  snapshotDir: 'tests/visual-regression/__baselines__/',
  
  // Expect configuration for visual comparisons
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 0,
      threshold: 0.005, // 0.5% threshold
      animations: 'disabled',
      clip: undefined,
    },
  },
  
  // Timeout settings
  timeout: 120000,
  globalTimeout: 600000,
  
  // Metadata for test runs
  metadata: {
    project: 'rediseño_aws_v2',
    phase: 'Phase 4: Visual Regression + A11y Gate',
  },
});
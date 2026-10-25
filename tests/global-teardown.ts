import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global Teardown for Playwright Tests
 * - Cleans up temporary files
 * - Reports summary
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global Playwright teardown...');
  
  const resultsDir = path.join(__dirname, '..', 'test-results');
  
  // Check for test results
  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir);
    console.log(`📊 Test artifacts in ${resultsDir}:`, files.length, 'files');
  }
  
  // Report baseline status
  const baselineDir = path.join(__dirname, 'visual-regression', '__baselines__');
  if (fs.existsSync(baselineDir)) {
    const browsers = fs.readdirSync(baselineDir);
    let totalBaselines = 0;
    for (const browser of browsers) {
      const browserPath = path.join(baselineDir, browser);
      if (fs.statSync(browserPath).isDirectory()) {
        const themes = fs.readdirSync(browserPath);
        for (const theme of themes) {
          const themePath = path.join(browserPath, theme);
          if (fs.statSync(themePath).isDirectory()) {
            const files = fs.readdirSync(themePath);
            totalBaselines += files.length;
          }
        }
      }
    }
    console.log(`📸 Total baseline screenshots: ${totalBaselines}`);
  }
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
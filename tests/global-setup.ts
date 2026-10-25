import { chromium, firefox, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global Setup for Playwright Tests
 * - Starts the Flask app if not running
 * - Warms up the application
 * - Creates test data if needed
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global Playwright setup...');
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const designParam = '?design=new';
  
  // Check if server is already running
  let serverRunning = false;
  try {
    const response = await fetch(`${baseUrl}/stock/login${designParam}`, { method: 'HEAD' });
    serverRunning = response.ok;
  } catch {
    serverRunning = false;
  }
  
  if (!serverRunning) {
    console.log('⚠️  Flask server not detected at', baseUrl);
    console.log('   Please start the server manually: python web_app.py');
    console.log('   Or set BASE_URL environment variable to point to running instance.');
  } else {
    console.log('✅ Flask server is running at', baseUrl);
  }
  
  // Ensure baseline directories exist
  const baselineDir = path.join(__dirname, 'visual-regression', '__baselines__');
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
    console.log('📁 Created baseline directory:', baselineDir);
  }
  
  const a11yBaselineDir = path.join(__dirname, 'a11y', '__baselines__');
  if (!fs.existsSync(a11yBaselineDir)) {
    fs.mkdirSync(a11yBaselineDir, { recursive: true });
    console.log('📁 Created a11y baseline directory:', a11yBaselineDir);
  }
  
  // Create test results directory
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Warm up the application by making a few requests
  if (serverRunning) {
    console.log('🔥 Warming up application...');
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/stock/login${designParam}`);
      await page.waitForLoadState('networkidle');
      await browser.close();
      console.log('✅ Application warmed up');
    } catch (error) {
      console.warn('⚠️  Warmup failed (non-fatal):', error);
    }
  }
  
  console.log('✅ Global setup complete');
}

export default globalSetup;
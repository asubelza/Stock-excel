import { test, expect, Page, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { pixelmatch } from 'pixelmatch';
import { PNG } from 'pngjs';
import pageConfig from './page-config.json';

/**
 * Visual Regression - Baseline Capture (VR-03)
 * 
 * This test captures baseline screenshots for all configured pages
 * across all browser/viewport/theme combinations.
 * 
 * Run with: UPDATE_BASELINE=true pnpm vr:update
 * Or: pnpm vr:capture (will fail if baselines don't exist)
 */

// Test configuration
const BASE_URL = process.env.BASE_URL || pageConfig.baseUrl;
const DESIGN_PARAM = pageConfig.designSystemParam;
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === 'true';
const BASELINE_DIR = path.join(__dirname, '__baselines__');

// Get current project name from test info
function getProjectConfig(testInfo: any) {
  const projectName = testInfo.project.name;
  // Parse: vr-{browser}-{viewport}-{theme}
  const match = projectName.match(/vr-(chromium|firefox)-(mobile|tablet|desktop)-(light|dark)/);
  if (!match) {
    throw new Error(`Invalid project name format: ${projectName}`);
  }
  return {
    browser: match[1],
    viewport: match[2],
    theme: match[3],
    projectName,
  };
}

// Get viewport dimensions
function getViewport(viewportName: string) {
  const vp = pageConfig.viewports.find(v => v.name === viewportName);
  if (!vp) throw new Error(`Unknown viewport: ${viewportName}`);
  return { width: vp.width, height: vp.height };
}

// Login helper
async function login(page: Page, role: string = 'admin') {
  const user = pageConfig.testUsers[role as keyof typeof pageConfig.testUsers] || pageConfig.testUsers.admin;
  await page.goto(`${BASE_URL}/stock/login${DESIGN_PARAM}`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="usuario"]', user.username);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/stock/**');
  await page.waitForLoadState('networkidle');
  
  // Wait for design system to initialize
  await page.waitForFunction(() => document.documentElement.getAttribute('data-design-system') === 'new');
}

// Wait for page hydration (HTMX + Alpine.js)
async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForTimeout(500); // Allow animations to settle
}

// Set theme via localStorage
async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    try {
      localStorage.setItem('ecjy_theme', t);
      document.documentElement.setAttribute('data-theme', t);
    } catch (_) {
      // localStorage unavailable (private browsing, etc.)
      document.documentElement.setAttribute('data-theme', t);
    }
  }, theme);
  await page.waitForTimeout(200); // Allow theme transition
}

// Capture screenshot with ignore regions
async function captureScreenshot(
  page: Page,
  pageName: string,
  projectConfig: ReturnType<typeof getProjectConfig>
): Promise<string> {
  const { browser, viewport, theme } = projectConfig;
  const vp = getViewport(viewport);
  
  // Create directory structure: baselines/{browser}/{theme}/{viewport}/
  const screenshotDir = path.join(BASELINE_DIR, browser, theme, viewport);
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  const screenshotPath = path.join(screenshotDir, `${pageName}.png`);
  
  // Capture full page screenshot
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: 'disabled',
  });
  
  console.log(`📸 Captured: ${browser}/${theme}/${viewport}/${pageName}.png`);
  return screenshotPath;
}

// Compare screenshot with baseline
async function compareScreenshot(
  page: Page,
  pageName: string,
  projectConfig: ReturnType<typeof getProjectConfig>
): Promise<{ match: boolean; diffPercent: number; diffPath?: string }> {
  const { browser, viewport, theme } = projectConfig;
  const vp = getViewport(viewport);
  
  const baselineDir = path.join(BASELINE_DIR, browser, theme, viewport);
  const baselinePath = path.join(baselineDir, `${pageName}.png`);
  const currentPath = path.join(BASELINE_DIR, '..', '..', 'test-results', 'current', browser, theme, viewport, `${pageName}.png`);
  const diffPath = path.join(BASELINE_DIR, '..', '..', 'test-results', 'diff', browser, theme, viewport, `${pageName}.png`);
  
  // Ensure current/diff directories exist
  const currentDir = path.dirname(currentPath);
  const diffDir = path.dirname(diffPath);
  if (!fs.existsSync(currentDir)) fs.mkdirSync(currentDir, { recursive: true });
  if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir, { recursive: true });
  
  // Capture current screenshot
  await page.screenshot({
    path: currentPath,
    fullPage: true,
    animations: 'disabled',
  });
  
  // If no baseline exists, fail with clear message
  if (!fs.existsSync(baselinePath)) {
    return {
      match: false,
      diffPercent: 100,
      diffPath: undefined,
    };
  }
  
  // Compare using pixelmatch
  const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
  const currentImg = PNG.sync.read(fs.readFileSync(currentPath));
  
  // Ensure same dimensions
  if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
    return {
      match: false,
      diffPercent: 100,
      diffPath,
    };
  }
  
  const diffImg = new PNG({ width: baselineImg.width, height: baselineImg.height });
  const diffPixels = pixelmatch(
    baselineImg.data,
    currentImg.data,
    diffImg.data,
    baselineImg.width,
    baselineImg.height,
    { threshold: 0.1, includeAA: true }
  );
  
  const totalPixels = baselineImg.width * baselineImg.height;
  const diffPercent = (diffPixels / totalPixels) * 100;
  
  // Save diff image
  fs.writeFileSync(diffPath, PNG.sync.write(diffImg));
  
  const threshold = pageConfig.thresholds.visual.pixelThreshold * 100; // Convert to percentage
  const match = diffPercent <= threshold;
  
  return { match, diffPercent, diffPath: match ? undefined : diffPath };
}

// Main test for each page
for (const category of Object.values(pageConfig.pages)) {
  for (const pageDef of category) {
    if (!pageDef.designSystem) continue; // Skip legacy-only pages
    
    test.describe(`${pageDef.name} (${pageDef.description})`, () => {
      test(`visual regression: ${pageDef.name}`, async ({ page, context }, testInfo) => {
        const projectConfig = getProjectConfig(testInfo);
        const { browser, viewport, theme } = projectConfig;
        const vp = getViewport(viewport);
        
        // Set viewport
        await page.setViewportSize(vp);
        
        // Set theme
        await setTheme(page, theme);
        
        // Login if required
        if (pageDef.requiresAuth) {
          const role = pageDef.roles?.[0] || 'admin';
          await login(page, role);
        }
        
        // Navigate to page
        const url = `${BASE_URL}${pageDef.path}${DESIGN_PARAM}`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Wait for specific selector if defined
        if (pageDef.waitForSelector) {
          await page.waitForSelector(pageDef.waitForSelector, { timeout: 10000 });
        }
        
        // Handle modal pages
        if (pageDef.captureModal && pageDef.modalTrigger) {
          // Click trigger to open modal
          await page.click(pageDef.modalTrigger);
          await page.waitForSelector(pageDef.modalSelector || '.c-modal', { state: 'visible' });
          await page.waitForTimeout(300); // Wait for modal animation
        }
        
        // Wait for hydration
        await waitForHydration(page);
        
        // Apply ignore selectors by hiding them
        for (const selector of pageConfig.ignoreSelectors) {
          await page.addStyleTag({
            content: `${selector} { visibility: hidden !important; }`,
          });
        }
        
        if (UPDATE_BASELINE) {
          // Capture new baseline
          await captureScreenshot(page, pageDef.name, projectConfig);
          console.log(`✅ Baseline updated: ${pageDef.name} (${browser}/${theme}/${viewport})`);
        } else {
          // Compare with baseline
          const result = await compareScreenshot(page, pageDef.name, projectConfig);
          
          if (!result.match) {
            console.error(`❌ Visual regression detected: ${pageDef.name}`);
            console.error(`   Diff: ${result.diffPercent.toFixed(2)}% (threshold: ${pageConfig.thresholds.visual.pixelThreshold * 100}%)`);
            console.error(`   Baseline: ${browser}/${theme}/${viewport}/${pageDef.name}.png`);
            
            // Attach diff image to test results
            if (result.diffPath && fs.existsSync(result.diffPath)) {
              await testInfo.attach(`diff-${pageDef.name}`, {
                path: result.diffPath,
                contentType: 'image/png',
              });
            }
            
            throw new Error(
              `Visual regression: ${pageDef.name} (${browser}/${theme}/${viewport}) ` +
              `differs by ${result.diffPercent.toFixed(2)}% (threshold: ${pageConfig.thresholds.visual.pixelThreshold * 100}%)`
            );
          }
          
          console.log(`✅ Match: ${pageDef.name} (${browser}/${theme}/${viewport}) - ${result.diffPercent.toFixed(2)}% diff`);
        }
      });
    });
  }
}

// Test to verify baseline directory structure
test.describe('Baseline Structure Validation', () => {
  test('should have baseline directories for all configs', async ({}, testInfo) => {
    if (UPDATE_BASELINE) {
      test.skip('Skipping structure validation in update mode');
    }
    
    const projectConfig = getProjectConfig(testInfo);
    const { browser, viewport, theme } = projectConfig;
    const vp = getViewport(viewport);
    
    const baselineDir = path.join(BASELINE_DIR, browser, theme, viewport);
    
    if (!fs.existsSync(baselineDir)) {
      throw new Error(
        `Missing baseline directory: ${baselineDir}\n` +
        `Run 'pnpm vr:update' to generate baselines.`
      );
    }
    
    // Check that at least one baseline exists
    const files = fs.readdirSync(baselineDir).filter(f => f.endsWith('.png'));
    if (files.length === 0) {
      throw new Error(
        `No baseline screenshots found in: ${baselineDir}\n` +
        `Run 'pnpm vr:update' to generate baselines.`
      );
    }
    
    console.log(`✅ Baseline directory valid: ${browser}/${theme}/${viewport} (${files.length} screenshots)`);
  });
});
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { pixelmatch } from 'pixelmatch';
import { PNG } from 'pngjs';
import pageConfig from './page-config.json';

/**
 * Visual Regression - CI Comparison Job (VR-04)
 * 
 * This test compares current screenshots against baselines.
 * Used in CI pipeline - fails on diff > threshold.
 * Uploads diff artifacts on failure.
 */

const BASE_URL = process.env.BASE_URL || pageConfig.baseUrl;
const DESIGN_PARAM = pageConfig.designSystemParam;
const BASELINE_DIR = path.join(__dirname, '__baselines__');
const THRESHOLD = pageConfig.thresholds.visual.pixelThreshold;

function getProjectConfig(testInfo: any) {
  const projectName = testInfo.project.name;
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

function getViewport(viewportName: string) {
  const vp = pageConfig.viewports.find(v => v.name === viewportName);
  if (!vp) throw new Error(`Unknown viewport: ${viewportName}`);
  return { width: vp.width, height: vp.height };
}

async function login(page: any, role: string = 'admin') {
  const user = pageConfig.testUsers[role as keyof typeof pageConfig.testUsers] || pageConfig.testUsers.admin;
  await page.goto(`${BASE_URL}/stock/login${DESIGN_PARAM}`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"]', user.username);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/stock/**');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-design-system') === 'new');
}

async function setTheme(page: any, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    localStorage.setItem('ecjy_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(200);
}

async function waitForHydration(page: any) {
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForTimeout(500);
}

async function compareScreenshot(
  page: any,
  pageName: string,
  projectConfig: ReturnType<typeof getProjectConfig>,
  testInfo: any
): Promise<{ match: boolean; diffPercent: number; diffPath?: string }> {
  const { browser, viewport, theme } = projectConfig;
  
  const baselineDir = path.join(BASELINE_DIR, browser, theme, viewport);
  const baselinePath = path.join(baselineDir, `${pageName}.png`);
  const currentPath = path.join('test-results', 'current', browser, theme, viewport, `${pageName}.png`);
  const diffPath = path.join('test-results', 'diff', browser, theme, viewport, `${pageName}.png`);
  
  // Ensure directories exist
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
  
  // Check baseline exists
  if (!fs.existsSync(baselinePath)) {
    await testInfo.attach(`missing-baseline-${pageName}`, {
      body: JSON.stringify({ baselinePath, message: 'Baseline not found. Run vr:update locally.' }, null, 2),
      contentType: 'application/json',
    });
    return { match: false, diffPercent: 100 };
  }
  
  // Compare using pixelmatch
  const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
  const currentImg = PNG.sync.read(fs.readFileSync(currentPath));
  
  if (baselineImg.width !== currentImg.width || baselineImg.height !== currentImg.height) {
    return { match: false, diffPercent: 100, diffPath };
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
  
  const match = diffPercent <= THRESHOLD * 100;
  
  return { match, diffPercent, diffPath: match ? undefined : diffPath };
}

// Run comparison tests for all pages
for (const category of Object.values(pageConfig.pages)) {
  for (const pageDef of category) {
    if (!pageDef.designSystem) continue;
    
    test.describe(`${pageDef.name}`, () => {
      test(`compare: ${pageDef.name}`, async ({ page, context }, testInfo) => {
        const projectConfig = getProjectConfig(testInfo);
        const vp = getViewport(projectConfig.viewport);
        
        await page.setViewportSize(vp);
        await setTheme(page, projectConfig.theme);
        
        if (pageDef.requiresAuth) {
          const role = pageDef.roles?.[0] || 'admin';
          await login(page, role);
        }
        
        const url = `${BASE_URL}${pageDef.path}${DESIGN_PARAM}`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        if (pageDef.waitForSelector) {
          await page.waitForSelector(pageDef.waitForSelector, { timeout: 10000 });
        }
        
        if (pageDef.captureModal && pageDef.modalTrigger) {
          await page.click(pageDef.modalTrigger);
          await page.waitForSelector(pageDef.modalSelector || '.c-modal', { state: 'visible' });
          await page.waitForTimeout(300);
        }
        
        await waitForHydration(page);
        
        // Hide ignore regions
        for (const selector of pageConfig.ignoreSelectors) {
          await page.addStyleTag({
            content: `${selector} { visibility: hidden !important; }`,
          });
        }
        
        const result = await compareScreenshot(page, pageDef.name, projectConfig, testInfo);
        
        // Attach diff on failure
        if (!result.match && result.diffPath && fs.existsSync(result.diffPath)) {
          await testInfo.attach(`diff-${pageDef.name}`, {
            path: result.diffPath,
            contentType: 'image/png',
          });
          
          // Also attach side-by-side comparison info
          await testInfo.attach(`comparison-info-${pageName}`, {
            body: JSON.stringify({
              page: pageDef.name,
              browser: projectConfig.browser,
              viewport: projectConfig.viewport,
              theme: projectConfig.theme,
              diffPercent: result.diffPercent.toFixed(2),
              threshold: THRESHOLD * 100,
              baselinePath: path.join(BASELINE_DIR, projectConfig.browser, projectConfig.theme, projectConfig.viewport, `${pageDef.name}.png`),
              currentPath,
              diffPath: result.diffPath,
            }, null, 2),
            contentType: 'application/json',
          });
        }
        
        expect(result.match).toBeTruthy();
        
        console.log(`✅ ${pageDef.name} (${projectConfig.browser}/${projectConfig.theme}/${projectConfig.viewport}): ${result.diffPercent.toFixed(2)}% diff`);
      });
    });
  }
}
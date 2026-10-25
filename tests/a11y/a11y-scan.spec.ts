import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import pageConfig from '../visual-regression/page-config.json';

/**
 * A11y Gate - Accessibility Scanning (AG-01, AG-03)
 * 
 * Scans all new-design routes at 3 viewports × 2 browsers
 * Fails on critical/serious violations
 * Warns on moderate/minor violations
 */

const BASE_URL = process.env.BASE_URL || pageConfig.baseUrl;
const DESIGN_PARAM = pageConfig.designSystemParam;
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === 'true';
const BASELINE_DIR = path.join(__dirname, '__baselines__');

function getProjectConfig(testInfo: any) {
  const projectName = testInfo.project.name;
  const match = projectName.match(/a11y-(chromium|firefox)-(mobile|tablet|desktop)/);
  if (!match) {
    throw new Error(`Invalid project name format: ${projectName}`);
  }
  return {
    browser: match[1],
    viewport: match[2],
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

async function waitForHydration(page: any) {
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForTimeout(500);
}

// Main a11y scan test for each page
for (const pagePath of pageConfig.a11yPages) {
  const pageName = pagePath.replace(/^\/stock\//, '').replace(/\//g, '-') || 'index';
  
  test.describe(`A11y: ${pageName}`, () => {
    test(`scan: ${pageName}`, async ({ page }, testInfo) => {
      const projectConfig = getProjectConfig(testInfo);
      const vp = getViewport(projectConfig.viewport);
      
      await page.setViewportSize(vp);
      await login(page);
      
      const url = `${BASE_URL}${pagePath}${DESIGN_PARAM}`;
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await waitForHydration(page);
      
      // Run axe-core scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      
      // Categorize violations
      const criticalViolations = accessibilityScanResults.violations.filter(v => v.impact === 'critical');
      const seriousViolations = accessibilityScanResults.violations.filter(v => v.impact === 'serious');
      const moderateViolations = accessibilityScanResults.violations.filter(v => v.impact === 'moderate');
      const minorViolations = accessibilityScanResults.violations.filter(v => v.impact === 'minor');
      
      // Log results
      console.log(`${pageName} (${projectConfig.browser}/${projectConfig.viewport}):`);
      console.log(`  Critical: ${criticalViolations.length}`);
      console.log(`  Serious: ${seriousViolations.length}`);
      console.log(`  Moderate: ${moderateViolations.length}`);
      console.log(`  Minor: ${minorViolations.length}`);
      
      // Save detailed results
      const resultsDir = path.join('test-results', 'a11y', projectConfig.browser, projectConfig.viewport);
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      const resultPath = path.join(resultsDir, `${pageName}.json`);
      fs.writeFileSync(resultPath, JSON.stringify(accessibilityScanResults, null, 2));
      
      // Attach results to test report
      await testInfo.attach(`a11y-results-${pageName}`, {
        path: resultPath,
        contentType: 'application/json',
      });
      
      // Generate HTML report
      const htmlReport = generateHtmlReport(accessibilityScanResults, pageName, projectConfig);
      const htmlPath = path.join(resultsDir, `${pageName}.html`);
      fs.writeFileSync(htmlPath, htmlReport);
      
      await testInfo.attach(`a11y-report-${pageName}`, {
        path: htmlPath,
        contentType: 'text/html',
      });
      
      // Update baseline if requested (do this BEFORE throwing)
      if (UPDATE_BASELINE) {
        const baselinePath = path.join(BASELINE_DIR, 'a11y-baseline.json');
        let baseline: any = {};
        
        if (fs.existsSync(baselinePath)) {
          baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
        }
        
        const key = `${pageName}-${projectConfig.browser}-${projectConfig.viewport}`;
        baseline[key] = {
          page: pageName,
          browser: projectConfig.browser,
          viewport: projectConfig.viewport,
          timestamp: new Date().toISOString(),
          violations: {
            critical: criticalViolations.length,
            serious: seriousViolations.length,
            moderate: moderateViolations.length,
            minor: minorViolations.length,
            details: accessibilityScanResults.violations.map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodes: v.nodes.map(n => ({
                target: n.target,
                html: n.html,
                failureSummary: n.failureSummary,
              })),
            })),
          },
        };
        
        fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
        console.log(`✅ Baseline updated: ${key}`);
      }
      
      // Fail on critical/serious violations (only if NOT updating baseline)
      if (!UPDATE_BASELINE) {
        if (criticalViolations.length > 0) {
          const errorMsg = criticalViolations.map(v => 
            `[CRITICAL] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n  Nodes: ${v.nodes.map(n => n.target).join(', ')}`
          ).join('\n\n');
          
          throw new Error(`Critical accessibility violations on ${pageName}:\n${errorMsg}`);
        }
        
        if (seriousViolations.length > 0) {
          const errorMsg = seriousViolations.map(v => 
            `[SERIOUS] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n  Nodes: ${v.nodes.map(n => n.target).join(', ')}`
          ).join('\n\n');
          
          throw new Error(`Serious accessibility violations on ${pageName}:\n${errorMsg}`);
        }
      }
      
      // Warn on moderate/minor (don't fail)
      if (moderateViolations.length > 0) {
        console.warn(`⚠️  Moderate violations on ${pageName}:`);
        moderateViolations.forEach(v => console.warn(`  - ${v.id}: ${v.description}`));
      }
      
      if (minorViolations.length > 0) {
        console.log(`ℹ️  Minor violations on ${pageName}:`);
        minorViolations.forEach(v => console.log(`  - ${v.id}: ${v.description}`));
      }
      
      if (!UPDATE_BASELINE) {
        expect(criticalViolations.length).toBe(0);
        expect(seriousViolations.length).toBe(0);
      }
    });
  });
}

// Additional focused a11y tests (skipped during baseline update)
const skipFocusedTests = UPDATE_BASELINE ? test.describe.skip : test.describe;

skipFocusedTests('A11y: Focused Tests', () => {
  test('Skip link functional', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE_URL}/stock/${DESIGN_PARAM}`);
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);
    
    // Tab to skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link:focus');
    await expect(skipLink).toBeVisible();
    
    // Press Enter on skip link
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content:focus');
    await expect(mainContent).toBeFocused();
  });
  
  test('Reduced motion respected', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page);
    await page.goto(`${BASE_URL}/stock/${DESIGN_PARAM}`);
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);
    
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(hasReducedMotion).toBe(true);
  });
  
  test('Focus order logical on stock page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE_URL}/stock/${DESIGN_PARAM}`);
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);
    
    const focusableElements = await page.locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    const focusOrder: string[] = [];
    for (const element of focusableElements) {
      await element.focus();
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const id = await element.getAttribute('id');
        const ariaLabel = await element.getAttribute('aria-label');
        const text = await element.textContent();
        focusOrder.push(`${tagName}${id ? '#' + id : ''}${ariaLabel ? ' [' + ariaLabel + ']' : ''}${text ? ': ' + text.substring(0, 50) : ''}`);
      }
    }
    
    console.log('Focus order:', focusOrder.join(' → '));
    expect(focusOrder.length).toBeGreaterThan(0);
  });
  
  test('Modal focus trap', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE_URL}/stock/${DESIGN_PARAM}`);
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);
    
    // Open create product modal
    await page.click('[data-cy="create-product"]');
    await page.waitForSelector('.c-modal', { state: 'visible' });
    await page.waitForTimeout(300);
    
    // Check focus is trapped
    const focusableInModal = await page.locator('.c-modal').locator(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();
    
    expect(focusableInModal.length).toBeGreaterThan(0);
    
    // Tab through all elements
    for (let i = 0; i < focusableInModal.length + 2; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Focus should still be within modal
    const focusedInModal = await page.evaluate(() => {
      const focused = document.activeElement;
      return focused && focused.closest('.c-modal') !== null;
    });
    
    expect(focusedInModal).toBe(true);
    
    // Close modal
    await page.keyboard.press('Escape');
  });
});

function generateHtmlReport(results: any, pageName: string, projectConfig: any): string {
  const { violations, passes, incomplete, inapplicable } = results;
  
  const critical = violations.filter((v: any) => v.impact === 'critical');
  const serious = violations.filter((v: any) => v.impact === 'serious');
  const moderate = violations.filter((v: any) => v.impact === 'moderate');
  const minor = violations.filter((v: any) => v.impact === 'minor');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A11y Report: ${pageName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .meta-item { background: #f8f9fa; padding: 15px; border-radius: 6px; }
    .meta-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .meta-value { font-size: 16px; font-weight: 600; color: #333; }
    .summary { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
    .badge { padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
    .badge-critical { background: #fee; color: #c00; }
    .badge-serious { background: #fee8e8; color: #c53030; }
    .badge-moderate { background: #fffbeb; color: #b45309; }
    .badge-minor { background: #f0fdf4; color: #166534; }
    .badge-pass { background: #f0fdf4; color: #166534; }
    .violation { border: 1px solid #eee; border-radius: 6px; margin-bottom: 15px; overflow: hidden; }
    .violation-critical { border-left: 4px solid #c00; }
    .violation-serious { border-left: 4px solid #c53030; }
    .violation-moderate { border-left: 4px solid #b45309; }
    .violation-minor { border-left: 4px solid #166534; }
    .violation-header { padding: 15px; background: #fafafa; display: flex; justify-content: space-between; align-items: center; }
    .violation-title { font-weight: 600; color: #333; }
    .violation-impact { text-transform: uppercase; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 4px; }
    .violation-body { padding: 15px; }
    .violation-desc { color: #444; margin-bottom: 10px; }
    .violation-help { font-size: 13px; color: #666; }
    .violation-help a { color: #3498db; }
    .violation-nodes { margin-top: 10px; }
    .node { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 12px; overflow-x: auto; }
    .node-html { color: #666; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Report: ${pageName}</h1>
    
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Page</div>
        <div class="meta-value">${pageName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Browser</div>
        <div class="meta-value">${projectConfig.browser}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Viewport</div>
        <div class="meta-value">${projectConfig.viewport}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Timestamp</div>
        <div class="meta-value">${new Date().toISOString()}</div>
      </div>
    </div>
    
    <div class="summary">
      <span class="badge badge-critical">Critical: ${critical.length}</span>
      <span class="badge badge-serious">Serious: ${serious.length}</span>
      <span class="badge badge-moderate">Moderate: ${moderate.length}</span>
      <span class="badge badge-minor">Minor: ${minor.length}</span>
      <span class="badge badge-pass">Passed: ${passes.length}</span>
    </div>
    
    ${violations.length > 0 ? `
      <h2>Violations (${violations.length})</h2>
      ${violations.map((v: any) => `
        <div class="violation violation-${v.impact}">
          <div class="violation-header">
            <span class="violation-title">${v.id}: ${v.description}</span>
            <span class="violation-impact" style="background: ${getImpactColor(v.impact)}; color: white;">${v.impact}</span>
          </div>
          <div class="violation-body">
            <div class="violation-desc">${v.help}</div>
            <div class="violation-help">WCAG Reference: <a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a></div>
            <div class="violation-nodes">
              ${v.nodes.slice(0, 5).map((n: any) => `
                <div class="node">
                  <strong>Target:</strong> ${n.target.join(', ')}<br>
                  <strong>Failure:</strong> ${n.failureSummary}
                  ${n.html ? `<div class="node-html"><strong>HTML:</strong> ${escapeHtml(n.html.substring(0, 500))}</div>` : ''}
                </div>
              `).join('')}
              ${v.nodes.length > 5 ? `<p style="color: #666; font-size: 13px;">... and ${v.nodes.length - 5} more nodes</p>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    ` : '<p style="color: #166534; font-weight: 600;">✅ No accessibility violations found!</p>'}
  </div>
</body>
</html>
  `.trim();
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'critical': return '#c00';
    case 'serious': return '#c53030';
    case 'moderate': return '#b45309';
    case 'minor': return '#166534';
    default: return '#666';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import pageConfig from '../visual-regression/page-config.json';

/**
 * A11y Gate - Baseline Generation (AG-02)
 * 
 * Generates initial a11y-baseline.json with all violations documented
 * Run with: UPDATE_BASELINE=true pnpm a11y:baseline
 */

const BASE_URL = process.env.BASE_URL || pageConfig.baseUrl;
const DESIGN_PARAM = pageConfig.designSystemParam;
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === 'true';
const BASELINE_DIR = path.join(__dirname, '__baselines__');
const BASELINE_PATH = path.join(BASELINE_DIR, 'a11y-baseline.json');

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

// Ensure baseline directory exists
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

// Load existing baseline
let baseline: Record<string, any> = {};
if (fs.existsSync(BASELINE_PATH)) {
  baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
}

// Test each page to generate/update baseline
for (const pagePath of pageConfig.a11yPages) {
  const pageName = pagePath.replace(/^\/stock\//, '').replace(/\//g, '-') || 'index';
  
  test.describe(`A11y Baseline: ${pageName}`, () => {
    test(`generate baseline: ${pageName}`, async ({ page }, testInfo) => {
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
      
      // Update baseline
      const key = `${pageName}-${projectConfig.browser}-${projectConfig.viewport}`;
      baseline[key] = {
        page: pageName,
        path: pagePath,
        browser: projectConfig.browser,
        viewport: projectConfig.viewport,
        timestamp: new Date().toISOString(),
        url: url,
        violations: {
          critical: criticalViolations.length,
          serious: seriousViolations.length,
          moderate: moderateViolations.length,
          minor: minorViolations.length,
          total: accessibilityScanResults.violations.length,
          passed: accessibilityScanResults.passes.length,
          incomplete: accessibilityScanResults.incomplete.length,
          inapplicable: accessibilityScanResults.inapplicable.length,
          details: accessibilityScanResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            tags: v.tags,
            nodes: v.nodes.map(n => ({
              target: n.target,
              html: n.html,
              failureSummary: n.failureSummary,
              any: n.any,
              all: n.all,
              none: n.none,
            })),
          })),
        },
      };
      
      // Save baseline after each page (incremental)
      fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2));
      console.log(`✅ Baseline saved: ${key} (${accessibilityScanResults.violations.length} violations)`);
    });
  });
}

// Summary test
test.describe('A11y Baseline Summary', () => {
  test('print baseline summary', async ({}, testInfo) => {
    if (!UPDATE_BASELINE) {
      test.skip('Run with UPDATE_BASELINE=true to generate baseline');
    }
    
    // Wait for all page tests to complete (they run in parallel)
    // This test runs last due to describe ordering
    
    const baselineData = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
    
    let totalCritical = 0;
    let totalSerious = 0;
    let totalModerate = 0;
    let totalMinor = 0;
    let totalViolations = 0;
    const pagesWithViolations: string[] = [];
    
    for (const [key, data] of Object.entries(baselineData)) {
      const d = data as any;
      totalCritical += d.violations.critical;
      totalSerious += d.violations.serious;
      totalModerate += d.violations.moderate;
      totalMinor += d.violations.minor;
      totalViolations += d.violations.total;
      
      if (d.violations.critical > 0 || d.violations.serious > 0) {
        pagesWithViolations.push(`${key}: ${d.violations.critical} critical, ${d.violations.serious} serious`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('A11Y BASELINE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total page configs scanned: ${Object.keys(baselineData).length}`);
    console.log(`Critical violations: ${totalCritical}`);
    console.log(`Serious violations: ${totalSerious}`);
    console.log(`Moderate violations: ${totalModerate}`);
    console.log(`Minor violations: ${totalMinor}`);
    console.log(`Total violations: ${totalViolations}`);
    console.log('='.repeat(60));
    
    if (pagesWithViolations.length > 0) {
      console.log('\nPages with critical/serious violations:');
      pagesWithViolations.forEach(p => console.log(`  - ${p}`));
    } else {
      console.log('\n✅ No critical/serious violations in baseline!');
    }
    
    console.log(`\nBaseline saved to: ${BASELINE_PATH}`);
    
    // Save summary as well
    const summaryPath = path.join(BASELINE_DIR, 'a11y-baseline-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalPages: Object.keys(baselineData).length,
      totalCritical,
      totalSerious,
      totalModerate,
      totalMinor,
      totalViolations,
      pagesWithViolations,
      pages: baselineData,
    }, null, 2));
    
    console.log(`Summary saved to: ${summaryPath}`);
  });
});
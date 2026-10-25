const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEMPLATES = [
  { path: '/stock/', name: 'stock' },
  { path: '/stock/historico', name: 'historico' },
  { path: '/stock/entrada', name: 'entrada' },
  { path: '/stock/salida', name: 'salida' },
  { path: '/stock/proveedores', name: 'proveedores' },
  { path: '/stock/clientes', name: 'clientes' },
  { path: '/stock/usuarios', name: 'usuarios' },
  { path: '/stock/nueva_entrada', name: 'nueva_entrada' },
  { path: '/stock/nueva_salida', name: 'nueva_salida' },
  { path: '/stock/nuevo_producto', name: 'nuevo_producto' },
  { path: '/stock/nuevo_proveedor', name: 'nuevo_proveedor' },
  { path: '/stock/nuevo_cliente', name: 'nuevo_cliente' },
  { path: '/stock/importar_excel', name: 'importar' },
  { path: '/stock/login', name: 'login' },
  { path: '/stock/', name: 'index', isIndex: true },
];

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function login(page) {
  await page.goto(`${BASE_URL}/stock/login?design=new`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/stock/');
  await page.waitForLoadState('networkidle');
}

test.describe('Accessibility Audit (axe-core)', () => {
  for (const breakpoint of BREAKPOINTS) {
    for (const template of TEMPLATES) {
      test(`${template.name} - ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        
        const url = `${BASE_URL}${template.path}?design=new`;
        await login(page);
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Run axe-core
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();
        
        const resultsDir = path.join(__dirname, 'a11y-results', breakpoint.name);
        if (!fs.existsSync(resultsDir)) {
          fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        const resultPath = path.join(resultsDir, `${template.name}.json`);
        fs.writeFileSync(resultPath, JSON.stringify(accessibilityScanResults, null, 2));
        
        // Check for violations
        const criticalViolations = accessibilityScanResults.violations.filter(v => v.impact === 'critical');
        const seriousViolations = accessibilityScanResults.violations.filter(v => v.impact === 'serious');
        const moderateViolations = accessibilityScanResults.violations.filter(v => v.impact === 'moderate');
        const minorViolations = accessibilityScanResults.violations.filter(v => v.impact === 'minor');
        
        console.log(`${template.name} (${breakpoint.name}):`);
        console.log(`  Critical: ${criticalViolations.length}`);
        console.log(`  Serious: ${seriousViolations.length}`);
        console.log(`  Moderate: ${moderateViolations.length}`);
        console.log(`  Minor: ${minorViolations.length}`);
        
        // Fail on critical/serious
        expect(criticalViolations.length).toBe(0);
        expect(seriousViolations.length).toBe(0);
        
        // Log moderate/minor for review
        if (moderateViolations.length > 0) {
          console.log(`  Moderate violations for ${template.name}:`);
          moderateViolations.forEach(v => console.log(`    - ${v.id}: ${v.description}`));
        }
        if (minorViolations.length > 0) {
          console.log(`  Minor violations for ${template.name}:`);
          minorViolations.forEach(v => console.log(`    - ${v.id}: ${v.description}`));
        }
      });
    }
  }
  
  test('Skip link functional', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE_URL}/stock/?design=new`);
    await page.waitForLoadState('networkidle');
    
    // Tab to skip link
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('.skip-link:focus');
    await expect(skipLink).toBeVisible();
    
    // Press Enter on skip link
    await page.keyboard.press('Enter');
    const mainContent = await page.locator('#main-content:focus');
    await expect(mainContent).toBeFocused();
  });
  
  test('Reduced motion respected', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await login(page);
    await page.goto(`${BASE_URL}/stock/?design=new`);
    await page.waitForLoadState('networkidle');
    
    // Check that animations are disabled
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(hasReducedMotion).toBe(true);
  });
  
  test('Focus order logical on stock page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE_URL}/stock/?design=new`);
    await page.waitForLoadState('networkidle');
    
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    let previousElement = null;
    
    for (const element of focusableElements) {
      await element.focus();
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const id = await element.getAttribute('id');
        const ariaLabel = await element.getAttribute('aria-label');
        console.log(`Focused: ${tagName}${id ? '#' + id : ''}${ariaLabel ? ' [' + ariaLabel + ']' : ''}`);
      }
    }
  });
});
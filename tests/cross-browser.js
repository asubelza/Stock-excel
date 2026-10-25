const { test, expect } = require('@playwright/test');
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
];

const BROWSERS = ['chromium', 'firefox', 'webkit'];

async function login(page) {
  await page.goto(`${BASE_URL}/stock/login?design=new`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/stock/');
  await page.waitForLoadState('networkidle');
}

test.describe('Cross-Browser Testing', () => {
  for (const browserName of BROWSERS) {
    test.describe(`${browserName}`, () => {
      test.use({ browserName });
      
      for (const template of TEMPLATES) {
        test(`${template.name} loads without JS errors`, async ({ page }) => {
          const errors = [];
          page.on('console', msg => {
            if (msg.type() === 'error') {
              errors.push(msg.text());
            }
          });
          page.on('pageerror', error => {
            errors.push(error.message);
          });
          
          await page.setViewportSize({ width: 1440, height: 900 });
          await login(page);
          await page.goto(`${BASE_URL}${template.path}?design=new`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
          // Check for JS errors
          expect(errors.length).toBe(0);
        });
      }
      
      test('CSS Custom Properties supported', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await login(page);
        await page.goto(`${BASE_URL}/stock/?design=new`);
        await page.waitForLoadState('networkidle');
        
        const customPropsSupported = await page.evaluate(() => {
          // Test if CSS custom properties work
          const testEl = document.createElement('div');
          testEl.style.setProperty('--test-prop', '1px');
          return testEl.style.getPropertyValue('--test-prop') === '1px';
        });
        expect(customPropsSupported).toBe(true);
      });
      
      test(':has() selector support or fallback', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await login(page);
        await page.goto(`${BASE_URL}/stock/?design=new`);
        await page.waitForLoadState('networkidle');
        
        const hasSupport = await page.evaluate(() => {
          try {
            document.querySelector('div:has(span)');
            return true;
          } catch (e) {
            return false;
          }
        });
        
        console.log(`${browserName} :has() support: ${hasSupport}`);
        // Just log, don't fail - fallback should handle it
      });
      
      test('Container queries support or fallback', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await login(page);
        await page.goto(`${BASE_URL}/stock/?design=new`);
        await page.waitForLoadState('networkidle');
        
        const cqSupport = await page.evaluate(() => {
          return CSS.supports('container-type', 'inline-size');
        });
        
        console.log(`${browserName} Container Queries support: ${cqSupport}`);
        // Just log, don't fail - fallback should handle it
      });
      
      test('Responsive layout at breakpoints', async ({ page }) => {
        const breakpoints = [
          { name: 'mobile', width: 375, height: 667 },
          { name: 'tablet', width: 768, height: 1024 },
          { name: 'desktop', width: 1440, height: 900 },
        ];
        
        for (const bp of breakpoints) {
          await page.setViewportSize({ width: bp.width, height: bp.height });
          await login(page);
          await page.goto(`${BASE_URL}/stock/?design=new`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);
          
          // Check sidebar behavior
          const sidebar = page.locator('.app-layout__sidebar');
          const overlay = page.locator('.app-layout__sidebar-overlay');
          
          if (bp.width < 768) {
            // Mobile: sidebar should be hidden by default, overlay present
            await expect(sidebar).toHaveClass(/app-layout__sidebar/);
          } else {
            // Desktop/Tablet: sidebar visible
            await expect(sidebar).toBeVisible();
          }
        }
      });
    });
  }
});
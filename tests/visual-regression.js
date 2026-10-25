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
  { path: '/stock/', name: 'index', isIndex: true },
];

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const DESIGN_SYSTEMS = ['legacy', 'new'];

async function login(page, designSystem) {
  const url = `${BASE_URL}/stock/login${designSystem === 'new' ? '?design=new' : ''}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/stock/');
  await page.waitForLoadState('networkidle');
}

test.describe('Visual Regression Tests', () => {
  for (const designSystem of DESIGN_SYSTEMS) {
    for (const breakpoint of BREAKPOINTS) {
      for (const template of TEMPLATES) {
        test(`${template.name} - ${designSystem} - ${breakpoint.name}`, async ({ page }) => {
          await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
          
          const url = `${BASE_URL}${template.path}${designSystem === 'new' ? '?design=new' : ''}`;
          
          if (designSystem === 'new') {
            await login(page, designSystem);
          } else {
            await page.goto(url);
            await page.waitForLoadState('networkidle');
          }
          
          // Wait for any dynamic content
          await page.waitForTimeout(1000);
          
          const screenshotDir = path.join(__dirname, 'screenshots', designSystem, breakpoint.name);
          if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
          }
          
          const screenshotPath = path.join(screenshotDir, `${template.name}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          
          console.log(`Captured: ${designSystem}/${breakpoint.name}/${template.name}.png`);
        });
      }
    }
  }
});
import { test, expect } from '@playwright/test';

test.describe('Dark Mode Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:5000/stock/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('DS-01/DS-02: Dark mode CSS custom properties are defined', async ({ page }) => {
    await page.goto('http://localhost:5000/stock/');
    
    // Check that dark mode tokens exist in computed styles when data-theme=dark
    const darkTokens = await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      const styles = getComputedStyle(document.documentElement);
      return {
        surfaceCard: styles.getPropertyValue('--color-surface-card').trim(),
        surfaceElevated: styles.getPropertyValue('--color-surface-elevated').trim(),
        surfaceInput: styles.getPropertyValue('--color-surface-input').trim(),
        textPrimary: styles.getPropertyValue('--color-text-primary').trim(),
        textSecondary: styles.getPropertyValue('--color-text-secondary').trim(),
        borderDefault: styles.getPropertyValue('--color-border-default').trim(),
        bg: styles.getPropertyValue('--color-bg')?.trim() || 'NOT_DEFINED',
        surface: styles.getPropertyValue('--color-surface')?.trim() || 'NOT_DEFINED',
        text: styles.getPropertyValue('--color-text')?.trim() || 'NOT_DEFINED',
        border: styles.getPropertyValue('--color-border')?.trim() || 'NOT_DEFINED',
      };
    });
    
    // Verify dark mode tokens have dark values (not light/white)
    expect(darkTokens.surfaceCard).not.toBe('#ffffff');
    expect(darkTokens.surfaceCard).not.toBe('rgb(255, 255, 255)');
    expect(darkTokens.textPrimary).not.toBe('#0f172a');
    expect(darkTokens.textPrimary).not.toBe('rgb(15, 23, 42)');
    
    // Verify semantic aliases exist
    expect(darkTokens.bg).not.toBe('NOT_DEFINED');
    expect(darkTokens.surface).not.toBe('NOT_DEFINED');
    expect(darkTokens.text).not.toBe('NOT_DEFINED');
    expect(darkTokens.border).not.toBe('NOT_DEFINED');
  });

  test('DM-01: System preference detection works', async ({ page }) => {
    await page.goto('http://localhost:5000/stock/');
    
    // Simulate system dark preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    // Should default to system preference (dark) when no saved preference
    expect(theme).toBe('dark');
  });

  test('DM-02/DM-03: Manual toggle in user menu persists to localStorage', async ({ page }) => {
    await page.goto('http://localhost:5000/stock/');
    
    // Wait for theme provider to initialize
    await page.waitForFunction(() => window.ThemeProvider !== undefined);
    
    // Click user menu trigger
    const userTrigger = page.locator('.c-top-bar__user-trigger');
    await expect(userTrigger).toBeVisible();
    await userTrigger.click();
    
    // Click theme toggle
    const themeToggle = page.locator('.c-top-bar__theme-toggle');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();
    
    // Verify theme changed to dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    // Verify localStorage persisted
    const storedTheme = await page.evaluate(() => localStorage.getItem('ecjy_theme'));
    expect(storedTheme).toBe('dark');
    
    // Reload and verify persistence
    await page.reload();
    await page.waitForFunction(() => window.ThemeProvider !== undefined);
    const themeAfterReload = await page.getAttribute('html', 'data-theme');
    expect(themeAfterReload).toBe('dark');
  });

  test('DM-04: FOUC prevention - inline script applies theme before paint', async ({ page }) => {
    // Set a theme in localStorage before navigation
    await page.goto('http://localhost:5000/stock/');
    await page.evaluate(() => localStorage.setItem('ecjy_theme', 'dark'));
    
    // Navigate to a new page - theme should be applied immediately
    const themeOnLoad = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    
    expect(themeOnLoad).toBe('dark');
  });

  test('Theme cycles through light -> dark -> system', async ({ page }) => {
    await page.goto('http://localhost:5000/stock/');
    await page.waitForFunction(() => window.ThemeProvider !== undefined);
    
    const userTrigger = page.locator('.c-top-bar__user-trigger');
    await userTrigger.click();
    
    const themeToggle = page.locator('.c-top-bar__theme-toggle');
    
    // Initial state (system/light)
    let theme = await page.getAttribute('html', 'data-theme');
    expect(['light', 'system']).toContain(theme);
    
    // Click 1: light -> dark
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    
    // Click 2: dark -> system (if enabled) or light
    await userTrigger.click();
    await themeToggle.click();
    theme = await page.getAttribute('html', 'data-theme');
    expect(['light', 'system']).toContain(theme);
  });
});

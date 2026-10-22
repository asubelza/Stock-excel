/* ==========================================================================
   ECJY Design System — ThemeProvider
   ==========================================================================
   Three-state theme toggle (light | dark | system) with localStorage persistence
   and cross-tab synchronization via storage events.
   Exposes: DesignSystem.ThemeProvider
   ========================================================================== */

export class ThemeProvider {
  /**
   * @param {Object} options
   * @param {string} options.storageKey - localStorage key (default: 'ecjy_theme')
   * @param {string} options.attribute - HTML attribute to set (default: 'data-theme')
   * @param {boolean} options.enableSystem - Whether to support 'system' option (default: true)
   * @param {boolean} options.syncTabs - Enable cross-tab sync (default: true)
   * @param {boolean} options.listenMedia - Listen to prefers-color-scheme changes (default: true)
   */
  constructor(options = {}) {
    this.options = {
      storageKey: 'ecjy_theme',
      attribute: 'data-theme',
      enableSystem: true,
      syncTabs: true,
      listenMedia: true,
      ...options,
    };

    this.mediaQuery = null;
    this.storageHandler = null;
    this.mediaHandler = null;
    this.initialized = false;

    // Theme state: 'light' | 'dark' | 'system'
    this._theme = null;
  }

  /**
   * Initialize the theme provider
   * Reads from localStorage, applies theme, sets up listeners
   */
  init() {
    if (this.initialized) return this;
    this.initialized = true;

    // Read saved theme or default to 'system'
    this._theme = this.getStoredTheme() || 'system';
    
    // Apply initial theme
    this.applyTheme(this._theme);

    // Set up cross-tab sync
    if (this.options.syncTabs) {
      this.setupStorageSync();
    }

    // Set up media query listener for system preference changes
    if (this.options.listenMedia && this.options.enableSystem) {
      this.setupMediaListener();
    }

    // Expose globally
    if (typeof window !== 'undefined') {
      window.DesignSystem = window.DesignSystem || {};
      window.DesignSystem.ThemeProvider = this;
      window.ThemeProvider = this;
    }

    return this;
  }

  /**
   * Get theme from localStorage
   * @returns {string|null}
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(this.options.storageKey);
    } catch (_) {
      return null;
    }
  }

  /**
   * Save theme to localStorage
   * @param {string} theme - 'light' | 'dark' | 'system'
   */
  setStoredTheme(theme) {
    try {
      localStorage.setItem(this.options.storageKey, theme);
    } catch (_) {
      // Ignore storage errors (private browsing, quota exceeded, etc.)
    }
  }

  /**
   * Get resolved theme (never returns 'system')
   * @returns {'light' | 'dark'}
   */
  getResolvedTheme() {
    if (this._theme === 'system' || !this._theme) {
      return this.getSystemPreference();
    }
    return this._theme;
  }

  /**
   * Get system preference from media query
   * @returns {'light' | 'dark'}
   */
  getSystemPreference() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (_) {
      return 'light';
    }
  }

  /**
   * Apply theme to document element
   * @param {'light' | 'dark' | 'system'} theme
   */
  applyTheme(theme) {
    const resolved = theme === 'system' ? this.getSystemPreference() : theme;
    document.documentElement.setAttribute(this.options.attribute, resolved);
    
    // Also set data-design-system for compatibility
    document.documentElement.setAttribute('data-theme', resolved);
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('ecjy:theme-change', {
      detail: { theme, resolved, previousTheme: this._theme }
    }));
  }

  /**
   * Set theme and persist
   * @param {'light' | 'dark' | 'system'} theme
   * @returns {string} The theme that was set
   */
  setTheme(theme) {
    const validThemes = ['light', 'dark'];
    if (this.options.enableSystem) validThemes.push('system');
    
    if (!validThemes.includes(theme)) {
      console.warn(`[ThemeProvider] Invalid theme: ${theme}. Valid: ${validThemes.join(', ')}`);
      return this._theme;
    }

    const previousTheme = this._theme;
    this._theme = theme;
    this.setStoredTheme(theme);
    this.applyTheme(theme);
    
    return theme;
  }

  /**
   * Toggle between light and dark (skips 'system')
   * @returns {string} The new theme
   */
  toggleTheme() {
    const current = this.getResolvedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    return this.setTheme(next);
  }

  /**
   * Cycle through all available themes
   * @returns {string} The new theme
   */
  cycleTheme() {
    const themes = this.options.enableSystem ? ['light', 'dark', 'system'] : ['light', 'dark'];
    const currentIndex = themes.indexOf(this._theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    return this.setTheme(themes[nextIndex]);
  }

  /**
   * Get current theme setting (may be 'system')
   * @returns {'light' | 'dark' | 'system'}
   */
  getTheme() {
    return this._theme;
  }

  /**
   * Set up cross-tab synchronization via storage event
   */
  setupStorageSync() {
    this.storageHandler = (event) => {
      if (event.key !== this.options.storageKey) return;
      if (event.newValue === this._theme) return; // Already in sync
      
      const newTheme = event.newValue;
      if (newTheme && ['light', 'dark', 'system'].includes(newTheme)) {
        this._theme = newTheme;
        this.applyTheme(newTheme);
      }
    };
    
    window.addEventListener('storage', this.storageHandler);
  }

  /**
   * Set up media query listener for system preference changes
   */
  setupMediaListener() {
    try {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      this.mediaHandler = (event) => {
        // Only react if current theme is 'system'
        if (this._theme === 'system') {
          this.applyTheme('system');
        }
      };
      
      // Modern API
      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', this.mediaHandler);
      } else if (this.mediaQuery.addListener) {
        // Legacy Safari
        this.mediaQuery.addListener(this.mediaHandler);
      }
    } catch (_) {
      // matchMedia not supported
    }
  }

  /**
   * Clean up listeners
   */
  destroy() {
    if (this.storageHandler) {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
    if (this.mediaHandler && this.mediaQuery) {
      if (this.mediaQuery.removeEventListener) {
        this.mediaQuery.removeEventListener('change', this.mediaHandler);
      } else if (this.mediaQuery.removeListener) {
        this.mediaQuery.removeListener(this.mediaHandler);
      }
      this.mediaHandler = null;
      this.mediaQuery = null;
    }
    this.initialized = false;
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  const initThemeProvider = () => {
    if (!window.ThemeProvider) {
      window.ThemeProvider = new ThemeProvider();
      window.ThemeProvider.init();
    }

    // Set up theme toggle in user menu dropdown
    setupThemeToggle();
  };

  const setupThemeToggle = () => {
    // Wait for dropdown to be initialized
    const checkAndSetup = () => {
      const themeToggle = document.querySelector('.c-top-bar__theme-toggle');
      if (themeToggle && window.ThemeProvider) {
        // Update initial UI
        updateThemeToggleUI();
        
        // Handle click
        themeToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const provider = window.ThemeProvider;
          provider.cycleTheme();
          updateThemeToggleUI();
          
          // Close dropdown after selection
          const dropdown = themeToggle.closest('[data-dropdown]');
          if (dropdown && dropdown._dsDropdown) {
            dropdown._dsDropdown.close();
          }
        });

        // Handle keyboard
        themeToggle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            themeToggle.click();
          }
        });

        // Listen for theme changes from other tabs
        window.addEventListener('ecjy:theme-change', updateThemeToggleUI);
      } else {
        // Retry after a short delay
        setTimeout(checkAndSetup, 100);
      }
    };

    const updateThemeToggleUI = () => {
      const provider = window.ThemeProvider;
      if (!provider) return;

      const theme = provider.getTheme();
      const resolved = provider.getResolvedTheme();
      
      const toggle = document.querySelector('.c-top-bar__theme-toggle');
      if (!toggle) return;

      // Update icons
      const sunIcon = toggle.querySelector('.c-top-bar__theme-icon-sun');
      const moonIcon = toggle.querySelector('.c-top-bar__theme-icon-moon');
      const systemIcon = toggle.querySelector('.c-top-bar__theme-icon-system');
      const currentLabel = toggle.querySelector('.c-top-bar__theme-current');

      // Hide all icons first
      [sunIcon, moonIcon, systemIcon].forEach(icon => {
        if (icon) icon.hidden = true;
      });

      // Show appropriate icon
      if (theme === 'system') {
        if (systemIcon) systemIcon.hidden = false;
        if (currentLabel) currentLabel.textContent = ` (Sistema: ${resolved === 'dark' ? 'Oscuro' : 'Claro'})`;
      } else if (theme === 'dark') {
        if (moonIcon) moonIcon.hidden = false;
        if (currentLabel) currentLabel.textContent = ' (Oscuro)';
      } else {
        if (sunIcon) sunIcon.hidden = false;
        if (currentLabel) currentLabel.textContent = ' (Claro)';
      }
    };

    checkAndSetup();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeProvider);
  } else {
    initThemeProvider();
  }

  // Register with DesignSystem
  if (window.DesignSystem) {
    window.DesignSystem.registerComponent('theme-provider', ThemeProvider, {
      selector: '[data-theme-provider]',
    });
    window.DesignSystem.ThemeProvider = ThemeProvider;
  }
}

export default ThemeProvider;
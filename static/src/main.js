/* ==========================================================================
   ECJY Design System — Main Entry Point
   ==========================================================================
   Imports all CSS, detects feature flag, exposes DesignSystem API.
   ========================================================================== */

// Import CSS (Vite will process and inject)
import './css/tokens.css';
import './css/base.css';

// Import JS Components (self-register with DesignSystem)
import './js/components/autocomplete.js';
import './js/components/dropdown.js';
import './js/components/modal.js';
import './js/components/modal-htmx.js';
import './js/components/side-nav.js';
import './js/components/form-validation.js';
import './js/components/data-table.js';
import './js/data-table-lazy.js';
import './js/theme-provider.js';

/* ==========================================================================
   FEATURE FLAG DETECTION
   ========================================================================== */

/**
 * Determines if the new design system should be active.
 * Checks (in order):
 * 1. Query parameter `?design=new`
 * 2. Session storage flag `design_system` (set by Flask middleware)
 * 3. localStorage preference (for user persistence)
 * 4. `data-design-system="new"` attribute on <html> (server-rendered)
 * 
 * @returns {boolean} True if new design system should be used
 */
export function isNewDesignSystemActive() {
  // 1. Check URL query parameter (highest priority for testing)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('design') === 'new') {
    return true;
  }
  if (urlParams.get('design') === 'legacy') {
    return false;
  }

  // 2. Check sessionStorage (set by Flask middleware per session)
  try {
    const sessionFlag = sessionStorage.getItem('design_system');
    if (sessionFlag === 'new') return true;
    if (sessionFlag === 'legacy') return false;
  } catch (_) {
    // sessionStorage unavailable (private browsing, etc.)
  }

  // 3. Check localStorage (user preference persistence)
  try {
    const localFlag = localStorage.getItem('ecjy_design_system');
    if (localFlag === 'new') return true;
    if (localFlag === 'legacy') return false;
  } catch (_) {
    // localStorage unavailable
  }

  // 4. Check server-rendered attribute on <html>
  const htmlAttr = document.documentElement.getAttribute('data-design-system');
  if (htmlAttr === 'new') return true;
  if (htmlAttr === 'legacy') return false;

  // Default: legacy (off)
  return false;
}

/**
 * Sets the design system preference for the current session.
 * @param {'new' | 'legacy'} value - Design system to use
 * @param {boolean} persist - Whether to persist in localStorage
 */
export function setDesignSystem(value, persist = false) {
  if (value !== 'new' && value !== 'legacy') {
    throw new Error('Invalid design system value. Use "new" or "legacy".');
  }

  // Update sessionStorage (current session)
  try {
    sessionStorage.setItem('design_system', value);
  } catch (_) {}

  // Update localStorage if requested (persistent preference)
  if (persist) {
    try {
      localStorage.setItem('ecjy_design_system', value);
    } catch (_) {}
  }

  // Update HTML attribute for CSS selectors
  document.documentElement.setAttribute('data-design-system', value);

  // Dispatch custom event for React/Vue/etc. components listening
  window.dispatchEvent(new CustomEvent('ecjy:design-system-change', {
    detail: { designSystem: value }
  }));
}

/**
 * Toggles between design systems.
 * @param {boolean} persist - Whether to persist in localStorage
 */
export function toggleDesignSystem(persist = false) {
  const current = isNewDesignSystemActive() ? 'new' : 'legacy';
  const next = current === 'new' ? 'legacy' : 'new';
  setDesignSystem(next, persist);
  return next;
}

/* ==========================================================================
   DESIGNSYSTEM OBJECT — Public API
   ========================================================================== */

/**
 * DesignSystem namespace — Central API for the design system.
 * Provides token access, component registration, and utilities.
 */
export const DesignSystem = {
  /**
   * Current version of the design system
   * @type {string}
   */
  version: '1.0.0',

  /**
   * Whether the new design system is currently active
   * @type {boolean}
   */
  get isActive() {
    return isNewDesignSystemActive();
  },

  /**
   * Get a design token value by name
   * @param {string} tokenName - Token name (e.g., 'color-brand-500', 'space-4')
   * @returns {string|undefined} Token value or undefined if not found
   */
  getToken(tokenName) {
    const cssVar = `--${tokenName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    return value || undefined;
  },

  /**
   * Get multiple token values at once
   * @param {...string} tokenNames - Token names
   * @returns {Record<string, string>} Object with token values
   */
  getTokens(...tokenNames) {
    return Object.fromEntries(
      tokenNames.map(name => [name, this.getToken(name)])
    );
  },

  /**
   * Set a design token value (runtime override)
   * @param {string} tokenName - Token name
   * @param {string} value - New value
   * @param {HTMLElement} [target=document.documentElement] - Target element
   */
  setToken(tokenName, value, target = document.documentElement) {
    const cssVar = `--${tokenName.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    target.style.setProperty(cssVar, value);
  },

  /**
   * Register a component class for the design system
   * @param {string} name - Component name (kebab-case)
   * @param {class} ComponentClass - Component constructor
   * @param {object} [options] - Registration options
   */
  components: new Map(),
  
  registerComponent(name, ComponentClass, options = {}) {
    if (this.components.has(name)) {
      console.warn(`[DesignSystem] Component "${name}" already registered. Overwriting.`);
    }
    this.components.set(name, { ComponentClass, options });
  },

  /**
   * Get a registered component class
   * @param {string} name - Component name
   * @returns {class|undefined} Component constructor or undefined
   */
  getComponent(name) {
    const entry = this.components.get(name);
    return entry?.ComponentClass;
  },

  /**
   * Initialize all registered components in a container
   * @param {HTMLElement} [container=document.body] - Container to scan
   */
  initComponents(container = document.body) {
    for (const [name, { ComponentClass, options }] of this.components) {
      const selector = options.selector || `[data-ds-component="${name}"]`;
      const elements = container.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el._dsInitialized) {
          try {
            new ComponentClass(el, options);
            el._dsInitialized = true;
          } catch (err) {
            console.error(`[DesignSystem] Failed to initialize ${name}:`, err);
          }
        }
      });
    }
  },

  /**
   * Utility: Create an element with design system classes
   * @param {string} tag - HTML tag
   * @param {object} [props={}] - Properties and classes
   * @returns {HTMLElement}
   */
  createElement(tag, props = {}) {
    const el = document.createElement(tag);
    if (props.class) {
      el.className = props.class;
    }
    if (props.attributes) {
      Object.entries(props.attributes).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
    }
    if (props.dataset) {
      Object.entries(props.dataset).forEach(([key, value]) => {
        el.dataset[key] = value;
      });
    }
    if (props.text) {
      el.textContent = props.text;
    }
    if (props.html) {
      el.innerHTML = props.html;
    }
    if (props.on) {
      Object.entries(props.on).forEach(([event, handler]) => {
        el.addEventListener(event, handler);
      });
    }
    return el;
  },

  /**
   * Utility: Debounce function
   * @param {Function} fn - Function to debounce
   * @param {number} [wait=150] - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(fn, wait = 150) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  },

  /**
   * Utility: Throttle function
   * @param {Function} fn - Function to throttle
   * @param {number} [limit=150] - Limit in ms
   * @returns {Function} Throttled function
   */
  throttle(fn, limit = 150) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Utility: Generate unique ID
   * @param {string} [prefix='ds'] - ID prefix
   * @returns {string} Unique ID
   */
  uid(prefix = 'ds') {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
  },

  /**
   * Utility: Check if element is visible in viewport
   * @param {HTMLElement} el - Element to check
   * @param {number} [threshold=0] - Intersection threshold
   * @returns {boolean}
   */
  isInViewport(el, threshold = 0) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * (1 - threshold) &&
      rect.bottom >= 0 &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      rect.right >= 0
    );
  },

  /**
   * Event emitter for design system events
   * @type {EventTarget}
   */
  events: new EventTarget(),

  /**
   * Subscribe to design system events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    this.events.addEventListener(event, handler);
    return () => this.events.removeEventListener(event, handler);
  },

  /**
   * Emit a design system event
   * @param {string} event - Event name
   * @param {*} detail - Event detail
   */
  emit(event, detail) {
    this.events.dispatchEvent(new CustomEvent(event, { detail }));
  },
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

// Apply design system attribute to <html> on load
(function initDesignSystem() {
  const active = isNewDesignSystemActive();
  document.documentElement.setAttribute('data-design-system', active ? 'new' : 'legacy');
  
  // Add class for CSS targeting
  if (active) {
    document.documentElement.classList.add('ds-active');
  } else {
    document.documentElement.classList.add('ds-legacy');
  }

  // Listen for design system changes
  window.addEventListener('ecjy:design-system-change', (e) => {
    const { designSystem } = e.detail;
    document.documentElement.setAttribute('data-design-system', designSystem);
    document.documentElement.classList.toggle('ds-active', designSystem === 'new');
    document.documentElement.classList.toggle('ds-legacy', designSystem === 'legacy');
  });

  // Initialize components when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      DesignSystem.initComponents();
    });
  } else {
    DesignSystem.initComponents();
  }
})();

/* ==========================================================================
   EXPORTS FOR GLOBAL ACCESS (legacy support)
   ========================================================================== */

// Make available globally for inline scripts in templates
window.DesignSystem = DesignSystem;
window.isNewDesignSystemActive = isNewDesignSystemActive;
window.setDesignSystem = setDesignSystem;
window.toggleDesignSystem = toggleDesignSystem;

// Export for module consumers
export default DesignSystem;
/* ==========================================================================
   ECJY Design System — Side Navigation Component
   ==========================================================================
   Handles collapsible sidebar, mobile drawer, nested navigation expansion,
   and persists state in localStorage.
   ========================================================================== */

const STORAGE_KEY_SIDEBAR_COLLAPSED = 'ecjy_sidebar_collapsed';
const STORAGE_KEY_SIDEBAR_EXPANDED_ITEMS = 'ecjy_sidebar_expanded_items';

/**
 * SideNav Component
 * Manages:
 * - Desktop: Collapsed/expanded sidebar state (persisted in localStorage)
 * - Mobile: Drawer overlay with backdrop
 * - Nested menu expansion (persisted in localStorage)
 * - Keyboard navigation
 * - Focus management
 */
export class SideNav {
  /**
   * @param {HTMLElement} root - Root element with [data-side-nav] attribute
   * @param {object} [options={}] - Component options
   * @param {boolean} [options.persistState=true] - Whether to persist state in localStorage
   * @param {number} [options.mobileBreakpoint=1024] - Breakpoint for mobile drawer (px)
   */
  constructor(root, options = {}) {
    this.root = root;
    this.options = {
      persistState: true,
      mobileBreakpoint: 1024,
      ...options,
    };

    // DOM references
    this.toggleBtn = root.querySelector('[data-side-nav-toggle]');
    this.navList = root.querySelector('.c-side-nav__list');
    this.sublistToggles = root.querySelectorAll('.c-side-nav__link--parent');
    this.mobileDrawer = null;
    this.overlay = null;

    // State
    this.isCollapsed = false;
    this.expandedItems = new Set();
    this.isMobile = false;
    this.isDrawerOpen = false;

    this.init();
  }

  init() {
    // Check if we're on mobile
    this.checkMobile();

    // Load persisted state
    this.loadState();

    // Apply initial state
    this.applyCollapsedState();
    this.applyExpandedState();

    // Bind events
    this.bindEvents();

    // Handle resize
    this.handleResize = this.debounce(() => {
      const wasMobile = this.isMobile;
      this.checkMobile();
      if (wasMobile !== this.isMobile) {
        this.handleMobileTransition(wasMobile);
      }
    }, 150);

    window.addEventListener('resize', this.handleResize);

    // Listen for design system changes (in case tokens change)
    window.addEventListener('ecjy:design-system-change', () => {
      this.checkMobile();
    });

    // Register with DesignSystem if available
    if (window.DesignSystem) {
      window.DesignSystem.registerComponent('side-nav', SideNav, {
        selector: '[data-side-nav]',
      });
    }
  }

  /**
   * Check if current viewport is mobile
   */
  checkMobile() {
    this.isMobile = window.innerWidth < this.options.mobileBreakpoint;
    this.root.dataset.mobile = this.isMobile ? 'true' : 'false';
  }

  /**
   * Handle transition between mobile/desktop
   */
  handleMobileTransition(wasMobile) {
    if (!this.isMobile && wasMobile) {
      // Mobile -> Desktop: close drawer, restore collapsed state
      this.closeDrawer();
      this.applyCollapsedState();
    } else if (this.isMobile && !wasMobile) {
      // Desktop -> Mobile: expand sidebar (drawer mode), keep collapsed state stored
      this.root.classList.remove('c-side-nav--collapsed');
      if (this.isDrawerOpen) {
        this.openDrawer();
      }
    }
  }

  /**
   * Load persisted state from localStorage
   */
  loadState() {
    if (!this.options.persistState) return;

    try {
      // Collapsed state
      const collapsed = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
      if (collapsed !== null) {
        this.isCollapsed = collapsed === 'true';
      }

      // Expanded items
      const expanded = localStorage.getItem(STORAGE_KEY_SIDEBAR_EXPANDED_ITEMS);
      if (expanded) {
        this.expandedItems = new Set(JSON.parse(expanded));
      }
    } catch (_) {
      // localStorage unavailable or corrupted
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    if (!this.options.persistState) return;

    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(this.isCollapsed));
      localStorage.setItem(STORAGE_KEY_SIDEBAR_EXPANDED_ITEMS, JSON.stringify([...this.expandedItems]));
    } catch (_) {
      // localStorage unavailable
    }
  }

  /**
   * Apply collapsed/expanded state to DOM
   */
  applyCollapsedState() {
    if (this.isCollapsed) {
      this.root.classList.add('c-side-nav--collapsed');
    } else {
      this.root.classList.remove('c-side-nav--collapsed');
    }

    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', String(!this.isCollapsed));
      this.toggleBtn.setAttribute('aria-label', this.isCollapsed ? 'Expandir navegación' : 'Colapsar navegación');

      // Update chevron direction
      const chevron = this.toggleBtn.querySelector('svg polyline');
      if (chevron) {
        chevron.setAttribute('points', this.isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6');
      }
    }
  }

  /**
   * Apply expanded state for nested items
   */
  applyExpandedState() {
    this.sublistToggles.forEach((btn) => {
      const itemId = btn.getAttribute('aria-controls');
      if (!itemId) return;

      const isExpanded = this.expandedItems.has(itemId);
      const sublist = document.getElementById(itemId);

      btn.setAttribute('aria-expanded', String(isExpanded));
      if (sublist) {
        if (isExpanded) {
          sublist.removeAttribute('hidden');
        } else {
          sublist.setAttribute('hidden', '');
        }
      }

      // Update chevron
      const chevron = btn.querySelector('.c-side-nav__chevron polyline');
      if (chevron) {
        chevron.setAttribute('points', isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
      }
    });
  }

  /**
   * Toggle sidebar collapsed state (desktop only)
   */
  toggleCollapsed() {
    if (this.isMobile) return; // No-op on mobile, drawer handled separately

    this.isCollapsed = !this.isCollapsed;
    this.applyCollapsedState();
    this.saveState();

    // Emit event for layout adjustments
    this.emit('collapse-change', { collapsed: this.isCollapsed });
  }

  /**
   * Open mobile drawer
   */
  openDrawer() {
    if (!this.isMobile) return;

    this.createMobileElements();
    this.isDrawerOpen = true;

    // Show overlay
    requestAnimationFrame(() => {
      this.overlay.classList.add('app-layout__sidebar-overlay--visible');
      this.mobileDrawer.classList.add('app-layout__sidebar--open');
    });

    // Trap focus
    this.trapFocus(this.mobileDrawer);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    this.emit('drawer-open');
  }

  /**
   * Close mobile drawer
   */
  closeDrawer() {
    if (!this.isDrawerOpen) return;

    this.isDrawerOpen = false;

    if (this.overlay) {
      this.overlay.classList.remove('app-layout__sidebar-overlay--visible');
    }
    if (this.mobileDrawer) {
      this.mobileDrawer.classList.remove('app-layout__sidebar--open');
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Return focus to toggle button
    if (this.toggleBtn) {
      this.toggleBtn.focus();
    }

    this.emit('drawer-close');
  }

  /**
   * Toggle mobile drawer
   */
  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  /**
   * Create mobile drawer elements (overlay + clone sidebar for drawer)
   */
  createMobileElements() {
    if (this.overlay && this.mobileDrawer) return;

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'app-layout__sidebar-overlay';
    this.overlay.addEventListener('click', () => this.closeDrawer());
    document.body.appendChild(this.overlay);

    // The sidebar itself becomes the drawer on mobile
    // We just need to ensure it has the right classes
    this.mobileDrawer = this.root;
    this.mobileDrawer.classList.add('app-layout__sidebar');
  }

  /**
   * Toggle nested menu item
   * @param {HTMLButtonElement} btn - The parent link button
   */
  toggleSublist(btn) {
    const itemId = btn.getAttribute('aria-controls');
    if (!itemId) return;

    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    const newExpanded = !isExpanded;

    btn.setAttribute('aria-expanded', String(newExpanded));
    const sublist = document.getElementById(itemId);
    if (sublist) {
      if (newExpanded) {
        sublist.removeAttribute('hidden');
      } else {
        sublist.setAttribute('hidden', '');
      }
    }

    // Update chevron
    const chevron = btn.querySelector('.c-side-nav__chevron polyline');
    if (chevron) {
      chevron.setAttribute('points', newExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
    }

    // Persist
    if (newExpanded) {
      this.expandedItems.add(itemId);
    } else {
      this.expandedItems.delete(itemId);
    }
    this.saveState();

    this.emit('sublist-toggle', { itemId, expanded: newExpanded });
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Toggle button (desktop collapse / mobile drawer)
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.isMobile) {
          this.toggleDrawer();
        } else {
          this.toggleCollapsed();
        }
      });
    }

    // Nested menu toggles
    this.sublistToggles.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSublist(btn);
      });

      // Keyboard support for nested toggles
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleSublist(btn);
        }
      });
    });

    // Keyboard navigation for drawer
    this.root.addEventListener('keydown', (e) => {
      if (!this.isMobile || !this.isDrawerOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeDrawer();
      }

      // Tab trapping is handled by trapFocus
    });

    // Close drawer on link click (mobile)
    if (this.isMobile) {
      this.root.addEventListener('click', (e) => {
        const link = e.target.closest('.c-side-nav__link:not(.c-side-nav__link--parent)');
        if (link && this.isDrawerOpen) {
          this.closeDrawer();
        }
      });
    }
  }

  /**
   * Trap focus within an element
   * @param {HTMLElement} element - Element to trap focus in
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', this.focusTrapHandler);
    firstElement.focus();
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap() {
    if (this.focusTrapHandler && this.mobileDrawer) {
      this.mobileDrawer.removeEventListener('keydown', this.focusTrapHandler);
      this.focusTrapHandler = null;
    }
  }

  /**
   * Emit custom event
   * @param {string} name - Event name
   * @param {object} detail - Event detail
   */
  emit(name, detail = {}) {
    this.root.dispatchEvent(new CustomEvent(`side-nav:${name}`, {
      detail: { ...detail, sideNav: this },
      bubbles: true,
    }));
  }

  /**
   * Debounce utility
   * @param {Function} fn - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  /**
   * Destroy component and clean up
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.releaseFocusTrap();

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.mobileDrawer = null;
  }
}

/**
 * Auto-initialize all side nav components
 */
export function initSideNavs(container = document.body) {
  const elements = container.querySelectorAll('[data-side-nav]');
  elements.forEach((el) => {
    if (!el._sideNavInitialized) {
      new SideNav(el);
      el._sideNavInitialized = true;
    }
  });
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSideNavs());
} else {
  initSideNavs();
}

// Export for manual initialization
export default SideNav;
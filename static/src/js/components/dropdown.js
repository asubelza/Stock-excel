/* ==========================================================================
   ECJY Design System — Dropdown Component
   ==========================================================================
   ES module class for accessible dropdown menus.
   Features: Popper positioning, keyboard navigation, click-outside close
   Exports to: DesignSystem.Dropdown
   ========================================================================== */

export class Dropdown {
    /**
     * @param {HTMLElement} wrapper - The dropdown wrapper element
     * @param {Object} options - Configuration options
     */
    constructor(wrapper, options = {}) {
        this.wrapper = wrapper;
        this.options = {
            align: 'end',
            closeOnSelect: true,
            closeOnOutsideClick: true,
            closeOnEscape: true,
            ...options,
        };

        // Parse config from data attributes
        const configEl = wrapper.querySelector('[data-dropdown-config]');
        if (configEl) {
            try {
                const config = JSON.parse(configEl.textContent);
                this.options = { ...this.options, ...config };
            } catch (_) {}
        }

        this.id = this.options.id || wrapper.id;
        this.triggerId = this.options.triggerId;
        this.menuId = this.options.menuId;
        this.triggerSelector = this.options.triggerSelector;

        // DOM elements
        this.trigger = this.triggerId ? document.getElementById(this.triggerId) : wrapper.querySelector('[data-dropdown-trigger]');
        this.menu = this.menuId ? document.getElementById(this.menuId) : wrapper.querySelector('[role="menu"]');

        // State
        this.isOpen = false;
        this.items = [];
        this.focusedIndex = -1;

        this.init();
    }

    init() {
        this.collectItems();
        this.bindEvents();
        this.positionMenu();
    }

    collectItems() {
        if (!this.menu) return;
        this.items = Array.from(this.menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])'));
    }

    bindEvents() {
        // Trigger events
        if (this.trigger) {
            this.trigger.addEventListener('click', this.handleTriggerClick.bind(this));
            this.trigger.addEventListener('keydown', this.handleTriggerKeydown.bind(this));
        }

        // External trigger
        if (this.triggerSelector) {
            const externalTrigger = document.querySelector(this.triggerSelector);
            if (externalTrigger) {
                externalTrigger.addEventListener('click', this.handleTriggerClick.bind(this));
                externalTrigger.addEventListener('keydown', this.handleTriggerKeydown.bind(this));
            }
        }

        // Menu events
        if (this.menu) {
            this.menu.addEventListener('click', this.handleItemClick.bind(this));
            this.menu.addEventListener('keydown', this.handleMenuKeydown.bind(this));
            this.menu.addEventListener('focusin', this.handleFocusIn.bind(this));
        }

        // Outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this), true);

        // Escape key
        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));

        // Resize/scroll
        window.addEventListener('resize', this.positionMenu.bind(this));
        window.addEventListener('scroll', this.positionMenu.bind(this), true);
    }

    handleTriggerClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.toggle();
    }

    handleTriggerKeydown(event) {
        switch (event.key) {
            case 'Enter':
            case ' ':
            case 'ArrowDown':
                event.preventDefault();
                if (!this.isOpen) {
                    this.open();
                    this.focusFirstItem();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!this.isOpen) {
                    this.open();
                    this.focusLastItem();
                }
                break;
            case 'Escape':
                this.close();
                break;
        }
    }

    handleItemClick(event) {
        const item = event.target.closest('[role="menuitem"]');
        if (!item || item.hasAttribute('aria-disabled')) return;

        const action = item.dataset.action;
        const value = item.dataset.value;

        this.wrapper.dispatchEvent(new CustomEvent('dropdown:select', {
            detail: { item, action, value, trigger: this.trigger },
            bubbles: true,
        }));

        if (this.options.closeOnSelect) {
            this.close();
            this.trigger?.focus();
        }
    }

    handleMenuKeydown(event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.focusNextItem();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.focusPreviousItem();
                break;
            case 'Home':
                event.preventDefault();
                this.focusFirstItem();
                break;
            case 'End':
                event.preventDefault();
                this.focusLastItem();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                const focusedItem = this.items[this.focusedIndex];
                if (focusedItem) {
                    focusedItem.click();
                }
                break;
            case 'Escape':
            case 'Tab':
                this.close();
                this.trigger?.focus();
                break;
            default:
                // Type-ahead search
                if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
                    this.typeAheadSearch(event.key.toLowerCase());
                }
                break;
        }
    }

    handleFocusIn(event) {
        const item = event.target.closest('[role="menuitem"]');
        if (item) {
            this.focusedIndex = this.items.indexOf(item);
        }
    }

    handleOutsideClick(event) {
        if (!this.isOpen) return;
        if (!this.options.closeOnOutsideClick) return;
        if (this.wrapper.contains(event.target)) return;
        if (this.triggerSelector) {
            const externalTrigger = document.querySelector(this.triggerSelector);
            if (externalTrigger && externalTrigger.contains(event.target)) return;
        }
        this.close();
    }

    handleGlobalKeydown(event) {
        if (event.key === 'Escape' && this.isOpen && this.options.closeOnEscape) {
            this.close();
            this.trigger?.focus();
        }
    }

    typeAheadSearch(char) {
        const searchString = (this._typeAheadBuffer || '') + char;
        this._typeAheadBuffer = searchString;

        clearTimeout(this._typeAheadTimer);
        this._typeAheadTimer = setTimeout(() => {
            this._typeAheadBuffer = '';
        }, 500);

        const matchedItem = this.items.find((item, idx) => {
            const label = item.textContent.trim().toLowerCase();
            return label.startsWith(searchString) && idx > this.focusedIndex;
        }) || this.items.find(item => {
            const label = item.textContent.trim().toLowerCase();
            return label.startsWith(searchString);
        });

        if (matchedItem) {
            this.focusedIndex = this.items.indexOf(matchedItem);
            this.updateFocus();
        }
    }

    open() {
        if (this.isOpen || this.wrapper.classList.contains('c-dropdown--disabled')) return;
        
        this.isOpen = true;
        this.wrapper.classList.add('c-dropdown--open');
        
        if (this.trigger) {
            this.trigger.setAttribute('aria-expanded', 'true');
        }
        
        if (this.menu) {
            this.menu.hidden = false;
            this.collectItems();
            this.positionMenu();
        }

        this.wrapper.dispatchEvent(new CustomEvent('dropdown:open', { bubbles: true }));
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.wrapper.classList.remove('c-dropdown--open');
        
        if (this.trigger) {
            this.trigger.setAttribute('aria-expanded', 'false');
        }
        
        if (this.menu) {
            this.menu.hidden = true;
        }

        this.focusedIndex = -1;
        this.wrapper.dispatchEvent(new CustomEvent('dropdown:close', { bubbles: true }));
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    focusFirstItem() {
        this.focusedIndex = 0;
        this.updateFocus();
    }

    focusLastItem() {
        this.focusedIndex = this.items.length - 1;
        this.updateFocus();
    }

    focusNextItem() {
        if (this.items.length === 0) return;
        this.focusedIndex = (this.focusedIndex + 1) % this.items.length;
        this.updateFocus();
    }

    focusPreviousItem() {
        if (this.items.length === 0) return;
        this.focusedIndex = (this.focusedIndex - 1 + this.items.length) % this.items.length;
        this.updateFocus();
    }

    updateFocus() {
        this.items.forEach((item, idx) => {
            const focused = idx === this.focusedIndex;
            item.classList.toggle('c-dropdown__item--focused', focused);
            if (focused) {
                item.focus({ preventScroll: true });
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    positionMenu() {
        if (!this.trigger || !this.menu || !this.isOpen) return;

        const triggerRect = this.trigger.getBoundingClientRect();
        const menuRect = this.menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gap = 4;

        let top, left;

        // Vertical position (below trigger by default)
        top = triggerRect.bottom + gap;

        // Check if menu fits below, otherwise position above
        if (top + menuRect.height > viewportHeight && triggerRect.top > menuRect.height) {
            top = triggerRect.top - menuRect.height - gap;
            this.wrapper.classList.add('c-dropdown--drop-up');
        } else {
            this.wrapper.classList.remove('c-dropdown--drop-up');
        }

        // Horizontal position based on align
        switch (this.options.align) {
            case 'start':
                left = triggerRect.left;
                break;
            case 'center':
                left = triggerRect.left + (triggerRect.width - menuRect.width) / 2;
                break;
            case 'end':
                left = triggerRect.right - menuRect.width;
                break;
            case 'stretch':
                left = triggerRect.left;
                this.menu.style.width = `${triggerRect.width}px`;
                break;
            default:
                left = triggerRect.right - menuRect.width;
        }

        // Constrain to viewport
        const minLeft = 8;
        const maxLeft = viewportWidth - menuRect.width - 8;
        left = Math.max(minLeft, Math.min(maxLeft, left));

        // Apply position
        this.menu.style.position = 'fixed';
        this.menu.style.top = `${top}px`;
        this.menu.style.left = `${left}px`;
        this.menu.style.zIndex = 'var(--z-index-dropdown)';
    }

    destroy() {
        document.removeEventListener('click', this.handleOutsideClick.bind(this), true);
        document.removeEventListener('keydown', this.handleGlobalKeydown.bind(this));
        window.removeEventListener('resize', this.positionMenu.bind(this));
        window.removeEventListener('scroll', this.positionMenu.bind(this), true);
    }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    const initDropdowns = () => {
        document.querySelectorAll('[data-dropdown]').forEach(wrapper => {
            if (!wrapper._dsDropdown) {
                try {
                    wrapper._dsDropdown = new Dropdown(wrapper);
                } catch (err) {
                    console.error('[Dropdown] Init error:', err);
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDropdowns);
    } else {
        initDropdowns();
    }

    // Register with DesignSystem
    if (window.DesignSystem) {
        window.DesignSystem.registerComponent('dropdown', Dropdown, {
            selector: '[data-dropdown]',
        });
        window.DesignSystem.Dropdown = Dropdown;
    }
}

export default Dropdown;
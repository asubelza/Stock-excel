/* ==========================================================================
   ECJY Design System — Modal Component
   ==========================================================================
   ES module class for accessible modal dialogs.
   Features: Focus trap, stack management, ESC close, overlay click
   Exports to: DesignSystem.Modal
   ========================================================================== */

export class Modal {
    /**
     * @param {HTMLElement} modal - The modal element
     * @param {Object} options - Configuration options
     */
    constructor(modal, options = {}) {
        this.modal = modal;
        this.options = {
            closeOnOverlay: true,
            closeOnEscape: true,
            stackManagement: true,
            ...options,
        };

        // Parse config from data attributes
        const configEl = modal.querySelector('[data-modal-config]');
        if (configEl) {
            try {
                const config = JSON.parse(configEl.textContent);
                this.options = { ...this.options, ...config };
            } catch (_) {}
        }

        this.id = modal.id;
        this.overlay = document.getElementById(`${this.id}-overlay`);
        this.container = modal.querySelector('.c-modal__container');
        this.closeBtn = modal.querySelector('.c-modal__close');
        this.header = modal.querySelector('.c-modal__header');
        this.body = modal.querySelector('.c-modal__body');
        this.footer = modal.querySelector('.c-modal__footer');

        // Focus management
        this.previousActiveElement = null;
        this.focusableElements = [];
        this.firstFocusable = null;
        this.lastFocusable = null;

        // Stack management
        this.modalStack = Modal.modalStack;
        this.zIndexBase = 550;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateFocusableElements();
        
        // Check if should be open initially
        if (this.modal.classList.contains('c-modal--open') || this.modal.dataset.open === 'true') {
            this.open();
        }
    }

    bindEvents() {
        // Close button
        if (this.closeBtn) {
            // Ensure close button has aria-label
            if (!this.closeBtn.getAttribute('aria-label')) {
                this.closeBtn.setAttribute('aria-label', 'Cerrar modal');
            }
            this.closeBtn.addEventListener('click', this.close.bind(this));
        }

        // Overlay click
        if (this.overlay && this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', this.handleOverlayClick.bind(this));
        }

        // Modal custom events
        this.modal.addEventListener('modal:close', this.close.bind(this));
        this.modal.addEventListener('modal:overlay-click', this.handleOverlayClick.bind(this));

        // Keyboard
        this.modal.addEventListener('keydown', this.handleKeydown.bind(this));

        // Focus trap
        this.modal.addEventListener('focusin', this.handleFocusIn.bind(this));

        // Prevent body scroll when modal opens
        this.modal.addEventListener('modal:before-open', () => {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${this.getScrollbarWidth()}px`;
        });

        this.modal.addEventListener('modal:after-close', () => {
            if (Modal.openModals === 0) {
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        });
    }

    handleOverlayClick(event) {
        if (event.target === this.overlay && this.options.closeOnOverlay) {
            this.close();
        }
    }

    handleKeydown(event) {
        if (event.key === 'Escape' && this.options.closeOnEscape) {
            event.preventDefault();
            this.close();
            return;
        }

        if (event.key === 'Tab') {
            this.trapFocus(event);
        }
    }

    handleFocusIn(event) {
        // Ensure focus stays within modal
        if (!this.modal.contains(event.target)) {
            event.preventDefault();
            this.focusFirstElement();
        }
    }
    
    /**
     * Restore focus to previously active element
     * Ensures accessibility when modal closes
     */
    restoreFocus() {
        if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
            // Check if element is still in DOM
            if (document.body.contains(this.previousActiveElement)) {
                this.previousActiveElement.focus();
            }
        }
    }

    trapFocus(event) {
        if (this.focusableElements.length === 0) return;

        if (event.shiftKey) {
            if (document.activeElement === this.firstFocusable) {
                event.preventDefault();
                this.lastFocusable?.focus();
            }
        } else {
            if (document.activeElement === this.lastFocusable) {
                event.preventDefault();
                this.firstFocusable?.focus();
            }
        }
    }

    updateFocusableElements() {
        const focusableSelector = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
        ].join(', ');

        this.focusableElements = Array.from(this.modal.querySelectorAll(focusableSelector))
            .filter(el => el.offsetParent !== null); // visible only

        this.firstFocusable = this.focusableElements[0] || null;
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
    }

    focusFirstElement() {
        if (this.firstFocusable) {
            this.firstFocusable.focus();
        } else if (this.closeBtn) {
            this.closeBtn.focus();
        }
    }

    open() {
        if (this.isOpen) return;

        // Concurrent modal prevention (EM-10): Prevent opening if another modal is already open
        if (Modal.openModals > 0 && this.options.stackManagement) {
            const topModal = Modal.getTopModal();
            if (topModal && topModal !== this) {
                console.warn('[Modal] Another modal is already open. Close it first.');
                return;
            }
        }

        // Stack management
        if (this.options.stackManagement) {
            this.modalStack.push(this);
            this.updateStackZIndex();
        }

        // Save previous active element
        this.previousActiveElement = document.activeElement;

        // Show modal
        this.modal.classList.add('c-modal--open');
        if (this.overlay) {
            this.overlay.setAttribute('aria-hidden', 'false');
        }
        this.modal.setAttribute('aria-hidden', 'false');
        this.modal.hidden = false;
        
        // Ensure proper ARIA attributes
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');

        // Update focusable elements
        this.updateFocusableElements();

        // Focus management - focus first invalid field if exists, otherwise first focusable
        this.focusFirstInvalidOrFirst();

        // Dispatch events
        this.modal.dispatchEvent(new CustomEvent('modal:open', { bubbles: true }));
        this.modal.dispatchEvent(new CustomEvent('modal:after-open', { bubbles: true }));

        Modal.openModals++;

        // Announce to screen readers
        this.announce('Modal abierto');
    }

    /**
     * Focus first invalid field (aria-invalid="true") or first focusable element
     * Used for EM-08: focus first invalid field on validation error
     */
    focusFirstInvalidOrFirst() {
        // First, try to find an invalid field
        const invalidField = this.modal.querySelector('[aria-invalid="true"]:not([disabled])');
        if (invalidField && invalidField.offsetParent !== null) {
            invalidField.focus();
            return;
        }
        
        // Fallback to first focusable
        this.focusFirstElement();
    }

    close() {
        if (!this.isOpen) return;

        // Stack management
        if (this.options.stackManagement) {
            const index = this.modalStack.indexOf(this);
            if (index > -1) {
                this.modalStack.splice(index, 1);
                this.updateStackZIndex();
            }
        }

        // Hide modal
        this.modal.classList.remove('c-modal--open');
        if (this.overlay) {
            this.overlay.setAttribute('aria-hidden', 'true');
        }
        this.modal.setAttribute('aria-hidden', 'true');
        this.modal.hidden = true;

        // Restore focus to trigger element
        this.restoreFocus();

        // Dispatch events
        this.modal.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));
        this.modal.dispatchEvent(new CustomEvent('modal:after-close', { bubbles: true }));

        Modal.openModals--;

        // Announce to screen readers
        this.announce('Modal cerrado');
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    updateStackZIndex() {
        this.modalStack.forEach((modal, index) => {
            const zIndex = this.zIndexBase + index * 2;
            modal.modal.style.zIndex = zIndex;
            if (modal.overlay) {
                modal.overlay.style.zIndex = zIndex - 1;
            }
        });
    }

    get isOpen() {
        return this.modal.classList.contains('c-modal--open');
    }

    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    announce(message) {
        const announcer = document.getElementById('ds-announcer') || this.createAnnouncer();
        announcer.textContent = message;
    }

    createAnnouncer() {
        const announcer = document.createElement('div');
        announcer.id = 'ds-announcer';
        announcer.className = 'visually-hidden';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announcer);
        return announcer;
    }

    destroy() {
        if (this.isOpen) this.close();
        
        const index = this.modalStack.indexOf(this);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }
    }
}

// Static properties for stack management
Modal.modalStack = [];
Modal.openModals = 0;

// Static methods
Modal.getTopModal = () => Modal.modalStack[Modal.modalStack.length - 1];
Modal.closeAll = () => {
    [...Modal.modalStack].reverse().forEach(modal => modal.close());
};

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    const initModals = () => {
        document.querySelectorAll('[data-modal]').forEach(modal => {
            if (!modal._dsModal) {
                try {
                    modal._dsModal = new Modal(modal);
                } catch (err) {
                    console.error('[Modal] Init error:', err);
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModals);
    } else {
        initModals();
    }

    // Global keyboard handler for ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const topModal = Modal.getTopModal();
            if (topModal && topModal.options.closeOnEscape) {
                topModal.close();
            }
        }
    });

    // Register with DesignSystem
    if (window.DesignSystem) {
        window.DesignSystem.registerComponent('modal', Modal, {
            selector: '[data-modal]',
        });
        window.DesignSystem.Modal = Modal;
    }
}

export default Modal;
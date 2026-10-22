/* ==========================================================================
   ECJY Design System — Modal HTMX Integration
   ==========================================================================
   Handles HTMX events for modal open/close, form submission, and table refresh.
   Features:
   - Auto-open modal after HTMX swap
   - Auto-close modal on HX-Trigger: closeModal
   - Table reload on HX-Trigger: reloadTable
   - Toast notifications on HX-Trigger: showToast
   - Concurrent modal prevention
   ========================================================================== */

// Global state for concurrent modal prevention
let _modalOpenCount = 0;

// Listen for HTMX events
document.addEventListener('htmx:afterSwap', (evt) => {
    // Auto-open modal when swapped into modal-container
    if (evt.target.id === 'modal-container') {
        const modal = evt.target.querySelector('[data-modal]');
        if (modal && modal._dsModal) {
            // Check concurrent modal prevention
            if (_modalOpenCount > 0) {
                console.warn('[Modal HTMX] Another modal is already open');
                return;
            }
            _modalOpenCount++;
            modal._dsModal.open();
        }
    }
});

// Listen for modal close events
document.addEventListener('modal:after-close', () => {
    _modalOpenCount = Math.max(0, _modalOpenCount - 1);
});

// Handle HX-Trigger: closeModal
document.body.addEventListener('closeModal', () => {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        const modal = modalContainer.querySelector('[data-modal]');
        if (modal && modal._dsModal && modal._dsModal.isOpen) {
            modal._dsModal.close();
        }
    }
});

// Handle HX-Trigger: reloadTable
document.body.addEventListener('reloadTable', () => {
    const tableWrapper = document.querySelector('[data-table]');
    if (tableWrapper && tableWrapper._dsDataTable) {
        tableWrapper._dsDataTable.refresh();
    }
});

// Handle HX-Trigger: showToast
document.body.addEventListener('showToast', (evt) => {
    const detail = evt.detail || {};
    if (window.DesignSystem && DesignSystem.Toast) {
        const type = detail.type || 'info';
        const message = detail.message || 'Operación completada';
        DesignSystem.Toast[type](message);
    }
});

// Helper to show toast from backend response headers
// This is triggered by the HX-Trigger-After-Swap header
document.addEventListener('htmx:afterOnLoad', (evt) => {
    const xhr = evt.detail.xhr;
    if (!xhr) return;
    
    // Check for HX-Trigger-After-Swap header
    const triggerHeader = xhr.getResponseHeader('HX-Trigger-After-Swap');
    if (triggerHeader) {
        try {
            const triggers = JSON.parse(triggerHeader);
            if (triggers.showToast) {
                const { message, type = 'info' } = triggers.showToast;
                if (window.DesignSystem && DesignSystem.Toast) {
                    DesignSystem.Toast[type](message);
                }
            }
            if (triggers.closeModal) {
                document.body.dispatchEvent(new CustomEvent('closeModal'));
            }
            if (triggers.reloadTable) {
                document.body.dispatchEvent(new CustomEvent('reloadTable'));
            }
        } catch (_) {
            // Header might not be JSON
        }
    }
});

// Prevent concurrent modals at trigger level
document.addEventListener('htmx:beforeRequest', (evt) => {
    const elt = evt.target;
    if (elt.hasAttribute('hx-get') && elt.getAttribute('hx-target') === '#modal-container') {
        if (_modalOpenCount > 0) {
            console.warn('[Modal HTMX] Preventing concurrent modal open');
            evt.preventDefault();
            if (window.DesignSystem && DesignSystem.Toast) {
                DesignSystem.Toast.warning('Ya hay un modal abierto. Ciérrelo antes de abrir otro.');
            }
        }
    }
});

export {};
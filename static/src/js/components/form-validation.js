/* ==========================================================================
   ECJY Design System — Form Validation Component
   ==========================================================================
   ES module for client-side form validation with async support.
   Features: validateField, validateForm, debounced async validation
   Exports to: DesignSystem.FormValidation
   ========================================================================== */

export class FormValidation {
    /**
     * @param {HTMLFormElement} form - The form element to validate
     * @param {Object} options - Configuration options
     */
    constructor(form, options = {}) {
        this.form = form;
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            validateOnSubmit: true,
            debounceMs: 300,
            asyncValidators: {},
            customValidators: {},
            errorClass: 'c-input--error',
            successClass: 'c-input--valid',
            errorSelector: '.c-form__error',
            ...options,
        };

        this.debounceTimers = new Map();
        this.asyncValidators = this.options.asyncValidators;
        this.customValidators = this.options.customValidators;
        this.fieldStates = new Map();

        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        if (this.options.validateOnSubmit) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Bind input/blur events for all form controls
        const controls = this.form.querySelectorAll('input, select, textarea');
        controls.forEach(control => {
            if (this.options.validateOnInput) {
                control.addEventListener('input', this.handleInput.bind(this));
            }
            if (this.options.validateOnBlur) {
                control.addEventListener('blur', this.handleBlur.bind(this));
            }
        });

        // Form reset
        this.form.addEventListener('reset', this.handleReset.bind(this));
    }

    handleInput(event) {
        const field = event.target;
        this.clearFieldError(field);
        
        if (this.options.validateOnInput) {
            this.debouncedValidate(field);
        }
    }

    handleBlur(event) {
        const field = event.target;
        this.validateField(field);
    }

    handleSubmit(event) {
        const isValid = this.validateForm();
        if (!isValid) {
            event.preventDefault();
            event.stopPropagation();
        }
        return isValid;
    }

    handleReset() {
        this.clearAllErrors();
        this.fieldStates.clear();
    }

    debouncedValidate(field) {
        const fieldName = field.name || field.id;
        if (this.debounceTimers.has(fieldName)) {
            clearTimeout(this.debounceTimers.get(fieldName));
        }

        const timer = setTimeout(() => {
            this.validateField(field);
            this.debounceTimers.delete(fieldName);
        }, this.options.debounceMs);

        this.debounceTimers.set(fieldName, timer);
    }

    /**
     * Validate a single field
     * @param {HTMLElement} field - The field to validate
     * @returns {Promise<boolean>} True if valid
     */
    async validateField(field) {
        const fieldName = field.name || field.id;
        const value = field.value;

        // Clear previous error
        this.clearFieldError(field);

        // Required validation
        if (field.required && !value.trim()) {
            this.showFieldError(field, 'Este campo es requerido');
            return false;
        }

        // Type validation
        if (value && !this.validateType(field, value)) {
            return false;
        }

        // Pattern validation
        if (value && field.pattern && !new RegExp(field.pattern).test(value)) {
            this.showFieldError(field, field.title || 'Formato inválido');
            return false;
        }

        // Min/max validation for numbers
        if (value && (field.type === 'number' || field.type === 'range')) {
            const num = parseFloat(value);
            if (field.min !== '' && num < parseFloat(field.min)) {
                this.showFieldError(field, `El valor mínimo es ${field.min}`);
                return false;
            }
            if (field.max !== '' && num > parseFloat(field.max)) {
                this.showFieldError(field, `El valor máximo es ${field.max}`);
                return false;
            }
        }

        // Minlength/maxlength
        if (value && field.minLength && value.length < parseInt(field.minLength)) {
            this.showFieldError(field, `Mínimo ${field.minLength} caracteres`);
            return false;
        }
        if (value && field.maxLength && value.length > parseInt(field.maxLength)) {
            this.showFieldError(field, `Máximo ${field.maxLength} caracteres`);
            return false;
        }

        // Custom validators
        if (value && this.customValidators[fieldName]) {
            const result = await this.customValidators[fieldName](value, field, this.form);
            if (result !== true) {
                this.showFieldError(field, result || 'Valor inválido');
                return false;
            }
        }

        // Async validators
        if (value && this.asyncValidators[fieldName]) {
            this.setFieldLoading(field, true);
            try {
                const result = await this.asyncValidators[fieldName](value, field, this.form);
                this.setFieldLoading(field, false);
                if (result !== true) {
                    this.showFieldError(field, result || 'Validación fallida');
                    return false;
                }
            } catch (err) {
                this.setFieldLoading(field, false);
                this.showFieldError(field, 'Error en validación: ' + err.message);
                return false;
            }
        }

        // Mark as valid
        this.markFieldValid(field);
        return true;
    }

    validateType(field, value) {
        switch (field.type) {
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    this.showFieldError(field, 'Email inválido');
                    return false;
                }
                break;
            case 'url':
                try {
                    new URL(value);
                } catch {
                    this.showFieldError(field, 'URL inválida');
                    return false;
                }
                break;
            case 'tel':
                // Basic phone validation - allow various formats
                if (!/^[\d\s\-+()]{7,}$/.test(value)) {
                    this.showFieldError(field, 'Teléfono inválido');
                    return false;
                }
                break;
        }
        return true;
    }

    /**
     * Validate entire form
     * @returns {Promise<boolean>} True if all fields valid
     */
    async validateForm() {
        const controls = this.form.querySelectorAll('input, select, textarea');
        let allValid = true;

        // Validate all fields
        for (const field of controls) {
            const isValid = await this.validateField(field);
            if (!isValid) {
                allValid = false;
            }
        }

        // Focus first invalid field
        if (!allValid) {
            const firstInvalid = this.form.querySelector(`.${this.options.errorClass}`);
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }

        return allValid;
    }

    showFieldError(field, message) {
        field.classList.add(this.options.errorClass);
        field.classList.remove(this.options.successClass);
        field.setAttribute('aria-invalid', 'true');

        // Find or create error element
        let errorEl = field.parentElement.querySelector(this.options.errorSelector);
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'c-form__error';
            errorEl.setAttribute('role', 'alert');
            field.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.hidden = false;

        // Link error to field via aria-describedby
        const fieldId = field.id || `field-${Math.random().toString(36).slice(2, 9)}`;
        field.id = fieldId;
        errorEl.id = `${fieldId}-error`;
        field.setAttribute('aria-describedby', errorEl.id);

        this.fieldStates.set(fieldName, { valid: false, message });
    }

    clearFieldError(field) {
        field.classList.remove(this.options.errorClass);
        field.setAttribute('aria-invalid', 'false');

        const errorEl = field.parentElement.querySelector(this.options.errorSelector);
        if (errorEl) {
            errorEl.hidden = true;
            errorEl.textContent = '';
        }
        field.removeAttribute('aria-describedby');
    }

    markFieldValid(field) {
        field.classList.add(this.options.successClass);
        field.classList.remove(this.options.errorClass);
        field.setAttribute('aria-invalid', 'false');
        this.fieldStates.set(field.name || field.id, { valid: true });
    }

    setFieldLoading(field, loading) {
        field.classList.toggle('c-input--loading', loading);
        field.disabled = loading;
    }

    clearAllErrors() {
        const controls = this.form.querySelectorAll('input, select, textarea');
        controls.forEach(field => {
            this.clearFieldError(field);
            field.classList.remove(this.options.successClass);
        });
    }

    /**
     * Get validation state for a field
     * @param {string} fieldName - Field name or ID
     * @returns {Object|null} Validation state
     */
    getFieldState(fieldName) {
        return this.fieldStates.get(fieldName) || null;
    }

    /**
     * Check if form is valid
     * @returns {boolean}
     */
    isValid() {
        for (const [, state] of this.fieldStates) {
            if (!state.valid) return false;
        }
        return this.fieldStates.size > 0;
    }

    /**
     * Reset validation state
     */
    reset() {
        this.clearAllErrors();
        this.fieldStates.clear();
    }

    destroy() {
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
    }
}

/* ==========================================================================
   Built-in Async Validators
   ========================================================================== */

export const AsyncValidators = {
    /**
     * Validate CUIT (Argentine tax ID) via API
     * @param {string} value - CUIT value
     * @returns {Promise<boolean|string>} True if valid, error message if invalid
     */
    async cuit(value) {
        if (!value) return true; // Optional field
        // Basic format check first
        if (!/^\d{2}-?\d{8}-?\d$/.test(value.replace(/\s/g, ''))) {
            return 'Formato de CUIT inválido (XX-XXXXXXXX-X)';
        }
        try {
            const response = await fetch(`/stock/api/validar_cuit?cuit=${encodeURIComponent(value)}`);
            const data = await response.json();
            if (!data.valid) {
                return data.message || 'CUIT inválido';
            }
            if (data.exists) {
                return 'Este CUIT ya está registrado';
            }
            return true;
        } catch {
            return 'Error al validar CUIT';
        }
    },

    /**
     * Validate email uniqueness via API
     * @param {string} value - Email value
     * @returns {Promise<boolean|string>} True if valid, error message if invalid
     */
    async email(value) {
        if (!value) return true; // Optional field
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Email inválido';
        }
        try {
            const response = await fetch(`/stock/api/validar_email?email=${encodeURIComponent(value)}`);
            const data = await response.json();
            if (data.exists) {
                return 'Este email ya está registrado';
            }
            return true;
        } catch {
            return 'Error al validar email';
        }
    },

    /**
     * Validate SKU uniqueness via API
     * @param {string} value - SKU value
     * @returns {Promise<boolean|string>} True if valid, error message if invalid
     */
    async sku(value) {
        if (!value) return true;
        try {
            const response = await fetch(`/stock/api/validar_sku?sku=${encodeURIComponent(value)}`);
            const data = await response.json();
            if (data.exists) {
                return 'Este SKU ya existe';
            }
            return true;
        } catch {
            return 'Error al validar SKU';
        }
    },
};

/* ==========================================================================
   Helper: Create FormValidation instance from form element
   ========================================================================== */

export function createFormValidation(form, options = {}) {
    return new FormValidation(form, options);
}

/* ==========================================================================
   Auto-initialize forms with data-validation attribute
   ========================================================================== */

if (typeof window !== 'undefined') {
    const initForms = () => {
        document.querySelectorAll('form[data-validation]').forEach(form => {
            if (!form._dsFormValidation) {
                try {
                    const configEl = form.querySelector('[data-validation-config]');
                    const config = configEl ? JSON.parse(configEl.textContent) : {};
                    form._dsFormValidation = new FormValidation(form, config);
                } catch (err) {
                    console.error('[FormValidation] Init error:', err);
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForms);
    } else {
        initForms();
    }

    // Register with DesignSystem
    if (window.DesignSystem) {
        window.DesignSystem.registerComponent('form-validation', FormValidation, {
            selector: 'form[data-validation]',
        });
        window.DesignSystem.FormValidation = FormValidation;
        window.DesignSystem.AsyncValidators = AsyncValidators;
    }
}

export default FormValidation;
/* ==========================================================================
   ECJY Design System — Autocomplete Component
   ==========================================================================
   ES module class for accessible autocomplete combobox.
   Features: fetch, debounce, keyboard navigation, ARIA, min_chars
   Exports to: DesignSystem.Autocomplete
   ========================================================================== */

export class Autocomplete {
    /**
     * @param {HTMLElement} wrapper - The autocomplete wrapper element
     * @param {Object} options - Configuration options
     */
    constructor(wrapper, options = {}) {
        this.wrapper = wrapper;
        this.options = {
            fetchUrl: null,
            fetchParams: {},
            minChars: 2,
            debounceMs: 150,
            maxResults: 10,
            multiple: false,
            optionValue: 'value',
            optionLabel: 'label',
            optionDescription: null,
            optionGroup: null,
            initialOptions: [],
            initialValue: '',
            ...options,
        };

        // DOM elements
        this.input = wrapper.querySelector('.c-autocomplete__input');
        this.listbox = wrapper.querySelector('.c-autocomplete__listbox');
        this.loadingEl = wrapper.querySelector('.c-autocomplete__loading');
        this.clearBtn = wrapper.querySelector('.c-autocomplete__clear');
        this.chevron = wrapper.querySelector('.c-autocomplete__chevron');
        this.hiddenInput = wrapper.querySelector('[id$="-values"]');

        // State
        this.isOpen = false;
        this.options = this.options.initialOptions || [];
        this.filteredOptions = [];
        this.highlightedIndex = -1;
        this.debounceTimer = null;
        this.abortController = null;
        this.value = this.options.initialValue || '';
        this.selectedValues = this.options.multiple ? [] : null;

        // IDs
        this.id = this.input.id;
        this.listboxId = this.listbox.id;

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderOptions(this.options.initialOptions);
        this.syncValue();
    }

    bindEvents() {
        // Input events
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('click', this.handleClick.bind(this));

        // Clear button
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', this.clear.bind(this));
        }

        // Listbox events
        this.listbox.addEventListener('mousedown', this.handleOptionMousedown.bind(this));
        this.listbox.addEventListener('mouseover', this.handleOptionMouseover.bind(this));

        // Outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Form reset
        const form = this.input.closest('form');
        if (form) {
            form.addEventListener('reset', () => setTimeout(() => this.reset(), 0));
        }
    }

    handleInput(event) {
        const query = event.target.value.trim();
        this.value = query;
        this.updateClearButton();

        if (this.options.multiple) {
            // For multiple, we don't filter on input - user selects from dropdown
            this.filteredOptions = this.options;
            this.highlightedIndex = -1;
            this.open();
            return;
        }

        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (query.length >= this.options.minChars) {
                this.fetchOptions(query);
            } else {
                this.filteredOptions = this.options.filter(opt => 
                    opt[this.options.optionLabel].toLowerCase().includes(query.toLowerCase())
                );
                this.renderOptions(this.filteredOptions);
                this.open();
            }
        }, this.options.debounceMs);
    }

    handleFocus() {
        if (this.options.multiple || this.input.value.trim().length >= this.options.minChars) {
            this.filteredOptions = this.options.filter(opt => 
                opt[this.options.optionLabel].toLowerCase().includes(this.input.value.trim().toLowerCase())
            );
            this.renderOptions(this.filteredOptions);
            this.open();
        }
    }

    handleBlur(event) {
        // Delay to allow click on option
        setTimeout(() => {
            if (!this.wrapper.contains(document.activeElement)) {
                this.close();
            }
        }, 200);
    }

    handleClick(event) {
        if (this.options.multiple) {
            this.filteredOptions = this.options;
            this.highlightedIndex = -1;
            this.open();
        }
    }

    handleKeydown(event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.highlightNext();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.highlightPrevious();
                break;
            case 'Enter':
                if (this.isOpen && this.highlightedIndex >= 0) {
                    event.preventDefault();
                    this.selectHighlighted();
                } else if (!this.isOpen) {
                    this.open();
                }
                break;
            case 'Escape':
                this.close();
                this.input.blur();
                break;
            case 'Tab':
                if (this.isOpen) {
                    if (this.highlightedIndex >= 0) {
                        event.preventDefault();
                        this.selectHighlighted();
                    }
                    this.close();
                }
                break;
            case 'Backspace':
                if (this.options.multiple && !this.input.value && this.selectedValues.length > 0) {
                    this.removeLastSelection();
                }
                break;
        }
    }

    handleOptionMousedown(event) {
        const option = event.target.closest('[role="option"]');
        if (option) {
            event.preventDefault(); // Prevent blur
            const index = parseInt(option.dataset.index, 10);
            this.highlightedIndex = index;
            this.selectHighlighted();
        }
    }

    handleOptionMouseover(event) {
        const option = event.target.closest('[role="option"]');
        if (option) {
            const index = parseInt(option.dataset.index, 10);
            this.highlightedIndex = index;
            this.updateHighlight();
        }
    }

    handleOutsideClick(event) {
        if (!this.wrapper.contains(event.target)) {
            this.close();
        }
    }

    async fetchOptions(query) {
        if (!this.options.fetchUrl) {
            this.filteredOptions = this.options.filter(opt =>
                opt[this.options.optionLabel].toLowerCase().includes(query.toLowerCase())
            );
            this.renderOptions(this.filteredOptions);
            this.open();
            return;
        }

        this.setLoading(true);

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        try {
            const params = new URLSearchParams({
                q: query,
                limit: this.options.maxResults,
                ...this.options.fetchParams,
            });

            const response = await fetch(`${this.options.fetchUrl}?${params}`, {
                signal: this.abortController.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Fetch failed');

            const data = await response.json();
            this.options = Array.isArray(data) ? data : (data.results || data.data || []);
            this.filteredOptions = this.options;
            this.renderOptions(this.filteredOptions);
            this.open();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('[Autocomplete] Fetch error:', err);
                this.filteredOptions = [];
                this.renderOptions([]);
            }
        } finally {
            this.setLoading(false);
        }
    }

    renderOptions(options) {
        this.filteredOptions = options.slice(0, this.options.maxResults);
        this.highlightedIndex = -1;

        if (this.filteredOptions.length === 0) {
            this.listbox.innerHTML = `
                <div class="c-autocomplete__no-results" role="status">
                    No se encontraron resultados
                </div>
            `;
            return;
        }

        let html = '';
        if (this.options.optionGroup) {
            // Grouped options
            const groups = {};
            for (const opt of this.filteredOptions) {
                const groupKey = opt[this.options.optionGroup];
                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(opt);
            }

            for (const [groupLabel, groupOpts] of Object.entries(groups)) {
                html += `<div class="c-autocomplete__group" role="group" aria-label="${this.escapeHtml(groupLabel)}">`;
                html += `<div class="c-autocomplete__group-label">${this.escapeHtml(groupLabel)}</div>`;
                groupOpts.forEach((opt, idx) => {
                    html += this.renderOption(opt, idx);
                });
                html += '</div>';
            }
        } else {
            this.filteredOptions.forEach((opt, idx) => {
                html += this.renderOption(opt, idx);
            });
        }

        this.listbox.innerHTML = html;
    }

    renderOption(option, index) {
        const value = option[this.options.optionValue];
        const label = this.escapeHtml(option[this.options.optionLabel]);
        const description = this.options.optionDescription && option[this.options.optionDescription]
            ? `<span class="c-autocomplete__option-description">${this.escapeHtml(option[this.options.optionDescription])}</span>`
            : '';
        const selected = this.options.multiple
            ? this.selectedValues.includes(value)
            : value === this.value;

        return `
            <div role="option"
                 class="c-autocomplete__option ${selected ? 'c-autocomplete__option--selected' : ''}"
                 data-index="${index}"
                 data-value="${this.escapeHtml(value)}"
                 aria-selected="${selected}"
                 id="${this.listboxId}-option-${index}">
                <span class="c-autocomplete__option-label">${label}</span>
                ${description}
            </div>
        `;
    }

    highlightNext() {
        if (this.filteredOptions.length === 0) return;
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredOptions.length - 1);
        this.updateHighlight();
        this.scrollToHighlighted();
    }

    highlightPrevious() {
        if (this.filteredOptions.length === 0) return;
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.updateHighlight();
        this.scrollToHighlighted();
    }

    updateHighlight() {
        const options = this.listbox.querySelectorAll('[role="option"]');
        options.forEach((opt, idx) => {
            const selected = idx === this.highlightedIndex;
            opt.classList.toggle('c-autocomplete__option--highlighted', selected);
            opt.setAttribute('aria-selected', selected);
        });

        if (this.highlightedIndex >= 0) {
            const highlightedOption = options[this.highlightedIndex];
            this.input.setAttribute('aria-activedescendant', highlightedOption.id);
        } else {
            this.input.removeAttribute('aria-activedescendant');
        }
    }

    scrollToHighlighted() {
        const highlighted = this.listbox.querySelector('.c-autocomplete__option--highlighted');
        if (highlighted) {
            highlighted.scrollIntoView({ block: 'nearest' });
        }
    }

    selectHighlighted() {
        if (this.highlightedIndex < 0 || this.highlightedIndex >= this.filteredOptions.length) return;

        const option = this.filteredOptions[this.highlightedIndex];
        this.selectOption(option);
    }

    selectOption(option) {
        const value = option[this.options.optionValue];
        const label = option[this.options.optionLabel];

        if (this.options.multiple) {
            if (!this.selectedValues.includes(value)) {
                this.selectedValues.push(value);
                this.input.value = '';
                this.value = '';
                this.renderSelectedTags();
                this.syncValue();
                this.filteredOptions = this.options;
                this.renderOptions(this.filteredOptions);
                this.highlightedIndex = -1;
            }
        } else {
            this.input.value = label;
            this.value = value;
            this.input.setAttribute('data-value', value);
            this.syncValue();
            this.close();
        }

        // Dispatch change event
        this.input.dispatchEvent(new CustomEvent('autocomplete:select', {
            detail: { option, value, label },
            bubbles: true,
        }));
    }

    removeLastSelection() {
        if (this.selectedValues.length > 0) {
            const removed = this.selectedValues.pop();
            this.renderSelectedTags();
            this.syncValue();
            this.input.dispatchEvent(new CustomEvent('autocomplete:unselect', {
                detail: { value: removed },
                bubbles: true,
            }));
        }
    }

    renderSelectedTags() {
        if (!this.options.multiple) return;

        const tagsContainer = this.wrapper.querySelector('.c-autocomplete__tags');
        if (!tagsContainer) return;

        tagsContainer.innerHTML = this.selectedValues.map(value => {
            const opt = this.options.find(o => o[this.options.optionValue] === value);
            const label = opt ? opt[this.options.optionLabel] : value;
            return `
                <span class="c-tag c-tag--brand c-tag--sm c-autocomplete__tag" data-value="${this.escapeHtml(value)}">
                    <span class="c-tag__text">${this.escapeHtml(label)}</span>
                    <button type="button" class="c-tag__remove" aria-label="Eliminar ${this.escapeHtml(label)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </span>
            `;
        }).join('');

        // Add remove handlers
        tagsContainer.querySelectorAll('.c-tag__remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.currentTarget.closest('.c-autocomplete__tag').dataset.value;
                this.selectedValues = this.selectedValues.filter(v => v !== value);
                this.renderSelectedTags();
                this.syncValue();
                this.input.dispatchEvent(new CustomEvent('autocomplete:unselect', {
                    detail: { value },
                    bubbles: true,
                }));
            });
        });
    }

    syncValue() {
        if (this.hiddenInput) {
            this.hiddenInput.value = this.options.multiple
                ? JSON.stringify(this.selectedValues)
                : this.value;
        }
        this.input.value = this.options.multiple ? '' : (this.options.initialOptions.find(o => o[this.options.optionValue] === this.value)?.[this.options.optionLabel] || this.value);
    }

    updateClearButton() {
        if (this.clearBtn) {
            this.clearBtn.hidden = !this.value && (!this.options.multiple || this.selectedValues.length === 0);
        }
    }

    setLoading(loading) {
        this.input.classList.toggle('c-autocomplete__input--loading', loading);
        if (this.loadingEl) this.loadingEl.hidden = !loading;
        if (this.chevron) this.chevron.hidden = loading;
    }

    open() {
        if (this.isOpen || this.options.disabled) return;
        this.isOpen = true;
        this.listbox.hidden = false;
        this.input.setAttribute('aria-expanded', 'true');
        this.wrapper.classList.add('c-autocomplete--open');
        this.updateHighlight();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.listbox.hidden = true;
        this.input.setAttribute('aria-expanded', 'false');
        this.input.removeAttribute('aria-activedescendant');
        this.wrapper.classList.remove('c-autocomplete--open');
        this.highlightedIndex = -1;
    }

    clear() {
        this.input.value = '';
        this.value = '';
        if (this.options.multiple) {
            this.selectedValues = [];
            this.renderSelectedTags();
        }
        this.syncValue();
        this.updateClearButton();
        this.input.focus();
        this.input.dispatchEvent(new CustomEvent('autocomplete:clear', { bubbles: true }));
    }

    reset() {
        this.value = this.options.initialValue || '';
        this.selectedValues = this.options.multiple ? [] : null;
        this.syncValue();
        this.updateClearButton();
        this.renderOptions(this.options.initialOptions);
    }

    setOptions(options) {
        this.options = options;
        this.filteredOptions = options;
        this.renderOptions(options);
    }

    setValue(value) {
        if (this.options.multiple) {
            this.selectedValues = Array.isArray(value) ? value : [];
            this.renderSelectedTags();
        } else {
            this.value = value;
            const opt = this.options.find(o => o[this.options.optionValue] === value);
            this.input.value = opt ? opt[this.options.optionLabel] : value;
        }
        this.syncValue();
        this.updateClearButton();
    }

    getValue() {
        return this.options.multiple ? this.selectedValues : this.value;
    }

    destroy() {
        clearTimeout(this.debounceTimer);
        if (this.abortController) this.abortController.abort();
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    const initAutocompletes = () => {
        document.querySelectorAll('[data-autocomplete-wrapper]').forEach(wrapper => {
            if (!wrapper._dsAutocomplete) {
                try {
                    const configEl = wrapper.querySelector('[data-autocomplete-config]');
                    const config = configEl ? JSON.parse(configEl.textContent) : {};
                    wrapper._dsAutocomplete = new Autocomplete(wrapper, config);
                } catch (err) {
                    console.error('[Autocomplete] Init error:', err);
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutocompletes);
    } else {
        initAutocompletes();
    }

    // Register with DesignSystem
    if (window.DesignSystem) {
        window.DesignSystem.registerComponent('autocomplete', Autocomplete, {
            selector: '[data-autocomplete-wrapper]',
        });
        window.DesignSystem.Autocomplete = Autocomplete;
    }
}

export default Autocomplete;
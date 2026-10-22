/* ==========================================================================
   ECJY Design System — Data Table Component
   ==========================================================================
   ES module class for server-side sortable, filterable, paginated tables.
   Features: Column sorting, global search, column filters, pagination,
   skeleton loading, responsive modes, virtual scrolling for large datasets.
   Exports to: DesignSystem.DataTable
   ========================================================================== */

export class DataTable {
    /**
     * @param {HTMLElement} wrapper - The table wrapper element
     * @param {Object} options - Configuration options
     */
    constructor(wrapper, options = {}) {
        this.wrapper = wrapper;
        this.options = {
            // Data source
            apiUrl: null,           // API endpoint for server-side data
            dataKey: 'rows',        // Key in response for rows array
            totalKey: 'total',      // Key in response for total count
            
            // Sorting
            sortable: true,
            defaultSort: null,      // { field: 'col', direction: 'asc' }
            
            // Filtering
            filterable: true,
            globalSearch: true,
            columnFilters: true,
            
            // Pagination
            paginated: true,
            pageSize: 25,
            pageSizeOptions: [10, 25, 50, 100],
            
            // Virtualization
            virtualized: false,
            rowHeight: 48,
            bufferRows: 5,
            
            // UI
            responsive: 'stack',    // 'stack' | 'scroll' | 'collapse'
            striped: true,
            hoverable: true,
            bordered: true,
            selectable: false,
            
            // Loading
            skeletonRows: 5,
            showLoading: true,
            
            // Callbacks
            onRowClick: null,
            onRowSelect: null,
            onSortChange: null,
            onFilterChange: null,
            onPageChange: null,
            onDataLoad: null,
            
            // Custom renderers
            columns: [],            // Array of column definitions
            actions: null,          // Actions per row
            
            ...options,
        };

        // Parse config from data attributes
        const configEl = wrapper.querySelector('[data-table-config]');
        if (configEl) {
            try {
                const config = JSON.parse(configEl.textContent);
                this.options = { ...this.options, ...config };
            } catch (_) {}
        }

        this.id = wrapper.id || `table-${DesignSystem.uid('dt')}`;
        
        // DOM elements
        this.table = wrapper.querySelector('table.c-table');
        this.thead = this.table?.querySelector('thead');
        this.tbody = this.table?.querySelector('tbody');
        this.scrollContainer = wrapper.querySelector('.c-table__scroll');
        
        // State
        this.sortField = this.options.defaultSort?.field || null;
        this.sortDirection = this.options.defaultSort?.direction || 'asc';
        this.currentPage = 1;
        this.pageSize = this.options.pageSize;
        this.totalRows = 0;
        this.totalPages = 0;
        this.data = [];
        this.isLoading = false;
        this.filters = {};
        this.globalSearchQuery = '';
        this.selectedRows = new Set();
        
        // Debounced search
        this.debouncedSearch = DesignSystem.debounce(this.loadData.bind(this), 300);
        
        this.init();
    }

    init() {
        this.collectColumns();
        this.bindEvents();
        this.renderSkeleton();
        
        if (this.options.apiUrl) {
            this.loadData();
        } else {
            this.data = this.extractDataFromDOM();
            this.totalRows = this.data.length;
            this.renderTable();
            this.renderPagination();
        }
    }

    collectColumns() {
        if (!this.thead) return;
        
        const headerCells = this.thead.querySelectorAll('th[data-sortable="true"]');
        this.options.columns = Array.from(headerCells).map((th, index) => ({
            key: th.dataset.sortKey || `col-${index}`,
            label: th.querySelector('.c-table__th-text')?.textContent?.trim() || th.textContent.trim(),
            sortable: th.dataset.sortable === 'true',
            align: th.dataset.align || 'left',
            render: th.dataset.render ? new Function('row', `return ${th.dataset.render}`) : null,
        }));
    }

    extractDataFromDOM() {
        if (!this.tbody) return [];
        
        return Array.from(this.tbody.querySelectorAll('tr.c-table__row:not(.c-table__empty-row)')).map((tr, index) => {
            const row = { _index: index, _element: tr };
            const cells = tr.querySelectorAll('td[data-key]');
            cells.forEach(td => {
                row[td.dataset.key] = td.textContent.trim();
            });
            const rowKey = tr.dataset.rowKey;
            if (rowKey) row._key = rowKey;
            return row;
        });
    }

    bindEvents() {
        // Sort headers
        if (this.options.sortable && this.thead) {
            this.thead.querySelectorAll('th[data-sortable="true"]').forEach(th => {
                th.style.cursor = 'pointer';
                th.addEventListener('click', (e) => {
                    if (e.target.closest('.c-table__sort-btn')) return;
                    this.handleSort(th.dataset.sortKey);
                });
            });
        }

        // Sort buttons
        if (this.options.sortable && this.thead) {
            this.thead.querySelectorAll('.c-table__sort-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const th = btn.closest('th');
                    if (th?.dataset.sortKey) {
                        this.handleSort(th.dataset.sortKey);
                    }
                });
            });
        }

        // Global search
        if (this.options.globalSearch) {
            const searchInput = this.wrapper.querySelector('[data-table-search]');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.globalSearchQuery = e.target.value;
                    this.currentPage = 1;
                    this.debouncedSearch();
                });
            }
        }

        // Column filters
        if (this.options.columnFilters) {
            this.wrapper.querySelectorAll('[data-table-filter]').forEach(input => {
                input.addEventListener('change', (e) => {
                    const key = e.target.dataset.tableFilter;
                    const value = e.target.value;
                    if (value) {
                        this.filters[key] = value;
                    } else {
                        delete this.filters[key];
                    }
                    this.currentPage = 1;
                    this.loadData();
                });
            });
        }

        // Pagination
        this.wrapper.addEventListener('click', (e) => {
            const pageBtn = e.target.closest('[data-page]');
            if (pageBtn) {
                e.preventDefault();
                this.goToPage(parseInt(pageBtn.dataset.page));
            }
            
            const pageSizeSelect = e.target.closest('[data-page-size]');
            if (pageSizeSelect) {
                this.pageSize = parseInt(pageSizeSelect.value);
                this.currentPage = 1;
                this.loadData();
            }
        });

        // Row selection
        if (this.options.selectable) {
            this.wrapper.addEventListener('change', (e) => {
                const checkbox = e.target.closest('.c-table__row-select, .c-table__select-all');
                if (!checkbox) return;
                
                if (checkbox.classList.contains('c-table__select-all')) {
                    if (checkbox.checked) {
                        this.selectAll();
                    } else {
                        this.clearSelection();
                    }
                } else {
                    const rowKey = checkbox.value;
                    if (checkbox.checked) {
                        this.selectRow(rowKey);
                    } else {
                        this.deselectRow(rowKey);
                    }
                }
            });
        }

        // Row click
        if (this.options.onRowClick && this.tbody) {
            this.tbody.addEventListener('click', (e) => {
                const row = e.target.closest('tr.c-table__row[data-row-key]');
                if (row && !e.target.closest('.c-table__actions, .c-table__select, label, input, button, a')) {
                    const rowKey = row.dataset.rowKey;
                    const rowData = this.data.find(d => d._key == rowKey);
                    if (rowData) {
                        this.options.onRowClick(rowData, row);
                    }
                }
            });
        }

        // Keyboard navigation for virtualized table
        if (this.options.virtualized) {
            this.wrapper.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        // Resize observer for virtualized scrolling
        if (this.options.virtualized && this.scrollContainer) {
            this.resizeObserver = new ResizeObserver(() => this.renderVirtualized());
            this.resizeObserver.observe(this.scrollContainer);
            
            this.scrollContainer.addEventListener('scroll', 
                DesignSystem.throttle(() => this.renderVirtualized(), 16)
            );
        }
    }

    handleSort(field) {
        if (!this.options.columns.some(c => c.key === field && c.sortable)) return;
        
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        this.updateSortUI();
        this.currentPage = 1;
        this.loadData();
        
        if (this.options.onSortChange) {
            this.options.onSortChange(this.sortField, this.sortDirection);
        }
    }

    updateSortUI() {
        this.thead?.querySelectorAll('th[data-sortable="true"]').forEach(th => {
            const key = th.dataset.sortKey;
            const btn = th.querySelector('.c-table__sort-btn');
            if (!btn) return;
            
            const isActive = key === this.sortField;
            btn.dataset.sortDirection = isActive ? this.sortDirection : 'none';
            btn.setAttribute('aria-label', 
                `Ordenar por ${th.querySelector('.c-table__th-text')?.textContent?.trim() || key} ` +
                `${isActive ? (this.sortDirection === 'asc' ? 'descendente' : 'ascendente') : 'ascendente'}`
            );
        });
    }

    async loadData() {
        if (this.isLoading || !this.options.apiUrl) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                page_size: this.pageSize,
            });
            
            if (this.sortField) {
                params.set('sort', this.sortField);
                params.set('order', this.sortDirection);
            }
            
            if (this.globalSearchQuery) {
                params.set('q', this.globalSearchQuery);
            }
            
            Object.entries(this.filters).forEach(([key, value]) => {
                params.set(`filter_${key}`, value);
            });
            
            const response = await fetch(`${this.options.apiUrl}?${params}`, {
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            
            this.data = result[this.options.dataKey] || result.data || result.rows || [];
            this.totalRows = result[this.options.totalKey] || result.total || this.data.length;
            this.totalPages = Math.ceil(this.totalRows / this.pageSize);
            
            this.renderTable();
            this.renderPagination();
            
            if (this.options.onDataLoad) {
                this.options.onDataLoad(this.data, { 
                    page: this.currentPage, 
                    pageSize: this.pageSize,
                    total: this.totalRows,
                });
            }
        } catch (err) {
            console.error('[DataTable] Load error:', err);
            this.showError('Error al cargar los datos');
        } finally {
            this.isLoading = false;
        }
    }

    showLoading() {
        if (!this.options.showLoading || !this.tbody) return;
        
        const cols = this.options.columns.length + (this.options.selectable ? 1 : 0) + (this.options.actions ? 1 : 0);
        this.tbody.innerHTML = '';
        
        for (let i = 0; i < this.options.skeletonRows; i++) {
            const tr = document.createElement('tr');
            tr.className = 'c-skeleton c-skeleton--table-row';
            tr.innerHTML = Array(cols).fill('<td><div class="c-skeleton c-skeleton--text" style="height: 1rem; width: 100%;"></div></td>').join('');
            this.tbody.appendChild(tr);
        }
    }

    showError(message) {
        if (!this.tbody) return;
        const cols = this.options.columns.length + (this.options.selectable ? 1 : 0) + (this.options.actions ? 1 : 0);
        this.tbody.innerHTML = `
            <tr class="c-table__empty-row">
                <td colspan="${cols}" class="c-table__empty">
                    <div class="c-empty-state">
                        <svg class="c-empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <h3 class="c-empty-state__title">Error al cargar</h3>
                        <p class="c-empty-state__description">${message}</p>
                        <button class="c-btn c-btn--primary c-btn--sm" onclick="this.closest('[data-table]')._dsDataTable.loadData()">
                            Reintentar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderTable() {
        if (!this.tbody) return;
        
        if (this.options.virtualized) {
            this.renderVirtualized();
        } else {
            this.renderFullTable();
        }
    }

    renderFullTable() {
        if (!this.tbody) return;
        
        if (this.data.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        this.tbody.innerHTML = this.data.map((row, index) => this.renderRow(row, index)).join('');
        this.updateRowSelectionUI();
    }

    renderVirtualized() {
        if (!this.scrollContainer || !this.tbody) return;
        
        const scrollTop = this.scrollContainer.scrollTop;
        const containerHeight = this.scrollContainer.clientHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / this.options.rowHeight) - this.options.bufferRows);
        const endIndex = Math.min(
            this.data.length,
            startIndex + Math.ceil(containerHeight / this.options.rowHeight) + this.options.bufferRows * 2
        );
        
        // Create spacer elements to maintain scroll height
        const totalHeight = this.data.length * this.options.rowHeight;
        const offsetTop = startIndex * this.options.rowHeight;
        
        this.tbody.style.height = `${totalHeight}px`;
        this.tbody.style.position = 'relative';
        
        const visibleRows = this.data.slice(startIndex, endIndex);
        const rowsHtml = visibleRows.map((row, index) => {
            const rowHtml = this.renderRow(row, startIndex + index);
            return `<div style="position: absolute; top: ${(startIndex + index) * this.options.rowHeight}px; width: 100%;">${rowHtml}</div>`;
        }).join('');
        
        this.tbody.innerHTML = rowsHtml;
        this.updateRowSelectionUI();
    }

    renderRow(row, index) {
        const rowKey = row._key || row.id || index;
        const isSelected = this.selectedRows.has(String(rowKey));
        const cols = this.options.columns;
        
        let cellsHtml = '';
        
        // Selection checkbox
        if (this.options.selectable) {
            cellsHtml += `
                <td class="c-table__td c-table__td--select">
                    <label class="c-checkbox c-checkbox--small">
                        <input type="checkbox" class="c-checkbox__input c-table__row-select" value="${rowKey}" ${isSelected ? 'checked' : ''}>
                        <span class="c-checkbox__box" aria-hidden="true">
                            <svg class="c-checkbox__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </span>
                    </label>
                </td>
            `;
        }
        
        // Data columns
        cols.forEach(col => {
            let value = row[col.key] ?? '';
            if (col.render) {
                try {
                    value = col.render(row);
                } catch (_) {}
            }
            
            cellsHtml += `
                <td class="c-table__td" data-key="${col.key}" data-label="${col.label}" style="text-align: ${col.align};">
                    <div class="c-table__cell-content">${value}</div>
                </td>
            `;
        });
        
        // Actions
        if (this.options.actions) {
            cellsHtml += `
                <td class="c-table__td c-table__td--actions">
                    <div class="c-table__actions">${this.renderActions(row)}</div>
                </td>
            `;
        }
        
        return `
            <tr class="c-table__row ${isSelected ? 'c-table__row--selected' : ''}" data-row-key="${rowKey}" tabindex="0">
                ${cellsHtml}
            </tr>
        `;
    }

    renderActions(row) {
        if (!this.options.actions) return '';
        
        return this.options.actions.map(action => {
            const visible = action.visible ? action.visible(row) : true;
            if (!visible) return '';
            
            const props = typeof action.props === 'function' ? action.props(row) : (action.props || {});
            
            if (action.type === 'button') {
                return DesignSystem.createElement('button', {
                    class: `c-btn c-btn--${props.variant || 'ghost'} c-btn--${props.size || 'sm'} ${props.classes || ''}`,
                    text: props.label || '',
                    attributes: { type: 'button', 'aria-label': props.ariaLabel || props.label },
                    on: { click: props.onClick ? () => props.onClick(row) : null },
                }).outerHTML;
            } else if (action.type === 'link') {
                return `<a href="${typeof props.href === 'function' ? props.href(row) : props.href}" 
                    class="c-btn c-btn--link c-btn--sm ${props.classes || ''}" 
                    ${props.target ? `target="${props.target}"` : ''}
                    ${props.rel ? `rel="${props.rel}"` : ''}>
                    ${props.label}
                </a>`;
            } else if (action.type === 'icon') {
                return DesignSystem.createElement('button', {
                    class: `c-btn c-btn--icon c-btn--${props.variant || 'ghost'} c-btn--${props.size || 'sm'} ${props.classes || ''}`,
                    attributes: { type: 'button', 'aria-label': props.ariaLabel || props.label },
                    html: props.icon || '',
                    on: { click: props.onClick ? () => props.onClick(row) : null },
                }).outerHTML;
            }
            return '';
        }).join('');
    }

    renderEmptyState() {
        if (!this.tbody) return;
        const cols = this.options.columns.length + (this.options.selectable ? 1 : 0) + (this.options.actions ? 1 : 0);
        this.tbody.innerHTML = `
            <tr class="c-table__empty-row">
                <td colspan="${cols}" class="c-table__empty">
                    <div class="c-empty-state">
                        <svg class="c-empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                        </svg>
                        <h3 class="c-empty-state__title">No hay datos</h3>
                        <p class="c-empty-state__description">No se encontraron resultados con los filtros actuales</p>
                    </div>
                </td>
            </tr>
        `;
    }

    renderPagination() {
        if (!this.options.paginated || this.totalPages <= 1) {
            this.removePagination();
            return;
        }
        
        let pagination = this.wrapper.querySelector('.c-table__pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'c-table__pagination';
            this.wrapper.appendChild(pagination);
        }
        
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalRows);
        
        let pagesHtml = '';
        if (this.totalPages <= 7) {
            for (let i = 1; i <= this.totalPages; i++) {
                pagesHtml += this.renderPageButton(i);
            }
        } else {
            // First, prev, current±1, next, last
            pagesHtml += this.renderPageButton(1);
            if (this.currentPage > 3) pagesHtml += '<span class="c-pagination__ellipsis">…</span>';
            
            const startPage = Math.max(2, this.currentPage - 1);
            const endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
            for (let i = startPage; i <= endPage; i++) {
                pagesHtml += this.renderPageButton(i);
            }
            
            if (this.currentPage < this.totalPages - 2) pagesHtml += '<span class="c-pagination__ellipsis">…</span>';
            pagesHtml += this.renderPageButton(this.totalPages);
        }
        
        pagination.innerHTML = `
            <div class="c-pagination__info">
                Mostrando ${start}–${end} de ${this.totalRows}
            </div>
            <nav class="c-pagination" aria-label="Paginación">
                <button class="c-btn c-btn--ghost c-btn--sm c-pagination__btn" 
                        data-page="${this.currentPage - 1}" 
                        ${this.currentPage === 1 ? 'disabled' : ''}
                        aria-label="Página anterior">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                ${pagesHtml}
                <button class="c-btn c-btn--ghost c-btn--sm c-pagination__btn" 
                        data-page="${this.currentPage + 1}" 
                        ${this.currentPage === this.totalPages ? 'disabled' : ''}
                        aria-label="Página siguiente">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </nav>
            <div class="c-pagination__size">
                <label for="${this.id}-page-size" class="visually-hidden">Filas por página</label>
                <select id="${this.id}-page-size" data-page-size class="c-select c-select--sm">
                    ${this.options.pageSizeOptions.map(size => 
                        `<option value="${size}" ${size === this.pageSize ? 'selected' : ''}>${size} por página</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }

    renderPageButton(page) {
        const isActive = page === this.currentPage;
        return `
            <button class="c-btn c-btn--${isActive ? 'primary' : 'ghost'} c-btn--sm c-pagination__page" 
                    data-page="${page}" 
                    ${isActive ? 'aria-current="page"' : ''}>
                ${page}
            </button>
        `;
    }

    removePagination() {
        const pagination = this.wrapper.querySelector('.c-table__pagination');
        if (pagination) pagination.remove();
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadData();
        
        if (this.options.onPageChange) {
            this.options.onPageChange(page);
        }
    }

    // Selection methods
    selectRow(key) {
        this.selectedRows.add(String(key));
        this.updateRowSelectionUI();
        if (this.options.onRowSelect) {
            const rowData = this.data.find(d => String(d._key || d.id) === String(key));
            this.options.onRowSelect(rowData, true);
        }
    }

    deselectRow(key) {
        this.selectedRows.delete(String(key));
        this.updateRowSelectionUI();
        if (this.options.onRowSelect) {
            const rowData = this.data.find(d => String(d._key || d.id) === String(key));
            this.options.onRowSelect(rowData, false);
        }
    }

    selectAll() {
        this.data.forEach(row => this.selectedRows.add(String(row._key || row.id)));
        this.updateRowSelectionUI();
    }

    clearSelection() {
        this.selectedRows.clear();
        this.updateRowSelectionUI();
    }

    updateRowSelectionUI() {
        this.tbody?.querySelectorAll('tr[data-row-key]').forEach(tr => {
            const key = tr.dataset.rowKey;
            const isSelected = this.selectedRows.has(key);
            tr.classList.toggle('c-table__row--selected', isSelected);
            const checkbox = tr.querySelector('.c-table__row-select');
            if (checkbox) checkbox.checked = isSelected;
        });
        
        // Update select all checkbox
        const selectAll = this.thead?.querySelector('.c-table__select-all');
        if (selectAll) {
            selectAll.checked = this.selectedRows.size === this.data.length && this.data.length > 0;
            selectAll.indeterminate = this.selectedRows.size > 0 && this.selectedRows.size < this.data.length;
        }
        
        // Update selection bar
        this.updateSelectionBar();
    }

    updateSelectionBar() {
        let bar = this.wrapper.querySelector('.c-table__selection-bar');
        if (this.selectedRows.size > 0) {
            if (!bar) {
                bar = document.createElement('div');
                bar.className = 'c-table__selection-bar';
                this.wrapper.querySelector('.c-table__scroll').after(bar);
            }
            bar.innerHTML = `
                <span class="c-table__selection-count">
                    ${this.selectedRows.size} de ${this.data.length} seleccionadas
                </span>
                <div class="c-table__selection-actions">
                    <button type="button" class="c-btn c-btn--ghost c-btn--sm" onclick="this.closest('[data-table]')._dsDataTable.clearSelection()">
                        Limpiar selección
                    </button>
                </div>
            `;
        } else if (bar) {
            bar.remove();
        }
    }

    handleKeydown(e) {
        if (!this.options.virtualized) return;
        
        const focusedRow = this.tbody?.querySelector('tr.c-table__row:focus');
        if (!focusedRow) return;
        
        const currentIndex = this.data.findIndex(r => String(r._key || r.id) === focusedRow.dataset.rowKey);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusRow(currentIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusRow(currentIndex - 1);
                break;
            case 'Home':
                e.preventDefault();
                this.focusRow(0);
                break;
            case 'End':
                e.preventDefault();
                this.focusRow(this.data.length - 1);
                break;
            case 'Enter':
            case ' ':
                if (this.options.onRowClick) {
                    const rowData = this.data[currentIndex];
                    if (rowData) this.options.onRowClick(rowData, focusedRow);
                }
                break;
        }
    }

    focusRow(index) {
        if (index < 0 || index >= this.data.length) return;
        const row = this.data[index];
        const rowKey = String(row._key || row.id);
        const rowEl = this.tbody?.querySelector(`tr[data-row-key="${rowKey}"]`);
        if (rowEl) {
            rowEl.focus();
            rowEl.scrollIntoView({ block: 'nearest' });
        }
    }

    renderSkeleton() {
        if (!this.options.showLoading) return;
        this.showLoading();
    }

    refresh() {
        this.currentPage = 1;
        this.loadData();
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}

// Client-side DataTable for static data (no API)
export class ClientDataTable extends DataTable {
    constructor(wrapper, options = {}) {
        super(wrapper, { ...options, apiUrl: null });
    }

    init() {
        this.collectColumns();
        this.bindEvents();
        this.data = this.extractDataFromDOM();
        this.totalRows = this.data.length;
        this.renderTable();
        this.renderPagination();
    }

    loadData() {
        // Client-side filtering/sorting
        let filtered = [...this.data];
        
        // Apply global search
        if (this.globalSearchQuery) {
            const query = this.globalSearchQuery.toLowerCase();
            filtered = filtered.filter(row => 
                Object.values(row).some(v => 
                    String(v).toLowerCase().includes(query)
                )
            );
        }
        
        // Apply column filters
        Object.entries(this.filters).forEach(([key, value]) => {
            filtered = filtered.filter(row => String(row[key] ?? '').toLowerCase().includes(value.toLowerCase()));
        });
        
        // Apply sorting
        if (this.sortField) {
            filtered.sort((a, b) => {
                const aVal = a[this.sortField];
                const bVal = b[this.sortField];
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
                return this.sortDirection === 'asc' ? cmp : -cmp;
            });
        }
        
        this.totalRows = filtered.length;
        this.totalPages = Math.ceil(this.totalRows / this.pageSize);
        
        // Paginate
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.data = filtered.slice(start, end);
        
        this.renderTable();
        this.renderPagination();
    }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
    const initDataTables = () => {
        document.querySelectorAll('[data-table]:not([data-table-lazy])').forEach(wrapper => {
            if (!wrapper._dsDataTable) {
                try {
                    const isServerSide = wrapper.dataset.tableApi !== undefined;
                    const TableClass = isServerSide ? DataTable : ClientDataTable;
                    wrapper._dsDataTable = new TableClass(wrapper);
                } catch (err) {
                    console.error('[DataTable] Init error:', err);
                }
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDataTables);
    } else {
        initDataTables();
    }

    // Register with DesignSystem
    if (window.DesignSystem) {
        window.DesignSystem.registerComponent('data-table', DataTable, {
            selector: '[data-table]:not([data-table-lazy])',
        });
        window.DesignSystem.DataTable = DataTable;
        window.DesignSystem.ClientDataTable = ClientDataTable;
    }
}

export default DataTable;
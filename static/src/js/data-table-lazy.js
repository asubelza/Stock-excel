/* ==========================================================================
   ECJY Design System — Data Table Lazy Loader
   ==========================================================================
   Lazy loads the data-table chunk via IntersectionObserver when table
   enters viewport. Reduces initial bundle size by deferring heavy component.
   ========================================================================== */

export class DataTableLazyLoader {
  /**
   * @param {Object} options
   * @param {string} options.selector - Selector for table wrappers (default: '[data-table-lazy]')
   * @param {number} options.rootMargin - IntersectionObserver rootMargin (default: '200px')
   * @param {number} options.threshold - IntersectionObserver threshold (default: 0.01)
   * @param {Function} options.onLoad - Callback when data-table module loads
   */
  constructor(options = {}) {
    this.options = {
      selector: '[data-table-lazy]',
      rootMargin: '200px',
      threshold: 0.01,
      onLoad: null,
      ...options,
    };

    this.observer = null;
    this.loaded = false;
    this.loading = false;
  }

  /**
   * Initialize the lazy loader
   */
  init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load immediately if IntersectionObserver not supported
      this.loadDataTable();
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loaded && !this.loading) {
          this.loadDataTable();
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold,
    });

    // Observe all matching elements
    document.querySelectorAll(this.options.selector).forEach(el => {
      this.observer.observe(el);
    });

    // Also handle dynamically added elements
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches(this.options.selector)) {
              this.observer.observe(node);
            }
            node.querySelectorAll(this.options.selector).forEach(el => {
              this.observer.observe(el);
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
    this._mutationObserver = mutationObserver;
  }

  /**
   * Dynamically import and initialize data-table
   */
  async loadDataTable() {
    if (this.loaded || this.loading) return;
    this.loading = true;

    try {
      // Dynamic import - Vite will create a separate chunk
      const { DataTable, ClientDataTable } = await import(
        /* webpackChunkName: "data-table" */
        './components/data-table.js'
      );

      this.loaded = true;
      this.loading = false;

      // Disconnect observer since we're loaded
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
      }

      // Initialize data tables that were waiting
      document.querySelectorAll(this.options.selector).forEach(wrapper => {
        if (!wrapper._dsDataTable) {
          try {
            const isServerSide = wrapper.dataset.tableApi !== undefined;
            const TableClass = isServerSide ? DataTable : ClientDataTable;
            wrapper._dsDataTable = new TableClass(wrapper);
          } catch (err) {
            console.error('[DataTableLazyLoader] Init error:', err);
          }
        }
      });

      // Call optional callback
      if (this.options.onLoad) {
        this.options.onLoad({ DataTable, ClientDataTable });
      }

      // Dispatch event
      window.dispatchEvent(new CustomEvent('ecjy:data-table-loaded', {
        detail: { DataTable, ClientDataTable }
      }));

    } catch (err) {
      this.loading = false;
      console.error('[DataTableLazyLoader] Failed to load data-table:', err);
    }
  }

  /**
   * Manually trigger load (e.g., on user interaction)
   */
  triggerLoad() {
    this.loadDataTable();
  }

  /**
   * Clean up observers
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
  }
}

// Auto-initialize if lazy tables exist
if (typeof window !== 'undefined') {
  const initLazyLoader = () => {
    const lazyTables = document.querySelectorAll('[data-table-lazy]');
    if (lazyTables.length > 0) {
      window.DataTableLazyLoader = new DataTableLazyLoader();
      window.DataTableLazyLoader.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyLoader);
  } else {
    initLazyLoader();
  }
}

export default DataTableLazyLoader;
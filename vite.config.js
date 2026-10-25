import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Manual chunks configuration for optimal bundle splitting
 * - vendor: Core dependencies (rarely change, long-term cache)
 * - components: UI components (change occasionally)
 * - data-table: Heavy data table component (lazy loaded)
 * Stable hashes via content-based naming for long-term caching
 */
const manualChunks = {
  'vendor': [
    // Core utilities - stable, rarely updated
  ],
  'components': [
    './src/js/components/dropdown.js',
    './src/js/components/modal.js',
    './src/js/components/modal-htmx.js',
    './src/js/components/side-nav.js',
    './src/js/components/form-validation.js',
    './src/js/components/autocomplete.js',
  ],
  'data-table': [
    './src/js/components/data-table.js',
  ],
};

export default defineConfig({
  root: 'static',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    lib: {
      entry: 'src/main.js',
      name: 'DesignSystem',
      fileName: 'main',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunk splitting with stable content-based hashes
        manualChunks: (id) => {
          // Vendor chunk - node_modules (external deps if any)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Data-table chunk - lazy loaded via IntersectionObserver
          if (id.includes('data-table.js')) {
            return 'data-table';
          }
          // Components chunk - UI components
          if (id.includes('/components/') && !id.includes('data-table.js')) {
            return 'components';
          }
          // Main entry stays as main
          return null;
        },
      },
    },
    cssCodeSplit: true,
    minify: isProduction ? 'esbuild' : false,
    // Bundle size budget warnings (in KB, gzipped)
    // vendor+components ≤60KB gz, data-table ≤35KB gz
    reportCompressedSize: true,
    chunkSizeWarningLimit: 60,
  },
  server: {
    port: 5173,
    proxy: {
      '/': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  // Define bundle size budgets for CI verification
  define: {
    __BUNDLE_BUDGETS__: JSON.stringify({
      'vendor': 60,      // KB gzipped
      'components': 60,  // KB gzipped (combined with vendor)
      'data-table': 35,  // KB gzipped
    }),
  },
});
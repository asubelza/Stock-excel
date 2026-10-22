/* ==========================================================================
   Post-build script: Generate preload hints from Vite manifest
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('static/dist/.vite/manifest.json');
const outputPath = path.resolve('templates/_preload_hints.html');

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const mainEntry = manifest['src/main.js'];
  
  if (!mainEntry) {
    console.warn('No main entry found in manifest');
    process.exit(0);
  }

  const chunks = [];
  const excludedChunks = ['data-table']; // Don't preload lazy-loaded chunks
  
  // Main entry (always preload)
  if (mainEntry.file) {
    chunks.push({
      file: mainEntry.file,
      type: 'modulepreload',
      as: 'script',
    });
  }
  
  // CSS for main entry
  if (mainEntry.css && mainEntry.css.length > 0) {
    mainEntry.css.forEach(cssFile => {
      chunks.push({
        file: cssFile,
        type: 'preload',
        as: 'style',
      });
    });
  }
  
  // Imported chunks (vendor, components) - exclude lazy-loaded
  if (mainEntry.imports) {
    mainEntry.imports.forEach(importName => {
      // Skip excluded chunks
      if (excludedChunks.some(ex => importName.includes(ex))) {
        return;
      }
      const imported = manifest[importName];
      if (imported && imported.file) {
        chunks.push({
          file: imported.file,
          type: 'modulepreload',
          as: 'script',
        });
        if (imported.css) {
          imported.css.forEach(cssFile => {
            chunks.push({
              file: cssFile,
              type: 'preload',
              as: 'style',
            });
          });
        }
      }
    });
  }
  
  // Generate HTML
  const staticUrl = '{{ url_for(\'static\', filename=\'dist/\') }}';
  const hints = chunks.map(chunk => {
    const href = `${staticUrl}${chunk.file}`;
    if (chunk.type === 'modulepreload') {
      return `<link rel="modulepreload" href="${href}">`;
    } else {
      return `<link rel="preload" as="${chunk.as}" href="${href}">`;
    }
  }).join('\n    ');
  
  const html = `{# Auto-generated preload hints from Vite manifest #}\n    ${hints}\n`;
  
  fs.writeFileSync(outputPath, html);
  console.log(`Generated preload hints: ${outputPath}`);
  
} catch (err) {
  console.error('Failed to generate preload hints:', err.message);
  process.exit(1);
}
/* ==========================================================================
   Post-build script: Copy hashed CSS to main.css for template compatibility
   ========================================================================== */

import fs from 'fs';
import path from 'path';

const distDir = path.resolve('static/dist/assets');

try {
  // Read manifest to find the CSS file
  const manifestPath = path.resolve('static/dist/.vite/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Find the CSS file for the main entry
  const mainEntry = manifest['src/main.js'];
  if (mainEntry && mainEntry.css && mainEntry.css.length > 0) {
    const cssFile = mainEntry.css[0]; // e.g., "assets/style-DoQjSgAq.css"
    const cssFileName = path.basename(cssFile); // e.g., "style-DoQjSgAq.css"
    const srcPath = path.join(distDir, cssFileName);
    const destPath = path.join(distDir, 'main.css');

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${cssFileName} to main.css`);
    } else {
      console.warn(`⚠ Source CSS not found: ${srcPath}`);
    }
  } else {
    console.warn('⚠ No CSS entry found in manifest');
  }
} catch (err) {
  console.error('✗ Failed to copy CSS:', err.message);
  process.exit(1);
}
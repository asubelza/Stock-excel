const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEMPLATES = [
  { path: '/stock/', name: 'stock' },
  { path: '/stock/historico', name: 'historico' },
  { path: '/stock/entrada', name: 'entrada' },
  { path: '/stock/salida', name: 'salida' },
  { path: '/stock/proveedores', name: 'proveedores' },
  { path: '/stock/clientes', name: 'clientes' },
  { path: '/stock/usuarios', name: 'usuarios' },
  { path: '/stock/nueva_entrada', name: 'nueva_entrada' },
  { path: '/stock/nueva_salida', name: 'nueva_salida' },
  { path: '/stock/nuevo_producto', name: 'nuevo_producto' },
  { path: '/stock/nuevo_proveedor', name: 'nuevo_proveedor' },
  { path: '/stock/nuevo_cliente', name: 'nuevo_cliente' },
  { path: '/stock/importar_excel', name: 'importar' },
  { path: '/stock/login', name: 'login' },
];

const THRESHOLDS = {
  performance: 90,
  'first-contentful-paint': 1800, // ms
  'largest-contentful-paint': 2500, // ms
  'total-blocking-time': 200, // ms
  'cumulative-layout-shift': 0.1,
};

async function login(page) {
  await page.goto(`${BASE_URL}/stock/login?design=new`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/stock/');
  await page.waitForLoadState('networkidle');
}

async function runLighthouse(url, config = {}) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
    ...config,
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  return runnerResult.lhr;
}

async function checkBundleSizes() {
  const distDir = path.join(__dirname, '..', 'static', 'dist', 'assets');
  const files = fs.readdirSync(distDir);
  
  let cssFile = null;
  let jsFile = null;
  
  for (const file of files) {
    if (file.endsWith('.css')) cssFile = file;
    if (file.endsWith('.js')) jsFile = file;
  }
  
  const results = {};
  
  if (cssFile) {
    const cssPath = path.join(distDir, cssFile);
    const stats = fs.statSync(cssPath);
    const gzipped = require('zlib').gzipSync(fs.readFileSync(cssPath));
    results.css = {
      file: cssFile,
      size: stats.size,
      gzipped: gzipped.length,
      passes: gzipped.length < 50 * 1024, // 50KB
    };
  }
  
  if (jsFile) {
    const jsPath = path.join(distDir, jsFile);
    const stats = fs.statSync(jsPath);
    const gzipped = require('zlib').gzipSync(fs.readFileSync(jsPath));
    results.js = {
      file: jsFile,
      size: stats.size,
      gzipped: gzipped.length,
      passes: gzipped.length < 100 * 1024, // 100KB
    };
  }
  
  return results;
}

async function runPerformanceTests() {
  console.log('=== ECJY Visual System - Performance Tests ===\n');
  
  // Check bundle sizes first
  console.log('Checking bundle sizes...');
  const bundleSizes = await checkBundleSizes();
  
  if (bundleSizes.css) {
    console.log(`CSS: ${bundleSizes.css.file} - ${(bundleSizes.css.size / 1024).toFixed(1)}KB raw, ${(bundleSizes.css.gzipped / 1024).toFixed(1)}KB gzipped ${bundleSizes.css.passes ? '✅' : '❌'}`);
  }
  if (bundleSizes.js) {
    console.log(`JS: ${bundleSizes.js.file} - ${(bundleSizes.js.size / 1024).toFixed(1)}KB raw, ${(bundleSizes.js.gzipped / 1024).toFixed(1)}KB gzipped ${bundleSizes.js.passes ? '✅' : '❌'}`);
  }
  
  const allResults = {};
  let allPassed = true;
  
  for (const template of TEMPLATES) {
    const url = `${BASE_URL}${template.path}?design=new`;
    console.log(`\nTesting ${template.name} (${url})...`);
    
    try {
      const lhr = await runLighthouse(url);
      const scores = {};
      
      for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
        const audit = lhr.audits[metric];
        let value = audit?.numericValue;
        let passes = false;
        
        if (metric === 'performance') {
          value = audit?.score * 100;
          passes = value >= threshold;
        } else if (metric === 'cumulative-layout-shift') {
          passes = value <= threshold;
        } else {
          passes = value <= threshold;
        }
        
        scores[metric] = { value, threshold, passes };
        console.log(`  ${metric}: ${typeof value === 'number' ? value.toFixed(0) : value} (threshold: ${threshold}) ${passes ? '✅' : '❌'}`);
        
        if (!passes) allPassed = false;
      }
      
      // Check for render-blocking resources
      const renderBlocking = lhr.audits['render-blocking-resources'];
      if (renderBlocking) {
        console.log(`  render-blocking-resources: ${renderBlocking.numericValue}ms ${renderBlocking.numericValue === 0 ? '✅' : '❌'}`);
        if (renderBlocking.numericValue > 0) allPassed = false;
      }
      
      allResults[template.name] = { scores, lhr };
      
    } catch (error) {
      console.error(`  ERROR: ${error.message}`);
      allPassed = false;
    }
  }
  
  // Save results
  const resultsDir = path.join(__dirname, 'lighthouse-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(resultsDir, `results-${Date.now()}.json`),
    JSON.stringify({ bundleSizes, allResults, passed: allPassed }, null, 2)
  );
  
  console.log(`\n=== Summary ===`);
  console.log(`Bundle sizes: ${bundleSizes.css?.passes && bundleSizes.js?.passes ? 'PASS' : 'FAIL'}`);
  console.log(`Lighthouse: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Overall: ${allPassed && bundleSizes.css?.passes && bundleSizes.js?.passes ? 'PASS ✅' : 'FAIL ❌'}`);
  
  return { bundleSizes, allResults, passed: allPassed && bundleSizes.css?.passes && bundleSizes.js?.passes };
}

// Run if executed directly
if (require.main === module) {
  runPerformanceTests()
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests, checkBundleSizes };
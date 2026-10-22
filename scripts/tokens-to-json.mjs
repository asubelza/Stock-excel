// ECJY Design System — Token Parser: tokens.css -> tokens.json
// Parses CSS custom properties from tokens.css and extracts:
// - Token name, value, category, description, type
// - Generates tokens.json for documentation site
// - Supports metadata comments: /* @token { category: 'color', description: '...' } */

import fs from 'fs';
import path from 'path';
import postcss from 'postcss';

const TOKENS_CSS_PATH = path.resolve('static/src/css/tokens.css');
const OUTPUT_JSON_PATH = path.resolve('scripts/tokens.json');
const OUTPUT_META_PATH = path.resolve('scripts/tokens-meta.json');

/**
 * Category detection based on token prefix
 */
function detectCategory(tokenName) {
  if (tokenName.startsWith('color-')) return 'color';
  if (tokenName.startsWith('font-') || tokenName.startsWith('letter-spacing') || tokenName.startsWith('line-height')) return 'typography';
  if (tokenName.startsWith('space-') || tokenName.startsWith('space-')) return 'spacing';
  if (tokenName.startsWith('radius-')) return 'border-radius';
  if (tokenName.startsWith('shadow-')) return 'shadow';
  if (tokenName.startsWith('duration-') || tokenName.startsWith('easing-') || tokenName.startsWith('transition-')) return 'animation';
  if (tokenName.startsWith('z-index-') || tokenName.startsWith('breakpoint-')) return 'layout';
  if (tokenName.startsWith('btn-') || tokenName.startsWith('input-') || tokenName.startsWith('table-') ||
      tokenName.startsWith('card-') || tokenName.startsWith('badge-') || tokenName.startsWith('modal-') ||
      tokenName.startsWith('toast-') || tokenName.startsWith('header-') || tokenName.startsWith('sidebar-') ||
      tokenName.startsWith('container-')) return 'component';
  if (tokenName.startsWith('legacy-')) return 'legacy';
  return 'other';
}

/**
 * Extract metadata from comment nodes
 */
function extractMetadata(comment) {
  const text = comment.text;
  const metaMatch = text.match(/@token\s+\{([^}]+)\}/);
  if (!metaMatch) return null;
  
  try {
    // Parse the metadata object (simple key: 'value' format)
    const metaStr = '{' + metaMatch[1] + '}';
    return JSON.parse(metaStr.replace(/(\w+):/g, '"$1":'));
  } catch (_) {
    return null;
  }
}

/**
 * Format token name for display
 */
function formatDisplayName(tokenName) {
  return tokenName
    .replace(/-/g, ' ')
    .replace(/\b(\w)/g, c => c.toUpperCase())
    .replace(/\b([A-Z])([A-Z]+)\b/g, (_, a, b) => a + b.toLowerCase());
}

/**
 * Get token type from value
 */
function getTokenType(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('var(')) return 'reference';
  if (trimmed.match(/^#[0-9a-fA-F]{3,8}$/)) return 'color';
  if (trimmed.match(/^\d+(\.\d+)?(px|rem|em|%|vh|vw)$/)) return 'dimension';
  if (trimmed.match(/^\d+(\.\d+)?(ms|s)$/)) return 'duration';
  if (trimmed.match(/^cubic-bezier\(/)) return 'easing';
  if (trimmed.match(/^(rgba?|hsla?)\(/)) return 'color';
  if (trimmed.match(/^\d+(\.\d+)?$/)) return 'number';
  if (trimmed.startsWith('clamp(')) return 'fluid';
  return 'string';
}

/**
 * Main parser function
 */
async function parseTokens() {
  const css = fs.readFileSync(TOKENS_CSS_PATH, 'utf-8');
  
  const tokens = [];
  const categories = new Set();
  
  // Parse with PostCSS to get AST with comments
  const root = postcss.parse(css);
  
  // Process :root rule with custom properties
  root.walkRules(':root', rule => {
    rule.walkDecls(decl => {
      if (decl.prop.startsWith('--')) {
        const tokenName = decl.prop.slice(2); // Remove '--'
        const value = decl.value.trim();
        const category = detectCategory(tokenName);
        
        // Look for metadata comment before this declaration
        let description = '';
        let metadata = {};
        
        let prev = decl.prev();
        while (prev && prev.type === 'comment') {
          const meta = extractMetadata(prev);
          if (meta) {
            description = meta.description || '';
            metadata = meta;
            break;
          }
          prev = prev.prev();
        }
        
        // If no explicit description, generate from token name
        if (!description) {
          description = `${formatDisplayName(tokenName)} design token`;
        }
        
        tokens.push({
          name: tokenName,
          cssVar: decl.prop,
          value: value,
          category: category,
          type: getTokenType(value),
          description: description,
          displayName: formatDisplayName(tokenName),
          deprecated: metadata.deprecated === true,
          ...metadata,
        });
      }
    });
  });
  
  // Process dark mode media query
  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('prefers-color-scheme: dark')) {
      atRule.walkDecls(decl => {
        if (decl.prop.startsWith('--')) {
          const tokenName = decl.prop.slice(2);
          const value = decl.value.trim();
          
          // Find matching light token and add dark value
          const existing = tokens.find(t => t.name === tokenName);
          if (existing) {
            existing.darkValue = value;
            existing.hasDarkMode = true;
          } else {
            tokens.push({
              name: tokenName,
              cssVar: decl.prop,
              value: value,
              category: detectCategory(tokenName),
              type: getTokenType(value),
              description: `Dark mode: ${formatDisplayName(tokenName)}`,
              displayName: formatDisplayName(tokenName) + ' (Dark)',
              darkModeOnly: true,
            });
          }
        }
      });
    }
  });
  
  // Process forced-colors media query (high contrast mode)
  root.walkAtRules('media', atRule => {
    if (atRule.params.includes('forced-colors: active')) {
      atRule.walkDecls(decl => {
        if (decl.prop.startsWith('--')) {
          const tokenName = decl.prop.slice(2);
          const value = decl.value.trim();
          
          const existing = tokens.find(t => t.name === tokenName);
          if (existing) {
            existing.highContrastValue = value;
            existing.hasHighContrast = true;
          }
        }
      });
    }
  });
  
  // Sort tokens: categories first, then alphabetical
  const categoryOrder = [
    'color', 'typography', 'spacing', 'border-radius', 'shadow', 
    'animation', 'layout', 'component', 'legacy', 'other'
  ];
  
  tokens.sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.name.localeCompare(b.name);
  });
  
  // Collect unique categories from tokens
  tokens.forEach(t => categories.add(t.category));
  
  // Generate category metadata
  const categoryMeta = {};
  categories.forEach(cat => {
    categoryMeta[cat] = {
      name: cat,
      displayName: formatDisplayName(cat),
      tokenCount: tokens.filter(t => t.category === cat).length,
    };
  });
  
  // Write tokens.json
  const output = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    source: 'tokens.css',
    tokens: tokens,
    categories: categoryMeta,
    stats: {
      total: tokens.length,
      byCategory: Object.fromEntries(
        Object.entries(categoryMeta).map(([k, v]) => [k, v.tokenCount])
      ),
      withDarkMode: tokens.filter(t => t.hasDarkMode).length,
      withHighContrast: tokens.filter(t => t.hasHighContrast).length,
      deprecated: tokens.filter(t => t.deprecated).length,
    },
  };
  
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2));
  console.log(`Generated ${OUTPUT_JSON_PATH} with ${tokens.length} tokens`);
  
  // Write simplified meta for docs (name, value, category, description)
  const metaOutput = tokens.map(t => ({
    name: t.name,
    cssVar: t.cssVar,
    value: t.value,
    darkValue: t.darkValue || null,
    highContrastValue: t.highContrastValue || null,
    category: t.category,
    type: t.type,
    description: t.description,
    displayName: t.displayName,
    deprecated: t.deprecated,
  }));
  
  fs.writeFileSync(OUTPUT_META_PATH, JSON.stringify(metaOutput, null, 2));
  console.log(`Generated ${OUTPUT_META_PATH}`);
  
  // Print summary
  console.log('\nToken Summary:');
  Object.entries(categoryMeta).forEach(([cat, meta]) => {
    console.log(`  ${meta.displayName}: ${meta.tokenCount} tokens`);
  });
  console.log(`  Total: ${tokens.length} tokens`);
  console.log(`  With dark mode: ${output.stats.withDarkMode}`);
  console.log(`  With high contrast: ${output.stats.withHighContrast}`);
  console.log(`  Deprecated: ${output.stats.deprecated}`);
}

// Run parser
parseTokens().catch(err => {
  console.error('Token parsing failed:', err);
  process.exit(1);
});
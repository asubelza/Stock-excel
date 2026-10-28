'use strict';

/**
 * tokens-to-json.js
 *
 * Parses static/src/css/tokens.css and generates human-readable design-token
 * documentation (JSON + Markdown) under docs/.
 *
 * Token values are NOT changed — this script is descriptive only.
 *
 * Output:
 *   docs/tokens.json   { category: { tokenName: { name, value, description, type, darkValue? } } }
 *   docs/tokens.md     Human-readable token reference (name, value, category, usage, dark value)
 *
 * Runs with plain Node (no external dependencies).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_PATH = path.join(ROOT, 'static/src/css/tokens.css');
const OUT_DIR = path.join(ROOT, 'docs');
const OUT_JSON = path.join(OUT_DIR, 'tokens.json');
const OUT_MD = path.join(OUT_DIR, 'tokens.md');

/*
 * Category prefixes recognised from the custom-property name, used as a
 * fallback when no @token comment supplies a category.
 */
const PREFIX_CATEGORY = {
  color: 'color',
  space: 'spacing',
  font: 'font',
  radius: 'radius',
  shadow: 'shadow',
  transition: 'transition',
  easing: 'transition',
  duration: 'transition',
  'z-index': 'z',
  breakpoint: 'breakpoint',
  'line-height': 'font',
  'letter-spacing': 'font',
  btn: 'component',
  input: 'component',
  table: 'component',
  card: 'component',
  badge: 'component',
  modal: 'component',
  toast: 'component',
  header: 'layout',
  sidebar: 'layout',
  container: 'layout',
  legacy: 'legacy',
};

/**
 * Parse an @token { category: '...', description: '...' } comment block.
 * Returns { category, description } or null.
 */
function parseTokenMeta(comment) {
  const m = comment.match(/@token\s*\{([^}]*)\}/);
  if (!m) return null;
  const body = m[1];
  const cat = body.match(/category:\s*['"]([^'"]+)['"]/);
  const desc = body.match(/description:\s*['"]([^'"]+)['"]/);
  return {
    category: cat ? cat[1] : 'uncategorized',
    description: desc ? desc[1] : '',
  };
}

/**
 * Selector text immediately preceding a '{' at bracePos, scanning backwards
 * past whitespace and nested block comments until '}', ';', '{' or EOF.
 */
function selectorBefore(css, bracePos) {
  let j = bracePos - 1;
  const buf = [];
  while (j >= 0) {
    const ch = css[j];
    if (ch === '}' || ch === ';' || ch === '{') break;
    if (ch === '/' && j - 1 >= 0 && css[j - 1] === '*') {
      const commentStart = css.lastIndexOf('/*', j - 1);
      if (commentStart === -1) break;
      j = commentStart - 1;
      continue;
    }
    buf.push(ch);
    j--;
  }
  return buf.reverse().join('').trim();
}

/**
 * Current documentation context from the block stack:
 * nearest media query wins, else root-dark, else light.
 */
function contextFromStack(blockStack) {
  for (let k = blockStack.length - 1; k >= 0; k--) {
    const b = blockStack[k];
    if (b === 'media-reduced') return 'reduced-motion';
    if (b === 'media-forced') return 'forced-colors';
  }
  if (blockStack.includes('root-dark')) return 'dark';
  return 'light';
}

/**
 * Infer a token value type for documentation purposes.
 */
function inferType(value) {
  if (/^#([0-9a-fA-F]{3,8})$/.test(value) || /^rgba?\(/.test(value)) return 'color';
  if (/^var\(/.test(value)) return 'reference';
  if (/cubic-bezier|ease-(in|out|in-out)/.test(value)) return 'easing';
  if (/^clamp\(/.test(value)) return 'fluid-size';
  if (/^\d+(\.\d+)?(px|rem|em|%|ch|ex)$/.test(value) || value === '0' || value === 'none') return 'length';
  if (/^\d+(\.\d+)?(ms|s)$/.test(value)) return 'time';
  if (/^\d+$/.test(value)) return 'number';
  if (value.includes(',')) return 'shadow';
  return 'string';
}

/**
 * Category for a token name: use @token metadata when available, otherwise
 * infer from the custom-property name prefix.
 */
function categoryFor(name, metaCategory) {
  if (metaCategory) return metaCategory;
  const lower = name.toLowerCase();
  for (const [prefix, category] of Object.entries(PREFIX_CATEGORY)) {
    if (lower.startsWith(prefix)) return category;
  }
  return 'uncategorized';
}

/**
 * Parse tokens.css into light-mode token entries and dark-mode overrides.
 */
function parseTokens(css) {
  // Normalize line endings (CRLF -> LF) so values are platform-independent.
  css = css.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const len = css.length;
  let i = 0;
  let depth = 0;
  const blockStack = []; // labels: root-light | root-dark | media-reduced | media-forced | other
  let pendingMeta = null; // {category, description} from the last @token comment

  const light = {};   // name -> {value, category, description, type}
  const dark = {};    // name -> value (dark-mode overrides)

  while (i < len) {
    const ch = css[i];

    /* ---- CSS comment (may carry @token metadata) ---- */
    if (ch === '/' && i + 1 < len && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      const comment = css.slice(i, end + 2);
      const meta = parseTokenMeta(comment);
      if (meta) pendingMeta = meta;
      i = end + 2;
      continue;
    }

    /* ---- opening brace -> push block context ---- */
    if (ch === '{') {
      depth++;
      const sel = selectorBefore(css, i);
      let label = 'other';
      if (/\[data-theme="dark"\]/.test(sel)) label = 'root-dark';
      else if (/^:root\b/.test(sel)) label = 'root-light';
      else if (/prefers-reduced-motion:\s*reduce/.test(sel)) label = 'media-reduced';
      else if (/forced-colors:\s*active/.test(sel)) label = 'media-forced';
      blockStack.push(label);
      i++;
      continue;
    }

    /* ---- closing brace -> pop block context ---- */
    if (ch === '}') {
      depth--;
      blockStack.pop();
      i++;
      continue;
    }

    /* ---- custom-property declaration --name: value; ---- */
    if (depth >= 1 && ch === '-' && i + 1 < len && css[i + 1] === '-') {
      const m = css.slice(i).match(/^(\-\-[a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;]*?)\s*;/);
      if (m) {
        const name = m[1].slice(2); // strip leading '--'
        const value = m[2].trim();
        const context = contextFromStack(blockStack);
        const entry = {
          value,
          category: categoryFor(name, pendingMeta ? pendingMeta.category : null),
          description: pendingMeta ? pendingMeta.description : '',
          type: inferType(value),
        };
        if (context === 'dark') {
          dark[name] = value;
        } else if (context === 'light') {
          light[name] = entry;
          // Keep pendingMeta until the next @token comment replaces it, so the
          // whole token group shares the same category/description.
        }
        i += m[0].length;
        continue;
      }
    }

    i++;
  }

  return { light, dark };
}

/**
 * Build the structured output JSON from light tokens + dark overrides.
 */
function buildJson(light, dark) {
  const result = {};
  for (const [name, entry] of Object.entries(light)) {
    const category = entry.category;
    if (!result[category]) result[category] = {};
    const token = {
      name: `--${name}`,
      value: entry.value,
      description: entry.description,
      type: entry.type,
    };
    if (Object.prototype.hasOwnProperty.call(dark, name) && dark[name] !== entry.value) {
      token.darkValue = dark[name];
    }
    result[category][name] = token;
  }
  return result;
}

/**
 * Render human-readable Markdown documentation.
 */
function renderMarkdown(json) {
  const lines = [];
  // Display labels aligned with the spec's token categories (FR-TD-01).
  const CATEGORY_LABEL = {
    color: 'Color tokens',
    spacing: 'Spacing tokens',
    typography: 'Typography tokens',
    'border-radius': 'Radius tokens',
    shadow: 'Shadow tokens',
    animation: 'Transition tokens',
    layout: 'Z-index tokens',
    component: 'Component tokens',
    legacy: 'Legacy tokens',
    'uncategorized': 'Other tokens',
  };
  lines.push('# ECJY Design Tokens');
  lines.push('');
  lines.push(
    'Single source of truth: `static/src/css/tokens.css`. This documentation is '
    + 'generated and descriptive only — token values are **unchanged** from the '
    + 'source CSS.'
  );
  lines.push('');
  lines.push('## Token reference');
  lines.push('');

  const categoryOrder = ['color', 'spacing', 'font', 'radius', 'shadow', 'transition', 'z', 'breakpoint', 'layout', 'component', 'legacy', 'uncategorized'];
  const categories = Object.keys(json).sort((a, b) => {
    let ia = categoryOrder.indexOf(a);
    let ib = categoryOrder.indexOf(b);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    return ia - ib || a.localeCompare(b);
  });

  let total = 0;
  for (const category of categories) {
    const tokens = json[category];
    const names = Object.keys(tokens).sort();
    total += names.length;
    lines.push(`### ${CATEGORY_LABEL[category] || category} (${names.length})`);
    lines.push('');
    lines.push('| Token | Value | Type | Usage / Description | Dark value |');
    lines.push('|-------|-------|------|---------------------|------------|');
    for (const name of names) {
      const t = tokens[name];
      const usage = t.description || '—';
      const dark = t.darkValue ? `\`${t.darkValue}\`` : '—';
      lines.push(`|\`--${name}\`|\`${t.value}\`|${t.type}|${usage}|${dark}|`);
    }
    lines.push('');
  }
  lines.push(`**Total tokens documented: ${total}**`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Generated by `scripts/tokens-to-json.js`. Re-run after editing `static/src/css/tokens.css` to keep docs in sync.*');
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(CSS_PATH)) {
    console.error(`ERROR: source not found: ${CSS_PATH}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const css = fs.readFileSync(CSS_PATH, 'utf8');
  const { light, dark } = parseTokens(css);
  const json = buildJson(light, dark);

  fs.writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUT_MD, renderMarkdown(json), 'utf8');

  const lightCount = Object.keys(light).length;
  const darkCount = Object.keys(dark).length;
  const total = Object.values(json).reduce((sum, cat) => sum + Object.keys(cat).length, 0);
  console.log(`Parsed ${CSS_PATH}`);
  console.log(`  light-mode tokens: ${lightCount}`);
  console.log(`  dark-mode overrides: ${darkCount}`);
  console.log(`  total documented: ${total}`);
  console.log(`  wrote ${OUT_JSON}`);
  console.log(`  wrote ${OUT_MD}`);
}

main();

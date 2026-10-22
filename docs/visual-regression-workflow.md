# Visual Regression Local Developer Workflow (VR-06)

## Overview

This document describes how to run visual regression tests locally, update baselines, and tune false positives.

## Prerequisites

1. **Node.js 18+** and **pnpm** installed
2. **Python 3.10+** with Flask dependencies (`pip install -r requirements.txt`)
3. **Playwright browsers** installed: `pnpm exec playwright install`

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install chromium firefox

# Start Flask application (in separate terminal)
DESIGN_SYSTEM_ENABLED=true python web_app.py

# Run visual regression comparison (CI mode)
pnpm vr:compare

# Update baselines locally
pnpm vr:update
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm vr:capture` | Capture screenshots (fails if baselines don't exist) |
| `pnpm vr:update` | Update baselines (sets `UPDATE_BASELINE=true`) |
| `pnpm vr:compare` | Compare against baselines (CI mode) |

## Local Development Workflow

### 1. Making Visual Changes

When you modify templates, CSS, or components that affect visual appearance:

```bash
# 1. Make your changes
# 2. Start the Flask app
DESIGN_SYSTEM_ENABLED=true python web_app.py

# 3. In another terminal, update baselines
pnpm vr:update

# 4. Review the changes
git diff tests/visual-regression/__baselines__/

# 5. Commit baselines with your changes
git add tests/visual-regression/__baselines__/
git commit -m "chore(vr): update baselines for [feature]"
```

### 2. Reviewing Diffs Locally

When `pnpm vr:compare` fails, diff images are saved to:
```
test-results/diff/{browser}/{theme}/{viewport}/{page-name}.png
test-results/current/{browser}/{theme}/{viewport}/{page-name}.png
```

Open these images to visually inspect differences.

### 3. Running Specific Configurations

Run tests for a specific browser/viewport/theme combination:

```bash
# Single configuration
pnpm exec playwright test tests/visual-regression/vr-compare.spec.ts --project=vr-chromium-desktop-light

# Multiple configurations
pnpm exec playwright test tests/visual-regression/vr-compare.spec.ts --project=vr-chromium-desktop-light --project=vr-firefox-desktop-light

# All desktop configurations
pnpm exec playwright test tests/visual-regression/vr-compare.spec.ts --project=vr-*-desktop-*
```

## False Positive Tuning (Target: <2%)

### Ignore Regions

Add `data-vr-ignore` attributes to elements that change dynamically:

```html
<!-- Timestamps, user info, dynamic content -->
<span data-vr-ignore="timestamp">{{ current_time }}</span>
<div data-vr-ignore="user-info">{{ user.name }}</div>
<div data-vr-ignore="dynamic-content">{{ random_banner }}</div>
```

These are automatically hidden during screenshot comparison via `page-config.json` ignoreSelectors.

### Threshold Configuration

Adjust thresholds in `tests/visual-regression/page-config.json`:

```json
{
  "thresholds": {
    "visual": {
      "pixelThreshold": 0.005,  // 0.5% - default
      "maxDiffPixels": 100      // Absolute pixel limit
    }
  }
}
```

**Tuning guidelines:**
- **0.5% (default)**: Good for most pages, catches meaningful changes
- **1%**: More tolerant, use for pages with minor rendering differences
- **0.1%**: Strict, use for pixel-perfect pages (logos, critical UI)

### Per-Page Threshold Overrides

For pages that need different thresholds, add to page config:

```json
{
  "pages": {
    "list": [
      {
        "path": "/stock/",
        "name": "stock-list",
        "threshold": 0.01  // 1% for stock list (dynamic row count)
      }
    ]
  }
}
```

### Common False Positive Sources

| Source | Solution |
|--------|----------|
| Timestamps/dates | Add `data-vr-ignore="timestamp"` |
| User avatars/names | Add `data-vr-ignore="user-info"` |
| Dynamic badges/counts | Add `data-vr-ignore="dynamic-content"` |
| Toast notifications | Already ignored via `.c-toast` selector |
| Modal animations | Wait for animation: `await page.waitForTimeout(300)` |
| Font rendering differences | Use same OS/browser in CI (Ubuntu + Chromium/Firefox) |
| Scroll position | Ensure consistent viewport, use `fullPage: true` |

### Reducing False Positives Checklist

- [ ] All dynamic timestamps have `data-vr-ignore="timestamp"`
- [ ] User-specific content has `data-vr-ignore="user-info"`
- [ ] Toast/modal animations are waited for
- [ ] Viewport sizes match exactly (no fractional pixels)
- [ ] Theme is explicitly set before capture
- [ ] Page is fully hydrated (`waitForHydration()`)
- [ ] Scroll position is consistent (top of page)

## CI Integration

### PR Workflow

1. Push changes → GitHub Actions runs `visual-regression.yml`
2. 12 parallel jobs (2 browsers × 3 viewports × 2 themes)
3. On failure: diff artifacts uploaded automatically
4. Review diffs in Actions artifacts or PR comment

### Baseline Update Workflow

1. Comment `@visual-regression update-baseline` on PR
2. Workflow runs with `UPDATE_BASELINE=true`
3. New baselines committed to PR branch
4. Review and merge

## Git LFS for Large Images

Baselines >100KB are tracked via Git LFS:

```bash
# Install Git LFS
git lfs install

# Track PNG baselines
git lfs track "tests/visual-regression/__baselines__/**/*.png"
git add .gitattributes
```

## Troubleshooting

### "Baseline not found" Error
```bash
# Run baseline capture first
pnpm vr:update
```

### "Viewport mismatch" Error
Ensure `playwright.config.ts` viewport matches `page-config.json` viewports exactly.

### Font Rendering Differences
CI runs on Ubuntu. For local development on Windows/Mac, expect minor font rendering differences. Use ignore regions or increase threshold slightly.

### Flaky Tests
- Increase wait times: `await page.waitForTimeout(1000)`
- Ensure network idle: `await page.waitForLoadState('networkidle')`
- Disable animations: `animations: 'disabled'` in screenshot options

## Best Practices

1. **Always run `vr:update` locally** before pushing visual changes
2. **Review baseline diffs** in git before committing
3. **Use ignore regions** for truly dynamic content
4. **Keep thresholds consistent** across team
5. **Update baselines in same PR** as visual changes
6. **Don't commit baselines** from CI without review

## File Structure

```
tests/
├── visual-regression/
│   ├── __baselines__/          # Baseline screenshots (Git LFS)
│   │   ├── chromium/
│   │   │   ├── light/
│   │   │   │   ├── mobile/
│   │   │   │   ├── tablet/
│   │   │   │   └── desktop/
│   │   │   └── dark/
│   │   │       ├── mobile/
│   │   │       ├── tablet/
│   │   │       └── desktop/
│   │   └── firefox/
│   │       ├── light/
│   │       │   ├── mobile/
│   │       │   ├── tablet/
│   │       │   └── desktop/
│   │       └── dark/
│   │           ├── mobile/
│   │           ├── tablet/
│   │           └── desktop/
│   ├── page-config.json        # Page/ignore/threshold config
│   ├── vr-capture.spec.ts      # Baseline capture tests
│   └── vr-compare.spec.ts      # CI comparison tests
├── global-setup.ts
└── global-teardown.ts
```
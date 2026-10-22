# Rollback Procedure — ECJY Visual System Redesign (rediseño_aws)

## Overview
This document describes how to rollback the new design system if critical issues are found in production. The feature flag architecture enables **instant, zero-downtime rollback** at multiple granularities.

---

## Feature Flag Architecture

| Layer | Mechanism | Scope | Speed |
|-------|-----------|-------|-------|
| **Query Param** | `?design=legacy` | Per-request | Instant |
| **Session** | `session['design_system'] = 'legacy'` | Per-user session | Instant |
| **Server Config** | `DESIGN_SYSTEM_DEFAULT = 'legacy'` | All users | Next deploy |
| **Code Revert** | Git revert PRs | Permanent | Deploy time |

---

## Rollback Scenarios

### Scenario 1: Visual Regression on Specific Page
**Action**: User removes `?design=new` from URL or uses "Switch to Legacy" link
```python
# Add to any template for manual testing
<a href="{{ request.path }}?design=legacy">Ver versión anterior</a>
```

### Scenario 2: Global CSS/JS Issue Affecting Multiple Pages
**Action**: Flip session flag for all users
```python
# In web_app.py - temporary hotfix
@app.before_request
def force_legacy_design():
    session['design_system'] = 'legacy'
```
Then deploy fix and remove.

### Scenario 3: Critical JS Error Breaking Interactions
**Action**: The new CSS loads but JS fails gracefully (try/catch in each component init). Users see styled but non-interactive pages.
**Fix**: Deploy JS fix, or set `session['design_system'] = 'legacy'` until fixed.

### Scenario 4: Token Values Wrong (Colors, Spacing)
**Action**: Edit `static/src/css/tokens.css`, rebuild, deploy — **no template changes needed**.
```bash
npm run build
# Deploy static/dist/assets/
```

---

## Template Revert Checklist

If full rollback to legacy templates is needed:

| Template | Legacy Version | Status |
|----------|----------------|--------|
| `base.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `login.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `nueva_entrada.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `nueva_salida.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `nuevo_producto.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `nuevo_proveedor.html` | ⚠️ **New template** — no legacy version | Create if needed |
| `nuevo_cliente.html` | ⚠️ **New template** — no legacy version | Create if needed |
| `importar.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `usuarios.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `stock.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `entrada.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `salida.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `historico.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `proveedores.html` | ✅ Preserved in `{% else %}` branch | Ready |
| `clientes.html` | ✅ Preserved in `{% else %}` branch | Ready |

**Note**: `nuevo_proveedor.html` and `nuevo_cliente.html` were created new (no legacy equivalent). If rollback needed, create minimal legacy versions or redirect to legacy list pages.

---

## Cache Busting

### Production Build
```bash
npm run build
# Outputs: static/dist/assets/main-<hash>.css, main-<hash>.js
```

### Vite Config (vite.config.js)
```javascript
build: {
  rollupOptions: {
    output: {
      entryFileNames: 'assets/main-[hash].js',
      chunkFileNames: 'assets/chunk-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]'
    }
  }
}
```

### Flask Template References
```jinja2
<!-- Uses content-hashed filenames automatically -->
<link rel="stylesheet" href="{{ url_for('static', filename='dist/assets/main.css') }}">
<script type="module" src="{{ url_for('static', filename='dist/assets/main.js') }}"></script>
```

**Rollback cache**: No action needed — old hashed files remain in `static/dist/assets/` until explicitly deleted.

---

## Emergency Rollback Commands

```bash
# 1. Quick: Disable new design for all users (hotfix)
# Edit web_app.py, add before_request:
# session['design_system'] = 'legacy'

# 2. Medium: Revert last PR (feature-branch-chain)
git revert <merge-commit-sha> -m 1
# Push to tracker branch, then to main

# 3. Full: Revert all 6 PRs in reverse order
git revert <pr6-merge> -m 1
git revert <pr5-merge> -m 1
git revert <pr4-merge> -m 1
git revert <pr3-merge> -m 1
git revert <pr2-merge> -m 1
git revert <pr1-merge> -m 1

# 4. Nuclear: Checkout main before redesign
git checkout main@{1.week.ago} -- .
git commit -m "revert: full rollback to pre-redesign state"
```

---

## Verification After Rollback

1. Visit `/stock/?design=legacy` — confirm legacy styles load
2. Check browser console — no JS errors from new components
3. Verify all 13 templates render correctly
4. Test critical flows: login, nueva_entrada, stock list, historico
5. Confirm no 404s for static assets (old hashed files still exist)

---

## Contacts

| Role | Contact |
|------|---------|
| Tech Lead | [Nombre] |
| DevOps | [Nombre] |
| Stakeholder | [Nombre] |

---

*Last updated: {{ date }}*
*Change: rediseño_aws*
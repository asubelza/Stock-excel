# Migration Checklist — ECJY Visual System Redesign (rediseño_aws)

## Overview
Per-template and cross-cutting signoff checklist for production deployment. Each item must be ✅ before merging to main.

---

## Per-Template Signoff

### Layout & Authentication
| Template | Visual Parity | Responsive (3 BP) | A11y | Performance | Legacy Fallback | Owner | Status |
|----------|---------------|-------------------|------|-------------|-----------------|-------|--------|
| `base.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `login.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |

### Form Templates (Phase 4)
| Template | Visual Parity | Responsive (3 BP) | A11y | Performance | Legacy Fallback | Owner | Status |
|----------|---------------|-------------------|------|-------------|-----------------|-------|--------|
| `nueva_entrada.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `nueva_salida.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `nuevo_producto.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `nuevo_proveedor.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `nuevo_cliente.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `importar.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `usuarios.html` (create/edit) | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |

### Data Display Templates (Phase 5)
| Template | Visual Parity | Responsive (3 BP) | A11y | Performance | Legacy Fallback | Owner | Status |
|----------|---------------|-------------------|------|-------------|-----------------|-------|--------|
| `stock.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `entrada.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `salida.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `historico.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `proveedores.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `clientes.html` | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |
| `usuarios.html` (list) | ☐ | ☐ | ☐ | ☐ | ☐ | | ⬜ |

---

## Cross-Cutting Signoff

### Accessibility (WCAG 2.1 AA)
| Criterion | Test Method | Status | Notes |
|-----------|-------------|--------|-------|
| **Color Contrast** (≥4.5:1 text, ≥3:1 UI) | axe-core + manual | ⬜ | |
| **Focus Order** (logical tab sequence) | Keyboard nav test | ⬜ | |
| **Focus Visible** (clear focus indicator) | Keyboard nav test | ⬜ | |
| **ARIA Labels** (buttons, inputs, navigation) | axe-core + screen reader | ⬜ | |
| **Skip Links** (present, functional) | Keyboard test | ⬜ | |
| **Reduced Motion** (respects `prefers-reduced-motion`) | OS setting + test | ⬜ | |
| **Screen Reader** (NVDA/VoiceOver) | Manual test | ⬜ | |
| **Zoom 200%** (no horizontal scroll) | Browser zoom test | ⬜ | |

### Visual Regression
| Breakpoint | Templates Tested | Tool | Baseline | Status |
|------------|------------------|------|----------|--------|
| Mobile (375px) | All 13 | Playwright + pixelmatch | Legacy screenshots | ⬜ |
| Tablet (768px) | All 13 | Playwright + pixelmatch | Legacy screenshots | ⬜ |
| Desktop (1280px) | All 13 | Playwright + pixelmatch | Legacy screenshots | ⬜ |

**Acceptable diff**: < 0.1% pixel difference (anti-aliasing only)

### Performance (Lighthouse CI)
| Metric | Target | Mobile | Desktop | Status |
|--------|--------|--------|---------|--------|
| **CSS Size (gzipped)** | < 50 KB | ☐ | ☐ | ⬜ |
| **JS Size (gzipped)** | < 100 KB | ☐ | ☐ | ⬜ |
| **First Contentful Paint** | < 1.8s | ☐ | ☐ | ⬜ |
| **Largest Contentful Paint** | < 2.5s | ☐ | ☐ | ⬜ |
| **Cumulative Layout Shift** | < 0.1 | ☐ | ☐ | ⬜ |
| **Total Blocking Time** | < 200ms | ☐ | ☐ | ⬜ |
| **No Render-Blocking Resources** | Pass | ☐ | ☐ | ⬜ |

### Cross-Browser
| Browser | Version | OS | Status | Notes |
|---------|---------|-----|--------|-------|
| Chrome | Latest | Windows/macOS | ⬜ | |
| Firefox | Latest | Windows/macOS | ⬜ | |
| Safari | Latest | macOS/iOS | ⬜ | |
| Edge | Latest | Windows | ⬜ | |

### Functional Testing
| Flow | Legacy Works | New Design Works | Status |
|------|--------------|------------------|--------|
| Login → Dashboard | ☐ | ☐ | ⬜ |
| Stock list → filter/search | ☐ | ☐ | ⬜ |
| Nueva entrada → autocomplete producto/proveedor → save | ☐ | ☐ | ⬜ |
| Nueva salida → autocomplete producto/cliente → save | ☐ | ☐ | ⬜ |
| Nuevo producto → validation → save | ☐ | ☐ | ⬜ |
| Proveedores/Clientes CRUD | ☐ | ☐ | ⬜ |
| Usuarios CRUD + roles | ☐ | ☐ | ⬜ |
| Histórico pagination/filter | ☐ | ☐ | ⬜ |
| Importar Excel → progress → result | ☐ | ☐ | ⬜ |
| Role-based nav visibility | ☐ | ☐ | ⬜ |
| Toast notifications | ☐ | ☐ | ⬜ |
| Modal confirmations | ☐ | ☐ | ⬜ |

---

## Deployment Signoff

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Frontend Lead** | | | |
| **Backend Lead** | | | |
| **QA Lead** | | | |
| **Product Owner** | | | |
| **Stakeholder (ECJY)** | | | |

---

## Go/No-Go Decision

| Check | Pass/Fail | Blocker? |
|-------|-----------|----------|
| All template signoffs ✅ | | |
| A11y audit ✅ (0 critical, 0 major) | | |
| Visual regression ✅ (<0.1% diff) | | |
| Performance ✅ (all targets met) | | |
| Cross-browser ✅ | | |
| Functional flows ✅ | | |
| Stakeholder approval ✅ | | |

**Decision**: ☐ **GO** — Deploy to production
**Decision**: ☐ **NO-GO** — Fix blockers, re-test

---

## Post-Deployment Monitoring (First 48h)

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| JS Errors | Sentry/Console | > 0 new errors/hour |
| Page Load Time | Lighthouse CI / RUM | > 3s p95 |
| User Complaints | Support channel | Any design-related |
| Feature Flag Usage | Analytics | > 10% users on legacy |

---

*Checklist version: 1.0*
*Change: rediseño_aws*
*Last updated: {{ date }}*
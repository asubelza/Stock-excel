# Exploration: rediseño_aws_v2 (ECJY Visual System Redesign v2)

## Current State

### What's Migrated (13 templates with dual legacy/new branches)
| Template | New Design System | Uses DataTable | Uses Modals | Uses Autocomplete |
|----------|-------------------|----------------|-------------|-------------------|
| `stock.html` | ✅ | ✅ (ClientDataTable) | ❌ | ❌ |
| `entrada.html` | ✅ | ✅ | ✅ (edit) | ❌ |
| `salida.html` | ✅ | ✅ | ✅ (edit) | ❌ |
| `historico.html` | ✅ | ✅ (virtualized) | ❌ | ❌ |
| `clientes.html` | ✅ | ✅ (responsive cards) | ✅ (create) | ❌ |
| `proveedores.html` | ✅ | ✅ (responsive cards) | ✅ (create) | ❌ |
| `usuarios.html` | ✅ | ✅ | ✅ (create/edit/reset) | ❌ |
| `nueva_entrada.html` | ✅ | ❌ (inline table) | ❌ | ✅ (producto, proveedor) |
| `nueva_salida.html` | ✅ | ❌ (inline table) | ❌ | ✅ (producto, cliente) |
| `nuevo_producto.html` | ✅ | ❌ | ❌ | ❌ |
| `nuevo_proveedor.html` | ✅ | ❌ | ❌ | ❌ |
| `nuevo_cliente.html` | ✅ | ❌ | ❌ | ❌ |
| `importar.html` | ✅ | ❌ | ❌ | ❌ |

### What's NOT Yet Migrated
| Template | Status | Notes |
|----------|--------|-------|
| `login.html` | Partial | New design uses `app-layout--login` but imports individual macros; not using `render_card` consistently |
| `index.html` | Legacy only | Old historical view — likely deprecated in favor of `historico.html` |
| Edit modals for `proveedores`, `clientes` | Not implemented | Toasts show "próximamente" — backend APIs may not exist |

### Design Token System (tokens.css: 429 lines)
- **Complete**: Color system (brand, neutral, semantic), typography, spacing, border radius, shadows, animation, z-index, breakpoints
- **Component tokens**: Buttons, inputs, tables, cards, badges, modals, toasts, layout
- **Dark mode**: Defined but **not activated** — requires `data-theme="dark"` on `:root` (media query only, no class toggle)
- **Reduced motion**: Fully implemented via `@media (prefers-reduced-motion: reduce)`
- **High contrast**: Windows forced-colors support implemented
- **Legacy compatibility**: 14 legacy tokens mapped for gradual migration

### JS Components (6 components, ~104KB total)
| Component | File | Size | Features |
|-----------|------|------|----------|
| Autocomplete | autocomplete.js | 20KB | Debounced fetch, keyboard nav, option descriptions |
| DataTable | data-table.js | 33KB | Sort, filter, pagination, virtualization, responsive (stack/scroll), actions |
| Dropdown | dropdown.js | 13KB | Click-outside, keyboard, submenus |
| Modal | modal.js | 10KB | Focus trap, backdrop, ESC close, animations |
| SideNav | side-nav.js | 13KB | Collapse, mobile drawer, nested items, keyboard |
| FormValidation | form-validation.js | 15KB | Custom validators, async, accessibility |

### Build & Assets
- **Vite** library mode → single `main.js` + `main.css` with content hashes
- **No code splitting** — all components bundled together
- **CSS code splitting enabled** but single entry point
- Assets in `static/dist/assets/` served by Flask

### Accessibility (a11y-report.json)
- **All pages**: 2 moderate violations each (landmark-one-main, region)
- **Root cause**: Legacy pages lack `<main>` landmark; new design HAS it but axe runs on both
- **New design system base.html**: Includes skip link, focus-visible, ARIA labels, reduced motion
- **Missing**: No screen reader testing documented, no 200% zoom test results

---

## Affected Areas

- `templates/base.html` — layout, feature flag, dark mode toggle injection point
- `static/src/css/tokens.css` — dark mode activation, new component tokens
- `static/src/js/main.js` — lazy loading, component registry, dark mode API
- `vite.config.js` — code splitting, chunk strategy
- `templates/login.html` — complete migration to new macros
- `templates/index.html` — deprecate or migrate
- New files: dark mode toggle component, token docs, Storybook config, visual regression tests

---

## Approaches

### 1. Dark Mode Support
| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Class-based toggle** (`data-theme="dark"` on `<html>`) | Full control, persists via localStorage, works with tokens.css media query | Need toggle UI, sync with OS preference | Medium |
| **B: OS preference only** (`@media (prefers-color-scheme: dark)`) | Zero JS, respects user system setting | No user override, can't test light mode on dark OS | Low |
| **C: Both** (OS default + manual toggle) | Best UX, WCAG compliant | More complex state management | Medium |

**Recommendation**: **C** — implement class-based toggle with OS preference as default, persist to localStorage.

### 2. Bundle Splitting & Lazy Loading
| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: Vite manual chunks** (vendor, components, data-table) | Reduces initial JS, cacheable vendor | Need to audit dynamic imports | Medium |
| **B: Route-based lazy loading** (load DataTable only on list pages) | Smallest initial bundle | Requires module pattern refactor | High |
| **C: Keep single bundle** | Simple, HTTP/2 multiplexing helps | 79KB JS + 46KB CSS = 125KB total (gzipped ~35KB) | None |

**Recommendation**: **A** — split vendor (DesignSystem core) from components, lazy-load DataTable (33KB) on demand.

### 3. Portal de Clientes
| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A: New separate app** (subdomain, own auth) | Clean separation, different user model | Duplication, separate deployment | High |
| **B: Extend existing** (new role `cliente`, restricted nav, read-only views) | Reuses design system, single codebase | Need role-based data filtering | Medium |
| **C: Not in v2 scope** | Focus on current gaps | Misses business opportunity | N/A |

**Recommendation**: **B** — if business need confirmed; otherwise **C** (defer).

### 4. New Components Needed
| Component | Used By | Exists? | Notes |
|-----------|---------|---------|-------|
| Date picker | Filters (fecha_desde/hasta) | ❌ | Native `<input type="date">` used — consider custom for range |
| Rich text editor | Not needed currently | ❌ | Defer |
| Charts/Graphs | Dashboard (not built) | ❌ | Defer until dashboard exists |
| File upload (drag-drop) | importar.html | ✅ (c-file-dropzone) | Already in base.css |
| Progress bar | importar.html | ✅ (c-progress) | Already in base.css |
| Toast notifications | All CRUD | ✅ (toast.js) | Via DesignSystem.Toast |
| Confirmation dialog | Delete actions | ✅ (Toast.show with action) | Pattern established |
| Tabs | Not used | ❌ | Defer |
| Accordion | SideNav subitems | ✅ (CSS-only) | Works |

**Recommendation**: Date picker enhancement for range selection; others defer.

### 5. Accessibility Gaps
| Gap | Fix | Effort |
|-----|-----|--------|
| Main landmark on all pages | Already in new `base.html` — verify `role="main"` on `app-layout__main` | Low |
| Region containment | Wrap all content in landmarks (nav, main, aside, footer) | Low |
| Skip link | Present in new design | Done |
| Focus visible | Comprehensive in base.css | Done |
| Reduced motion | Tokens + base.css | Done |
| Color contrast | Tokens designed for 4.5:1 — verify in practice | Medium (audit) |
| Screen reader testing | Not done | Medium (manual) |
| 200% zoom test | Not done | Low (test) |

**Recommendation**: Run axe on new design system pages only; fix any remaining issues; document testing protocol.

### 6. Developer Experience
| Tool | Current | Target | Effort |
|------|---------|--------|--------|
| Storybook | ❌ | Add for component library | Medium |
| Visual regression | ❌ (manual checklist) | Playwright + pixelmatch CI | Medium |
| Token documentation | ❌ (CSS only) | Auto-generated docs site (Style Dictionary or custom) | Medium |
| TypeScript types | ❌ (JS only) | JSDoc or .d.ts for DesignSystem API | Low |
| Component playground | ❌ | `/design-system` route with all components | Low |

**Recommendation**: Add Storybook + visual regression in CI; generate token docs from tokens.css.

---

## Recommendation: Recommended Scope for v2

### Must Have (High Impact, Medium Effort)
1. **Dark mode toggle** — Class-based with OS default, localStorage persistence, toggle in user menu
2. **Bundle splitting** — Vite manual chunks: `vendor` (DesignSystem core), `components` (UI), `data-table` (lazy)
3. **Login page completion** — Migrate fully to new macros, remove legacy inline styles
4. **Accessibility audit & fixes** — Run axe on new design pages only; fix violations; add CI check

### Should Have (High Value)
5. **Edit modals for proveedores/clientes** — Implement backend APIs + frontend modals (currently "próximamente")
6. **Visual regression automation** — Playwright + pixelmatch in CI for 3 breakpoints
7. **Token documentation site** — Auto-generated from tokens.css (colors, spacing, typography, components)

### Nice to Have (Lower Priority)
8. **Storybook** — Component playground for designers/devs
9. **Date range picker** — Enhanced date filter UX
10. **TypeScript definitions** — For DesignSystem API autocomplete
11. **Deprecate index.html** — Remove or redirect to historico

### Out of Scope for v2
- Portal de Clientes (separate initiative)
- Charts/Dashboard (no backend data yet)
- Rich text editor (no use case)
- Full i18n (Spanish only currently)

---

## Risks & Constraints

| Risk | Mitigation |
|------|------------|
| Dark mode breaks legacy pages | Legacy pages don't load design system CSS — isolated by feature flag |
| Bundle splitting breaks inline scripts | Templates use `window.DesignSystem` — ensure core API in vendor chunk |
| Edit modals need backend changes | Coordinate with backend API work; stub frontend first |
| Visual regression flakiness | Use fixed viewport, disable animations, baseline on main branch |
| Token doc generator maintenance | Use simple script parsing CSS custom properties; regenerate on build |

---

## Ready for Proposal

**Yes** — sufficient information gathered to create an SDD proposal with clear scope, tasks, and acceptance criteria. The orchestrator should present this exploration to the user for scope confirmation before proceeding to `sdd-propose`.
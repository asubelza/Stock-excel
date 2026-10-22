# Exploration: Visual System Redesign — SISTEMA VISUAL ECJY

## Current State

**Flask app** (`web_app.py`, 1275 lines) with **13 Jinja2 templates** in `templates/`. Single `base.html` contains ~90 lines of inline CSS — no external stylesheets, no design system, no build step.

### Template/Component Inventory (what needs redesign)

| Template | Type | Key Patterns |
|----------|------|--------------|
| `base.html` | Layout | Header nav (role-based), container, card wrapper |
| `stock.html` | List/Dashboard | Search + filter select, table with inline delete, role-based actions |
| `entrada.html` | List/Dashboard | Multi-filter (text, tipo, date range), edit/delete modals |
| `salida.html` | List/Dashboard | Same as entrada, different tipo_comp options |
| `historico.html` | List/Dashboard | Unified filter across all movement types, badge-style status |
| `nueva_entrada.html` | Create Form | Header fields, provider autocomplete, dynamic item table, totals |
| `nueva_salida.html` | Create Form | Header fields, client autocomplete, dynamic item table (no cost), totals |
| `nuevo_producto.html` | Create Form | Simple 2-col grid form |
| `proveedores.html` | List + Inline Create | Table + collapsible create form + Excel import |
| `clientes.html` | List + Inline Create | Same as proveedores |
| `usuarios.html` | Admin CRUD | Table + create form + edit/reset/delete modals |
| `importar.html` | Import | Format reference table + file upload |
| `login.html` | Auth | Centered card (not read, referenced in base.html) |

### Current CSS (inline in base.html)

**Colors (hardcoded):**
- Primary: `#2c3e50` (header bg), `#3498db` (primary btn)
- Success: `#27ae60` / `#219a52`
- Danger: `#e74c3c` / `#c0392b`
- Warning: `#f39c12` (reset pass btn)
- Purple: `#9b59b6` (import btn)
- Background: `#f0f0f0` (body), `white` (cards), `#f8f9fa` (muted)
- Text: `#555` (muted), `#999` (placeholder)

**Spacing:** Ad-hoc (`15px`, `20px`, `8px`, `10px`, `4px`) — no scale
**Typography:** `Arial, sans-serif` only, sizes: `20px` (h1), `18px` (h2), `13-14px` (body), `12px` (small) — no scale
**Components:** `.card`, `.btn` (3 variants), `.form-group`, `.row/.col` grid, `.search-box`, `.resultados` dropdown, tables, modals (inline styles)
**States:** `.entrada` (green), `.salida` (red), `.stock-bajo` (red), `.error`/`.success` alerts

---

## Tokens to Define

### Color System (ECJY identity → digital premium)
```
Brand (from logo):        [extract from logo.png]
Neutral scale:            9 steps (50–900) for backgrounds, borders, text
Semantic:                 success, warning, danger, info — each with light/hover/active
Surface:                  card, elevated, overlay, input, disabled
State:                    focus ring, hover, active, disabled, selected
```
**No flat Bootstrap-like colors.** Use brand-derived neutrals with semantic accents.

### Typography Scale
```
Display:       48/56  — page hero (rare)
H1:            32/40  — page titles
H2:            24/32  — section headers
H3:            20/28  — card titles
Body LG:       18/28  — important numbers, empty states
Body:          16/24  — default
Body SM:       14/20  — secondary, table cells
Caption:       12/16  — labels, metadata, timestamps
Mono:          14/20  — SKU, CUIT, codes
```
**Font:** System UI stack or single premium font (Inter, IBM Plex Sans, or brand font if licensed)

### Spacing Scale (4px base)
```
0    = 0
1    = 4px
2    = 8px
3    = 12px
4    = 16px
5    = 20px
6    = 24px
8    = 32px
10   = 40px
12   = 48px
16   = 64px
```
Use consistently: `gap`, `padding`, `margin`, `grid-gap`

### Border Radius
```
none   = 0
sm     = 4px  (inputs, buttons)
md     = 8px  (cards, dropdowns)
lg     = 12px (modals, elevated)
full   = 9999px (pills, badges, avatars)
```

### Shadows/Elevation
```
level-0: none
level-1: 0 1px 2px rgba(0,0,0,0.04)  (cards)
level-2: 0 4px 8px rgba(0,0,0,0.08)  (elevated, dropdowns)
level-3: 0 8px 24px rgba(0,0,0,0.12) (modals, toasts)
level-4: 0 16px 48px rgba(0,0,0,0.16) (overlays)
```

---

## Component System Needed

### 1. Navigation
- **Top Bar**: Logo, page title, user avatar/menu, global actions
- **Side Nav** (optional for client portal): Primary sections with icons, badges for counts
- **Breadcrumbs**: For deep views (detail → list)

### 2. Buttons
| Variant | Use |
|---------|-----|
| Primary | Main CTA (Confirmar, Guardar, Crear) |
| Secondary | Alternative actions (Cancelar, Volver) |
| Ghost | Low-emphasis (Editar in tables) |
| Danger | Destructive (Eliminar, Anular) |
| Icon-only | Dense toolbars (delete, edit, more) |
| Loading | Spinner state (Confirmando...) |

**Sizes:** `sm` (tables), `md` (forms), `lg` (hero CTAs)

### 3. Form Controls
- Input (text, number, email, password, date, search)
- Select (native + custom styled)
- Textarea
- Checkbox/Radio (styled)
- Switch (for boolean toggles)
- File upload (drag-drop zone)
- **Autocomplete/Combobox** — critical for product/proveedor/cliente search
- Input with prefix/suffix (currency, units)

**States:** default, hover, focus (visible ring!), error, disabled, read-only

### 4. Tables
- Sortable columns (click header)
- Row hover, striped, selected
- Inline actions (icon buttons)
- Expandable rows (for detail)
- Responsive: horizontal scroll on mobile, stack cards on <640px
- Empty state illustration + message
- Column visibility toggle (optional)

### 5. Cards
- **Default**: content container
- **Elevated**: dropdowns, modals
- **Interactive**: hover lift (dashboard widgets)
- **Section**: with header + action

### 6. Feedback/Status
- **Toast/Notification**: success, error, warning, info (auto-dismiss + action)
- **Inline Alert**: form-level, page-level
- **Badge/Pill**: status (Entrada/Salida/Anulado), role, stock level
- **Skeleton**: loading placeholders
- **Progress**: linear (import), circular (button loading)

### 7. Modals/Overlays
- **Dialog**: centered, focus trap, ESC to close, backdrop click to close
- **Drawer**: side panel (for filters, detail views)
- **Popover**: anchored (dropdown menus, tooltips)
- **Confirmation**: standardized replace for `confirm()`

### 8. Data Display
- **Key-Value**: definition list style (detail views)
- **Stat Card**: large number + label + trend (dashboard)
- **Timeline**: for movement history
- **Empty State**: illustration + copy + primary action

---

## Layout Patterns

### Dashboard (Stock Home)
```
┌─────────────────────────────────────────────────────┐
│ Top Bar: Logo | Search Global | User Menu           │
├──────────────┬──────────────────────────────────────┤
│              │  Stats Row: [Stock Total] [Bajo Min] │
│  Side Nav    │           [Entradas Hoy] [Salidas]   │
│  (collapsible)├──────────────────────────────────────┤
│              │  Quick Actions: +Entrada +Salida     │
│              │           +Producto +Proveedor       │
│              │                                      │
│              │  Recent Activity Table (10 rows)     │
│              │  [Ver todo →]                        │
└──────────────┴──────────────────────────────────────┘
```

### List Views (Entrada, Salida, Histórico, Proveedores, Clientes, Usuarios)
```
┌─────────────────────────────────────────────────────┐
│ Top Bar                                              │
├─────────────────────────────────────────────────────┤
│ Page Header: Title | Primary Action (+Nueva...)     │
├─────────────────────────────────────────────────────┤
│ Filter Bar: [Search] [Tipo ▼] [Fecha ▼] [Más filtros]│
├─────────────────────────────────────────────────────┤
│                                                      │
│  Data Table (sortable, filterable, paginated)       │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Pagination: [←] 1 2 3 ... 12 [→]  [50 por página ▼] │
└─────────────────────────────────────────────────────┘
```

### Create/Edit Forms (Nueva Entrada/Salida, Producto)
```
┌─────────────────────────────────────────────────────┐
│ Top Bar                                              │
├─────────────────────────────────────────────────────┤
│ Page Header: Title | [Cancelar] [Guardar/Borrador]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Section: Datos del Comprobante (tipo, nro, fecha)  │
│  Section: Proveedor/Cliente (autocomplete)          │
│  Section: Items (dynamic table + add row)           │
│     └─ Inline validation, running totals             │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Sticky Footer: [Cancelar] [Confirmar]               │
└─────────────────────────────────────────────────────┘
```

### Detail View (Movimiento, Producto, Proveedor)
```
┌─────────────────────────────────────────────────────┐
│ Top Bar                                              │
├─────────────────────────────────────────────────────┤
│ Header: Title + Badge | [Editar] [Anular] [•••]     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Sidebar:    │  │ Main:                       │  │
│  │ - Metadata  │  │ - Key info (grid)           │  │
│  │ - Actions   │  │ - Related items table       │  │
│  │ - Timeline  │  │ - Audit log                 │  │
│  └─────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Animation/Interaction Patterns

| Interaction | Pattern | Duration | Easing |
|-------------|---------|----------|--------|
| Page transition | Fade + slide (200ms) | 200ms | ease-out |
| Modal open | Scale(0.95)→1 + fade backdrop | 150ms | ease-out |
| Modal close | Scale(1)→0.95 + fade | 100ms | ease-in |
| Dropdown | Slide down + fade | 120ms | ease-out |
| Toast enter | Slide from right + fade | 200ms | ease-out |
| Toast exit | Slide right + fade | 150ms | ease-in |
| Table row hover | Background transition | 100ms | ease |
| Button press | Scale(0.98) | 80ms | ease-out |
| Input focus | Ring expand | 120ms | ease-out |
| Card hover (interactive) | TranslateY(-2px) + shadow | 150ms | ease-out |
| Accordion expand | Height auto + fade | 200ms | ease-out |
| Skeleton pulse | Opacity 0.4↔1 | 1.5s | infinite |

**Reduced motion:** Respect `prefers-reduced-motion` — disable all non-essential animation.

---

## Migration Strategy

### Option A: Big Bang (Single PR)
- Replace base.html CSS with design system CSS
- Update all 13 templates to use new component classes
- Add CSS custom properties for tokens
- **Risk:** High — visual regressions everywhere, hard to review
- **Effort:** High (2-3 weeks)

### Option B: Progressive (Recommended)
**Phase 1 — Foundation (Week 1)**
- Create `static/css/tokens.css` (CSS custom properties)
- Create `static/css/components.css` (base components)
- Update `base.html` to load new CSS, keep inline as fallback
- Add build step (Vite/PostCSS) for token generation

**Phase 2 — Layout & Navigation (Week 1-2)**
- Redesign Top Bar, Side Nav, Container
- Update `base.html` structure
- Test all pages render correctly

**Phase 3 — Core Components (Week 2-3)**
- Buttons, Forms, Tables, Cards, Badges
- Update list pages first (stock, entrada, salida, historico, proveedores, clientes, usuarios)
- One template at a time, verify each

**Phase 4 — Complex Forms (Week 3-4)**
- Nueva entrada/salida (autocomplete, dynamic tables)
- Usuarios modals
- Import page

**Phase 5 — Polish (Week 4)**
- Animations, micro-interactions
- Empty states, loading states
- Toast system replacing alert()
- Confirmation dialogs replacing confirm()
- Responsive testing
- Accessibility audit

**Phase 6 — Client Portal Specific (Week 4-5)**
- Dashboard with stats widgets
- Document/vencimientos/tareas views (new pages)
- Communications center
- Brand refinement

### Migration Guards
- **Visual regression:** Playwright + pixelmatch on key pages
- **Feature flags:** `?design=new` query param to toggle
- **Rollback:** Keep old CSS loaded behind flag
- **Per-template migration:** Each template can opt-in independently

---

## Risks

1. **Inline styles in templates** — 12 templates have inline `style=` attributes that override CSS. Must audit and remove.
2. **JavaScript tightly coupled to DOM structure** — Modals, dropdowns, tables use hardcoded IDs/classes. Refactor JS to use data-attributes or component initialization.
3. **No build pipeline** — Adding PostCSS/Vite introduces Node dependency. Keep simple: `npx postcss tokens.css -o tokens.compiled.css` in CI.
4. **Role-based nav** — 4 roles with different permissions. New nav must derive from same PERMISOS map.
5. **Autocomplete dropdowns** — Custom implementation in 4 templates. Replace with single reusable component.
6. **Mobile** — Current tables don't work on mobile. Responsive table pattern needed.
7. **Accessibility** — No ARIA, no focus management, color-only status. Must fix in new system.

---

## Recommendation

**Progressive migration (Option B)** with feature flag. Start with tokens + base components, migrate one page type at a time. This allows:
- Continuous deployment
- Easy rollback per page
- Stakeholder feedback on real pages
- Parallel work (backend unchanged)

**First deliverable:** `tokens.css` + `components.css` + updated `base.html` with feature flag. Then migrate `stock.html` as pilot.

---

## Ready for Proposal

**Yes.** The exploration is complete. The orchestrator should present the user with:
1. This exploration summary
2. A proposal for the design system architecture (tokens, components, CSS architecture)
3. Phase 1 task breakdown (tokens, base components, base.html update, build setup)

The user can then approve or request adjustments before moving to SDD Spec phase.
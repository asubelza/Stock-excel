---
title: Changelog
description: Historial de versiones del ECJY Design System
---

# Changelog

Todas las versiones notables documentadas aquí. Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-10-08

### Added
- **Design Tokens**: 279 tokens CSS custom properties organizados en 10 categorías
  - Color: Brand, Neutral, Semantic (Success/Warning/Danger/Info), Surface, State, Text
  - Typography: Fluid scale con `clamp()`, familias, pesos, line-height, letter-spacing
  - Spacing: Base 4px scale + aliases semánticos (xs–3xl)
  - Border Radius: none–full
  - Shadows: 4 niveles + aliases semánticos (card, dropdown, modal, toast, focus)
  - Animation: Duraciones, easings, transiciones predefinidas, keyframes
  - Layout: Breakpoints, z-index scale, container dimensions
  - Components: Button, Input, Table, Card, Badge, Modal, Toast tokens
  - Legacy: 14 tokens para migración gradual

- **Componentes Vanilla JS** (11 componentes, 0 dependencias):
  - `Button` — Variantes, tamaños, loading, iconos
  - `Card` — Default, elevated, outlined, con imagen
  - `Input` — Text, email, password, textarea, select, checkbox, radio
  - `DataTable` — Sort, filter, pagination, virtualización, server-side, lazy loading
  - `Dropdown` — Keyboard nav, type-ahead, positioning, Popper-like
  - `Modal` — Focus trap, ESC, backdrop, accessibility
  - `SideNav` — Collapsible, nested, role-based filtering
  - `Toast` — Auto-dismiss, actions, container
  - `Alert` — 4 variantes, dismissible, actions
  - `Badge` — 6 variantes, 3 tamaños
  - `FormValidation` — HTML5 + custom rules, async validation

- **Modo Oscuro** (Three-state: light/dark/system):
  - FOUC prevention inline script
  - ThemeProvider con localStorage + cross-tab sync
  - `matchMedia` listener para prefers-color-scheme
  - Toggle integrado en user menu dropdown
  - 19 tokens con valores dark mode
  - 14 tokens high contrast mode

- **Bundle Splitting** (Vite + Rollup):
  - `vendor` — Core deps (long-term cache)
  - `components` — UI components chunk
  - `data-table` — Lazy loaded via IntersectionObserver
  - Preload hints generados desde manifest
  - Cache headers config (_headers para Netlify/Vercel/Cloudflare)
  - Budgets: vendor+components ≤60KB gz, data-table ≤35KB gz

- **Token Documentation** (VitePress):
  - Parser PostCSS: `tokens.css` → `tokens.json` + `tokens-meta.json`
  - Metadata via `@token` comments en CSS
  - Live component previews (Button, Card, Input, Alert)
  - Copy-to-clipboard para token names/values
  - Categorized token tables con dark mode values
  - Search/filter en tablas de tokens

- **Guías**:
  - Primeros pasos (Flask + Jinja2 integration)
  - Modo oscuro (implementación, toggle, sync)
  - Temática (runtime theming, CSS layers, themes)
  - Accesibilidad (WCAG 2.1 AA, patterns, testing)
  - Migración legacy (5 fases, mapeo, rollout)

### Changed
- Vite config: `manualChunks` con stable content hashes
- `base.html`: FOUC script, preload hints include, module script
- `nav.html`: Theme toggle en user dropdown
- `data-table.js`: Lazy loading support via `data-table-lazy`
- `package.json`: Scripts `tokens:parse`, build con preload hints

### Performance
- Bundle sizes: main 4.85KB gz, components 10.34KB gz, data-table 6.32KB gz
- CSS: 8.42KB gz (tokens + base + components)
- Code splitting: data-table solo carga cuando entra en viewport

---

## [Unreleased]

### Planned
- [ ] DatePicker component
- [ ] Select virtualizado para listas grandes
- [ ] Tree view component
- [ ] Charts integration (tokens para Chart.js)
- [ ] React/Vue/Svelte wrappers
- [ ] Storybook integration
- [ ] Visual regression testing (Chromatic)
- [ ] Design tokens Figma sync
- [ ] i18n support en componentes
- [ ] CSS Container Queries migration
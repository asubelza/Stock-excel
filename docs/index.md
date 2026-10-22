---
layout: home
hero:
  name: ECJY Design System
  text: Sistema de diseño unificado
  tagline: Tokens, componentes y guías para aplicaciones ECJY
  image:
    src: /logo.png
    alt: ECJY Logo
  actions:
    - theme: brand
      text: Empezar
      link: /guides/getting-started
    - theme: alt
      text: Ver Tokens
      link: /tokens/colors
    - theme: alt
      text: Componentes
      link: /components/button

features:
  - icon: 🎨
    title: Design Tokens
    details: Paleta de colores, tipografía, espaciado y más — todo como CSS custom properties
  - icon: 🧩
    title: Componentes
    details: Componentes accesibles, listos para usar: Button, Card, Input, Table, Modal y más
  - icon: 🌗
    title: Modo Oscuro
    details: Soporte nativo para light/dark/system con persistencia y sincronización cross-tab
  - icon: ⚡
    title: Performance
    details: Code splitting, lazy loading, preload hints y cache headers optimizados
  - icon: ♿
    title: Accesibilidad
    details: Cumple WCAG 2.1 AA, focus visible, navegación por teclado, screen readers
  - icon: 📦
    title: Framework Agnóstico
    details: Vanilla JS, sin dependencias — funciona con Flask, React, Vue, Svelte, etc.
---

<script setup>
import TokenTable from './.vitepress/components/TokenTable.vue';
import ComponentPreview from './.vitepress/components/ComponentPreview.vue';
</script>

# ECJY Design System

El **ECJY Design System** es un sistema de diseño unificado para las aplicaciones del Estudio Contable JY. Proporciona:

## 🎯 Qué incluye

### Design Tokens
Fuente única de verdad para todas las decisiones de diseño:
- **Colores**: Brand, neutrales, semánticos (success/warning/danger/info), superficies, texto
- **Tipografía**: Escalas fluidas con `clamp()`, familias, pesos, alturas de línea
- **Espaciado**: Escala base 4px con aliases semánticos
- **Bordes y sombras**: Radio, elevación, focus rings
- **Animaciones**: Duraciones, easings, transiciones predefinidas
- **Layout**: Breakpoints, z-index, container

### Componentes
Componentes vanilla JS accesibles y sin dependencias:
- **Button**: Primary, secondary, ghost, danger, icon, loading states
- **Card**: Header, body, footer, elevated, outlined variants
- **Input**: Text, select, textarea, checkbox, radio, validation states
- **Table**: Sortable, filterable, paginated, virtualized, server-side
- **Modal**: Accessible dialogs, focus trap, ESC to close
- **Dropdown**: Keyboard navigation, type-ahead, positioning
- **Toast**: Notifications, action buttons, auto-dismiss
- **Badge**: Status indicators, counts, variants
- **Side Nav**: Collapsible, nested, role-based filtering

### Características avanzadas
- **Modo oscuro**: Three-state toggle (light/dark/system), localStorage, cross-tab sync
- **Code splitting**: Vendor, components, data-table chunks con lazy loading
- **Bundle budgets**: Vendor+components ≤60KB gz, data-table ≤35KB gz
- **Cache headers**: Long-term caching for vendor, immutable assets
- **Documentación viva**: VitePress con previews interactivos

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Parsear tokens a JSON
npm run tokens:parse
```

## 📦 Uso en Flask (Jinja2)

```jinja
{# base.html #}
{% if request.design_system == 'new' %}
<link rel="stylesheet" href="{{ url_for('static', filename='dist/assets/main.css') }}">
<script type="module" src="{{ url_for('static', filename='dist/assets/main.js') }}"></script>
{% endif %}
```

```html
<!-- Button -->
<button class="c-btn c-btn--primary" data-ds-component="button">Primario</button>

<!-- Card -->
<div class="c-card">
  <div class="c-card__header">Título</div>
  <div class="c-card__body">Contenido</div>
</div>

<!-- Data Table (lazy loaded) -->
<div data-table-lazy data-table-api="/api/data"></div>
```

## 🔗 Enlaces útiles

- [Tokens de color](/tokens/colors) — Paleta completa con valores light/dark
- [Componentes](/components/button) — Previews interactivos y API
- [Guía de modo oscuro](/guides/dark-mode) — Implementación y uso
- [Migración desde Legacy](/guides/migration) — Pasos para migrar
- [Changelog](/changelog) — Historial de versiones
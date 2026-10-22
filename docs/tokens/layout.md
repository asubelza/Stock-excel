---
title: Tokens de Layout
description: Breakpoints, z-index, container y dimensiones de layout
---

# Tokens de Layout

## Breakpoints

Para referencia en JavaScript (CSS usa media queries directamente):

<TokenTable category="layout" filter="breakpoint-" />

### Media queries CSS

```css
@media (max-width: 640px) {   /* --breakpoint-sm */ }
@media (min-width: 768px) {   /* --breakpoint-md */ }
@media (min-width: 1024px) {  /* --breakpoint-lg */ }
@media (min-width: 1280px) {  /* --breakpoint-xl */ }
@media (min-width: 1536px) {  /* --breakpoint-2xl */ }
```

## Z-Index Scale

Capas de apilamiento para posicionamiento:

<TokenTable category="layout" filter="z-index-" />

### Uso

```css
.dropdown { z-index: var(--z-index-dropdown); }        /* 100 */
.sticky-header { z-index: var(--z-index-sticky); }     /* 200 */
.fixed-banner { z-index: var(--z-index-fixed); }       /* 300 */
.sidebar { z-index: var(--z-index-drawer); }           /* 400 */
.modal-backdrop { z-index: var(--z-index-modal-backdrop); } /* 500 */
.modal { z-index: var(--z-index-modal); }              /* 550 */
.popover { z-index: var(--z-index-popover); }          /* 600 */
.tooltip { z-index: var(--z-index-tooltip); }          /* 700 */
.toast { z-index: var(--z-index-toast); }              /* 800 */
.loading-overlay { z-index: var(--z-index-loading-overlay); } /* 900 */
```

## Dimensiones de Layout

<TokenTable category="component" filter="header-,sidebar-,container-" />

### Container

```css
.container {
  max-width: var(--container-max-width);  /* 1400px */
  padding: 0 var(--container-padding);    /* 20px */
  margin: 0 auto;
}

.container-fluid {
  max-width: 100%;
  padding: 0 var(--container-padding);
}

.container-narrow {
  max-width: 800px;
}
```

## Clases utilitarias

```html
<div class="container">Max 1400px centrado</div>
<div class="container-fluid">Ancho completo con padding</div>
<div class="container-narrow">Max 800px para texto</div>
<div class="container-wide">Max 1600px para dashboards</div>
```
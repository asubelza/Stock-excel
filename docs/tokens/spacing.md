---
title: Tokens de Espaciado
description: Escala base 4px con aliases semánticos para layout consistente
---

# Tokens de Espaciado

Sistema de espaciado basado en **4px** como unidad base. Todos los valores son múltiplos de 4px para consistencia visual.

## Escala Base

<TokenTable category="spacing" filter="space-" />

## Aliases Semánticos

Nombres descriptivos para casos de uso comunes:

<TokenTable category="spacing" filter="space-xs,space-sm,space-md,space-lg,space-xl,space-2xl,space-3xl" />

## Uso en CSS

```css
.componente {
  padding: var(--space-md);        /* 16px */
  margin-bottom: var(--space-lg);  /* 24px */
  gap: var(--space-sm);            /* 8px */
}

.card {
  padding: var(--card-padding);    /* 20px (--space-5) */
}

.boton {
  padding: var(--space-2) var(--space-4);  /* 8px 16px */
}
```

## Clases utilitarias

```html
<div class="p-4">Padding 16px</div>
<div class="m-4">Margin 16px</div>
<div class="gap-4">Gap 16px (flex/grid)</div>
<div class="mt-4 mb-2">Margin top/bottom</div>
```

## Responsive spacing

```css
@media (max-width: 640px) {
  .container {
    padding: var(--space-4);  /* 16px en móvil */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--space-6);  /* 24px en desktop */
  }
}
```
---
title: Bordes y Sombras
description: Radio de borde, elevación y sombras semánticas
---

# Bordes y Sombras

## Border Radius

<TokenTable category="border-radius" />

### Uso

```css
.card {
  border-radius: var(--radius-md);      /* 8px */
}

.boton {
  border-radius: var(--btn-border-radius);  /* 4px (--radius-sm) */
}

.badge {
  border-radius: var(--badge-border-radius);  /* 9999px (--radius-full) */
}

.imagen-redonda {
  border-radius: var(--radius-full);
}
```

## Sombras / Elevación

### Niveles base

<TokenTable category="shadow" filter="shadow-level" />

### Aliases semánticos

<TokenTable category="shadow" filter="shadow-card,shadow-elevated,shadow-dropdown,shadow-modal,shadow-overlay,shadow-toast,shadow-focus,shadow-focus-error" />

### Focus rings

```css
:focus-visible {
  box-shadow: var(--shadow-focus);        /* Brand focus ring */
}

[aria-invalid="true"]:focus-visible {
  box-shadow: var(--shadow-focus-error);  /* Error focus ring */
}
```

### Uso en componentes

```css
.c-card {
  box-shadow: var(--shadow-card);
}

.c-dropdown__menu {
  box-shadow: var(--shadow-dropdown);
}

.c-modal__overlay {
  box-shadow: var(--shadow-overlay);
}

.c-toast {
  box-shadow: var(--shadow-toast);
}
```

## Modo alto contraste

En `@media (forced-colors: active)` las sombras se convierten en bordes de 1-2px `CanvasText` para visibilidad.
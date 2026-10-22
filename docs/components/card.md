---
title: Card
description: Contenedores flexibles para agrupar contenido relacionado
---

# Card

Las tarjetas (`Card`) son contenedores flexibles para agrupar contenido relacionado con header, body y footer opcionales.

## Preview interactivo

<ComponentPreview component="card" variant="default" label="Tarjeta de ejemplo" />

## Variantes

### Default
Tarjeta básica con borde sutil.

```html
<div class="c-card">
  <div class="c-card__header">
    <h3 class="c-card__title">Título</h3>
  </div>
  <div class="c-card__body">
    <p>Contenido de la tarjeta</p>
  </div>
  <div class="c-card__footer">
    <button class="c-btn c-btn--primary c-btn--sm">Acción</button>
  </div>
</div>
```

### Elevated
Con sombra más pronunciada para destacar.

```html
<div class="c-card c-card--elevated">
  <div class="c-card__header">
    <h3 class="c-card__title">Tarjeta elevada</h3>
  </div>
  <div class="c-card__body">
    <p>Esta tarjeta tiene más elevación visual</p>
  </div>
</div>
```

### Outlined
Con borde más marcado, sin sombra.

```html
<div class="c-card c-card--outlined">
  <div class="c-card__header">
    <h3 class="c-card__title">Tarjeta con borde</h3>
  </div>
  <div class="c-card__body">
    <p>Borde más visible para separación clara</p>
  </div>
</div>
```

## Estructura

```html
<div class="c-card">
  <!-- Header opcional -->
  <div class="c-card__header">
    <h3 class="c-card__title">Título</h3>
    <div class="c-card__actions">
      <button class="c-btn c-btn--icon c-btn--ghost" aria-label="Más opciones">
        <svg class="c-btn__icon"><use href="#icon-more"></use></svg>
      </button>
    </div>
  </div>

  <!-- Body requerido -->
  <div class="c-card__body">
    <p>Contenido principal</p>
  </div>

  <!-- Footer opcional -->
  <div class="c-card__footer">
    <button class="c-btn c-btn--ghost c-btn--sm">Cancelar</button>
    <button class="c-btn c-btn--primary c-btn--sm">Confirmar</button>
  </div>
</div>
```

## Con imagen

```html
<div class="c-card">
  <img src="imagen.jpg" alt="" class="c-card__image">
  <div class="c-card__header">
    <h3 class="c-card__title">Tarjeta con imagen</h3>
  </div>
  <div class="c-card__body">
    <p>Descripción del contenido visual</p>
  </div>
</div>
```

## Tokens de diseño

```css
--card-padding: var(--space-5);           /* 20px */
--card-border-radius: var(--radius-md);   /* 8px */
--card-border-width: 1px;
--card-border-color: var(--color-border-default);
--card-bg: var(--color-surface-card);
```

### Variantes via tokens
```css
.c-card--elevated {
  box-shadow: var(--shadow-elevated);
}

.c-card--outlined {
  border-width: 2px;
  border-color: var(--color-border-hover);
  box-shadow: none;
}
```

## Clases disponibles

| Clase | Descripción |
|-------|-------------|
| `.c-card` | Contenedor base |
| `.c-card--elevated` | Sombra elevada |
| `.c-card--outlined` | Borde marcado, sin sombra |
| `.c-card__header` | Cabecera con título y acciones |
| `.c-card__title` | Título principal |
| `.c-card__actions` | Acciones en header (align right) |
| `.c-card__image` | Imagen superior (ancho completo) |
| `.c-card__body` | Contenido principal |
| `.c-card__footer` | Pie con acciones |

## Ejemplos completos

### Dashboard metric card
```html
<div class="c-card">
  <div class="c-card__header">
    <h3 class="c-card__title">Usuarios activos</h3>
    <span class="c-badge c-badge--success">+12%</span>
  </div>
  <div class="c-card__body">
    <div class="c-card__metric">2,458</div>
    <p class="c-card__trend">vs mes anterior</p>
  </div>
</div>
```

### Profile card
```html
<div class="c-card">
  <img src="avatar.jpg" alt="" class="c-card__avatar">
  <div class="c-card__header">
    <h3 class="c-card__title">Juan Pérez</h3>
    <p class="c-card__subtitle">Administrador</p>
  </div>
  <div class="c-card__body">
    <p>juan.perez@ecjy.com</p>
    <p class="text-tertiary">Último acceso: hace 2 horas</p>
  </div>
  <div class="c-card__footer">
    <button class="c-btn c-btn--ghost c-btn--sm">Ver perfil</button>
    <button class="c-btn c-btn--primary c-btn--sm">Editar</button>
  </div>
</div>
```

### Card grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="c-card">...</div>
  <div class="c-card">...</div>
  <div class="c-card">...</div>
</div>
```

## Accesibilidad

- **Semántica**: Usa `<article>` o `<section>` si el contenido es independiente
- **Headers**: `c-card__title` debe ser un heading apropiado (`h2`-`h4`)
- **Imágenes**: `c-card__image` requiere `alt` descriptivo
- **Contraste**: Bordes y fondos cumplen WCAG AA

## JavaScript

No requiere inicialización JavaScript. Es puramente CSS.
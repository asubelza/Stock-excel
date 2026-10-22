---
title: Button
description: Botones accesibles con múltiples variantes, tamaños y estados
---

# Button

El componente `Button` proporciona botones accesibles con variantes semánticas, tamaños, estados de carga y soporte para iconos.

## Preview interactivo

<ComponentPreview component="button" variant="primary" size="md" label="Botón primario" />

## Variantes

### Primary
Para la acción principal en una interfaz.

```html
<button class="c-btn c-btn--primary">Primario</button>
```

### Secondary
Para acciones secundarias o alternativas.

```html
<button class="c-btn c-btn--secondary">Secundario</button>
```

### Ghost
Para acciones sutiles o destructivas de bajo énfasis.

```html
<button class="c-btn c-btn--ghost">Ghost</button>
```

### Danger
Para acciones destructivas irreversibles.

```html
<button class="c-btn c-btn--danger">Peligro</button>
```

### Success
Para acciones de confirmación positiva.

```html
<button class="c-btn c-btn--success">Éxito</button>
```

### Warning
Para acciones que requieren precaución.

```html
<button class="c-btn c-btn--warning">Advertencia</button>
```

### Link
Para navegación que parece un enlace pero funciona como botón.

```html
<button class="c-btn c-btn--link">Enlace</button>
```

## Tamaños

```html
<button class="c-btn c-btn--primary c-btn--sm">Pequeño</button>
<button class="c-btn c-btn--primary c-btn--md">Mediano (default)</button>
<button class="c-btn c-btn--primary c-btn--lg">Grande</button>
```

## Estados

### Deshabilitado
```html
<button class="c-btn c-btn--primary" disabled>Deshabilitado</button>
```

### Cargando
```html
<button class="c-btn c-btn--primary" aria-busy="true">
  <span class="c-btn__spinner" aria-hidden="true"></span>
  Cargando...
</button>
```

### Con icono
```html
<button class="c-btn c-btn--primary">
  <svg class="c-btn__icon" aria-hidden="true"><use href="#icon-plus"></use></svg>
  Nuevo
</button>
```

### Solo icono
```html
<button class="c-btn c-btn--icon c-btn--primary" aria-label="Agregar">
  <svg class="c-btn__icon" aria-hidden="true"><use href="#icon-plus"></use></svg>
</button>
```

## API CSS

### Clases base
| Clase | Descripción |
|-------|-------------|
| `.c-btn` | Clase base requerida |
| `.c-btn--{variant}` | Variante: primary, secondary, ghost, danger, success, warning, link |
| `.c-btn--{size}` | Tamaño: sm, md, lg |
| `.c-btn--icon` | Botón solo icono (cuadrado) |

### Tokens de diseño
```css
--btn-height-sm: 32px;
--btn-height-md: 40px;
--btn-height-lg: 48px;
--btn-padding-x-sm: var(--space-3);  /* 12px */
--btn-padding-x-md: var(--space-4);  /* 16px */
--btn-padding-x-lg: var(--space-6);  /* 24px */
--btn-font-size-sm: var(--font-size-caption);
--btn-font-size-md: var(--font-size-body-sm);
--btn-font-size-lg: var(--font-size-body);
--btn-font-weight: var(--font-weight-medium);
--btn-border-radius: var(--radius-sm);
```

## Accesibilidad

- **ARIA**: `aria-busy="true"` para estado de carga, `aria-label` para botones solo icono
- **Focus visible**: Anillo de foco visible con `--shadow-focus`
- **Teclado**: Activable con Enter y Espacio
- **Disabled**: `aria-disabled="true"`, `tabindex="-1"`, cursor not-allowed

## JavaScript

```js
// El botón se auto-inicializa con data-ds-component="button"
// No requiere inicialización manual para funcionalidad básica

// Para estado de carga programático
const btn = document.querySelector('.c-btn');
btn.setAttribute('aria-busy', 'true');
btn.innerHTML = '<span class="c-btn__spinner"></span> Procesando...';

// Restaurar
btn.removeAttribute('aria-busy');
btn.innerHTML = 'Texto original';
```

## Ejemplos de uso

### Formulario con acciones
```html
<div class="c-btn-group c-btn-group--end">
  <button class="c-btn c-btn--ghost" type="button">Cancelar</button>
  <button class="c-btn c-btn--primary" type="submit">Guardar cambios</button>
</div>
```

### Toolbar con iconos
```html
<div class="c-btn-group" role="toolbar" aria-label="Acciones de edición">
  <button class="c-btn c-btn--icon c-btn--ghost" aria-label="Deshacer">
    <svg class="c-btn__icon"><use href="#icon-undo"></use></svg>
  </button>
  <button class="c-btn c-btn--icon c-btn--ghost" aria-label="Rehacer">
    <svg class="c-btn__icon"><use href="#icon-redo"></use></svg>
  </button>
</div>
```

### Estados de validación
```html
<button class="c-btn c-btn--primary" aria-busy="true" disabled>
  <span class="c-btn__spinner" aria-hidden="true"></span>
  Guardando...
</button>
```
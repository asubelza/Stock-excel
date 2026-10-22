---
title: Accesibilidad
description: Guía de accesibilidad WCAG 2.1 AA para componentes y patrones
---

# Accesibilidad

El ECJY Design System está diseñado para cumplir **WCAG 2.1 Level AA** de forma nativa. Esta guía documenta los patrones y responsabilidades.

## Resumen de cumplimiento

| Criterio WCAG | Estado | Implementación |
|---------------|--------|----------------|
| 1.1.1 Non-text Content | ✅ | Iconos decorativos `aria-hidden`, labels en inputs |
| 1.3.1 Info and Relationships | ✅ | HTML semántico, heading hierarchy, landmarks |
| 1.4.3 Contrast (Minimum) | ✅ | Tokens de color validados 4.5:1 AA / 7:1 AAA |
| 1.4.4 Resize Text | ✅ | Unidades `rem`, `clamp()`, zoom hasta 200% |
| 1.4.10 Reflow | ✅ | Layout responsive, no scroll horizontal 320px |
| 2.1.1 Keyboard | ✅ | Todos los componentes navegables por teclado |
| 2.1.2 No Keyboard Trap | ✅ | Focus trap en modales, ESC para cerrar |
| 2.4.3 Focus Order | ✅ | Orden lógico DOM = orden visual |
| 2.4.7 Focus Visible | ✅ | `--shadow-focus` en todos los interactivos |
| 2.5.3 Label in Name | ✅ | Labels visibles = accessible names |
| 3.2.1 On Focus | ✅ | Sin cambios de contexto en focus |
| 3.2.2 On Input | ✅ | Sin submit automático en cambio |
| 4.1.2 Name, Role, Value | ✅ | ARIA roles, states, properties correctos |

## Patrones implementados

### Focus Visible

```css
/* Todos los elementos interactivos */
:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);  /* 3px brand ring */
  border-radius: var(--radius-sm);
}

/* Error state */
[aria-invalid="true"]:focus-visible {
  box-shadow: var(--shadow-focus-error);  /* 3px danger ring */
}
```

### Skip Link

```html
<a href="#main-content" class="skip-link">Saltar al contenido principal</a>
```

### Landmarks

```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Navegación principal">...</nav>
<main role="main" id="main-content">...</main>
<aside role="complementary" aria-label="Navegación lateral">...</aside>
<footer role="contentinfo">...</footer>
```

### Heading Hierarchy

```html
<h1>Página principal</h1>
  <h2>Sección</h2>
    <h3>Subsección</h3>
  <h2>Otra sección</h2>
```

## Componentes y ARIA

### Button
```html
<button class="c-btn c-btn--primary" aria-busy="true" disabled>
  <span class="c-btn__spinner" aria-hidden="true"></span>
  Guardando...
</button>
```

### Input con error
```html
<div class="c-form-group">
  <label class="c-label" for="email">Email</label>
  <input type="email" 
         class="c-input" 
         id="email" 
         aria-invalid="true" 
         aria-describedby="email-error"
         required>
  <p id="email-error" class="c-form-error" role="alert">
    Formato de email inválido
  </p>
</div>
```

### Modal (Dialog)
```html
<div class="c-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="c-modal__overlay" tabindex="-1"></div>
  <div class="c-modal__content">
    <button class="c-modal__close" aria-label="Cerrar">
      <svg aria-hidden="true">...</svg>
    </button>
    <h2 id="modal-title" class="c-modal__title">Confirmar</h2>
    <div class="c-modal__body">...</div>
  </div>
</div>
```

### Dropdown / Menu
```html
<div class="c-dropdown" data-dropdown>
  <button class="c-dropdown__trigger" 
          aria-expanded="false" 
          aria-haspopup="true"
          aria-label="Opciones">
    Acciones
  </button>
  <div class="c-dropdown__menu" role="menu" hidden>
    <a href="#" role="menuitem">Editar</a>
    <a href="#" role="menuitem">Eliminar</a>
  </div>
</div>
```

### Table
```html
<table class="c-table">
  <thead>
    <tr>
      <th scope="col" data-sortable="true">Nombre</th>
      <th scope="col">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Nombre">Juan</td>
      <td data-label="Email">juan@ejemplo.com</td>
    </tr>
  </tbody>
</table>
```

### Alert / Toast
```html
<!-- Alert inline (no se auto-cierra) -->
<div class="c-alert c-alert--danger" role="alert">
  <svg class="c-alert__icon" aria-hidden="true">...</svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Error</p>
    <p>No se pudo guardar</p>
  </div>
</div>

<!-- Toast (auto-cierra, contenedor global) -->
<div class="c-toast-container" aria-live="polite" aria-label="Notificaciones">
  <div class="c-toast c-toast--success" role="status">
    <svg class="c-toast__icon" aria-hidden="true">...</svg>
    <div class="c-toast__message">Guardado correctamente</div>
  </div>
</div>
```

## Navegación por teclado

| Componente | Teclas | Acción |
|------------|--------|--------|
| Button | Enter, Space | Activar |
| Link | Enter | Navegar |
| Input | Tab | Siguiente campo |
| Select | Space, Arrows | Abrir/Seleccionar |
| Dropdown | Enter/Space, Arrows, Esc | Abrir, navegar, cerrar |
| Modal | Tab (trap), Esc | Navegar, cerrar |
| Tabs | Arrows, Home, End | Cambiar tab |
| Table (virtualized) | Arrows, Home, End | Navegar filas |
| Toast | Esc | Cerrar (opcional) |

## Focus Trap en Modales

```js
// Implementación en modal.js
function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    if (e.key === 'Escape') closeModal();
  });
  
  first?.focus();
}
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```js
// Respetar en JavaScript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  element.animate(keyframes, { duration: 300 });
}
```

## High Contrast Mode (Windows)

```css
@media (forced-colors: active) {
  :root {
    --color-focus-ring: CanvasText;
    --color-border-default: CanvasText;
    --shadow-focus: 0 0 0 3px CanvasText;
    --shadow-card: 0 0 0 1px CanvasText;
  }
  
  .c-btn {
    border: 1px solid CanvasText;
    background: Canvas;
  }
  
  .c-btn--primary {
    background: CanvasText;
    color: Canvas;
  }
}
```

## Screen Readers

### Texto solo para screen readers
```css
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
```

### Live Regions
```html
<!-- Polite: no interrumpe -->
<div aria-live="polite" aria-label="Notificaciones">...</div>

<!-- Assertive: interrumpe (solo errores críticos) -->
<div aria-live="assertive" aria-label="Errores">...</div>
```

### ARIA Labels vs Labelledby
```html
<!-- Label visible = accessible name -->
<label for="search">Buscar</label>
<input id="search" ...>

<!-- Sin label visible -->
<button aria-label="Cerrar diálogo">×</button>

<!-- Labelledby para elementos compuestos -->
<div role="alert" aria-labelledby="alert-title">
  <h3 id="alert-title">Error</h3>
  <p>Descripción...</p>
</div>
```

## Testing de accesibilidad

### Automatizado
```bash
# axe-core en CI
npm install @axe-core/playwright
npx playwright test --project=accessibility
```

### Manual (checklist)
- [ ] Navegar solo con teclado (Tab, Shift+Tab, Enter, Space, Esc, Arrows)
- [ ] Verificar focus visible en todos los interactivos
- [ ] Probar con screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verificar zoom 200% sin scroll horizontal
- [ ] Probar modo alto contraste (Windows)
- [ ] Verificar `prefers-reduced-motion`
- [ ] Validar HTML con W3C Validator
- [ ] Ejecutar axe DevTools en navegador

### Herramientas recomendadas
- **axe DevTools** (extensión navegador)
- **WAVE** (extensión navegador)
- **Lighthouse** (auditoría integrada)
- **NVDA** (screen reader gratuito Windows)
- **VoiceOver** (macOS/iOS integrado)
- **Colour Contrast Analyser** (TPGi)

## Responsabilidades del desarrollador

El design system provee la base, pero **tú eres responsable de**:

1. **Estructura semántica** — Usa `<main>`, `<nav>`, `<header>`, `<footer>`, headings correctos
2. **Labels en formularios** — Siempre `<label for="id">` + `input#id`
3. **Texto alternativo** — `alt` descriptivo en imágenes informativas
4. **Contraste en contenido** — Textos personalizados sobre fondos tokenizados
5. **Orden de foco** — DOM order = visual order
6. **Estados ARIA** — `aria-invalid`, `aria-expanded`, `aria-selected` dinámicos
7. **Live regions** — Para actualizaciones dinámicas (toasts, validación async)

## Recursos

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
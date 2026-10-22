---
title: Input
description: Campos de formulario accesibles con validación, estados y variantes
---

# Input

Componentes de formulario accesibles: text, email, password, search, textarea, select, checkbox, radio.

## Preview interactivo

<ComponentPreview component="input" variant="text" size="md" label="Campo de texto" />

## Tipos de input

### Text / Email / Password / Search
```html
<div class="c-form-group">
  <label class="c-label" for="email">Correo electrónico</label>
  <input type="email" class="c-input" id="email" placeholder="usuario@ejemplo.com" required>
</div>
```

### Textarea
```html
<div class="c-form-group">
  <label class="c-label" for="mensaje">Mensaje</label>
  <textarea class="c-textarea" id="mensaje" rows="4" placeholder="Escribe tu mensaje..."></textarea>
</div>
```

### Select
```html
<div class="c-form-group">
  <label class="c-label" for="pais">País</label>
  <select class="c-select" id="pais">
    <option value="">Seleccionar país</option>
    <option value="ar">Argentina</option>
    <option value="uy">Uruguay</option>
    <option value="br">Brasil</option>
  </select>
</div>
```

### Checkbox
```html
<div class="c-form-group">
  <label class="c-checkbox">
    <input type="checkbox" class="c-checkbox__input">
    <span class="c-checkbox__box" aria-hidden="true">
      <svg class="c-checkbox__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
    <span class="c-checkbox__label">Acepto los términos</span>
  </label>
</div>
```

### Radio
```html
<fieldset class="c-form-group">
  <legend class="c-label">Plan</legend>
  <div class="c-radio-group">
    <label class="c-radio">
      <input type="radio" name="plan" class="c-radio__input" value="free">
      <span class="c-radio__box" aria-hidden="true"></span>
      <span class="c-radio__label">Gratis</span>
    </label>
    <label class="c-radio">
      <input type="radio" name="plan" class="c-radio__input" value="pro">
      <span class="c-radio__box" aria-hidden="true"></span>
      <span class="c-radio__label">Pro</span>
    </label>
  </div>
</fieldset>
```

## Tamaños

```html
<input type="text" class="c-input c-input--sm" placeholder="Pequeño">
<input type="text" class="c-input c-input--md" placeholder="Mediano (default)">
<input type="text" class="c-input c-input--lg" placeholder="Grande">
```

## Estados

### Con error
```html
<div class="c-form-group">
  <label class="c-label" for="email-error">Email</label>
  <input type="email" class="c-input" id="email-error" aria-invalid="true" aria-describedby="email-error-msg" value="invalido">
  <p id="email-error-msg" class="c-form-error">Formato de email inválido</p>
</div>
```

### Deshabilitado
```html
<input type="text" class="c-input" disabled placeholder="Deshabilitado">
```

### Solo lectura
```html
<input type="text" class="c-input" readonly value="Solo lectura">
```

### Con icono
```html
<div class="c-input-wrapper">
  <svg class="c-input__icon" aria-hidden="true"><use href="#icon-search"></use></svg>
  <input type="search" class="c-input" placeholder="Buscar...">
</div>
```

## Tokens de diseño

```css
--input-height-sm: 32px;
--input-height-md: 40px;
--input-height-lg: 48px;
--input-padding-x: var(--space-3);     /* 12px */
--input-padding-y: var(--space-2);     /* 8px */
--input-font-size: var(--font-size-body-sm);
--input-border-width: 1px;
--input-border-radius: var(--radius-sm);  /* 4px */
--input-placeholder-color: var(--color-text-tertiary);
```

## Clases disponibles

| Clase | Descripción |
|-------|-------------|
| `.c-input` | Input base (text, email, password, etc.) |
| `.c-input--sm` | Tamaño pequeño (32px) |
| `.c-input--md` | Tamaño mediano (40px) |
| `.c-input--lg` | Tamaño grande (48px) |
| `.c-textarea` | Textarea |
| `.c-select` | Select nativo |
| `.c-label` | Label asociado |
| `.c-form-group` | Wrapper label + input + error |
| `.c-form-error` | Mensaje de error |
| `.c-form-hint` | Texto de ayuda |
| `.c-checkbox` | Checkbox wrapper |
| `.c-radio` | Radio wrapper |
| `.c-input-wrapper` | Input con icono |

## Validación

### HTML5 nativo
```html
<input type="email" class="c-input" required pattern="[^@]+@[^@]+\.[^@]+" title="Email válido requerido">
```

### Con JavaScript (form-validation.js)
```html
<form class="c-form" novalidate>
  <div class="c-form-group">
    <label class="c-label" for="email">Email</label>
    <input type="email" class="c-input" id="email" name="email" required data-validate="email">
  </div>
  <button class="c-btn c-btn--primary" type="submit">Enviar</button>
</form>

<script type="module">
  import { FormValidation } from '/static/dist/assets/components.js';
  new FormValidation(document.querySelector('.c-form'));
</script>
```

## Accesibilidad

- **Labels**: Siempre asociar `<label for="id">` con `input#id`
- **Errores**: `aria-invalid="true"` + `aria-describedby="error-id"`
- **Requeridos**: `required` + `aria-required="true"`
- **Focus visible**: Anillo `--shadow-focus` (brand) / `--shadow-focus-error` (error)
- **Autocomplete**: Usar `autocomplete` apropiado (`email`, `current-password`, `off`)

## Ejemplos completos

### Login form
```html
<form class="c-form c-form--login" novalidate>
  <div class="c-form-group">
    <label class="c-label" for="email">Correo</label>
    <input type="email" class="c-input" id="email" name="email" required autocomplete="email">
  </div>
  <div class="c-form-group">
    <label class="c-label" for="password">Contraseña</label>
    <div class="c-input-wrapper">
      <input type="password" class="c-input" id="password" name="password" required autocomplete="current-password">
      <button type="button" class="c-input__toggle" aria-label="Mostrar contraseña">
        <svg class="c-input__toggle-icon"><use href="#icon-eye"></use></svg>
      </button>
    </div>
  </div>
  <div class="c-form-group">
    <label class="c-checkbox">
      <input type="checkbox" class="c-checkbox__input" name="remember">
      <span class="c-checkbox__box" aria-hidden="true"><svg class="c-checkbox__check" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
      <span class="c-checkbox__label">Recordarme</span>
    </label>
  </div>
  <button class="c-btn c-btn--primary c-btn--lg" type="submit" style="width: 100%;">Iniciar sesión</button>
</form>
```

### Search input (top bar)
```html
<div class="c-search-input" role="search">
  <label for="top-search" class="visually-hidden">Buscar</label>
  <input type="search" class="c-search-input__field" id="top-search" placeholder="Buscar..." autocomplete="off">
  <svg class="c-search-input__icon" aria-hidden="true"><use href="#icon-search"></use></svg>
  <button type="button" class="c-search-input__clear" aria-label="Limpiar búsqueda" hidden>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  </button>
</div>
```
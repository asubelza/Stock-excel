---
title: Modo Oscuro
description: Implementación y uso del modo oscuro (light/dark/system)
---

# Modo Oscuro

El ECJY Design System incluye soporte nativo para modo oscuro con tres estados: **light**, **dark** y **system** (sigue preferencia del SO).

## Cómo funciona

### 1. FOUC Prevention (inline script en `<head>`)

```html
<script>
  (function() {
    try {
      var theme = localStorage.getItem('ecjy_theme');
      if (theme === 'dark' || theme === 'light' || theme === 'system') {
        document.documentElement.setAttribute('data-theme', theme);
      } else {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
    } catch (_) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
</script>
```

Este script **debe ir en `<head>` antes de cualquier CSS** para evitar flash de contenido sin estilo (FOUC).

### 2. CSS Tokens para Dark Mode

En `tokens.css`, los valores oscuros están en media query:

```css
@media (prefers-color-scheme: dark) {
  :root[data-theme="dark"] {
    --color-surface-card: var(--color-neutral-800);
    --color-surface-elevated: var(--color-neutral-800);
    --color-surface-input: var(--color-neutral-700);
    --color-text-primary: var(--color-neutral-50);
    --color-text-secondary: var(--color-neutral-300);
    --color-border-default: var(--color-neutral-700);
    /* ... más tokens ... */
  }
}
```

### 3. ThemeProvider (JavaScript)

```js
// Inicialización automática al cargar main.js
// Expone: window.ThemeProvider

// Obtener tema actual
const theme = ThemeProvider.getTheme();        // 'light' | 'dark' | 'system'
const resolved = ThemeProvider.getResolvedTheme(); // 'light' | 'dark' (nunca 'system')

// Cambiar tema
ThemeProvider.setTheme('dark');     // Forzar oscuro
ThemeProvider.setTheme('light');    // Forzar claro
ThemeProvider.setTheme('system');   // Seguir preferencia del SO

// Toggle rápido (light ↔ dark)
ThemeProvider.toggleTheme();

// Ciclo completo (light → dark → system → light)
ThemeProvider.cycleTheme();
```

## Toggle en UI

El tema se integra en el menú de usuario (avatar dropdown):

```html
{# En nav.html macro render_top_bar #}
<div class="c-top-bar__user-item c-top-bar__theme-toggle" role="menuitem" tabindex="0">
  <span class="c-top-bar__user-item-icon">
    <svg class="c-top-bar__theme-icon-sun">...</svg>      <!-- Light -->
    <svg class="c-top-bar__theme-icon-moon" hidden>...</svg>  <!-- Dark -->
    <svg class="c-top-bar__theme-icon-system" hidden>...</svg> <!-- System -->
  </span>
  <span class="c-top-bar__user-item-label">Tema</span>
  <span class="c-top-bar__theme-current" aria-live="polite"></span>
</div>
```

El JavaScript en `theme-provider.js` maneja:
- Click → `cycleTheme()`
- Actualización de iconos y label
- Cierre del dropdown tras selección
- Sincronización cross-tab

## Persistencia

| Storage | Clave | Uso |
|---------|-------|-----|
| `localStorage` | `ecjy_theme` | Persistente entre sesiones |
| `sessionStorage` | `design_system` | Solo sesión actual (feature flag) |

El ThemeProvider guarda en `localStorage` por defecto al llamar `setTheme()`.

## Sincronización Cross-tab

```js
// Automático via storage event
window.addEventListener('storage', (e) => {
  if (e.key === 'ecjy_theme' && e.newValue !== ThemeProvider.getTheme()) {
    ThemeProvider._theme = e.newValue;
    ThemeProvider.applyTheme(e.newValue);
  }
});
```

Cambiar tema en una pestaña actualiza todas las pestañas abiertas instantáneamente.

## Detección de preferencia del sistema

```js
// Listener automático para prefers-color-scheme
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => {
  if (ThemeProvider.getTheme() === 'system') {
    ThemeProvider.applyTheme('system');
  }
});
```

Si el usuario tiene `system` seleccionado y cambia la preferencia del SO, la UI se adapta automáticamente.

## CSS: Usar tokens (no valores hardcodeados)

```css
/* ❌ Malo - no responde a tema */
.mi-componente {
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
}

/* ✅ Bueno - usa tokens semánticos */
.mi-componente {
  background: var(--color-surface-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

/* ✅ Hover/focus states */
.mi-componente:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-hover);
}

.mi-componente:focus-visible {
  box-shadow: var(--shadow-focus);
}
```

## Componentes que respetan tema

Todos los componentes base usan tokens semánticos:

- `c-btn` — fondos, bordes, texto
- `c-card` — `--card-bg`, `--card-border-color`
- `c-input` — `--input-border-color`, `--color-surface-input`
- `c-table` — `--table-header-bg`, `--table-row-hover-bg`, `--table-border-color`
- `c-alert` — colores semánticos por variante
- `c-dropdown` — `--color-surface-elevated`, `--shadow-dropdown`
- `c-modal` — `--color-surface-elevated`, `--shadow-modal`

## Testing

```bash
# Forzar tema via query param
# http://localhost:5000/?design=new&theme=dark
# http://localhost:5000/?design=new&theme=light
# http://localhost:5000/?design=new&theme=system
```

```js
// En DevTools console
ThemeProvider.setTheme('dark');
ThemeProvider.setTheme('system');
console.log(ThemeProvider.getResolvedTheme());
```

## Accesibilidad

- **Contraste**: Todos los pares token-fondo cumplen WCAG AA en ambos temas
- **Preferencia usuario**: Respeta `prefers-color-scheme`
- **Alto contraste**: Soporte `@media (forced-colors: active)`
- **Reduced motion**: Animaciones desactivadas en `@media (prefers-reduced-motion: reduce)`

## Migración desde legacy

```css
/* Legacy hardcodeado */
.header { background: #2c3e50; color: white; }
.card { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.1); }

/* Con tokens (funciona en ambos temas) */
.header { background: var(--color-neutral-900); color: var(--color-text-inverse); }
.card { background: var(--color-surface-card); box-shadow: var(--shadow-card); }
```
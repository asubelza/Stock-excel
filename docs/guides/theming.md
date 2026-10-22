---
title: Temática y Personalización
description: Cómo personalizar el design system con tokens y CSS custom properties
---

# Temática y Personalización

El ECJY Design System está construido sobre **CSS Custom Properties (tokens)**. Toda la personalización se hace sobrescribiendo tokens, no reescribiendo CSS.

## Arquitectura de tokens

```
:root {
  /* Primitivos - Valores base */
  --color-brand-500: #3b82f6;
  --space-4: 16px;
  --font-size-body: 1rem;
  
  /* Semánticos - Referencian primitivos */
  --color-primary: var(--color-brand-500);
  --color-focus-ring: var(--color-brand-500);
  --space-md: var(--space-4);
  
  /* Componentes - Referencian semánticos */
  --btn-bg-primary: var(--color-primary);
  --input-border-color: var(--color-border-default);
}
```

## Personalización básica

### Cambiar color de marca

```css
/* En tu CSS global, ANTES de importar base.css */
:root {
  --color-brand-500: #8b5cf6;      /* Púrpura en lugar de azul */
  --color-brand-600: #7c3aed;
  --color-brand-700: #6d28d9;
}

/* O solo el token semántico principal */
:root {
  --color-primary: #8b5cf6;
  --color-focus-ring: #8b5cf6;
}
```

### Cambiar escala de espaciado

```css
:root {
  /* Cambiar unidad base (default: 4px) */
  --space-1: 8px;    /* Ahora 8px base */
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  /* ... */
  
  /* O solo aliases semánticos */
  --space-md: 24px;  /* era 16px */
  --space-lg: 32px;  /* era 24px */
}
```

### Cambiar tipografía

```css
:root {
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  
  /* Escalas fluidas personalizadas */
  --font-size-h1: clamp(2.5rem, 4vw + 1rem, 3.5rem);
  --font-size-body: clamp(1rem, 0.5vw + 1rem, 1.125rem);
}
```

### Border radius global

```css
:root {
  --radius-sm: 2px;    /* Más angular */
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-full: 9999px;
  
  /* Componentes heredan automáticamente */
  --btn-border-radius: var(--radius-sm);
  --input-border-radius: var(--radius-sm);
  --card-border-radius: var(--radius-md);
}
```

## Personalización por componente

### Botones

```css
:root {
  /* Solo botones primary */
  --btn-bg-primary: var(--color-brand-600);
  --btn-text-primary: var(--color-text-inverse);
  --btn-hover-primary: var(--color-brand-700);
  
  /* Bordes */
  --btn-border-width: 2px;
  --btn-border-primary: transparent;
}
```

### Inputs

```css
:root {
  --input-border-color: var(--color-border-default);
  --input-border-focus: var(--color-brand-500);
  --input-border-error: var(--color-danger-500);
  --input-bg: var(--color-surface-input);
  --input-placeholder-color: var(--color-text-tertiary);
}
```

### Cards

```css
:root {
  --card-bg: var(--color-surface-card);
  --card-border-color: var(--color-border-default);
  --card-shadow: var(--shadow-card);
  --card-radius: var(--radius-md);
  --card-padding: var(--space-5);
}
```

## Temas completos (ejemplo: tema "Oscuro corporativo")

```css
/* themes/corporate-dark.css */
@layer theme {
  :root {
    /* Brand */
    --color-brand-500: #0ea5e9;    /* Sky blue */
    --color-brand-600: #0284c7;
    --color-brand-700: #0369a1;
    
    /* Surfaces - más oscuros que default */
    --color-surface-card: #0f172a;       /* neutral-900 */
    --color-surface-elevated: #1e293b;   /* neutral-800 */
    --color-surface-input: #1e293b;
    --color-surface-hover: #334155;      /* neutral-700 */
    
    /* Text - alto contraste */
    --color-text-primary: #f8fafc;       /* neutral-50 */
    --color-text-secondary: #cbd5e1;     /* neutral-300 */
    --color-text-tertiary: #94a3b8;      /* neutral-400 */
    
    /* Borders */
    --color-border-default: #334155;     /* neutral-700 */
    --color-border-hover: #475569;       /* neutral-600 */
    
    /* Shadows - más suaves en dark */
    --shadow-card: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-elevated: 0 4px 12px rgba(0,0,0,0.4);
    --shadow-dropdown: 0 8px 24px rgba(0,0,0,0.5);
    
    /* Focus */
    --color-focus-ring: var(--color-brand-500);
    --color-focus-ring-offset: var(--color-surface-card);
  }
  
  /* Forzar modo oscuro para este tema */
  :root[data-theme="dark"] {
    /* Los valores arriba ya son oscuros */
  }
}
```

```html
<!-- Aplicar tema -->
<link rel="stylesheet" href="themes/corporate-dark.css">
```

## Runtime theming (JavaScript)

```js
// Cambiar tokens en runtime
DesignSystem.setToken('color-brand-500', '#8b5cf6');
DesignSystem.setToken('space-4', '20px');

// Múltiples tokens
DesignSystem.setTokens({
  'color-brand-500': '#8b5cf6',
  'color-brand-600': '#7c3aed',
  'radius-md': '12px',
});

// En elemento específico (scoped theming)
const panel = document.querySelector('.mi-panel');
DesignSystem.setToken('color-brand-500', '#8b5cf6', panel);
```

## CSS Layers para organización

```css
/* 1. Tokens base (design system) */
@layer tokens {
  @import 'tokens.css';
}

/* 2. Estilos base + componentes */
@layer base {
  @import 'base.css';
}

/* 3. Temas personalizados */
@layer theme {
  @import 'themes/corporate-dark.css';
}

/* 4. Utilidades */
@layer utilities {
  @import 'utilities.css';
}

/* 5. Overrides de aplicación */
@layer app {
  .mi-app-custom { ... }
}
```

## Mejores prácticas

1. **Sobrescribe en `:root`** antes de importar base.css
2. **Usa tokens semánticos** (`--color-primary`) no primitivos (`--color-brand-500`) en tu CSS
3. **Agrupa overrides** en un archivo `theme.css` por tema
4. **Testea en ambos modos** (light/dark) tras cambios
5. **Documenta tus tokens** personalizados en la documentación del proyecto

## Herramientas

```bash
# Ver tokens actuales en runtime
console.table(DesignSystem.getTokens(
  'color-brand-500',
  'color-primary',
  'space-4',
  'radius-md'
));

# Generar JSON de tokens personalizados
npm run tokens:parse
# Lee tokens.css + tus overrides si los importas antes
```
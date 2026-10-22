---
title: Tokens de Color
description: Paleta completa de colores con valores light/dark mode
---

# Tokens de Color

El sistema de colores ECJY está organizado en escalas semánticas. Cada token es una CSS custom property que puede referenciarse directamente en tus estilos.

## Brand Colors

Extraídos del logo ECJY. Usados para acciones primarias, enlaces y elementos de marca.

<TokenTable category="color" filter="brand" />

## Neutral Scale

Escala de grises para fondos, bordes y jerarquía de texto. 9 pasos desde blanco puro hasta casi negro.

<TokenTable category="color" filter="neutral" />

## Semantic Colors

Colores con significado específico para estados de la interfaz.

### Success
<TokenTable category="color" filter="success" />

### Warning
<TokenTable category="color" filter="warning" />

### Danger
<TokenTable category="color" filter="danger" />

### Info
<TokenTable category="color" filter="info" />

## Surface Colors

Para capas y superposiciones (cards, modals, overlays, inputs).

<TokenTable category="color" filter="surface" />

## State Colors

Estados interactivos: focus, bordes, validación.

<TokenTable category="color" filter="border" />
<TokenTable category="color" filter="focus" />

## Text Colors

Jerarquía tipográfica: primary, secondary, tertiary, inverse, link, disabled, semantic.

<TokenTable category="color" filter="text" />

## Dark Mode

Todos los tokens de color tienen valores correspondientes en modo oscuro. El modo oscuro se activa automáticamente vía:

```css
@media (prefers-color-scheme: dark) {
  :root[data-theme="dark"] {
    /* Valores oscuros aplicados automáticamente */
  }
}
```

O programáticamente:
```js
// Toggle tema
DesignSystem.ThemeProvider.setTheme('dark');  // 'light' | 'dark' | 'system'

// Obtener valor resuelto
const resolved = DesignSystem.ThemeProvider.getResolvedTheme(); // 'light' | 'dark'
```

## Uso en CSS

```css
.mi-componente {
  background: var(--color-surface-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

.mi-componente:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-hover);
}

.mi-componente:focus-visible {
  box-shadow: var(--shadow-focus);
}
```

## Uso en JavaScript

```js
// Obtener valor de token
const primaryColor = DesignSystem.getToken('color-brand-500'); // '#3b82f6'

// Múltiples tokens
const colors = DesignSystem.getTokens(
  'color-brand-500',
  'color-neutral-100',
  'space-4'
);
// { 'color-brand-500': '#3b82f6', 'color-neutral-100': '#f1f5f9', 'space-4': '16px' }

// Sobrescribir en runtime
DesignSystem.setToken('color-brand-500', '#custom-color');
```

## Accesibilidad

- **Contraste**: Todos los pares texto/fondo cumplen WCAG 2.1 AA (4.5:1) o AAA (7:1)
- **Modo alto contraste**: Soporte nativo vía `@media (forced-colors: active)`
- **Reduced motion**: Animaciones se desactivan vía `@media (prefers-reduced-motion: reduce)`
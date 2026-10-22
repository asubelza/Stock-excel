---
title: Animaciones y Transiciones
description: Duraciones, easings, transiciones predefinidas y keyframes
---

# Animaciones y Transiciones

## Duraciones

<TokenTable category="animation" filter="duration-" />

## Easings

<TokenTable category="animation" filter="easing-" />

## Transiciones predefinidas

<TokenTable category="animation" filter="transition-" />

## Keyframe durations

<TokenTable category="animation" filter="duration-fade,duration-slide,duration-scale,duration-pulse" />

## Uso en CSS

```css
/* Transiciones simples */
.mi-elemento {
  transition: var(--transition-colors);
}

.mi-elemento:hover {
  background: var(--color-surface-hover);
}

/* Transiciones compuestas */
.tarjeta {
  transition: var(--transition-all);
}

.tarjeta:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}

/* Solo transform (para animaciones performantes) */
.animar-transform {
  transition: var(--transition-transform);
}

/* Solo sombras */
.animar-sombra {
  transition: var(--transition-shadow);
}
```

## Animaciones con keyframes

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { 
    opacity: 0; 
    transform: translateY(var(--space-4)); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes scale-in {
  from { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Aplicar con duraciones tokenizadas */
.fade-in {
  animation: fade-in var(--duration-fade-in) var(--easing-ease-out);
}

.slide-up {
  animation: slide-up var(--duration-slide) var(--easing-ease-out);
}

.scale-in {
  animation: scale-in var(--duration-scale) var(--easing-spring);
}

.pulse {
  animation: pulse var(--duration-pulse) var(--easing-ease-in-out) infinite;
}
```

## Clases utilitarias

```html
<div class="transition-fast">Transición rápida (80ms)</div>
<div class="transition-normal">Transición normal (120ms)</div>
<div class="transition-slow">Transición lenta (150ms)</div>
<div class="transition-colors">Solo colores</div>
<div class="transition-transform">Solo transform</div>
<div class="transition-shadow">Solo sombras</div>
<div class="transition-all">Todo</div>
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
  }
  
  .animate-fade,
  .animate-slide,
  .animate-scale,
  .animate-pulse {
    animation: none !important;
    transition: none !important;
  }
}
```

## JavaScript

```js
// Duraciones disponibles
DesignSystem.getTokens(
  'duration-fast',    // '80ms'
  'duration-normal',  // '120ms'
  'duration-slow',    // '150ms'
  'easing-ease-out'   // 'cubic-bezier(0, 0, 0.2, 1)'
);
```
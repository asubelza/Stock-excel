---
title: Tokens de Tipografía
description: Escalas tipográficas fluidas, familias, pesos y alturas de línea
---

# Tokens de Tipografía

La tipografía ECJY usa una **escala fluida** con `clamp()` para adaptarse automáticamente al viewport sin media queries.

## Familias de Fuente

<TokenTable category="typography" filter="font-family" />

## Tamaños de Fuente (Fluid Scale)

Todos los tamaños usan `clamp(min, preferred, max)` para responsividad nativa:

<TokenTable category="typography" filter="font-size" />

### Tabla de referencia visual

| Token | Clamp | Móvil (~375px) | Tablet (~768px) | Desktop (~1440px) |
|-------|-------|----------------|-----------------|-------------------|
| `--font-size-display` | `clamp(2.5rem, 5vw + 1rem, 3rem)` | 40px | 48px | 48px |
| `--font-size-h1` | `clamp(2rem, 3vw + 1rem, 2.5rem)` | 32px | 40px | 40px |
| `--font-size-h2` | `clamp(1.5rem, 2vw + 1rem, 2rem)` | 24px | 32px | 32px |
| `--font-size-h3` | `clamp(1.25rem, 1.5vw + 1rem, 1.5rem)` | 20px | 24px | 24px |
| `--font-size-body-lg` | `clamp(1.125rem, 1vw + 1rem, 1.25rem)` | 18px | 20px | 20px |
| `--font-size-body` | `clamp(1rem, 0.5vw + 0.9rem, 1.125rem)` | 16px | 18px | 18px |
| `--font-size-body-sm` | `clamp(0.875rem, 0.3vw + 0.8rem, 1rem)` | 14px | 16px | 16px |
| `--font-size-caption` | `clamp(0.75rem, 0.2vw + 0.7rem, 0.875rem)` | 12px | 14px | 14px |

## Alturas de Línea

<TokenTable category="typography" filter="line-height" />

## Pesos de Fuente

<TokenTable category="typography" filter="font-weight" />

## Espaciado de Letras

<TokenTable category="typography" filter="letter-spacing" />

## Uso en CSS

```css
.titulo-principal {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  font-family: var(--font-family-sans);
}

.texto-cuerpo {
  font-size: var(--font-size-body);
  line-height: var(--line-height-relaxed);
  font-weight: var(--font-weight-normal);
}

.codigo {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-mono);
}
```

## Clases utilitarias

```html
<h1 class="text-h1 font-semibold">Título H1</h1>
<h2 class="text-h2 font-semibold">Título H2</h2>
<p class="text-body text-secondary">Texto cuerpo secundario</p>
<small class="text-caption text-tertiary">Caption</small>
<code class="font-mono">código inline</code>
```

## Accesibilidad

- **Tamaño mínimo**: 16px (1rem) para texto de cuerpo
- **Escalado**: Respeta `prefers-reduced-motion` y zoom del navegador
- **Contraste**: Combinado con tokens de color cumple WCAG AA/AAA
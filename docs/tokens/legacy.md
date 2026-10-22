---
title: Tokens Legacy
description: Mapeo de colores legacy para migración gradual
---

# Tokens Legacy

Estos tokens mapean a los valores hardcodeados del sistema anterior para facilitar la migración gradual.

<TokenTable category="legacy" />

## Mapeo visual

| Legacy Token | Valor | Uso recomendado |
|-------------|-------|-----------------|
| `--legacy-primary` | `#2c3e50` | Headers, navegación principal |
| `--legacy-primary-btn` | `#3498db` | Botones primarios |
| `--legacy-primary-btn-hover` | `#2980b9` | Hover botones primarios |
| `--legacy-success` | `#27ae60` | Estados éxito |
| `--legacy-success-hover` | `#219a52` | Hover éxito |
| `--legacy-danger` | `#e74c3c` | Estados error/peligro |
| `--legacy-danger-hover` | `#c0392b` | Hover peligro |
| `--legacy-warning` | `#f39c12` | Advertencias |
| `--legacy-purple` | `#9b59b6` | Elementos secundarios |
| `--legacy-body-bg` | `#f0f0f0` | Fondo body legacy |
| `--legacy-card-bg` | `#ffffff` | Fondo tarjetas legacy |
| `--legacy-muted-bg` | `#f8f9fa` | Fondos sutiles |
| `--legacy-text-muted` | `#555` | Texto secundario legacy |
| `--legacy-text-placeholder` | `#999` | Placeholders legacy |

## Migración

### Antes (Legacy)
```css
.header {
  background: #2c3e50;
  color: white;
}

.btn-primary {
  background: #3498db;
}

.btn-primary:hover {
  background: #2980b9;
}

.card {
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

### Después (Design System)
```css
.header {
  background: var(--legacy-primary);  /* o var(--color-neutral-900) */
  color: var(--color-text-inverse);
}

.btn-primary {
  background: var(--legacy-primary-btn);  /* o var(--color-brand-600) */
}

.btn-primary:hover {
  background: var(--legacy-primary-btn-hover);  /* o var(--color-brand-700) */
}

.card {
  background: var(--legacy-card-bg);  /* o var(--color-surface-card) */
  box-shadow: var(--shadow-card);
}
```

## Estrategia de migración

1. **Fase 1**: Reemplazar valores hardcodeados por tokens legacy
2. **Fase 2**: Migrar tokens legacy a tokens semánticos nuevos
3. **Fase 3**: Eliminar tokens legacy cuando no haya referencias

```js
// Buscar referencias legacy en el código
grep -r "legacy-" static/src/css/ --include="*.css"
grep -r "#2c3e50\|#3498db\|#27ae60\|#e74c3c" static/src/ --include="*.css" --include="*.js"
```

## Deprecación

Estos tokens están marcados como `deprecated: true` en el JSON de tokens. En el futuro se eliminarán.
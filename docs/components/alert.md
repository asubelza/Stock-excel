---
title: Alert
description: Alertas accesibles para mensajes informativos, éxito, advertencia y error
---

# Alert

Las alertas (`Alert`) comunican mensajes importantes al usuario sin interrumpir su flujo de trabajo.

## Preview interactivo

<ComponentPreview component="alert" variant="info" label="Este es un mensaje informativo" />

## Variantes

### Info
Para información general, consejos o ayuda contextual.

```html
<div class="c-alert c-alert--info" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Información</p>
    <p>Tu sesión expirará en 5 minutos.</p>
  </div>
</div>
```

### Success
Para confirmar acciones completadas exitosamente.

```html
<div class="c-alert c-alert--success" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Éxito</p>
    <p>Los cambios se guardaron correctamente.</p>
  </div>
</div>
```

### Warning
Para advertencias que requieren atención pero no son errores.

```html
<div class="c-alert c-alert--warning" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Advertencia</p>
    <p>Estás a punto de eliminar un registro. Esta acción no se puede deshacer.</p>
  </div>
</div>
```

### Danger / Error
Para errores que impiden completar una acción.

```html
<div class="c-alert c-alert--danger" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Error</p>
    <p>No se pudo conectar con el servidor. Intenta de nuevo.</p>
  </div>
  <button class="c-alert__action c-btn c-btn--ghost c-btn--sm" onclick="retry()">Reintentar</button>
</div>
```

## Con acción

```html
<div class="c-alert c-alert--info" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Nueva versión disponible</p>
    <p>Hay una actualización con mejoras de rendimiento.</p>
  </div>
  <a href="/actualizar" class="c-alert__action c-btn c-btn--primary c-btn--sm">Actualizar ahora</a>
</div>
```

## Tokens de diseño

```css
--toast-min-width: 280px;
--toast-max-width: 420px;
--toast-padding: var(--space-4);
--toast-border-radius: var(--radius-md);
--toast-gap: var(--space-2);
```

### Colores por variante
```css
.c-alert--info {
  background: var(--color-info-50);
  color: var(--color-info-700);
  border: 1px solid var(--color-info-200);
}

.c-alert--success {
  background: var(--color-success-50);
  color: var(--color-success-700);
  border: 1px solid var(--color-success-200);
}

.c-alert--warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
  border: 1px solid var(--color-warning-200);
}

.c-alert--danger {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
  border: 1px solid var(--color-danger-200);
}
```

## Clases disponibles

| Clase | Descripción |
|-------|-------------|
| `.c-alert` | Contenedor base |
| `.c-alert--info` | Variante informativa |
| `.c-alert--success` | Variante éxito |
| `.c-alert--warning` | Variante advertencia |
| `.c-alert--danger` | Variante error/peligro |
| `.c-alert__icon` | Icono SVG (20x20) |
| `.c-alert__message` | Contenedor del mensaje |
| `.c-alert__title` | Título opcional (bold) |
| `.c-alert__action` | Botón/enlace de acción |

## Accesibilidad

- **role="alert"**: Anuncia automáticamente a screen readers
- **role="status"**: Para mensajes no críticos (polite)
- **Iconos**: `aria-hidden="true"` (decorativos)
- **Color**: No solo color para transmitir significado (iconos + texto)
- **Contraste**: Cumple WCAG AA en todas las variantes

## JavaScript (Toast system)

Para notificaciones temporales tipo "toast":

```js
// Mostrar toast
DesignSystem.emit('toast:show', {
  type: 'success',        // 'info' | 'success' | 'warning' | 'danger'
  title: 'Guardado',      // opcional
  message: 'Cambios guardados correctamente',
  duration: 5000,         // ms, 0 = no auto-dismiss
  action: {               // opcional
    label: 'Deshacer',
    onClick: () => undo()
  }
});

// Toast container se auto-inicializa con data-ds-component="toast-container"
```

## Ejemplos de uso

### Validación de formulario
```html
<form class="c-form" novalidate>
  <div class="c-alert c-alert--danger" role="alert" hidden>
    <svg class="c-alert__icon">...</svg>
    <div class="c-alert__message">
      <p class="c-alert__title">Error en el formulario</p>
      <p>Revisa los campos marcados en rojo.</p>
    </div>
  </div>
  
  <div class="c-form-group">
    <label class="c-label" for="email">Email</label>
    <input type="email" class="c-input" id="email" required aria-describedby="email-error">
    <p id="email-error" class="c-form-error" hidden>Email requerido</p>
  </div>
  
  <button class="c-btn c-btn--primary" type="submit">Enviar</button>
</form>
```

### Banner de mantenimiento
```html
<div class="c-alert c-alert--warning c-alert--banner" role="status">
  <svg class="c-alert__icon">...</svg>
  <div class="c-alert__message">
    <p class="c-alert__title">Mantenimiento programado</p>
    <p>El sistema estará fuera de servicio el domingo 02:00-04:00 UTC.</p>
  </div>
  <a href="/calendario" class="c-alert__action c-btn c-btn--ghost c-btn--sm">Ver calendario</a>
</div>

<style>
.c-alert--banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  border-radius: 0;
  border-left: none;
  border-right: none;
  z-index: var(--z-index-toast);
  max-width: none;
}
</style>
```

### Alerta inline en tabla
```html
<table class="c-table">
  <thead>...</thead>
  <tbody>
    <tr>
      <td colspan="100%">
        <div class="c-alert c-alert--info" style="margin: 0;">
          <svg class="c-alert__icon">...</svg>
          <div class="c-alert__message">
            <p>No hay datos para mostrar con los filtros actuales.</p>
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
```
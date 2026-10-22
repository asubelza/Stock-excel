---
title: Primeros pasos
description: Guía rápida para integrar el ECJY Design System en tu proyecto
---

# Primeros pasos

Esta guía te ayuda a integrar el ECJY Design System en una aplicación Flask + Jinja2.

## Requisitos

- Node.js 18+
- Flask (backend)
- Navegador moderno (ES2020+)

## Instalación

```bash
# Clonar o copiar la carpeta static/ a tu proyecto
cp -r static/ tu-proyecto/

# Instalar dependencias de build
cd tu-proyecto/static
npm install
```

## Estructura de archivos

```
tu-proyecto/
├── static/
│   ├── src/
│   │   ├── css/
│   │   │   ├── tokens.css      # Design tokens (CSS custom properties)
│   │   │   └── base.css        # Estilos base, componentes, utilidades
│   │   ├── js/
│   │   │   ├── components/     # Componentes vanilla JS
│   │   │   ├── main.js         # Entry point + DesignSystem API
│   │   │   └── theme-provider.js  # Modo oscuro
│   ├── dist/                   # Build output (generado)
│   ├── package.json
│   ├── vite.config.js
│   └── postcss.config.js
├── templates/
│   ├── base.html               # Template base con feature flag
│   └── macros/
│       └── nav.html            # Macros de navegación
└── scripts/
    ├── tokens-to-json.mjs      # Parser tokens → JSON
    └── generate-preload-hints.js  # Preload hints para build
```

## 1. Configurar Vite

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'static',
  build: {
    outDir: 'dist',
    manifest: true,
    lib: {
      entry: 'src/main.js',
      name: 'DesignSystem',
      fileName: 'main',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [],
          components: ['./src/js/components/dropdown.js', ...],
          'data-table': ['./src/js/components/data-table.js'],
        },
      },
    },
    cssCodeSplit: true,
  },
});
```

## 2. Build de producción

```bash
npm run build
```

Esto genera:
- `static/dist/assets/main-[hash].js` — Entry point
- `static/dist/assets/components-[hash].js` — Componentes UI
- `static/dist/assets/data-table-[hash].js` — Tabla (lazy loaded)
- `static/dist/assets/main-[hash].css` — Estilos compilados
- `static/dist/.vite/manifest.json` — Mapeo de chunks

## 3. Template base (Jinja2)

```jinja
{# templates/base.html #}
<!DOCTYPE html>
<html lang="es" data-design-system="{{ request.design_system if request else 'legacy' }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% block title %}Mi App{% endblock %}</title>

  {# FOUC prevention for dark mode #}
  <script>
    (function() {
      try {
        var theme = localStorage.getItem('ecjy_theme');
        if (theme === 'dark' || theme === 'light' || theme === 'system') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      } catch (_) {}
    })();
  </script>

  {% if request and request.design_system == 'new' %}
  {# Preload hints (generado en build) #}
  {% include '_preload_hints.html' %}
  <link rel="stylesheet" href="{{ url_for('static', filename='dist/assets/main.css') }}">
  <script type="module" src="{{ url_for('static', filename='dist/assets/main.js') }}"></script>
  {% else %}
  <style>{# Legacy inline styles #}</style>
  {% endif %}
</head>
<body>
  {% block page_header %}{% endblock %}
  {% block content %}{% endblock %}
</body>
</html>
```

## 4. Feature flag en Flask

```python
# app.py o middleware
@app.before_request
def set_design_system_flag():
    # Opción A: Query param para testing
    if request.args.get('design') == 'new':
        g.design_system = 'new'
    elif request.args.get('design') == 'legacy':
        g.design_system = 'legacy'
    # Opción B: Session storage
    elif session.get('design_system') == 'new':
        g.design_system = 'new'
    # Opción C: Config global
    else:
        g.design_system = current_app.config.get('DESIGN_SYSTEM', 'legacy')
    
    # Exponer a templates
    request.design_system = g.design_system
```

```jinja
{# En templates, usar el flag #}
{% if request.design_system == 'new' %}
  {# New design system layout #}
  <div class="app-layout">...</div>
{% else %}
  {# Legacy layout #}
  <div class="header">...</div>
{% endif %}
```

## 5. Usar componentes

### Botones
```html
<button class="c-btn c-btn--primary">Primario</button>
<button class="c-btn c-btn--secondary">Secundario</button>
<button class="c-btn c-btn--ghost">Ghost</button>
<button class="c-btn c-btn--danger">Peligro</button>
```

### Formularios
```html
<form class="c-form" novalidate>
  <div class="c-form-group">
    <label class="c-label" for="nombre">Nombre</label>
    <input type="text" class="c-input" id="nombre" required>
  </div>
  <button class="c-btn c-btn--primary" type="submit">Guardar</button>
</form>
```

### Data Table (lazy loaded)
```html
<div data-table-lazy data-table-api="/api/usuarios">
  <table class="c-table">
    <thead>
      <tr>
        <th data-sortable="true" data-sort-key="nombre">Nombre</th>
        <th data-sortable="true" data-sort-key="email">Email</th>
        <th data-sortable="true" data-sort-key="rol">Rol</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
```

## 6. API JavaScript

```js
// DesignSystem global API
DesignSystem.isActive           // boolean: ¿está activo el new DS?
DesignSystem.getToken(name)     // string: valor de token
DesignSystem.setToken(name, val) // sobrescribir token en runtime
DesignSystem.initComponents()   // inicializar componentes en contenedor

// ThemeProvider
ThemeProvider.setTheme('dark')     // 'light' | 'dark' | 'system'
ThemeProvider.getTheme()           // tema actual
ThemeProvider.toggleTheme()        // alternar light/dark
ThemeProvider.cycleTheme()         // light → dark → system → light
```

## 7. Desarrollo

```bash
# Servidor de desarrollo con HMR
npm run dev

# Proxy a Flask en puerto 5000
# Edita static/src/ y ve cambios instantáneos
```

## 8. Parsear tokens para documentación

```bash
npm run tokens:parse
# Genera scripts/tokens.json y scripts/tokens-meta.json
```

## Próximos pasos

- [Modo oscuro](/guides/dark-mode) — Configurar tema
- [Componentes](/components/button) — Ver todos los componentes
- [Tokens](/tokens/colors) — Referencia completa de tokens
- [Migración](/guides/migration) — Migrar desde legacy
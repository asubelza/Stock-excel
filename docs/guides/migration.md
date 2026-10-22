---
title: Migración desde Legacy
description: Pasos para migrar del sistema legacy al nuevo Design System
---

# Migración desde Legacy

Guía paso a paso para migrar una aplicación existente del CSS legacy inline al nuevo ECJY Design System.

## Estrategia: Feature Flag

La migración usa un **feature flag** (`g.design_system`) para servir ambos sistemas simultáneamente:

```jinja
{# templates/base.html #}
{% if request.design_system == 'new' %}
  {# New Design System #}
  <link rel="stylesheet" href="{{ url_for('static', filename='dist/assets/main.css') }}">
  <script type="module" src="{{ url_for('static', filename='dist/assets/main.js') }}"></script>
  <div class="app-layout">...</div>
{% else %}
  {# Legacy System #}
  <style>{/* inline legacy styles */}</style>
  <div class="header">...</div>
  <div class="container">...</div>
{% endif %}
```

Esto permite:
- **Rollback instantáneo** cambiando el flag
- **Testing A/B** con `?design=new` o `?design=legacy`
- **Migración gradual** página por página

## Fase 1: Preparación (1-2 días)

### 1.1 Instalar dependencias
```bash
cp -r static/ tu-proyecto/
cd tu-proyecto/static
npm install
npm run build
```

### 1.2 Configurar feature flag en Flask
```python
# app.py
@app.before_request
def set_design_system():
    # Prioridad: query param > session > config > legacy
    if request.args.get('design') in ('new', 'legacy'):
        session['design_system'] = request.args.get('design')
    
    g.design_system = session.get('design_system', 'legacy')
    request.design_system = g.design_system
```

### 1.3 Verificar build
```bash
npm run build
# Debe generar static/dist/assets/main-[hash].js y .css
```

## Fase 2: Mapeo de estilos (2-3 días)

### 2.1 Colores - Mapeo directo

| Legacy | Token DS | Nota |
|--------|----------|------|
| `#2c3e50` | `--legacy-primary` / `--color-neutral-900` | Headers, nav |
| `#3498db` | `--legacy-primary-btn` / `--color-brand-600` | Botones primarios |
| `#2980b9` | `--legacy-primary-btn-hover` / `--color-brand-700` | Hover primario |
| `#27ae60` | `--legacy-success` / `--color-success-600` | Éxito |
| `#e74c3c` | `--legacy-danger` / `--color-danger-600` | Peligro |
| `#f39c12` | `--legacy-warning` / `--color-warning-500` | Advertencia |
| `#9b59b6` | `--legacy-purple` | Secundario |
| `#f0f0f0` | `--legacy-body-bg` / `--color-neutral-50` | Fondo body |
| `#ffffff` | `--legacy-card-bg` / `--color-surface-card` | Fondo cards |
| `#f8f9fa` | `--legacy-muted-bg` / `--color-neutral-50` | Fondos sutiles |
| `#555` | `--legacy-text-muted` / `--color-text-secondary` | Texto secundario |
| `#999` | `--legacy-text-placeholder` / `--color-text-tertiary` | Placeholders |

### 2.2 Ejemplos de migración

#### Header
```css
/* Legacy */
.header {
  background: #2c3e50;
  color: white;
  padding: 15px 20px;
}

/* Design System */
.c-top-bar {
  background: var(--color-surface-card);
  border-bottom: 1px solid var(--color-border-default);
  height: var(--header-height);  /* 64px */
}
```

#### Botones
```css
/* Legacy */
.btn {
  background: #3498db;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}

/* Design System */
.c-btn--primary {
  background: var(--color-brand-600);
  color: var(--color-text-inverse);
  height: var(--btn-height-md);     /* 40px */
  padding: 0 var(--btn-padding-x-md); /* 16px */
  border-radius: var(--btn-border-radius); /* 4px */
}
```

#### Cards
```css
/* Legacy */
.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Design System */
.c-card {
  background: var(--color-surface-card);
  padding: var(--card-padding);         /* 20px */
  border-radius: var(--card-border-radius); /* 8px */
  box-shadow: var(--shadow-card);
  border: 1px solid var(--card-border-color);
}
```

#### Tablas
```css
/* Legacy */
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px; border-bottom: 1px solid #eee; }
th { background: #f8f9fa; font-weight: 600; color: #555; }

/* Design System */
.c-table { width: 100%; border-collapse: collapse; }
.c-table th,
.c-table td { 
  padding: var(--table-cell-padding-y) var(--table-cell-padding-x); /* 8px 12px */
  border-bottom: 1px solid var(--table-border-color);
}
.c-table th {
  background: var(--table-header-bg);
  font-weight: var(--table-header-font-weight);
  color: var(--color-text-secondary);
}
```

### 2.3 Buscar y reemplazar

```bash
# Buscar colores hardcodeados en templates
grep -r "#2c3e50\|#3498db\|#27ae60\|#e74c3c\|#f39c12\|#9b59b6" templates/ --include="*.html"

# Buscar en CSS legacy
grep -r "background:\|color:\|border:" static/css/ --include="*.css" | grep -v "var("
```

## Fase 3: Migración de templates (3-5 días)

### 3.1 Layout base

```jinja
{# Antes: legacy layout #}
<div class="header">...</div>
<div class="container">
  {% block content %}{% endblock %}
</div>

{# Después: new layout con feature flag #}
{% if request.design_system == 'new' %}
<div class="app-layout">
  <header class="app-layout__header">
    {{ render_top_bar(...) }}
  </header>
  <aside class="app-layout__sidebar">
    {{ render_side_nav(...) }}
  </aside>
  <main class="app-layout__main" id="main-content">
    <div class="container">
      {% block page_header %}{% endblock %}
      {% block content %}{% endblock %}
    </div>
  </main>
</div>
{% else %}
{# Legacy fallback #}
<div class="header">...</div>
<div class="container">{% block content %}{% endblock %}</div>
{% endif %}
```

### 3.2 Navegación

```jinja
{# Legacy nav #}
<div class="nav">
  <a href="/stock/">Stock</a>
  <a href="/stock/historico">Histórico</a>
</div>

{# New nav via macro #}
{% from 'macros/nav.html' import render_top_bar, render_side_nav %}
{{ render_top_bar(brand=..., navigation=..., user_menu=...) }}
{{ render_side_nav(navigation=..., current_role=session.rol) }}
```

### 3.3 Formularios

```jinja
{# Legacy form #}
<form method="POST">
  <div class="form-group">
    <label>Nombre</label>
    <input type="text" name="nombre" class="form-control">
  </div>
  <button class="btn btn-primary">Guardar</button>
</form>

{# New form #}
<form class="c-form" method="POST" novalidate>
  <div class="c-form-group">
    <label class="c-label" for="nombre">Nombre</label>
    <input type="text" class="c-input" id="nombre" name="nombre" required>
  </div>
  <button class="c-btn c-btn--primary" type="submit">Guardar</button>
</form>
```

### 3.4 Tablas con DataTable

```jinja
{# Legacy table #}
<table>
  <thead><tr><th>Nombre</th><th>Email</th></tr></thead>
  <tbody>
    {% for user in users %}
    <tr><td>{{ user.nombre }}</td><td>{{ user.email }}</td></tr>
    {% endfor %}
  </tbody>
</table>

{# New DataTable (lazy loaded) #}
<div data-table-lazy data-table-api="/api/usuarios">
  <table class="c-table">
    <thead>
      <tr>
        <th data-sortable="true" data-sort-key="nombre">Nombre</th>
        <th data-sortable="true" data-sort-key="email">Email</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
```

## Fase 4: Testing y QA (2-3 días)

### 4.1 Checklist por página

- [ ] Layout correcto (header, sidebar, main)
- [ ] Navegación funcional (responsive, mobile drawer)
- [ ] Formularios: validación, focus, error states
- [ ] Tablas: sort, filter, pagination, lazy load
- [ ] Modales: focus trap, ESC, backdrop click
- [ ] Dropdowns: keyboard, type-ahead, positioning
- [ ] Toasts: auto-dismiss, actions
- [ ] Modo oscuro: toggle, persistencia, cross-tab
- [ ] Responsive: 320px, 768px, 1024px, 1440px
- [ ] Accesibilidad: teclado, screen reader, contraste

### 4.2 Testing cross-browser

```bash
# Playwright tests
npm install @playwright/test
npx playwright install
npx playwright test --project=chromium,firefox,webkit
```

### 4.3 Performance

```bash
# Lighthouse CI
npm install @lhci/cli
npx lhci autorun

# Budgets: vendor+components ≤60KB gz, data-table ≤35KB gz
```

## Fase 5: Rollout gradual (1-2 semanas)

### Semana 1: Usuarios beta
```python
# Habilitar para usuarios opt-in
@app.before_request
def set_design_system():
    if current_user and current_user.beta_features:
        g.design_system = 'new'
    else:
        g.design_system = 'legacy'
```

### Semana 2: Roles específicos
```python
# Habilitar para roles que más usan la app
BETA_ROLES = ['admin', 'datainput', 'deposito']
if session.get('rol') in BETA_ROLES:
    g.design_system = 'new'
```

### Semana 3: 100% + Legacy removal
```python
# Remover feature flag
g.design_system = 'new'

# Limpiar templates legacy
git rm templates/legacy-*.html
# Remover estilos inline de base.html
```

## Rollback plan

```python
# Rollback instantáneo
@app.route('/admin/design-system/rollback')
def rollback_design_system():
    session['design_system'] = 'legacy'
    return redirect(request.referrer or '/')
```

## Problemas comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| FOUC al cargar | Falta script inline en `<head>` | Añadir script FOUC prevention |
| Tema no persiste | localStorage bloqueado | Verificar private browsing, fallback a sessionStorage |
| Componentes no init | JS no cargado o error | Verificar consola, `DesignSystem.initComponents()` |
| DataTable no carga | `data-table-lazy` sin API | Verificar `data-table-api` attribute |
| Estilos rotos | CSS legacy conflict | Aumentar especificidad o usar `!important` temporal |

## Checklist final

- [ ] Todas las páginas usan feature flag
- [ ] 0 referencias a colores legacy hardcodeados
- [ ] 0 `!important` en CSS (salvo overrides documentados)
- [ ] Bundle sizes dentro de budget
- [ ] Lighthouse ≥ 90 en Performance, Accessibility, Best Practices
- [ ] 0 errores de consola en páginas principales
- [ ] Documentación de overrides de proyecto actualizada
- [ ] Equipo entrenado en nuevos componentes/tokens
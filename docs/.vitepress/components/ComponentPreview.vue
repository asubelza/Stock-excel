<script setup>
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps({
  component: { type: String, required: true },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  showCode: { type: Boolean, default: true },
});

const previewHtml = ref('');
const codeHtml = ref('');
const copied = ref(false);

const componentConfigs = {
  button: {
    variants: ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning', 'link'],
    sizes: ['sm', 'md', 'lg'],
    getHtml: (variant, size, label, disabled) => {
      const classes = `c-btn c-btn--${variant} c-btn--${size}`;
      const disabledAttr = disabled ? 'disabled' : '';
      return `<button class="${classes}" ${disabledAttr}>${label || variant.charAt(0).toUpperCase() + variant.slice(1)}</button>`;
    },
    getCode: (variant, size, label, disabled) => {
      const classes = `c-btn c-btn--${variant} c-btn--${size}`;
      const disabledAttr = disabled ? ' disabled' : '';
      return `<button class="${classes}"${disabledAttr}>${label || variant.charAt(0).toUpperCase() + variant.slice(1)}</button>`;
    },
  },
  card: {
    variants: ['default', 'elevated', 'outlined'],
    sizes: ['default'],
    getHtml: (variant, size, label, disabled) => {
      const variantClass = variant !== 'default' ? ` c-card--${variant}` : '';
      return `<div class="c-card${variantClass}">
  <div class="c-card__header">
    <h3 class="c-card__title">${label || 'Título de la tarjeta'}</h3>
  </div>
  <div class="c-card__body">
    <p>Contenido de la tarjeta. Aquí va el cuerpo principal.</p>
  </div>
  <div class="c-card__footer">
    <button class="c-btn c-btn--primary c-btn--sm">Acción principal</button>
    <button class="c-btn c-btn--ghost c-btn--sm">Secundaria</button>
  </div>
</div>`;
    },
    getCode: (variant, size, label, disabled) => {
      const variantClass = variant !== 'default' ? ` c-card--${variant}` : '';
      return `<div class="c-card${variantClass}">
  <div class="c-card__header">
    <h3 class="c-card__title">${label || 'Título de la tarjeta'}</h3>
  </div>
  <div class="c-card__body">
    <p>Contenido de la tarjeta. Aquí va el cuerpo principal.</p>
  </div>
  <div class="c-card__footer">
    <button class="c-btn c-btn--primary c-btn--sm">Acción principal</button>
    <button class="c-btn c-btn--ghost c-btn--sm">Secundaria</button>
  </div>
</div>`;
    },
  },
  input: {
    variants: ['text', 'email', 'password', 'search', 'textarea', 'select'],
    sizes: ['sm', 'md', 'lg'],
    getHtml: (variant, size, label, disabled) => {
      const sizeClass = size !== 'md' ? ` c-input--${size}` : '';
      const disabledAttr = disabled ? 'disabled' : '';
      const labelText = label || 'Etiqueta del campo';
      
      if (variant === 'textarea') {
        return `<div class="c-form-group">
  <label class="c-label" for="textarea-demo">${labelText}</label>
  <textarea class="c-textarea${sizeClass}" id="textarea-demo" rows="4" placeholder="Escribe aquí..." ${disabledAttr}></textarea>
</div>`;
      }
      if (variant === 'select') {
        return `<div class="c-form-group">
  <label class="c-label" for="select-demo">${labelText}</label>
  <select class="c-select${sizeClass}" id="select-demo" ${disabledAttr}>
    <option value="">Seleccionar...</option>
    <option value="1">Opción 1</option>
    <option value="2">Opción 2</option>
    <option value="3">Opción 3</option>
  </select>
</div>`;
      }
      return `<div class="c-form-group">
  <label class="c-label" for="input-demo">${labelText}</label>
  <input type="${variant}" class="c-input${sizeClass}" id="input-demo" placeholder="Ingresa ${variant}" ${disabledAttr}>
</div>`;
    },
    getCode: (variant, size, label, disabled) => {
      const sizeClass = size !== 'md' ? ` c-input--${size}` : '';
      const disabledAttr = disabled ? ' disabled' : '';
      const labelText = label || 'Etiqueta del campo';
      
      if (variant === 'textarea') {
        return `<div class="c-form-group">
  <label class="c-label" for="textarea-demo">${labelText}</label>
  <textarea class="c-textarea${sizeClass}" id="textarea-demo" rows="4" placeholder="Escribe aquí..."${disabledAttr}></textarea>
</div>`;
      }
      if (variant === 'select') {
        return `<div class="c-form-group">
  <label class="c-label" for="select-demo">${labelText}</label>
  <select class="c-select${sizeClass}" id="select-demo"${disabledAttr}>
    <option value="">Seleccionar...</option>
    <option value="1">Opción 1</option>
    <option value="2">Opción 2</option>
    <option value="3">Opción 3</option>
  </select>
</div>`;
      }
      return `<div class="c-form-group">
  <label class="c-label" for="input-demo">${labelText}</label>
  <input type="${variant}" class="c-input${sizeClass}" id="input-demo" placeholder="Ingresa ${variant}"${disabledAttr}>
</div>`;
    },
  },
  alert: {
    variants: ['info', 'success', 'warning', 'danger'],
    sizes: ['default'],
    getHtml: (variant, size, label, disabled) => {
      const iconMap = {
        info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
        success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        danger: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
      };
      
      return `<div class="c-alert c-alert--${variant}" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    ${iconMap[variant]}
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">${variant.charAt(0).toUpperCase() + variant.slice(1)}</p>
    <p>${label || 'Este es un mensaje de alerta de ejemplo.'}</p>
  </div>
</div>`;
    },
    getCode: (variant, size, label, disabled) => {
      return `<div class="c-alert c-alert--${variant}" role="alert">
  <svg class="c-alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- SVG icon here -->
  </svg>
  <div class="c-alert__message">
    <p class="c-alert__title">${variant.charAt(0).toUpperCase() + variant.slice(1)}</p>
    <p>${label || 'Este es un mensaje de alerta de ejemplo.'}</p>
  </div>
</div>`;
    },
  },
  badge: {
    variants: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
    sizes: ['sm', 'default', 'lg'],
    getHtml: (variant, size) => {
      const sizeClass = size !== 'default' ? ` c-badge--${size}` : '';
      return `<span class="c-badge c-badge--${variant}${sizeClass}">${variant.charAt(0).toUpperCase() + variant.slice(1)}</span>`;
    },
    getCode: (variant, size) => {
      const sizeClass = size !== 'default' ? ` c-badge--${size}` : '';
      return `<span class="c-badge c-badge--${variant}${sizeClass}">${variant.charAt(0).toUpperCase() + variant.slice(1)}</span>`;
    },
  },
};

function updatePreview() {
  const config = componentConfigs[props.component];
  if (!config) {
    previewHtml.value = '<div class="c-alert c-alert--warning">Componente no soportado</div>';
    codeHtml.value = '';
    return;
  }

  // Generate preview with all variants
  const variants = config.variants;
  const size = config.sizes.includes(props.size) ? props.size : config.sizes[0];
  
  let html = '<div class="vp-preview-grid">';
  
  variants.forEach(variant => {
    html += `<div class="vp-preview-item">
      <div class="vp-preview-label">${variant}</div>
      <div class="vp-preview-demo">${config.getHtml(variant, size, props.label, props.disabled)}</div>
    </div>`;
  });
  
  // Add disabled state if not already shown
  if (!props.disabled) {
    html += `<div class="vp-preview-item">
      <div class="vp-preview-label">Disabled</div>
      <div class="vp-preview-demo">${config.getHtml(variants[0], size, props.label, true)}</div>
    </div>`;
  }
  
  html += '</div>';
  previewHtml.value = html;
  
  // Generate code for primary variant
  codeHtml.value = config.getCode(variants[0], size, props.label, props.disabled);
}

onMounted(() => {
  updatePreview();
});

import { watch } from 'vue';
watch(() => [props.component, props.variant, props.size, props.label, props.disabled], updatePreview);

function copyCode() {
  navigator.clipboard.writeText(codeHtml.value).then(() => {
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  });
}
</script>

<template>
  <div class="vp-component-preview">
    <div class="vp-preview-section">
      <h4>Preview</h4>
      <div class="vp-preview-container" v-html="previewHtml"></div>
    </div>

    <div v-if="showCode && codeHtml" class="vp-code-section">
      <div class="vp-code-header">
        <h4>Código HTML</h4>
        <button
          class="vp-copy-code-btn"
          @click="copyCode"
          :aria-label="copied ? 'Copiado!' : 'Copiar código'"
        >
          <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
      <pre class="vp-code-block"><code v-html="escapeHtml(codeHtml)"></code></pre>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    escapeHtml(text) {
      return text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
    }
  }
}
</script>

<style scoped>
.vp-component-preview {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
}

.vp-preview-section,
.vp-code-section {
  padding: 1.5rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.vp-preview-section:last-child,
.vp-code-section:last-child {
  border-bottom: none;
}

.vp-preview-section h4,
.vp-code-header h4 {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vp-preview-container {
  background: var(--vp-c-bg);
  border-radius: 6px;
  padding: 1.5rem;
  min-height: 100px;
}

.vp-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.vp-preview-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vp-preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vp-preview-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  padding: 1rem;
  background: var(--vp-c-bg-alt);
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
}

.vp-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.vp-copy-code-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.vp-copy-code-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.vp-copy-code-btn svg {
  width: 16px;
  height: 16px;
}

.vp-code-block {
  margin: 0;
  padding: 1rem;
  background: var(--vp-c-bg-alt);
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.vp-code-block code {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}
</style>
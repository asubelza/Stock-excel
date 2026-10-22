<script setup>
import { onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';

const props = defineProps({
  category: { type: String, required: true },
  filter: { type: String, default: '' },
});

const { theme } = useData();
const tokens = ref([]);
const filteredTokens = ref([]);
const searchQuery = ref('');

onMounted(async () => {
  // Load tokens from generated JSON
  try {
    const response = await fetch('/tokens-meta.json');
    const data = await response.json();
    tokens.value = data;
    applyFilter();
  } catch (err) {
    console.error('Failed to load tokens:', err);
  }
});

watch(() => props.filter, applyFilter);
watch(searchQuery, applyFilter);

function applyFilter() {
  let result = tokens.value.filter(t => t.category === props.category);
  
  if (props.filter) {
    const filters = props.filter.split(',');
    result = result.filter(t => filters.some(f => t.name.includes(f.trim())));
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.displayName.toLowerCase().includes(query) ||
      t.value.toLowerCase().includes(query)
    );
  }
  
  filteredTokens.value = result;
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copiado: ${label} = ${text}`);
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'vp-token-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function formatValue(value) {
  if (value.startsWith('var(')) {
    return `<code class="vp-token-ref">${value}</code>`;
  }
  if (value.startsWith('#')) {
    return `<span class="vp-token-color" style="--c:${value}"><code>${value}</code></span>`;
  }
  return `<code>${value}</code>`;
}
</script>

<template>
  <div class="vp-token-table-container">
    <div class="vp-token-search">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Filtrar tokens..."
        class="vp-token-search-input"
        aria-label="Filtrar tokens"
      >
      <span class="vp-token-count">{{ filteredTokens.length }} de {{ tokens.length }} tokens</span>
    </div>

    <div class="vp-token-table-wrapper">
      <table class="vp-token-table" v-if="filteredTokens.length > 0">
        <thead>
          <tr>
            <th>Token</th>
            <th>Valor</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th class="vp-token-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="token in filteredTokens" :key="token.name">
            <td>
              <div class="vp-token-name-cell">
                <code class="vp-token-css-var">{{ token.cssVar }}</code>
                <span class="vp-token-display-name">{{ token.displayName }}</span>
                <span v-if="token.deprecated" class="vp-token-deprecated">Deprecated</span>
                <span v-if="token.darkModeOnly" class="vp-token-dark-only">Solo Dark</span>
              </div>
            </td>
            <td>
              <div class="vp-token-value" v-html="formatValue(token.value)"></div>
              <div v-if="token.darkValue" class="vp-token-dark-value">
                <span class="vp-token-dark-label">Dark: </span>
                <span v-html="formatValue(token.darkValue)"></span>
              </div>
            </td>
            <td><span class="vp-token-type">{{ token.type }}</span></td>
            <td class="vp-token-description">{{ token.description }}</td>
            <td class="vp-token-actions">
              <button
                class="vp-token-copy-btn"
                @click="copyToClipboard(token.cssVar, 'CSS Var')"
                title="Copiar variable CSS"
                aria-label="Copiar variable CSS"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button
                class="vp-token-copy-btn"
                @click="copyToClipboard(token.value, 'Valor')"
                title="Copiar valor"
                aria-label="Copiar valor"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="vp-token-empty">
        <p>No se encontraron tokens para esta categoría.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vp-token-table-container {
  margin: 1rem 0;
}

.vp-token-search {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.vp-token-search-input {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  font-size: 0.875rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.vp-token-search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

.vp-token-count {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.vp-token-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
}

.vp-token-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.vp-token-table th,
.vp-token-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-border);
}

.vp-token-table th {
  background: var(--vp-c-bg-alt);
  font-weight: 600;
  color: var(--vp-c-text-1);
  position: sticky;
  top: 0;
  z-index: 1;
}

.vp-token-table tr:hover td {
  background: var(--vp-c-bg-alt);
}

.vp-token-table tr:last-child td {
  border-bottom: none;
}

.vp-token-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 200px;
}

.vp-token-css-var {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  color: var(--vp-c-brand);
}

.vp-token-display-name {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  text-transform: capitalize;
}

.vp-token-deprecated {
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger);
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vp-token-dark-only {
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning);
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.vp-token-value,
.vp-token-dark-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
}

.vp-token-color {
  display: inline-flex;
  align-items: center;
  min-width: 60px;
  height: 1.25rem;
  padding: 0 0.5rem;
  border-radius: 4px;
  background: var(--c);
  border: 1px solid var(--vp-c-border);
}

.vp-token-color code {
  color: var(--vp-c-text-1);
  mix-blend-mode: difference;
}

.vp-token-ref {
  color: var(--vp-c-text-2);
}

.vp-token-dark-value {
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px dashed var(--vp-c-border);
}

.vp-token-dark-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  font-family: inherit;
}

.vp-token-type {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  background: var(--vp-c-bg-alt);
  border-radius: 4px;
  color: var(--vp-c-text-2);
}

.vp-token-description {
  color: var(--vp-c-text-2);
  max-width: 300px;
}

.vp-token-actions {
  display: flex;
  gap: 0.375rem;
  white-space: nowrap;
}

.vp-token-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.vp-token-copy-btn:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.vp-token-copy-btn svg {
  width: 14px;
  height: 14px;
}

.vp-token-empty {
  padding: 3rem;
  text-align: center;
  color: var(--vp-c-text-2);
}

/* Toast notification */
.vp-token-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.75rem 1.25rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  font-size: 0.875rem;
  color: var(--vp-c-text-1);
  z-index: 1000;
  opacity: 0;
  transform: translateY(1rem);
  transition: all 0.2s ease;
}

.vp-token-toast.show {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .vp-token-table th:nth-child(4),
  .vp-token-table td:nth-child(4) {
    display: none;
  }
  
  .vp-token-name-cell {
    min-width: 150px;
  }
}
</style>
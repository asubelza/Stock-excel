---
title: Tokens de Componentes
description: Tokens específicos para Button, Input, Table, Card, Badge, Modal, Toast
---

# Tokens de Componentes

Tokens específicos que componen cada componente UI. Permiten personalización granular.

## Button

<TokenTable category="component" filter="btn-" />

### Variantes de uso

```css
.btn-primary {
  height: var(--btn-height-md);
  padding: 0 var(--btn-padding-x-md);
  font-size: var(--btn-font-size-md);
  font-weight: var(--btn-font-weight);
  border-radius: var(--btn-border-radius);
  background: var(--color-brand-600);
  color: var(--color-text-inverse);
}

.btn-sm {
  height: var(--btn-height-sm);
  padding: 0 var(--btn-padding-x-sm);
  font-size: var(--btn-font-size-sm);
}

.btn-lg {
  height: var(--btn-height-lg);
  padding: 0 var(--btn-padding-x-lg);
  font-size: var(--btn-font-size-lg);
}
```

## Input

<TokenTable category="component" filter="input-" />

### Uso

```css
.input {
  height: var(--input-height-md);
  padding: var(--input-padding-y) var(--input-padding-x);
  font-size: var(--input-font-size);
  border: var(--input-border-width) solid var(--color-border-default);
  border-radius: var(--input-border-radius);
  background: var(--color-surface-input);
  color: var(--color-text-primary);
}

.input::placeholder {
  color: var(--input-placeholder-color);
}

.input:focus {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
}

.input[aria-invalid="true"] {
  border-color: var(--color-border-error);
}

.input[aria-invalid="true"]:focus {
  box-shadow: var(--shadow-focus-error);
}
```

## Table

<TokenTable category="component" filter="table-" />

## Card

<TokenTable category="component" filter="card-" />

## Badge

<TokenTable category="component" filter="badge-" />

## Modal

<TokenTable category="component" filter="modal-" />

## Toast

<TokenTable category="component" filter="toast-" />

## Layout Components

<TokenTable category="component" filter="header-,sidebar-,container-" />
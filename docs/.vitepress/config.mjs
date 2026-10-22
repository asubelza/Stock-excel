/* ==========================================================================
   ECJY Design System — VitePress Configuration
   ==========================================================================
   Documentation site for design tokens and components.
   ========================================================================== */

import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  title: 'ECJY Design System',
  description: 'Design tokens, components, and guidelines for ECJY applications',
  lang: 'es-AR',
  base: '/docs/',
  
  // Theme configuration
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'ECJY Design System',
    
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Tokens', link: '/tokens/colors', activeMatch: '/tokens/' },
      { text: 'Componentes', link: '/components/button', activeMatch: '/components/' },
      { text: 'Guías', link: '/guides/getting-started', activeMatch: '/guides/' },
      { text: 'Changelog', link: '/changelog' },
    ],
    
    sidebar: {
      '/tokens/': [
        {
          text: 'Tokens de Diseño',
          items: [
            { text: 'Colores', link: '/tokens/colors' },
            { text: 'Tipografía', link: '/tokens/typography' },
            { text: 'Espaciado', link: '/tokens/spacing' },
            { text: 'Bordes y Sombras', link: '/tokens/borders-shadows' },
            { text: 'Animaciones', link: '/tokens/animations' },
            { text: 'Layout', link: '/tokens/layout' },
            { text: 'Componentes', link: '/tokens/components' },
            { text: 'Legacy', link: '/tokens/legacy' },
          ],
        },
      ],
      '/components/': [
        {
          text: 'Componentes',
          items: [
            { text: 'Button', link: '/components/button' },
            { text: 'Card', link: '/components/card' },
            { text: 'Input', link: '/components/input' },
            { text: 'Alert', link: '/components/alert' },
            { text: 'Badge', link: '/components/badge' },
            { text: 'Dropdown', link: '/components/dropdown' },
            { text: 'Modal', link: '/components/modal' },
            { text: 'Table', link: '/components/table' },
            { text: 'Toast', link: '/components/toast' },
          ],
        },
      ],
      '/guides/': [
        {
          text: 'Guías',
          items: [
            { text: 'Primeros pasos', link: '/guides/getting-started' },
            { text: 'Modo oscuro', link: '/guides/dark-mode' },
            { text: 'Temática', link: '/guides/theming' },
            { text: 'Accesibilidad', link: '/guides/accessibility' },
            { text: 'Migración desde Legacy', link: '/guides/migration' },
          ],
        },
      ],
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ecjy/design-system' },
    ],
    
    footer: {
      message: 'Licencia MIT | Copyright © 2025 ECJY - Estudio Contable JY',
      copyright: 'ECJY Design System v1.0.0',
    },
    
    search: {
      provider: 'local',
      options: {
        locales: {
          es: {
            translations: {
              button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar' },
              modal: { noResultsText: 'Sin resultados', resetButtonTitle: 'Limpiar' },
            },
          },
        },
      },
    },
    
    editLink: {
      pattern: 'https://github.com/ecjy/design-system/edit/main/docs/:path',
      text: 'Editar esta página en GitHub',
    },
    
    lastUpdated: {
      text: 'Última actualización',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },
  },
  
  // Markdown configuration
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    toc: { level: [2, 3] },
  },
  
  // Vite configuration
  vite: {
    resolve: {
      alias: {
        '@': resolve(__dirname, '../static/src'),
      },
    },
    css: {
      postcss: resolve(__dirname, '../postcss.config.js'),
    },
  },
  
  // Build configuration
  build: {
    target: 'es2020',
    outDir: resolve(__dirname, '../dist-docs'),
  },
  
  // Head configuration
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
  ],
});
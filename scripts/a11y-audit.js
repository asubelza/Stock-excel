/**
 * axe-core Accessibility Audit — Modal Pages
 * Run this script to audit modal pages for a11y violations
 * Usage: node scripts/a11y-audit.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AXE_CORE_VERSION = '4.8.4';

// Modal test pages to audit
const MODAL_TEST_PAGES = [
  { name: 'Create Product Modal', url: '/products', trigger: '[data-cy="create-product"]' },
  { name: 'Edit Product Modal', url: '/products', trigger: '[data-cy="edit-product"]' },
  { name: 'Create Category Modal', url: '/categories', trigger: '[data-cy="create-category"]' },
  { name: 'Edit Category Modal', url: '/categories', trigger: '[data-cy="edit-category"]' },
  { name: 'Create Supplier Modal', url: '/suppliers', trigger: '[data-cy="create-supplier"]' },
  { name: 'Edit Supplier Modal', url: '/suppliers', trigger: '[data-cy="edit-supplier"]' },
  { name: 'Create Customer Modal', url: '/customers', trigger: '[data-cy="create-customer"]' },
  { name: 'Edit Customer Modal', url: '/customers', trigger: '[data-cy="edit-customer"]' },
  { name: 'Confirm Delete Modal', url: '/products', trigger: '[data-cy="delete-product"]' },
  { name: 'Alert Modal', url: '/products', trigger: '[data-cy="alert-modal"]' },
];

async function runA11yAudit() {
  console.log('🔍 Starting axe-core accessibility audit for modal pages...\n');
  
  // Check if we have a running server
  const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
  
  try {
    // Try to reach the server
    const response = await fetch(baseUrl);
    if (!response.ok) {
      throw new Error(`Server not accessible: ${response.status}`);
    }
    console.log(`✅ Server accessible at ${baseUrl}\n`);
  } catch (error) {
    console.error('❌ Cannot reach server. Please start the development server first.');
    console.error('   Run: npm run dev (or python -m http.server)');
    process.exit(1);
  }

  // Generate HTML audit script
  const auditScript = generateAuditScript(baseUrl);
  const scriptPath = path.join(__dirname, '..', 'cypress', 'a11y-audit.cy.js');
  
  fs.writeFileSync(scriptPath, auditScript);
  console.log(`📝 Generated Cypress audit script at ${scriptPath}\n`);

  // Run Cypress with axe-core
  console.log('🚀 Running Cypress with axe-core...\n');
  
  try {
    execSync(`npx cypress run --spec "cypress/a11y-audit.cy.js"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: baseUrl },
    });
    console.log('\n✅ Accessibility audit completed!');
  } catch (error) {
    console.error('\n❌ Accessibility audit failed with violations');
    process.exit(1);
  }
}

function generateAuditScript(baseUrl) {
  return `
/// <reference types="cypress" />
import 'axe-core';

describe('axe-core Accessibility Audit — Modals', () => {
  const modalTests = ${JSON.stringify(MODAL_TEST_PAGES, null, 2)};
  const baseUrl = '${baseUrl}';

  modalTests.forEach((test) => {
    it(\`should have no critical/serious violations: \${test.name}\`, () => {
      cy.visit(\`\${baseUrl}\${test.url}\`);
      cy.waitForHydration();
      
      // Trigger modal
      cy.get(test.trigger).first().click();
      cy.verifyModalOpen();
      
      // Wait for modal animation
      cy.wait(300);
      
      // Inject axe-core
      cy.injectAxe();
      
      // Run axe on the modal container
      cy.checkA11y('.c-modal', {
        includedImpacts: ['critical', 'serious'],
        rules: {
          // Skip rules that are known false positives for our modals
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'label': { enabled: true },
          'button-name': { enabled: true },
          'link-name': { enabled: true },
          'image-alt': { enabled: true },
          'document-title': { enabled: false }, // Modals don't need document title
          'landmark-one-main': { enabled: false }, // Modals are not main landmarks
          'region': { enabled: false }, // Modals use role=dialog
        },
      }, (violations) => {
        if (violations.length > 0) {
          const violationDetails = violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map(n => ({
              target: n.target,
              html: n.html,
              failureSummary: n.failureSummary,
            })),
          }));
          
          // Log violations for debugging
          cy.task('log', \`\${test.name} violations: \${JSON.stringify(violationDetails, null, 2)}\`);
          
          // Fail the test with detailed output
          throw new Error(
            \`\${test.name} has \${violations.length} a11y violation(s):\` +
            violations.map(v => \`\n  - [\${v.impact.toUpperCase()}] \${v.id}: \${v.description}\`).join('')
          );
        }
      });
      
      // Close modal for next test
      cy.closeModalWithEscape();
    });
  });

  // Additional focused tests
  it('should have proper focus management in modals', () => {
    cy.visit(\`\${baseUrl}/products\`);
    cy.waitForHydration();
    cy.get('[data-cy="create-product"]').click();
    cy.verifyModalOpen();
    cy.wait(300);
    
    // Check focus is trapped
    cy.assertFocusTrapped();
    
    // Check first focusable element receives focus
    cy.get('.c-modal').within(() => {
      const focusableSelectors = [
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');
      
      cy.get(focusableSelectors).first().should('be.focused');
    });
    
    cy.closeModalWithEscape();
  });

  it('should have proper ARIA attributes on all modals', () => {
    modalTests.forEach((test) => {
      cy.visit(\`\${baseUrl}\${test.url}\`);
      cy.waitForHydration();
      cy.get(test.trigger).first().click();
      cy.verifyModalOpen();
      cy.wait(300);
      
      cy.checkModalA11y();
      
      cy.closeModalWithEscape();
    });
  });

  it('should announce validation errors to screen readers', () => {
    cy.visit(\`\${baseUrl}/products\`);
    cy.waitForHydration();
    cy.get('[data-cy="create-product"]').click();
    cy.verifyModalOpen();
    cy.wait(300);
    
    // Submit empty form
    cy.submitModalForm();
    
    // Check for live region with errors
    cy.get('.c-form__field-errors').should('exist');
    cy.get('.c-form__field-errors').should('have.attr', 'role', 'alert');
    cy.get('.c-form__field-errors').should('have.attr', 'aria-live', 'polite');
    
    // Check aria-invalid on first field
    cy.get('[aria-invalid="true"]').first().should('exist');
    
    cy.closeModalWithEscape();
  });

  it('should support reduced motion preference', () => {
    cy.visit(\`\${baseUrl}/products\`);
    cy.waitForHydration();
    
    // Enable reduced motion
    cy.window().then((win) => {
      win.matchMedia = (query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        addListener: () => {},
        removeListener: () => {},
      });
    });
    
    cy.get('[data-cy="create-product"]').click();
    cy.verifyModalOpen();
    
    // Check that transitions are disabled
    cy.get('.c-modal').should('have.css', 'transition-duration', '0s');
    cy.get('.c-modal__overlay').should('have.css', 'transition-duration', '0s');
    
    cy.closeModalWithEscape();
  });

  it('should work correctly in high contrast mode', () => {
    cy.visit(\`\${baseUrl}/products\`);
    cy.waitForHydration();
    
    // Simulate high contrast mode
    cy.window().then((win) => {
      win.matchMedia = (query) => ({
        matches: query === '(forced-colors: active)',
        addListener: () => {},
        removeListener: () => {},
      });
    });
    
    cy.get('[data-cy="create-product"]').click();
    cy.verifyModalOpen();
    cy.wait(300);
    
    // Check that forced-colors styles apply
    cy.get('.c-modal').should('have.css', 'border-color').and('not.equal', 'rgba(0, 0, 0, 0)');
    cy.get('.c-modal__close').should('have.css', 'border-color').and('not.equal', 'rgba(0, 0, 0, 0)');
    
    cy.closeModalWithEscape();
  });
});
`;
}

runA11yAudit();
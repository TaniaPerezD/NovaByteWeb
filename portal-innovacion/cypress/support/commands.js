// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

Cypress.Commands.add('loginAndVerify2FA', (email, password, code) => {
  cy.login(email, password);
  cy.url().should('include', '/verify-2fa');
  cy.get('[data-testid="2fa-code-input"]').type(code);
  cy.get('[data-testid="verify-button"]').click();
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
});

// Comando para saltarse autenticación en tests
Cypress.Commands.add('setAuthToken', (role = 'paciente') => {
  const token = 'mock_access_token';
  const user = {
    id: '123',
    email: 'test@test.com',
    user_metadata: { role },
  };

  window.localStorage.setItem('supabase.auth.token', JSON.stringify({
    access_token: token,
    user: user,
  }));
});
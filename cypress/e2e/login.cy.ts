import { TOKEN_KEY, fakeJwt } from '../support/commands';

describe('Connexion', () => {
  beforeEach(() => cy.visit('/login'));

  it('connecte l’utilisateur, stocke le token et redirige vers /upload', () => {
    const jwt = fakeJwt();
    cy.intercept('POST', '/api/login', { statusCode: 200, body: jwt }).as('login');

    cy.get('#login-email').type('user@example.com');
    cy.get('#login-password').type('password123');
    cy.contains('button', 'Connexion').click();

    cy.wait('@login').its('request.body').should('deep.equal', {
      email: 'user@example.com',
      password: 'password123',
    });
    cy.location('pathname').should('eq', '/upload');
    cy.window().its('localStorage').invoke('getItem', TOKEN_KEY).should('eq', jwt);
    cy.contains('a', 'Mon espace').should('be.visible');
  });

  it('affiche une erreur quand les identifiants sont incorrects', () => {
    cy.intercept('POST', '/api/login', { statusCode: 401, body: 'Unauthorized' }).as('login');

    cy.get('#login-email').type('user@example.com');
    cy.get('#login-password').type('mauvaispass');
    cy.contains('button', 'Connexion').click();

    cy.wait('@login');
    cy.get('[role="alert"]').should('contain', 'Email ou mot de passe incorrect.');
    cy.location('pathname').should('eq', '/login');
  });

  it('n’appelle pas l’API si le formulaire est invalide', () => {
    cy.intercept('POST', '/api/login', cy.spy().as('loginSpy'));

    cy.get('#login-email').type('pas-un-email');
    cy.get('#login-password').type('court');
    cy.contains('button', 'Connexion').click();

    cy.get('#login-email-error').should('be.visible');
    cy.get('#login-password-error').should('be.visible');
    cy.get('@loginSpy').should('not.have.been.called');
  });

  it('redirige vers /login quand on ouvre une page protégée sans être connecté', () => {
    cy.visit('/history');
    cy.location('pathname').should('eq', '/login');
  });
});

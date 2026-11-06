describe('Inscription', () => {
  beforeEach(() => cy.visit('/register'));

  const fillForm = (email: string, password: string, confirm: string) => {
    cy.get('#register-email').type(email);
    cy.get('#register-password').type(password);
    cy.get('#register-confirm').type(confirm);
  };

  it('crée le compte puis redirige vers /login', () => {
    cy.intercept('POST', '/api/register', { statusCode: 201 }).as('register');

    fillForm('nouveau@example.com', 'password123', 'password123');
    cy.contains('button', 'Créer mon compte').click();

    cy.wait('@register').its('request.body').should('deep.equal', {
      email: 'nouveau@example.com',
      password: 'password123',
    });
    cy.location('pathname').should('eq', '/login');
  });

  it('signale des mots de passe différents sans appeler l’API', () => {
    cy.intercept('POST', '/api/register', cy.spy().as('registerSpy'));

    fillForm('nouveau@example.com', 'password123', 'autrechose');
    cy.contains('button', 'Créer mon compte').click();

    cy.get('#register-confirm-error').should('contain', 'Les mots de passe ne correspondent pas.');
    cy.get('@registerSpy').should('not.have.been.called');
  });

  it('affiche une erreur quand l’email est déjà utilisé', () => {
    cy.intercept('POST', '/api/register', { statusCode: 409 }).as('register');

    fillForm('existant@example.com', 'password123', 'password123');
    cy.contains('button', 'Créer mon compte').click();

    cy.wait('@register');
    cy.get('[role="alert"]').should('contain', 'Cet email est déjà utilisé.');
    cy.location('pathname').should('eq', '/register');
  });
});

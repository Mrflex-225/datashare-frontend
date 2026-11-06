import { daysFromNow } from '../support/commands';

describe('Envoi de fichier', () => {
  const file = {
    contents: Cypress.Buffer.from('contenu du rapport'),
    fileName: 'rapport.pdf',
    mimeType: 'application/pdf',
  };

  beforeEach(() => {
    cy.visitAsLoggedIn('/upload');
    cy.get('input[type="file"]').selectFile(file, { force: true });
  });

  it('affiche le fichier sélectionné', () => {
    cy.contains('h2', 'Ajouter un fichier').should('be.visible');
    cy.get('.file-name').should('contain', 'rapport.pdf');
    cy.get('#expiration').should('have.value', '1');
  });

  it('téléverse le fichier avec mot de passe et expiration, puis affiche le lien de partage', () => {
    cy.intercept('POST', '/api/files', {
      statusCode: 201,
      body: {
        id: 1,
        originalName: 'rapport.pdf',
        size: 18,
        downloadToken: 'abc-123',
        expirationDate: daysFromNow(3),
        password: 'secret1',
      },
    }).as('upload');

    cy.get('#password').type('secret1');
    cy.get('#expiration').select('Trois jours');
    cy.contains('button', 'Téléverser').click();

    cy.wait('@upload').then(({ request }) => {
      expect(request.headers['authorization']).to.match(/^Bearer /);
      expect(request.headers['content-type']).to.include('multipart/form-data');
    });

    cy.contains('Félicitations, ton fichier sera conservé chez nous pendant 3 jours').should('be.visible');
    cy.get('#downloadLink').should('have.value', `${Cypress.config('baseUrl')}/download/abc-123`);
  });

  it('refuse un mot de passe trop court', () => {
    cy.intercept('POST', '/api/files', cy.spy().as('uploadSpy'));

    cy.get('#password').type('abc');
    cy.contains('button', 'Téléverser').click();

    cy.get('[role="alert"]').should('contain', 'au moins 6 caractères');
    cy.get('@uploadSpy').should('not.have.been.called');
  });

  it('affiche une erreur si le backend refuse le fichier', () => {
    cy.intercept('POST', '/api/files', { statusCode: 400 }).as('upload');

    cy.contains('button', 'Téléverser').click();

    cy.wait('@upload');
    cy.get('[role="alert"]').should('contain', 'Fichier manquant ou format non autorisé.');
  });
});

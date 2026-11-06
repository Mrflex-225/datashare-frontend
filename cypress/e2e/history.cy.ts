import { TOKEN_KEY, daysFromNow } from '../support/commands';

describe('Historique et suppression', () => {
  const files = [
    {
      id: 1,
      originalName: 'rapport.pdf',
      size: 2048,
      createdAt: daysFromNow(-1),
      expirationDate: daysFromNow(2),
      downloadToken: 'token-actif',
      password: true,
    },
    {
      id: 2,
      originalName: 'ancien.zip',
      size: 5 * 1024 * 1024,
      createdAt: daysFromNow(-10),
      expirationDate: daysFromNow(-3),
      downloadToken: 'token-expire',
      password: false,
    },
  ];

  const fileItem = (name: string) => cy.contains('.file-item', name);

  beforeEach(() => {
    cy.intercept('GET', '/api/files/me', files).as('myFiles');
    cy.visitAsLoggedIn('/history');
    cy.wait('@myFiles');
  });

  it('liste les fichiers de l’utilisateur avec leur expiration', () => {
    cy.get('.file-item').should('have.length', 2);
    fileItem('rapport.pdf').should('contain', 'Expire dans 2 jours');
    fileItem('ancien.zip').should('contain', 'Expiré').and('contain', "il n'est plus stocké chez nous");
    fileItem('ancien.zip').find('button').should('not.exist');
  });

  it('filtre les fichiers actifs et expirés', () => {
    cy.contains('.filters button', 'Actifs').click();
    cy.get('.file-item').should('have.length', 1).and('contain', 'rapport.pdf');

    cy.contains('.filters button', 'Expiré').click();
    cy.get('.file-item').should('have.length', 1).and('contain', 'ancien.zip');
  });

  it('ouvre la page de téléchargement d’un fichier', () => {
    fileItem('rapport.pdf').contains('button', 'Accéder').click();
    cy.location('pathname').should('eq', '/download/token-actif');
  });

  it('supprime un fichier après confirmation', () => {
    cy.intercept('DELETE', '/api/files/1', { statusCode: 204 }).as('delete');
    cy.on('window:confirm', (text) => {
      expect(text).to.contain('rapport.pdf');
      return true;
    });

    fileItem('rapport.pdf').contains('button', 'Supprimer').click();

    cy.wait('@delete');
    cy.contains('.file-item', 'rapport.pdf').should('not.exist');
    cy.get('.file-item').should('have.length', 1);
  });

  it('ne supprime rien si l’utilisateur annule', () => {
    cy.intercept('DELETE', '/api/files/*', cy.spy().as('deleteSpy'));
    cy.on('window:confirm', () => false);

    fileItem('rapport.pdf').contains('button', 'Supprimer').click();

    cy.get('@deleteSpy').should('not.have.been.called');
    cy.get('.file-item').should('have.length', 2);
  });

  it('déconnecte l’utilisateur', () => {
    cy.get('.logout-button').click();

    cy.location('pathname').should('eq', '/');
    cy.window().its('localStorage').invoke('getItem', TOKEN_KEY).should('be.null');
    cy.contains('a', 'Se connecter').should('be.visible');
  });

  context('sur mobile', () => {
    beforeEach(() => cy.viewport('iphone-x'));

    it('passe par le menu ⋮ pour accéder à un fichier', () => {
      fileItem('rapport.pdf').find('.access-button').should('not.be.visible');
      fileItem('rapport.pdf').find('.menu-toggle').click();
      fileItem('rapport.pdf').find('.menu-panel').contains('Accéder').click();

      cy.location('pathname').should('eq', '/download/token-actif');
    });

    it('ouvre le menu latéral avec le bouton ☰', () => {
      cy.get('.sidebar').should('not.be.visible');
      cy.get('.burger').click();
      cy.get('.sidebar').should('be.visible').and('contain', 'Mes fichiers');
    });
  });
});

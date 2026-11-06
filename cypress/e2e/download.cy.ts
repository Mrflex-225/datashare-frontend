import { daysFromNow } from '../support/commands';

describe('Téléchargement', () => {
  const token = 'abc-123';
  const metadataUrl = (t = token) => `/api/files/download/${t}/metadata`;
  const downloadUrl = `/api/files/download/${token}`;

  const metadata = (password: boolean) => ({
    originalName: 'rapport.pdf',
    contentType: 'application/pdf',
    size: 2048,
    expirationDate: daysFromNow(3),
    password,
  });

  beforeEach(() => {
    cy.intercept('GET', '/fake-s3/rapport.pdf', {
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<p>fichier</p>',
    }).as('s3');
  });

  it('affiche les infos du fichier et lance le téléchargement sans être connecté', () => {
    cy.intercept('GET', metadataUrl(), metadata(false)).as('metadata');
    cy.intercept('POST', downloadUrl, { downloadUrl: '/fake-s3/rapport.pdf' }).as('download');

    cy.visit(`/download/${token}`);
    cy.wait('@metadata');

    cy.contains('h2', 'Télécharger un fichier').should('be.visible');
    cy.get('.file-name').should('contain', 'rapport.pdf');
    cy.contains('Ce fichier expirera dans 3 jours.').should('be.visible');
    cy.get('#downloadPassword').should('not.exist');

    cy.contains('button', 'Télécharger').click();

    cy.wait('@download').its('request.body').should('deep.equal', { password: null });
    cy.wait('@s3');
    cy.location('pathname').should('eq', '/fake-s3/rapport.pdf');
  });

  it('demande le mot de passe et affiche une erreur s’il est incorrect', () => {
    cy.intercept('GET', metadataUrl(), metadata(true)).as('metadata');
    cy.intercept('POST', downloadUrl, { statusCode: 403 }).as('download');

    cy.visit(`/download/${token}`);
    cy.wait('@metadata');

    cy.contains('button', 'Télécharger').should('be.disabled');
    cy.get('#downloadPassword').type('mauvais');
    cy.contains('button', 'Télécharger').should('be.enabled').click();

    cy.wait('@download').its('request.body').should('deep.equal', { password: 'mauvais' });
    cy.get('[role="alert"]').should('contain', 'Mot de passe incorrect.');
  });

  it('indique que le fichier a expiré', () => {
    cy.intercept('GET', metadataUrl('expire'), { statusCode: 410 }).as('metadata');

    cy.visit('/download/expire');
    cy.wait('@metadata');

    cy.get('[role="alert"]').should('contain', "Ce fichier n'est plus disponible en téléchargement car il a expiré.");
    cy.contains('button', 'Télécharger').should('not.exist');
  });

  it('affiche un message quand le lien est invalide', () => {
    cy.intercept('GET', metadataUrl('inconnu'), { statusCode: 404 }).as('metadata');

    cy.visit('/download/inconnu');
    cy.wait('@metadata');

    cy.get('[role="alert"]').should('contain', 'Ce lien de partage est invalide.');
  });
});

export const TOKEN_KEY = 'datashare_token';
export const TOKEN_EXPIRY_KEY = 'datashare_token_expires_at';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const fakeJwt = (): string => {
  const exp = Math.floor((Date.now() + ONE_DAY_MS) / 1000);
  return `header.${btoa(JSON.stringify({ sub: 'user@example.com', exp }))}.signature`;
};

export const daysFromNow = (days: number): string => new Date(Date.now() + days * ONE_DAY_MS).toISOString();

declare global {
  namespace Cypress {
    interface Chainable {
      visitAsLoggedIn(path: string): Chainable<AUTWindow>;
    }
  }
}

Cypress.Commands.add('visitAsLoggedIn', (path: string) =>
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem(TOKEN_KEY, fakeJwt());
      win.localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + ONE_DAY_MS));
    },
  }),
);

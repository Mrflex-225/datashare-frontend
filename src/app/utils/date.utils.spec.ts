import { formatExpiresIn, getFormattedExpirationDuration, isExpired } from './date.utils';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const inMs = (ms: number) => new Date(Date.now() + ms).toISOString();

describe('date utils', () => {
  it('should detect expired dates', () => {
    expect(isExpired(inMs(-HOUR))).toBe(true);
    expect(isExpired(inMs(HOUR))).toBe(false);
  });

  it.each([
    [5 * HOUR, 'dans 5 heures'],
    [DAY, 'demain'],
    [3 * DAY, 'dans 3 jours'],
  ])('formatExpiresIn(+%d ms) should be "%s"', (ms, expected) => {
    expect(formatExpiresIn(inMs(ms))).toBe(expected);
  });

  it.each([
    [DAY, 'pendant 1 jour'],
    [3 * DAY, 'pendant 3 jours'],
    [7 * DAY, 'pendant une semaine'],
  ])('getFormattedExpirationDuration(+%d ms) should be "%s"', (ms, expected) => {
    expect(getFormattedExpirationDuration(inMs(ms))).toBe(expected);
  });
});

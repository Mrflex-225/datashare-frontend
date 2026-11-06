const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function isExpired(expirationDate: string): boolean {
  return new Date(expirationDate).getTime() <= Date.now();
}

export function getFormattedExpirationDuration(
  expirationDate: string,
  prefix: 'pendant' | 'dans' = 'pendant',
): string {
  const diff = new Date(expirationDate).getTime() - Date.now();
  const hours = Math.round(diff / HOUR);
  const days = Math.round(diff / DAY);

  if (hours < 24) {
    return `${prefix} ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (days <= 1) {
    return `${prefix} 1 jour`;
  }
  if (days < 7) {
    return `${prefix} ${days} jours`;
  }
  return `${prefix} une semaine`;
}

export function formatExpiresIn(expirationDate: string): string {
  const diff = new Date(expirationDate).getTime() - Date.now();
  const days = Math.round(diff / DAY);

  if (days === 1) {
    return 'demain';
  }
  if (days > 1) {
    return `dans ${days} jours`;
  }
  const hours = Math.max(1, Math.round(diff / HOUR));
  return `dans ${hours} heure${hours > 1 ? 's' : ''}`;
}

export function expiresWithinADay(expirationDate: string): boolean {
  return new Date(expirationDate).getTime() - Date.now() <= 1.5 * DAY;
}

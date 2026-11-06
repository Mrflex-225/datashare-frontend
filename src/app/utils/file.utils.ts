export const MAX_FILE_SIZE = 1024 * 1024 * 1024;

const UNITS = ['o', 'Ko', 'Mo', 'Go'];

export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = unit === 0 ? String(value) : value.toFixed(1).replace('.', ',');
  return `${rounded} ${UNITS[unit]}`;
}

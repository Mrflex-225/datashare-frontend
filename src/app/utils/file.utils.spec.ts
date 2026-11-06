import { formatFileSize } from './file.utils';

describe('formatFileSize', () => {
  it.each([
    [500, '500 o'],
    [2048, '2,0 Ko'],
    [2.6 * 1024 ** 2, '2,6 Mo'],
    [3.1 * 1024 ** 3, '3,1 Go'],
  ])('should format %d bytes as "%s"', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

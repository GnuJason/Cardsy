import { describe, expect, it } from 'vitest';
import { cardBackUrl } from '../src/config/cardArt';

describe('cardBackUrl', () => {
  it('accepts shipped filenames with spaces and tildes', () => {
    expect(cardBackUrl('50th Photo Booth Lens - 2022-06-17 12_01_39.jpg')).toBe(
      '/cards/backs/50th Photo Booth Lens - 2022-06-17 12_01_39.jpg',
    );
    expect(cardBackUrl('IMG-1837~3.jpg')).toBe('/cards/backs/IMG-1837~3.jpg');
    expect(cardBackUrl('Screenshot 2026-02-10 174744.png')).toBe(
      '/cards/backs/Screenshot 2026-02-10 174744.png',
    );
  });

  it('rejects traversal and path separator attempts', () => {
    expect(cardBackUrl('../secret.png')).toBe('/cards/backs/default.png');
    expect(cardBackUrl('nested/path.png')).toBe('/cards/backs/default.png');
    expect(cardBackUrl('nested\\path.png')).toBe('/cards/backs/default.png');
    expect(cardBackUrl('evil..name.png')).toBe('/cards/backs/default.png');
  });
});

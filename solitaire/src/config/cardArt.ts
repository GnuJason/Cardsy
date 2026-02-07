/**
 * Card art configuration.
 * Swap paths here to change card back / suit photos.
 */

export const CARD_BACK_DEFAULT = '/cards/backs/default.png';

// Optional per-suit photos (used as subtle background on card faces)
export const SUIT_PHOTOS: Record<string, string | null> = {
  hearts: null,   // e.g. '/cards/suits/hearts.png'
  diamonds: null,
  clubs: null,
  spades: null,
};

/**
 * Returns the card back image URL for the given filename.
 */
export function cardBackUrl(filename: string): string {
  return `/cards/backs/${filename}`;
}

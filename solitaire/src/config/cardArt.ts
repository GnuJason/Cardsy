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

const SAFE_FILENAME = /^(?!.*[\\/])(?!.*\.\.)[a-zA-Z0-9 _.~%()-]+\.(png|jpe?g)$/i;

/**
 * Returns the card back image URL for the given filename.
 * Rejects filenames containing path traversal or unexpected characters.
 */
export function cardBackUrl(filename: string): string {
  if (!SAFE_FILENAME.test(filename)) {
    return CARD_BACK_DEFAULT;
  }
  return `/cards/backs/${filename}`;
}

// ── Per-card back images ────────────────────────────────────
// 51 unique photos sorted alphabetically and assigned in suit order
// (hearts, diamonds, clubs, spades) then rank (1=A … 13=K).
// King of Spades (spades-13) has no assigned image and uses the fallback.

const CARD_BACKS: Record<string, string> = {
  // ♥ Hearts (A–K)
  'hearts-1':  '/cards/backs/10_20161130_201304.jpg',
  'hearts-2':  '/cards/backs/20150404_171440-1.jpg',
  'hearts-3':  '/cards/backs/20160905_184128.jpg',
  'hearts-4':  '/cards/backs/20161130_201211.jpg',
  'hearts-5':  '/cards/backs/20161130_201242.jpg',
  'hearts-6':  '/cards/backs/20171213_135440.jpg',
  'hearts-7':  '/cards/backs/20190228_230739.jpg',
  'hearts-8':  '/cards/backs/20201229_193501.jpg',
  'hearts-9':  '/cards/backs/20210219_170647_capture.jpg',
  'hearts-10': '/cards/backs/20210327_121714.jpg',
  'hearts-11': '/cards/backs/20210523_163153~3.jpg',
  'hearts-12': '/cards/backs/20210523_163303.jpg',
  'hearts-13': '/cards/backs/20210620_131500.jpg',

  // ♦ Diamonds (A–K)
  'diamonds-1':  '/cards/backs/20220507_112831.jpg',
  'diamonds-2':  '/cards/backs/20220606_143015.jpg',
  'diamonds-3':  '/cards/backs/20220807_170312.jpg',
  'diamonds-4':  '/cards/backs/20230109_165559.jpg',
  'diamonds-5':  '/cards/backs/20230713_124125.jpg',
  'diamonds-6':  '/cards/backs/20230721_200413.jpg',
  'diamonds-7':  '/cards/backs/20230805_130333.jpg',
  'diamonds-8':  '/cards/backs/20231121_164214.jpg',
  'diamonds-9':  '/cards/backs/20240208_170858~3.jpg',
  'diamonds-10': '/cards/backs/20240208_171635.jpg',
  'diamonds-11': '/cards/backs/20240208_171647.jpg',
  'diamonds-12': '/cards/backs/20240210_074754.jpg',
  'diamonds-13': '/cards/backs/20240618_110330.jpg',

  // ♣ Clubs (A–K)
  'clubs-1':  '/cards/backs/20240705_172459.jpg',
  'clubs-2':  '/cards/backs/20250412_112209.jpg',
  'clubs-3':  '/cards/backs/20250708_222438.jpg',
  'clubs-4':  '/cards/backs/20251025_155300.jpg',
  'clubs-5':  '/cards/backs/30_FB_IMG_1462542908736.jpg',
  'clubs-6':  '/cards/backs/43_20160305_145102.jpg',
  'clubs-7':  '/cards/backs/50th%20Photo%20Booth%20Lens%20-%202022-06-17%2012_01_39.jpg',
  'clubs-8':  '/cards/backs/7_FB_IMG_1535026130519.jpg',
  'clubs-9':  '/cards/backs/FACE_RC_1612506327977.jpg',
  'clubs-10': '/cards/backs/image.jpg',
  'clubs-11': '/cards/backs/IMG-1837~3.jpg',
  'clubs-12': '/cards/backs/IMG_20200903_101055_510.jpg',
  'clubs-13': '/cards/backs/IMG_20221201_114847.jpg',

  // ♠ Spades (A–Q) — King of Spades uses fallback
  'spades-1':  '/cards/backs/received_515288146968033.jpeg',
  'spades-2':  '/cards/backs/Resized_20210327_122527.jpeg',
  'spades-3':  '/cards/backs/Screenshot_20170829-091222.jpg',
  'spades-4':  '/cards/backs/Screenshot_20171020-215623.png',
  'spades-5':  '/cards/backs/Screenshot_20240622_090950_Gallery.jpg',
  'spades-6':  '/cards/backs/Screenshot_20240622_091207_Gallery.jpg',
  'spades-7':  '/cards/backs/Screenshot_20240622_095050_Gallery.jpg',
  'spades-8':  '/cards/backs/Screenshot_20250621_112512_Gallery.jpg',
  'spades-9':  '/cards/backs/Screenshot_20250621_113125_Gallery.jpg',
  'spades-10': '/cards/backs/Screenshot_20250621_141051_Gallery.jpg',
  'spades-11': '/cards/backs/Screenshot_20251031_101500_Gallery.jpg',
  'spades-12': '/cards/backs/Screenshot%202026-02-10%20174744.png',
};

/**
 * Returns the per-card back image URL, or null if none is assigned.
 * Handles Spider's counter-suffixed IDs (e.g. "spades-5-2" → "spades-5").
 */
export function getCardBackImage(cardId: string): string | null {
  // Direct lookup first (standard 52-card IDs)
  if (CARD_BACKS[cardId]) return CARD_BACKS[cardId];

  // Strip trailing counter suffix for Spider's 2-deck IDs
  const baseId = cardId.replace(/-\d+$/, '');
  return CARD_BACKS[baseId] ?? null;
}

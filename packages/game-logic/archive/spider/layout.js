// ── Spider Layout Constants ──────────────────────────────────
/** Number of tableau columns */
export const COLUMN_COUNT = 10;
/** Number of completed-run foundation slots */
export const FOUNDATION_COUNT = 8;
/** Total cards in a Spider game (two decks) */
export const TOTAL_CARDS = 104;
/** Number of cards dealt to tableau (54 total) */
export const DEALT_CARDS = 54;
/** Stock: 50 remaining cards dealt in 5 batches of 10 */
export const STOCK_BATCHES = 5;
/** Columns 0-3 get 6 cards; columns 4-9 get 5 cards */
export function cardsInColumn(colIndex) {
    return colIndex < 4 ? 6 : 5;
}

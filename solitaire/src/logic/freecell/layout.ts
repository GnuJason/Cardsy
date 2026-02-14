// ── FreeCell Layout Constants ────────────────────────────────

/** Number of tableau columns */
export const COLUMN_COUNT = 8;

/** Number of free cell slots */
export const FREE_CELL_COUNT = 4;

/** Number of foundation piles (one per suit) */
export const FOUNDATION_COUNT = 4;

/** Columns 0-3 get 7 cards; columns 4-7 get 6 cards */
export function cardsInColumn(colIndex: number): number {
  return colIndex < 4 ? 7 : 6;
}

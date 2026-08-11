import type { Card } from '../types';
import type { SpiderGameState } from '../types';
import { COLUMN_COUNT } from './layout';

// ── Sequence Helpers ────────────────────────────────────────

/**
 * Starting from `startIndex`, is the sub-sequence to the bottom
 * of the column an in-suit descending run?
 * e.g. 8♠ 7♠ 6♠ is valid; 8♠ 7♥ 6♠ is not.
 */
export function isInSuitRun(column: Card[], startIndex: number): boolean {
  for (let i = startIndex; i < column.length - 1; i++) {
    const upper = column[i];
    const lower = column[i + 1];
    if (lower.rank !== upper.rank - 1) return false;
    if (lower.suit !== upper.suit) return false;
    if (!lower.faceUp || !upper.faceUp) return false;
  }
  return column[startIndex].faceUp;
}

/**
 * Get the longest in-suit descending run from the bottom of a column
 * going upward. Returns the start index of that run.
 */
export function getRunStart(column: Card[]): number {
  if (column.length === 0) return 0;
  let start = column.length - 1;
  while (start > 0) {
    const upper = column[start - 1];
    const lower = column[start];
    if (
      !upper.faceUp ||
      upper.suit !== lower.suit ||
      upper.rank !== lower.rank + 1
    ) {
      break;
    }
    start--;
  }
  return start;
}

// ── Placement Rules ─────────────────────────────────────────

/**
 * Can a card be placed on top of a tableau column?
 * Empty columns accept any card.
 * Non-empty: the moving card must be rank = top.rank - 1 (any suit).
 */
export function canPlaceOnColumn(card: Card, column: Card[]): boolean {
  if (column.length === 0) return true;
  const top = column[column.length - 1];
  return card.rank === top.rank - 1 && top.faceUp;
}

// ── Completed Run Detection ─────────────────────────────────

/**
 * Check if the bottom 13 cards of a column form a complete
 * K→A in-suit run. Returns true if so.
 */
export function hasCompletedRun(column: Card[]): boolean {
  if (column.length < 13) return false;
  const start = column.length - 13;
  const topCard = column[start];
  if (topCard.rank !== 13) return false;
  return isInSuitRun(column, start);
}

// ── Deal Row ────────────────────────────────────────────────

/**
 * Can a row of 10 cards be dealt from stock?
 * Requires: stock >= 10 cards AND no empty columns.
 */
export function canDealRow(state: SpiderGameState): boolean {
  if (state.stock.length < COLUMN_COUNT) return false;
  return state.columns.every((col) => col.length > 0);
}

// ── Win Detection ───────────────────────────────────────────

/**
 * Is the game won? 8 completed runs = all 104 cards cleared.
 */
export function isWon(state: SpiderGameState): boolean {
  return state.completedRuns >= 8;
}

// ── Has Any Moves ───────────────────────────────────────────

/**
 * Does the player have any legal move? Includes:
 * - Move any in-suit sequence to another column
 * - Deal a row from stock (if no empty columns)
 */
export function hasAnyMoves(state: SpiderGameState): boolean {
  // Can deal from stock?
  if (canDealRow(state)) return true;

  for (let col = 0; col < state.columns.length; col++) {
    const column = state.columns[col];
    if (column.length === 0) continue;

    // Find the longest in-suit run from bottom
    const runStart = getRunStart(column);
    const movingCard = column[runStart];

    for (let target = 0; target < state.columns.length; target++) {
      if (target === col) continue;
      if (canPlaceOnColumn(movingCard, state.columns[target])) {
        // Don't count moving to an empty column if there's no benefit
        // (moving a run that starts at index 0 to an empty column is pointless)
        if (state.columns[target].length === 0 && runStart === 0) continue;
        return true;
      }
    }
  }

  return false;
}

import type { Card, FreeCellGameState } from '../types';
import { suitColor, SUIT_INDEX, SUITS } from '../types';

// ── Sequence Helpers ────────────────────────────────────────

/**
 * Check if cards from `startIndex` to the bottom of a column
 * form a valid alternating-color descending sequence.
 */
export function isValidSequence(column: Card[], startIndex: number): boolean {
  for (let i = startIndex; i < column.length - 1; i++) {
    const upper = column[i];
    const lower = column[i + 1];
    if (lower.rank !== upper.rank - 1) return false;
    if (suitColor(lower.suit) === suitColor(upper.suit)) return false;
  }
  return true;
}

/**
 * Calculate the maximum number of cards that can be moved
 * as a supermove: (emptyFreeCells + 1) × 2^(emptyColumns).
 *
 * If we're moving TO an empty column, we exclude that column
 * from the empty-column count.
 */
export function moveCapacity(
  state: FreeCellGameState,
  targetIsEmptyColumn: boolean = false,
): number {
  const emptyFreeCells = state.freeCells.filter((c) => c === null).length;
  let emptyColumns = state.columns.filter((col) => col.length === 0).length;
  if (targetIsEmptyColumn && emptyColumns > 0) {
    emptyColumns -= 1;
  }
  return (emptyFreeCells + 1) * Math.pow(2, emptyColumns);
}

// ── Placement Rules ─────────────────────────────────────────

/**
 * Can a card be placed on top of a tableau column?
 * Empty columns accept any card.
 * Non-empty: top card must be opposite color and rank+1.
 */
export function canPlaceOnColumn(card: Card, column: Card[]): boolean {
  if (column.length === 0) return true;
  const top = column[column.length - 1];
  return (
    card.rank === top.rank - 1 &&
    suitColor(card.suit) !== suitColor(top.suit)
  );
}

/**
 * Can a card be placed on a foundation pile?
 * Empty foundation: only Ace of the correct suit.
 * Non-empty: same suit, rank = top.rank + 1.
 */
export function canPlaceOnFoundation(
  card: Card,
  foundationIndex: number,
  foundations: Card[][],
): boolean {
  const pile = foundations[foundationIndex];
  const expectedSuit = SUITS[foundationIndex];
  if (card.suit !== expectedSuit) return false;
  if (pile.length === 0) return card.rank === 1;
  return card.rank === pile[pile.length - 1].rank + 1;
}

// ── Auto-Move Logic ─────────────────────────────────────────

/**
 * Determine if a card can be safely auto-moved to its foundation.
 * A card is "safe" to auto-move when both cards of the opposite
 * color with rank-1 are already on foundations (or it's an Ace/2).
 *
 * This prevents auto-moving cards that might still be needed
 * for building tableau sequences.
 */
export function canSafeAutoMove(
  card: Card,
  foundations: Card[][],
): boolean {
  const foundIdx = SUIT_INDEX[card.suit];
  if (!canPlaceOnFoundation(card, foundIdx, foundations)) return false;

  // Aces and 2s are always safe to auto-move
  if (card.rank <= 2) return true;

  // For rank N (N≥3), both opposite-color (N-2) cards must be on foundations
  const neededRank = card.rank - 1;
  const cardColor = suitColor(card.suit);

  for (let i = 0; i < foundations.length; i++) {
    const fSuit = SUITS[i];
    if (suitColor(fSuit) !== cardColor) {
      // Opposite color foundation — must have at least neededRank cards
      if (foundations[i].length < neededRank) return false;
    }
  }
  return true;
}

// ── Win / Loss Detection ────────────────────────────────────

/**
 * Is the game won? All 52 cards on foundations.
 */
export function isWon(state: FreeCellGameState): boolean {
  return state.foundations.reduce((sum, pile) => sum + pile.length, 0) === 52;
}

/**
 * Is the game trivially won? All remaining cards in columns
 * are already in descending order (each column is a valid sequence
 * from top to bottom), meaning the player can just sweep everything
 * to foundations without any strategic moves.
 */
export function isTriviallyWon(state: FreeCellGameState): boolean {
  // All free cells must be empty
  if (state.freeCells.some((c) => c !== null)) return false;

  // Every non-empty column must be a valid descending same-suit run
  // (not just alternating-color — must be in-suit since they go to foundations)
  for (const col of state.columns) {
    if (col.length === 0) continue;
    for (let i = 0; i < col.length - 1; i++) {
      if (col[i].rank !== col[i + 1].rank + 1) return false;
      // Must be same suit for auto-finish (going to same foundation)
      if (col[i].suit !== col[i + 1].suit) return false;
    }
  }
  return true;
}

/**
 * Does any legal move exist?
 */
export function hasAnyMoves(state: FreeCellGameState): boolean {
  const hasEmptyFreeCell = state.freeCells.some((c) => c === null);

  // Check each column's bottom card
  for (let col = 0; col < state.columns.length; col++) {
    const column = state.columns[col];
    if (column.length === 0) continue;

    const bottomCard = column[column.length - 1];

    // Can move bottom card to a free cell?
    if (hasEmptyFreeCell) return true;

    // Can move bottom card to a foundation?
    const fIdx = SUIT_INDEX[bottomCard.suit];
    if (canPlaceOnFoundation(bottomCard, fIdx, state.foundations)) return true;

    // Can move any sequence from this column to another column?
    // Find the longest valid sequence from the bottom
    let seqStart = column.length - 1;
    while (seqStart > 0 && isValidSequence(column, seqStart - 1)) {
      seqStart--;
    }

    const seqCard = column[seqStart];
    for (let targetCol = 0; targetCol < state.columns.length; targetCol++) {
      if (targetCol === col) continue;
      const targetColumn = state.columns[targetCol];
      if (canPlaceOnColumn(seqCard, targetColumn)) {
        const seqLen = column.length - seqStart;
        const isEmptyTarget = targetColumn.length === 0;
        if (seqLen <= moveCapacity(state, isEmptyTarget)) return true;
      }
    }
  }

  // Check free cell cards
  for (let i = 0; i < state.freeCells.length; i++) {
    const card = state.freeCells[i];
    if (!card) continue;

    // Can move to a foundation?
    const fIdx = SUIT_INDEX[card.suit];
    if (canPlaceOnFoundation(card, fIdx, state.foundations)) return true;

    // Can move to any column?
    for (const col of state.columns) {
      if (canPlaceOnColumn(card, col)) return true;
    }
  }

  return false;
}

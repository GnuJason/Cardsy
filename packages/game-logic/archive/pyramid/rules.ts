import type { Card, PyramidCard, PyramidGameState } from '../types';
import { CHILDREN } from './layout';

/**
 * Check if a pyramid card is uncovered (playable).
 * A card is uncovered when both its children have been removed,
 * or if it's in the bottom row.
 */
export function isUncovered(index: number, pyramid: PyramidCard[]): boolean {
  const [left, right] = CHILDREN[index];
  // Bottom row: no children (sentinel -1)
  if (left === -1) return true;
  return pyramid[left].removed && pyramid[right].removed;
}

/**
 * Get the rank value for pairing purposes (Ace=1 ... King=13).
 */
function rankValue(card: Card | PyramidCard): number {
  return card.rank;
}

/**
 * Can two cards be paired? They must sum to 13.
 */
export function canPair(a: Card | PyramidCard, b: Card | PyramidCard): boolean {
  return rankValue(a) + rankValue(b) === 13;
}

/**
 * Is a card a King (rank 13)? Kings are auto-removed solo.
 */
export function isKing(card: Card | PyramidCard): boolean {
  return card.rank === 13;
}

/**
 * Check if the pyramid is fully cleared (win condition).
 */
export function isWon(state: PyramidGameState): boolean {
  return state.cardsRemaining === 0;
}

/**
 * Check if any legal move exists.
 * Moves:
 * 1. Any uncovered King in the pyramid (auto-remove)
 * 2. Any two uncovered pyramid cards that sum to 13
 * 3. Any uncovered pyramid card + waste top that sum to 13
 * 4. Waste top is a King (auto-remove)
 * 5. Stock has cards to draw
 */
export function hasAnyMoves(state: PyramidGameState): boolean {
  // Collect uncovered pyramid card indices
  const uncovered: number[] = [];
  for (let i = 0; i < state.pyramid.length; i++) {
    if (!state.pyramid[i].removed && isUncovered(i, state.pyramid)) {
      uncovered.push(i);
    }
  }

  // 1. Any uncovered King?
  for (const idx of uncovered) {
    if (isKing(state.pyramid[idx])) return true;
  }

  // 2. Any pair of uncovered pyramid cards summing to 13?
  for (let i = 0; i < uncovered.length; i++) {
    for (let j = i + 1; j < uncovered.length; j++) {
      if (canPair(state.pyramid[uncovered[i]], state.pyramid[uncovered[j]])) {
        return true;
      }
    }
  }

  const wasteTop = state.waste.length > 0 ? state.waste[state.waste.length - 1] : null;

  if (wasteTop) {
    // 3. Any uncovered pyramid card + waste top = 13?
    for (const idx of uncovered) {
      if (canPair(state.pyramid[idx], wasteTop)) return true;
    }

    // 4. Waste top is a King?
    if (isKing(wasteTop)) return true;
  }

  // 5. Stock has cards to draw?
  return state.stock.length > 0;
}

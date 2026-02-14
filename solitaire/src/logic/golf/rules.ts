import type { Card, GolfGameState } from '../types';

/**
 * Check if a card is exposed (playable).
 * In Golf, only the bottom card of each column is playable.
 */
export function isExposed(colIndex: number, tableau: Card[][]): boolean {
  return tableau[colIndex].length > 0;
}

/**
 * Can a card be played onto the waste pile?
 * Golf rule: ±1 rank from waste top, with King↔Ace wrapping.
 */
export function canPlayCard(card: Card, wasteTop: Card): boolean {
  const diff = Math.abs(card.rank - wasteTop.rank);
  return diff === 1 || diff === 12; // diff === 12 handles A(1)↔K(13) wrap
}

/**
 * Check if the tableau is fully cleared (win condition).
 */
export function isWon(state: GolfGameState): boolean {
  return state.cardsRemaining === 0;
}

/**
 * Check if any legal move exists.
 * A move exists if any exposed (bottom) tableau card is ±1 from waste top,
 * or if the stock has cards to draw.
 */
export function hasAnyMoves(state: GolfGameState): boolean {
  if (state.waste.length === 0) return state.stock.length > 0;

  const wasteTop = state.waste[state.waste.length - 1];

  // Check bottom card of each non-empty column
  for (let col = 0; col < state.tableau.length; col++) {
    const column = state.tableau[col];
    if (column.length > 0) {
      const bottomCard = column[column.length - 1];
      if (canPlayCard(bottomCard, wasteTop)) {
        return true;
      }
    }
  }

  // Can still draw from stock
  return state.stock.length > 0;
}

import type { Card, TriPeaksCard, TriPeaksGameState } from '../types';
import { BLOCKED_BY, PEAK_TOPS } from './layout';

/**
 * Check if a pyramid card is exposed (playable).
 * A card is exposed when all cards that sit on top of it have been removed.
 */
export function isExposed(index: number, pyramid: TriPeaksCard[]): boolean {
  if (pyramid[index].removed) return false;
  return BLOCKED_BY[index].every((blockerIdx) => pyramid[blockerIdx].removed);
}

/**
 * Can a card be played onto the waste pile?
 * TriPeaks rule: ±1 rank from waste top, with King↔Ace wrapping.
 */
export function canPlayCard(card: Card, wasteTop: Card): boolean {
  const diff = Math.abs(card.rank - wasteTop.rank);
  return diff === 1 || diff === 12; // diff === 12 handles A(1)↔K(13) wrap
}

/**
 * Check if a specific peak is cleared.
 * A peak is cleared when its top card (row 0) has been removed.
 */
export function isPeakCleared(peakIndex: number, pyramid: TriPeaksCard[]): boolean {
  return pyramid[PEAK_TOPS[peakIndex]].removed;
}

/**
 * Check if the board is fully cleared (win condition).
 */
export function isWon(state: TriPeaksGameState): boolean {
  return state.pyramid.every((card) => card.removed);
}

/**
 * Check if any legal move exists.
 * A move exists if any exposed pyramid card is ±1 from waste top,
 * or if the stock has cards to draw.
 */
export function hasAnyMoves(state: TriPeaksGameState): boolean {
  if (state.waste.length === 0) return state.stock.length > 0;

  const wasteTop = state.waste[state.waste.length - 1];

  // Check exposed pyramid cards
  for (let i = 0; i < state.pyramid.length; i++) {
    if (isExposed(i, state.pyramid) && canPlayCard(state.pyramid[i], wasteTop)) {
      return true;
    }
  }

  // Can still draw from stock
  return state.stock.length > 0;
}

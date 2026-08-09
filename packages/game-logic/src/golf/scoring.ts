// ── Golf Scoring ────────────────────────────────────────────
//
// Golf uses subtractive scoring: the score IS the number of
// cards remaining in the tableau. Lower is better. 0 = perfect.
// There is no additive scoring or timer bonus.

import type { GolfGameState } from '../types';

/**
 * Returns the number of cards remaining in the tableau.
 * This is the player's score (lower is better).
 */
export function cardsRemaining(state: GolfGameState): number {
  return state.cardsRemaining;
}

/**
 * Undo penalty: not applicable for Golf since score = remaining count.
 * Undoing restores a card to the tableau, naturally increasing the count.
 * This constant exists for symmetry with other modes.
 */
export function undoPenalty(): number {
  return 0;
}

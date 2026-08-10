import type { GolfGameState } from '../types';
/**
 * Returns the number of cards remaining in the tableau.
 * This is the player's score (lower is better).
 */
export declare function cardsRemaining(state: GolfGameState): number;
/**
 * Undo penalty: not applicable for Golf since score = remaining count.
 * Undoing restores a card to the tableau, naturally increasing the count.
 * This constant exists for symmetry with other modes.
 */
export declare function undoPenalty(): number;

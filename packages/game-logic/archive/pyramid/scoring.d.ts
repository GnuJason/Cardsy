import type { PyramidGameState } from '../types';
/**
 * Returns the number of cards remaining in the pyramid.
 * This is the player's score (lower is better).
 */
export declare function cardsRemaining(state: PyramidGameState): number;
/**
 * Undo penalty: not applicable for Pyramid since score = remaining count.
 * Undoing restores cards to the pyramid, naturally increasing the count.
 * This constant exists for symmetry with other modes.
 */
export declare function undoPenalty(): number;

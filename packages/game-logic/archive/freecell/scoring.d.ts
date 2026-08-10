import type { FreeCellGameState } from '../types';
/**
 * Returns the move count (the player's score — lower is better).
 */
export declare function movesCount(state: FreeCellGameState): number;
/**
 * Undo penalty: not applicable for FreeCell.
 * This constant exists for symmetry with other modes.
 */
export declare function undoPenalty(): number;

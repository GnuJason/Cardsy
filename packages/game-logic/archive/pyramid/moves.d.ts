import type { PyramidGameState } from '../types';
export declare function cloneState(state: PyramidGameState): PyramidGameState;
/**
 * Draw one card from stock to waste. No recycling.
 * Returns null if stock is empty.
 */
export declare function drawFromStock(state: PyramidGameState): PyramidGameState | null;
/**
 * Remove a King from the pyramid (auto-remove, no pair needed).
 * Returns null if the card at index is not an uncovered King.
 */
export declare function removeKing(state: PyramidGameState, pyramidIndex: number): PyramidGameState | null;
/**
 * Remove the waste-top King.
 * Returns null if waste top is not a King.
 */
export declare function removeWasteKing(state: PyramidGameState): PyramidGameState | null;
/**
 * Remove two uncovered pyramid cards that sum to 13.
 * Returns null if the pair is invalid.
 */
export declare function removePyramidPair(state: PyramidGameState, indexA: number, indexB: number): PyramidGameState | null;
/**
 * Remove an uncovered pyramid card paired with the waste top.
 * Both must sum to 13.
 * Returns null if the pair is invalid.
 */
export declare function removePyramidWastePair(state: PyramidGameState, pyramidIndex: number): PyramidGameState | null;

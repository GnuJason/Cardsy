import type { GolfGameState } from '../types';
export declare function cloneState(state: GolfGameState): GolfGameState;
/**
 * Draw one card from stock to waste. No recycling.
 * Returns null if stock is empty.
 */
export declare function drawFromStock(state: GolfGameState): GolfGameState | null;
/**
 * Play the bottom card of a column onto the waste pile.
 * Returns null if the move is illegal.
 */
export declare function playCard(state: GolfGameState, colIndex: number): GolfGameState | null;

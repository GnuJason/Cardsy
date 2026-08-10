import type { Card, GolfGameState } from '../types';
/**
 * Check if a card is exposed (playable).
 * In Golf, only the bottom card of each column is playable.
 */
export declare function isExposed(colIndex: number, tableau: Card[][]): boolean;
/**
 * Can a card be played onto the waste pile?
 * Golf rule: ±1 rank from waste top, with King↔Ace wrapping.
 */
export declare function canPlayCard(card: Card, wasteTop: Card): boolean;
/**
 * Check if the tableau is fully cleared (win condition).
 */
export declare function isWon(state: GolfGameState): boolean;
/**
 * Check if any legal move exists.
 * A move exists if any exposed (bottom) tableau card is ±1 from waste top,
 * or if the stock has cards to draw.
 */
export declare function hasAnyMoves(state: GolfGameState): boolean;

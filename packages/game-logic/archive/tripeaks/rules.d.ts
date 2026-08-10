import type { Card, TriPeaksCard, TriPeaksGameState } from '../types';
/**
 * Check if a pyramid card is exposed (playable).
 * A card is exposed when all cards that sit on top of it have been removed.
 */
export declare function isExposed(index: number, pyramid: TriPeaksCard[]): boolean;
/**
 * Can a card be played onto the waste pile?
 * TriPeaks rule: ±1 rank from waste top, with King↔Ace wrapping.
 */
export declare function canPlayCard(card: Card, wasteTop: Card): boolean;
/**
 * Check if a specific peak is cleared.
 * A peak is cleared when its top card (row 0) has been removed.
 */
export declare function isPeakCleared(peakIndex: number, pyramid: TriPeaksCard[]): boolean;
/**
 * Check if the board is fully cleared (win condition).
 */
export declare function isWon(state: TriPeaksGameState): boolean;
/**
 * Check if any legal move exists.
 * A move exists if any exposed pyramid card is ±1 from waste top,
 * or if the stock has cards to draw.
 */
export declare function hasAnyMoves(state: TriPeaksGameState): boolean;

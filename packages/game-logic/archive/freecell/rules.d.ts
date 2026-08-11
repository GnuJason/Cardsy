import type { Card, FreeCellGameState } from '../types';
/**
 * Check if cards from `startIndex` to the bottom of a column
 * form a valid alternating-color descending sequence.
 */
export declare function isValidSequence(column: Card[], startIndex: number): boolean;
/**
 * Calculate the maximum number of cards that can be moved
 * as a supermove: (emptyFreeCells + 1) × 2^(emptyColumns).
 *
 * If we're moving TO an empty column, we exclude that column
 * from the empty-column count.
 */
export declare function moveCapacity(state: FreeCellGameState, targetIsEmptyColumn?: boolean): number;
/**
 * Can a card be placed on top of a tableau column?
 * Empty columns accept any card.
 * Non-empty: top card must be opposite color and rank+1.
 */
export declare function canPlaceOnColumn(card: Card, column: Card[]): boolean;
/**
 * Can a card be placed on a foundation pile?
 * Empty foundation: only Ace of the correct suit.
 * Non-empty: same suit, rank = top.rank + 1.
 */
export declare function canPlaceOnFoundation(card: Card, foundationIndex: number, foundations: Card[][]): boolean;
/**
 * Determine if a card can be safely auto-moved to its foundation.
 * A card is "safe" to auto-move when both cards of the opposite
 * color with rank-1 are already on foundations (or it's an Ace/2).
 *
 * This prevents auto-moving cards that might still be needed
 * for building tableau sequences.
 */
export declare function canSafeAutoMove(card: Card, foundations: Card[][]): boolean;
/**
 * Is the game won? All 52 cards on foundations.
 */
export declare function isWon(state: FreeCellGameState): boolean;
/**
 * Is the game trivially won? All remaining cards in columns
 * are already in descending order (each column is a valid sequence
 * from top to bottom), meaning the player can just sweep everything
 * to foundations without any strategic moves.
 */
export declare function isTriviallyWon(state: FreeCellGameState): boolean;
/**
 * Does any legal move exist?
 */
export declare function hasAnyMoves(state: FreeCellGameState): boolean;

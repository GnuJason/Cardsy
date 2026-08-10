import type { Card } from '../types';
import type { SpiderGameState } from '../types';
/**
 * Starting from `startIndex`, is the sub-sequence to the bottom
 * of the column an in-suit descending run?
 * e.g. 8♠ 7♠ 6♠ is valid; 8♠ 7♥ 6♠ is not.
 */
export declare function isInSuitRun(column: Card[], startIndex: number): boolean;
/**
 * Get the longest in-suit descending run from the bottom of a column
 * going upward. Returns the start index of that run.
 */
export declare function getRunStart(column: Card[]): number;
/**
 * Can a card be placed on top of a tableau column?
 * Empty columns accept any card.
 * Non-empty: the moving card must be rank = top.rank - 1 (any suit).
 */
export declare function canPlaceOnColumn(card: Card, column: Card[]): boolean;
/**
 * Check if the bottom 13 cards of a column form a complete
 * K→A in-suit run. Returns true if so.
 */
export declare function hasCompletedRun(column: Card[]): boolean;
/**
 * Can a row of 10 cards be dealt from stock?
 * Requires: stock >= 10 cards AND no empty columns.
 */
export declare function canDealRow(state: SpiderGameState): boolean;
/**
 * Is the game won? 8 completed runs = all 104 cards cleared.
 */
export declare function isWon(state: SpiderGameState): boolean;
/**
 * Does the player have any legal move? Includes:
 * - Move any in-suit sequence to another column
 * - Deal a row from stock (if no empty columns)
 */
export declare function hasAnyMoves(state: SpiderGameState): boolean;

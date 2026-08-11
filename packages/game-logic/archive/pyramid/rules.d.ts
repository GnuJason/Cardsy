import type { Card, PyramidCard, PyramidGameState } from '../types';
/**
 * Check if a pyramid card is uncovered (playable).
 * A card is uncovered when both its children have been removed,
 * or if it's in the bottom row.
 */
export declare function isUncovered(index: number, pyramid: PyramidCard[]): boolean;
/**
 * Can two cards be paired? They must sum to 13.
 */
export declare function canPair(a: Card | PyramidCard, b: Card | PyramidCard): boolean;
/**
 * Is a card a King (rank 13)? Kings are auto-removed solo.
 */
export declare function isKing(card: Card | PyramidCard): boolean;
/**
 * Check if the pyramid is fully cleared (win condition).
 */
export declare function isWon(state: PyramidGameState): boolean;
/**
 * Check if any legal move exists.
 * Moves:
 * 1. Any uncovered King in the pyramid (auto-remove)
 * 2. Any two uncovered pyramid cards that sum to 13
 * 3. Any uncovered pyramid card + waste top that sum to 13
 * 4. Waste top is a King (auto-remove)
 * 5. Stock has cards to draw
 */
export declare function hasAnyMoves(state: PyramidGameState): boolean;

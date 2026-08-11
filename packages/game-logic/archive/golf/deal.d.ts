import type { Card } from '../types';
import type { GolfGameState } from '../types';
/** Number of columns in Golf tableau */
export declare const GOLF_COLUMNS = 7;
/** Number of rows per column */
export declare const GOLF_ROWS = 5;
/** Total tableau cards */
export declare const GOLF_TABLEAU_SIZE: number;
/**
 * Deal a Golf game from a shuffled 52-card deck.
 * - First 35 cards → 7 columns of 5, all face-up
 * - Next 16 cards → stock (face-down)
 * - Last 1 card → waste (face-up, starting discard)
 */
export declare function dealGolf(deck: Card[]): {
    tableau: Card[][];
    stock: Card[];
    waste: Card[];
};
/**
 * Create a fresh Golf game with a shuffled deck.
 */
export declare function newGolfGame(): GolfGameState;

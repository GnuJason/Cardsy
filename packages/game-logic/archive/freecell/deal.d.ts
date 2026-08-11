import type { Card, FreeCellGameState } from '../types';
/**
 * Deal a FreeCell game from a shuffled 52-card deck.
 * Cards are dealt left-to-right across 8 columns.
 * Columns 0–3 get 7 cards; columns 4–7 get 6 cards.
 * All cards face-up.
 */
export declare function dealFreeCell(deck: Card[]): {
    columns: Card[][];
};
/**
 * Create a fresh FreeCell game with a shuffled deck.
 */
export declare function newFreeCellGame(): FreeCellGameState;

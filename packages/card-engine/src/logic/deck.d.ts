import type { Card } from './types';
/**
 * Create a standard 52-card deck, all face-down.
 */
export declare function createDeck(): Card[];
/**
 * Fisher-Yates shuffle. Returns a new array.
 */
export declare function shuffle(deck: Card[], seed?: number): Card[];
/**
 * Deal a Klondike tableau from a shuffled deck.
 * Returns { tableau, stock } where:
 *  - tableau: 7 piles, pile i has (i+1) cards, only the last face-up
 *  - stock: remaining 24 cards, all face-down
 */
export declare function dealKlondike(deck: Card[]): {
    tableau: Card[][];
    stock: Card[];
};
/**
 * Create a new game state with a fresh shuffled deal.
 */
export declare function newGame(): {
    stock: Card[];
    waste: Card[];
    tableau: Card[][];
    foundations: Card[][];
    shuffleSeed: number;
};

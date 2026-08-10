import type { Card, PyramidCard, PyramidGameState } from '../types';
/**
 * Deal a Pyramid game from a shuffled 52-card deck.
 * - First 28 cards → pyramid (all face-up)
 * - Remaining 24 cards → stock (face-down)
 * - Waste starts empty
 */
export declare function dealPyramid(deck: Card[]): {
    pyramid: PyramidCard[];
    stock: Card[];
    waste: Card[];
};
/**
 * Create a fresh Pyramid game with a shuffled deck.
 */
export declare function newPyramidGame(): PyramidGameState;

import type { Card, TriPeaksCard, TriPeaksGameState } from '../types';
/**
 * Deal a TriPeaks game from a shuffled 52-card deck.
 * - First 28 cards → pyramid (bottom row face-up, rest face-down)
 * - Next 23 cards → stock (face-down)
 * - Last 1 card → waste (face-up, starting discard)
 */
export declare function dealTriPeaks(deck: Card[]): {
    pyramid: TriPeaksCard[];
    stock: Card[];
    waste: Card[];
};
/**
 * Create a fresh TriPeaks game with a shuffled deck.
 */
export declare function newTriPeaksGame(): TriPeaksGameState;

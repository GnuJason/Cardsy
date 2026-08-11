import type { Card } from '../types';
import type { SpiderDifficulty, SpiderGameState } from '../types';
/**
 * Build a 104-card deck (two copies) limited to the suits
 * dictated by the difficulty level.
 *
 * - 1-suit:  all 104 cards are ♠
 * - 2-suit:  52 ♠ + 52 ♥
 * - 4-suit:  26 of each suit (standard two-deck)
 */
export declare function createSpiderDeck(difficulty: SpiderDifficulty): Card[];
/**
 * Deal a Spider game from a shuffled 104-card deck.
 * - 10 columns: cols 0–3 get 6 cards, cols 4–9 get 5 cards (54 total)
 * - Only the top card of each column is face-up
 * - Remaining 50 cards go to the stock
 */
export declare function dealSpider(deck: Card[]): {
    columns: Card[][];
    stock: Card[];
};
/**
 * Create a fresh Spider game with the given difficulty.
 */
export declare function newSpiderGame(difficulty: SpiderDifficulty): SpiderGameState;

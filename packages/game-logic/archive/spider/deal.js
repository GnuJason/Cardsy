import { shuffle } from '../deck';
import { createShuffleSeed } from '../random';
import { COLUMN_COUNT, FOUNDATION_COUNT } from './layout';
/**
 * Build a 104-card deck (two copies) limited to the suits
 * dictated by the difficulty level.
 *
 * - 1-suit:  all 104 cards are ♠
 * - 2-suit:  52 ♠ + 52 ♥
 * - 4-suit:  26 of each suit (standard two-deck)
 */
export function createSpiderDeck(difficulty) {
    const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const deck = [];
    let suitsToUse;
    let copiesPerSuit;
    switch (difficulty) {
        case 1:
            suitsToUse = ['spades'];
            copiesPerSuit = 8; // 8 × 13 = 104
            break;
        case 2:
            suitsToUse = ['spades', 'hearts'];
            copiesPerSuit = 4; // 2 suits × 4 × 13 = 104
            break;
        case 4:
            suitsToUse = ['spades', 'hearts', 'diamonds', 'clubs'];
            copiesPerSuit = 2; // 4 suits × 2 × 13 = 104
            break;
    }
    let idCounter = 0;
    for (const suit of suitsToUse) {
        for (let copy = 0; copy < copiesPerSuit; copy++) {
            for (const rank of RANKS) {
                deck.push({
                    suit,
                    rank,
                    faceUp: false,
                    id: `${suit}-${rank}-${idCounter++}`,
                });
            }
        }
    }
    return deck;
}
/**
 * Deal a Spider game from a shuffled 104-card deck.
 * - 10 columns: cols 0–3 get 6 cards, cols 4–9 get 5 cards (54 total)
 * - Only the top card of each column is face-up
 * - Remaining 50 cards go to the stock
 */
export function dealSpider(deck) {
    const columns = Array.from({ length: COLUMN_COUNT }, () => []);
    let idx = 0;
    for (let col = 0; col < COLUMN_COUNT; col++) {
        const count = col < 4 ? 6 : 5;
        for (let row = 0; row < count; row++) {
            columns[col].push({
                ...deck[idx],
                faceUp: row === count - 1,
            });
            idx++;
        }
    }
    const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
    return { columns, stock };
}
/**
 * Create a fresh Spider game with the given difficulty.
 */
export function newSpiderGame(difficulty) {
    const shuffleSeed = createShuffleSeed();
    const deck = shuffle(createSpiderDeck(difficulty), shuffleSeed);
    const { columns, stock } = dealSpider(deck);
    return {
        columns,
        stock,
        completedRuns: 0,
        shuffleSeed,
        score: 500,
        moves: 0,
        elapsedSeconds: 0,
        status: 'playing',
        difficulty,
        selectedSource: null,
        foundations: Array.from({ length: FOUNDATION_COUNT }, () => []),
    };
}

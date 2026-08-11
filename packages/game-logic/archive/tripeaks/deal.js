import { createDeck, shuffle } from '../deck';
import { createShuffleSeed } from '../random';
import { PYRAMID_SIZE, BOTTOM_ROW } from './layout';
/**
 * Deal a TriPeaks game from a shuffled 52-card deck.
 * - First 28 cards → pyramid (bottom row face-up, rest face-down)
 * - Next 23 cards → stock (face-down)
 * - Last 1 card → waste (face-up, starting discard)
 */
export function dealTriPeaks(deck) {
    const bottomRowSet = new Set(BOTTOM_ROW);
    const pyramid = [];
    for (let i = 0; i < PYRAMID_SIZE; i++) {
        const card = deck[i];
        pyramid.push({
            ...card,
            faceUp: bottomRowSet.has(i),
            pyramidIndex: i,
            removed: false,
        });
    }
    // 23 cards for stock (face-down)
    const stock = deck.slice(PYRAMID_SIZE, 51).map((c) => ({ ...c, faceUp: false }));
    // Last card starts face-up in waste
    const wasteCard = { ...deck[51], faceUp: true };
    return { pyramid, stock, waste: [wasteCard] };
}
/**
 * Create a fresh TriPeaks game with a shuffled deck.
 */
export function newTriPeaksGame() {
    const shuffleSeed = createShuffleSeed();
    const deck = shuffle(createDeck(), shuffleSeed);
    const { pyramid, stock, waste } = dealTriPeaks(deck);
    return {
        pyramid,
        stock,
        waste,
        shuffleSeed,
        score: 0,
        moves: 0,
        streak: 0,
        elapsedSeconds: 0,
        status: 'playing',
        peaksCleared: [false, false, false],
    };
}

import { createDeck, shuffle } from '../deck';
import { createShuffleSeed } from '../random';
/** Number of columns in Golf tableau */
export const GOLF_COLUMNS = 7;
/** Number of rows per column */
export const GOLF_ROWS = 5;
/** Total tableau cards */
export const GOLF_TABLEAU_SIZE = GOLF_COLUMNS * GOLF_ROWS; // 35
/**
 * Deal a Golf game from a shuffled 52-card deck.
 * - First 35 cards → 7 columns of 5, all face-up
 * - Next 16 cards → stock (face-down)
 * - Last 1 card → waste (face-up, starting discard)
 */
export function dealGolf(deck) {
    const tableau = [];
    let idx = 0;
    for (let col = 0; col < GOLF_COLUMNS; col++) {
        const column = [];
        for (let row = 0; row < GOLF_ROWS; row++) {
            column.push({ ...deck[idx], faceUp: true });
            idx++;
        }
        tableau.push(column);
    }
    // 16 cards for stock (face-down)
    const stock = deck.slice(idx, 51).map((c) => ({ ...c, faceUp: false }));
    // Last card starts face-up in waste
    const wasteCard = { ...deck[51], faceUp: true };
    return { tableau, stock, waste: [wasteCard] };
}
/**
 * Create a fresh Golf game with a shuffled deck.
 */
export function newGolfGame() {
    const shuffleSeed = createShuffleSeed();
    const deck = shuffle(createDeck(), shuffleSeed);
    const { tableau, stock, waste } = dealGolf(deck);
    return {
        tableau,
        stock,
        waste,
        shuffleSeed,
        cardsRemaining: GOLF_TABLEAU_SIZE,
        moves: 0,
        elapsedSeconds: 0,
        status: 'playing',
    };
}

/** Number of tableau columns */
export declare const COLUMN_COUNT = 10;
/** Number of completed-run foundation slots */
export declare const FOUNDATION_COUNT = 8;
/** Total cards in a Spider game (two decks) */
export declare const TOTAL_CARDS = 104;
/** Number of cards dealt to tableau (54 total) */
export declare const DEALT_CARDS = 54;
/** Stock: 50 remaining cards dealt in 5 batches of 10 */
export declare const STOCK_BATCHES = 5;
/** Columns 0-3 get 6 cards; columns 4-9 get 5 cards */
export declare function cardsInColumn(colIndex: number): number;

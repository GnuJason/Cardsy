/** Number of tableau columns */
export declare const COLUMN_COUNT = 8;
/** Number of free cell slots */
export declare const FREE_CELL_COUNT = 4;
/** Number of foundation piles (one per suit) */
export declare const FOUNDATION_COUNT = 4;
/** Columns 0-3 get 7 cards; columns 4-7 get 6 cards */
export declare function cardsInColumn(colIndex: number): number;

import type { SpiderGameState } from '../types';
/**
 * Move an in-suit sequence from one column to another.
 * `cardIndex` is the first card in the sequence to move.
 */
export declare function moveCards(state: SpiderGameState, fromCol: number, cardIndex: number, toCol: number): SpiderGameState | null;
/**
 * Deal one card from stock to each of the 10 columns, face-up.
 */
export declare function dealRow(state: SpiderGameState): SpiderGameState | null;

import type { FreeCellGameState } from '../types';
export declare function cloneState(state: FreeCellGameState): FreeCellGameState;
/**
 * Move the bottom card of a column to a free cell.
 */
export declare function moveColumnToFreeCell(state: FreeCellGameState, colIndex: number): FreeCellGameState | null;
/**
 * Move a card from a free cell to a tableau column.
 */
export declare function moveFreeCellToColumn(state: FreeCellGameState, cellIndex: number, colIndex: number): FreeCellGameState | null;
/**
 * Move a card from a free cell to its foundation.
 */
export declare function moveFreeCellToFoundation(state: FreeCellGameState, cellIndex: number): FreeCellGameState | null;
/**
 * Move a sequence of cards from one column to another (supermove).
 * `cardIndex` is the index of the top card in the sequence being moved.
 */
export declare function moveColumnToColumn(state: FreeCellGameState, fromCol: number, cardIndex: number, toCol: number): FreeCellGameState | null;
/**
 * Move the bottom card of a column to its foundation.
 */
export declare function moveColumnToFoundation(state: FreeCellGameState, colIndex: number): FreeCellGameState | null;
/**
 * Repeatedly move safe cards to foundations until no more safe moves.
 * Does NOT increment the move counter (auto-moves are "free").
 */
export declare function autoMoveToFoundations(state: FreeCellGameState): FreeCellGameState;
/**
 * Sweep all remaining cards to foundations when the game is trivially won.
 * Returns the new state with all cards on foundations.
 */
export declare function autoFinish(state: FreeCellGameState): FreeCellGameState;

import type { GameState } from './types';
export declare function drawFromStock(state: GameState, count?: 1 | 3): GameState;
export declare function recycleWaste(state: GameState): GameState;
export declare function moveWasteToFoundation(state: GameState, foundationIndex: number): GameState | null;
export declare function moveWasteToTableau(state: GameState, tableauIndex: number): GameState | null;
export declare function moveTableauToTableau(state: GameState, fromPile: number, cardIndex: number, toPile: number): GameState | null;
export declare function moveTableauToFoundation(state: GameState, tableauIndex: number): GameState | null;
export declare function moveFoundationToTableau(state: GameState, foundationIndex: number, tableauIndex: number): GameState | null;
export declare function autoCompleteStep(state: GameState): GameState | null;

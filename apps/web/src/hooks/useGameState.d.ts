import type { GameState } from '../logic/types';
export declare function useGameState(): {
    game: GameState;
    undoStack: GameState[];
    usedUndo: boolean;
    drawCount: 1 | 3;
    canUndo: boolean;
    canAutoComplete: boolean;
    hasMoves: boolean;
    actions: {
        newGame: () => void;
        draw: () => void;
        tapWaste: () => void;
        tapTableau: (pileIndex: number, cardIndex: number) => void;
        tapFoundation: (pileIndex: number) => void;
        moveToTarget: (sourcePile: "waste" | "tableau", sourcePileIndex: number, sourceCardIndex: number, targetPile: "tableau" | "foundation", targetPileIndex: number) => void;
        undo: () => void;
        autoComplete: () => void;
        setElapsed: (seconds: number) => void;
        setNoMoves: () => void;
        restoreGame: (game: GameState, undoStack: GameState[], drawCount?: 1 | 3) => void;
        setDrawCount: (drawCount: 1 | 3) => void;
    };
};

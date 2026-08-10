export interface ScreenLifecycleOptions {
    /** Current game status string — 'playing' | 'won' | 'no-moves' | etc. */
    gameStatus: string;
    /** Whether the player has legal moves remaining. */
    hasMoves: boolean;
    /** Reference-stable undo stack — used as a change trigger for auto-save. */
    undoStack: unknown;
    /**
     * Extra condition for no-moves detection.
     * Defaults to `true`. Klondike sets this to `game.stock.length === 0`
     * so no-moves is only triggered after the stock is exhausted.
     */
    noMovesReady?: boolean;
    /** Called once on mount to restore a saved game. */
    restore: () => void;
    /** Called by the debounced auto-save to persist the current state. */
    save: () => void;
    /** Called on win, loss, and new game to remove the saved state. */
    clearSave: () => void;
    /** Sync the timer's elapsed value into game state. */
    setElapsed: (elapsed: number) => void;
    /** Transition the game into the 'no-moves' status. */
    setNoMoves: () => void;
    /** Record that a game has been started (stats tracking). */
    onRecordStart: () => void;
    /** Record a loss (stats tracking). */
    onRecordLoss: () => void;
    /**
     * Mode-specific win handler. Called when status transitions to 'won',
     * BEFORE the celebration starts. The screen should call onRecordWin
     * and onWin inside this closure.
     */
    onWinTriggered: (elapsed: number) => void;
}
export interface ScreenLifecycleReturn {
    /** Current elapsed time in seconds. */
    elapsed: number;
    /** Reset the timer to zero. */
    resetTimer: () => void;
    /** Whether the win celebration overlay is showing. */
    showCelebration: boolean;
    /** Whether the win modal is showing. */
    showWinModal: boolean;
    /** Ref tracking whether a game has been started (for loss detection in handleNewGame). */
    gameStartedRef: React.MutableRefObject<boolean>;
    /** Transition from celebration → win modal. */
    handleCelebrationComplete: () => void;
    /**
     * Reset all lifecycle state for a new game.
     * Clears celebration/modal, resets timer, clears save, resets gameStartedRef.
     * Screens should call this AFTER checking whether to record a loss.
     */
    resetForNewGame: () => void;
}
export declare function useScreenLifecycle(options: ScreenLifecycleOptions): ScreenLifecycleReturn;

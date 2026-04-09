import { useEffect, useRef, useState, useCallback } from 'react';
import { useTimer } from './useTimer';
import { useDebouncedAutoSave } from './useDebouncedAutoSave';
import { soundManager } from '../services/sound';

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

  // ── Save / Restore ──────────────────────────────────────

  /** Called once on mount to restore a saved game. */
  restore: () => void;

  /** Called by the debounced auto-save to persist the current state. */
  save: () => void;

  /** Called on win, loss, and new game to remove the saved state. */
  clearSave: () => void;

  // ── Game actions ────────────────────────────────────────

  /** Sync the timer's elapsed value into game state. */
  setElapsed: (elapsed: number) => void;

  /** Transition the game into the 'no-moves' status. */
  setNoMoves: () => void;

  // ── External callbacks ──────────────────────────────────

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

export function useScreenLifecycle(
  options: ScreenLifecycleOptions,
): ScreenLifecycleReturn {
  const {
    gameStatus,
    hasMoves,
    undoStack,
    noMovesReady = true,
    setElapsed,
    setNoMoves,
    onRecordStart,
    onRecordLoss,
    clearSave,
  } = options;

  // Keep refs to closures that change every render
  const restoreRef = useRef(options.restore);
  const saveRef = useRef(options.save);
  const onWinTriggeredRef = useRef(options.onWinTriggered);
  const gameStatusRef = useRef(gameStatus);

  restoreRef.current = options.restore;
  saveRef.current = options.save;
  onWinTriggeredRef.current = options.onWinTriggered;
  gameStatusRef.current = gameStatus;

  // ── Timer ───────────────────────────────────────────────

  const isPlaying = gameStatus === 'playing';
  const { elapsed, reset: resetTimer } = useTimer(isPlaying);

  // ── Lifecycle state ─────────────────────────────────────

  const gameStartedRef = useRef(false);
  const restoredRef = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  // ── Restore on mount ────────────────────────────────────

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    restoreRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync elapsed time ───────────────────────────────────

  useEffect(() => {
    setElapsed(elapsed);
  }, [elapsed, setElapsed]);

  // ── Record game start ───────────────────────────────────

  useEffect(() => {
    if (isPlaying && !gameStartedRef.current) {
      onRecordStart();
      gameStartedRef.current = true;
    }
  }, [isPlaying, onRecordStart]);

  // ── Detect no-moves ─────────────────────────────────────

  useEffect(() => {
    if (isPlaying && !hasMoves && noMovesReady) {
      setNoMoves();
    }
  }, [isPlaying, hasMoves, noMovesReady, setNoMoves]);

  // ── Handle win ──────────────────────────────────────────

  useEffect(() => {
    if (gameStatus === 'won') {
      onWinTriggeredRef.current(elapsed);
      clearSave();
      soundManager.play('win');
      setShowCelebration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  // ── Handle loss ─────────────────────────────────────────

  useEffect(() => {
    if (gameStatus === 'no-moves') {
      onRecordLoss();
      clearSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  // ── Debounced auto-save ─────────────────────────────────

  const autoSaveFn = useCallback(() => {
    saveRef.current();
  }, [undoStack]); // eslint-disable-line react-hooks/exhaustive-deps

  useDebouncedAutoSave(isPlaying, autoSaveFn);

  // ── Handlers ────────────────────────────────────────────

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setShowWinModal(true);
  }, []);

  const resetForNewGame = useCallback(() => {
    setShowCelebration(false);
    setShowWinModal(false);
    resetTimer();
    clearSave();
    gameStartedRef.current = false;
  }, [resetTimer, clearSave]);

  return {
    elapsed,
    resetTimer,
    showCelebration,
    showWinModal,
    gameStartedRef,
    handleCelebrationComplete,
    resetForNewGame,
  };
}

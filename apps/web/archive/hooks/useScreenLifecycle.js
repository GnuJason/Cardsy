import { useEffect, useRef, useState, useCallback } from 'react';
import { useTimer } from './useTimer';
import { useDebouncedAutoSave } from './useDebouncedAutoSave';
import { soundManager } from '../services/sound';
export function useScreenLifecycle(options) {
    const { gameStatus, hasMoves, undoStack, noMovesReady = true, setElapsed, setNoMoves, onRecordStart, onRecordLoss, clearSave, } = options;
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
        if (restoredRef.current)
            return;
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

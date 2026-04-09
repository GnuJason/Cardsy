import React, { useEffect, useRef, useCallback, useState } from 'react';
import { usePyramidState } from '../hooks/usePyramidState';
import { useTimer } from '../hooks/useTimer';
import { PixiGameCanvas } from '../pixi/PixiGameCanvas';
import { HUD } from '../components/HUD/HUD';
import { WinCelebration } from '../components/WinCelebration/WinCelebration';
import { NoMovesModal } from '../components/NoMovesModal/NoMovesModal';
import { WinModal } from '../components/WinModal/WinModal';
import { formatTime } from '../hooks/useTimer';
import type { GameModeStats } from '../logic/types';
import type { PixiGameEvent, PixiThemeColors } from '../pixi/types';
import { soundManager } from '../services/sound';
import {
  getSavedPyramidGame,
  setSavedPyramidGame,
  clearSavedPyramidGame,
} from '../services/storage';

interface PyramidScreenProps {
  cardBackImage: string | null;
  themeColors: PixiThemeColors;
  modeStats: GameModeStats;
  reducedMotion: boolean;
  highContrast: boolean;
  cardScale: string;
  onRecordStart: () => void;
  onRecordWin: (score: number, time: number) => void;
  onRecordLoss: () => void;
  onChangeMode: () => void;
  onShowSettings: () => void;
  onShowStats: () => void;
  onShowAchievements: () => void;
  onWin: (elapsed: number) => void;
}

export const PyramidScreen: React.FC<PyramidScreenProps> = ({
  cardBackImage,
  themeColors,
  modeStats,
  reducedMotion,
  highContrast,
  cardScale,
  onRecordStart,
  onRecordWin,
  onRecordLoss,
  onChangeMode,
  onShowSettings,
  onShowStats,
  onShowAchievements,
  onWin,
}) => {
  const pyramid = usePyramidState();
  const { game, canUndo, hasMoves, undoStack, actions } = pyramid;

  const isPlaying = game.status === 'playing';
  const { elapsed, reset: resetTimer } = useTimer(isPlaying);

  const gameStartedRef = useRef(false);
  const restoredRef = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  // Restore saved game on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = getSavedPyramidGame();
    if (saved) {
      actions.restoreGame(saved.state, saved.undoStack);
    }
  }, [actions]);

  // Sync elapsed time
  useEffect(() => {
    actions.setElapsed(elapsed);
  }, [elapsed, actions]);

  // Record game start
  useEffect(() => {
    if (isPlaying && !gameStartedRef.current) {
      onRecordStart();
      gameStartedRef.current = true;
    }
  }, [isPlaying, onRecordStart]);

  // Detect no-moves
  useEffect(() => {
    if (isPlaying && !hasMoves) {
      actions.setNoMoves();
    }
  }, [isPlaying, hasMoves, actions]);

  // Handle win
  useEffect(() => {
    if (game.status === 'won') {
      // Pyramid score = cardsRemaining (0 for a perfect clear)
      onRecordWin(game.cardsRemaining, elapsed);
      onWin(elapsed);
      clearSavedPyramidGame();
      soundManager.play('win');
      setShowCelebration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Handle loss
  useEffect(() => {
    if (game.status === 'no-moves') {
      onRecordLoss();
      clearSavedPyramidGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Auto-save on every state change
  useEffect(() => {
    if (game.status === 'playing') {
      setSavedPyramidGame({
        state: game,
        undoStack,
        savedAt: Date.now(),
      });
    }
  }, [game, undoStack]);

  // ── Handlers ──────────────────────────────────────────────

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setShowWinModal(true);
  }, []);

  const handleNewGame = useCallback(() => {
    setShowCelebration(false);
    setShowWinModal(false);
    if (game.status === 'playing' && gameStartedRef.current) {
      onRecordLoss();
    }

    actions.newGame();
    resetTimer();
    clearSavedPyramidGame();
    gameStartedRef.current = false;
    soundManager.play('shuffle');
  }, [game.status, actions, resetTimer, onRecordLoss]);

  const handleUndo = useCallback(() => {
    actions.undo();
    soundManager.play('cardFlip');
  }, [actions]);

  const handleDraw = useCallback(() => {
    actions.draw();
    soundManager.play('draw');
  }, [actions]);

  const handleTapPyramid = useCallback(
    (pyramidIndex: number) => {
      actions.tapPyramid(pyramidIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleTapWaste = useCallback(() => {
    actions.tapWaste();
    soundManager.play('cardPlace');
  }, [actions]);

  const handleGameEvent = useCallback(
    (event: PixiGameEvent) => {
      if (event.type === 'DRAW') {
        handleDraw();
        return;
      }
      if (event.type === 'TAP_WASTE') {
        handleTapWaste();
        return;
      }
      if (event.type === 'TAP_PYRAMID') {
        handleTapPyramid(event.pyramidIndex);
        return;
      }
    },
    [handleDraw, handleTapPyramid, handleTapWaste],
  );

  return (
    <>
      <HUD
        score={game.cardsRemaining}
        moves={game.moves}
        elapsed={elapsed}
        canUndo={canUndo}
        onUndo={handleUndo}
        onNewGame={handleNewGame}
        onSettings={onShowSettings}
        onStats={onShowStats}
        onChangeMode={onChangeMode}
        onAchievements={onShowAchievements}
      />

      <PixiGameCanvas
        mode="pyramid"
        gameState={game}
        cardBackImage={cardBackImage}
        reducedMotion={reducedMotion}
        themeColors={themeColors}
        highContrast={highContrast}
        cardScale={cardScale}
        onGameEvent={handleGameEvent}
      />

      {showCelebration && (
        <WinCelebration
          onComplete={handleCelebrationComplete}
          reducedMotion={reducedMotion}
        />
      )}

      {showWinModal && (
        <WinModal
          moves={game.moves}
          elapsed={elapsed}
          bestScore={modeStats.bestScore}
          onNewGame={handleNewGame}
          modeStats={modeStats}
          isNewBest={modeStats.bestScore === null || game.cardsRemaining < modeStats.bestScore}
          statLines={[
            { label: 'Cards remaining', value: game.cardsRemaining },
            ...(game.cardsRemaining === 0 ? [{ label: '', value: '⭐ Perfect clear!', highlight: true as const }] : []),
            { label: 'Moves', value: game.moves },
            { label: 'Time', value: formatTime(elapsed) },
          ]}
        />
      )}

      {game.status === 'no-moves' && (
        <NoMovesModal
          onUndo={handleUndo}
          onNewGame={handleNewGame}
          canUndo={canUndo}
        />
      )}
    </>
  );
};

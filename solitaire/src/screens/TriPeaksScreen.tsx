import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTriPeaksState } from '../hooks/useTriPeaksState';
import { useTimer } from '../hooks/useTimer';
import { PixiGameCanvas } from '../pixi/PixiGameCanvas';
import { HUD } from '../components/HUD/HUD';
import { WinModal } from '../components/WinModal/WinModal';
import { WinCelebration } from '../components/WinCelebration/WinCelebration';
import { NoMovesModal } from '../components/NoMovesModal/NoMovesModal';
import { timerBonus } from '../logic/scoring';
import type { GameModeStats } from '../logic/types';
import type { PixiGameEvent, PixiThemeColors } from '../pixi/types';
import { soundManager } from '../services/sound';
import {
  getSavedTriPeaksGame,
  setSavedTriPeaksGame,
  clearSavedTriPeaksGame,
} from '../services/storage';

interface TriPeaksScreenProps {
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
  onWin: (elapsed: number, usedStock: boolean, peaksClearedInStreak: boolean) => void;
}

export const TriPeaksScreen: React.FC<TriPeaksScreenProps> = ({
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
  const tripeaks = useTriPeaksState();
  const { game, canUndo, hasMoves, usedStock, undoStack, actions } = tripeaks;

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
    const saved = getSavedTriPeaksGame();
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
      const bonus = timerBonus(elapsed);
      const finalScore = game.score + bonus;
      onRecordWin(finalScore, elapsed);
      // Check if all peaks were cleared in one streak (no stock draws between clears)
      const peaksClearedInStreak = game.peaksCleared.every(Boolean) && game.streak > 0;
      onWin(elapsed, usedStock, peaksClearedInStreak);
      clearSavedTriPeaksGame();
      soundManager.play('win');
      setShowCelebration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Handle loss
  useEffect(() => {
    if (game.status === 'no-moves') {
      onRecordLoss();
      clearSavedTriPeaksGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Auto-save on every state change
  useEffect(() => {
    if (game.status === 'playing') {
      setSavedTriPeaksGame({
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
    clearSavedTriPeaksGame();
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

  const handleTapCard = useCallback(
    (pyramidIndex: number) => {
      actions.tapCard(pyramidIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleGameEvent = useCallback(
    (event: PixiGameEvent) => {
      if (event.type === 'DRAW') {
        handleDraw();
        return;
      }
      if (event.type === 'TAP_PYRAMID') {
        handleTapCard(event.pyramidIndex);
        return;
      }
    },
    [handleDraw, handleTapCard],
  );

  return (
    <>
      <HUD
        score={game.score}
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
        mode="tripeaks"
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
          score={game.score}
          moves={game.moves}
          elapsed={elapsed}
          bestScore={modeStats.bestScore}
          onNewGame={handleNewGame}
          modeStats={modeStats}
          isTriPeaks
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

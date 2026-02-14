import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useTimer } from '../hooks/useTimer';
import { GameBoard } from '../components/GameBoard/GameBoard';
import { HUD } from '../components/HUD/HUD';
import { WinModal } from '../components/WinModal/WinModal';
import { WinCelebration } from '../components/WinCelebration/WinCelebration';
import { NoMovesModal } from '../components/NoMovesModal/NoMovesModal';
import { timerBonus } from '../logic/scoring';
import type { GameModeStats } from '../logic/types';
import { soundManager } from '../services/sound';
import {
  getSavedKlondikeGame,
  setSavedKlondikeGame,
  clearSavedKlondikeGame,
} from '../services/storage';

interface KlondikeScreenProps {
  cardBackImage: string | null;
  modeStats: GameModeStats;
  drawCount: 1 | 3;
  reducedMotion: boolean;
  onRecordStart: () => void;
  onRecordWin: (score: number, time: number) => void;
  onRecordLoss: () => void;
  onChangeMode: () => void;
  onShowSettings: () => void;
  onShowStats: () => void;
  onShowAchievements: () => void;
  onWin: (elapsed: number, usedUndo: boolean) => void;
}

export const KlondikeScreen: React.FC<KlondikeScreenProps> = ({
  cardBackImage,
  modeStats,
  drawCount: settingsDrawCount,
  reducedMotion,
  onRecordStart,
  onRecordWin,
  onRecordLoss,
  onChangeMode,
  onShowSettings,
  onShowStats,
  onShowAchievements,
  onWin,
}) => {
  const klondike = useGameState();
  const { game, canUndo, canAutoComplete, hasMoves, usedUndo, undoStack, drawCount, actions } = klondike;

  const isPlaying = game.status === 'playing';
  const { elapsed, reset: resetTimer } = useTimer(isPlaying);

  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const gameStartedRef = useRef(false);
  const restoredRef = useRef(false);

  // Restore saved game on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = getSavedKlondikeGame();
    if (saved) {
      actions.restoreGame(saved.state, saved.undoStack, saved.drawCount);
    } else {
      // Apply drawCount from settings for the initial game
      actions.setDrawCount(settingsDrawCount);
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
    if (isPlaying && !hasMoves && game.stock.length === 0) {
      actions.setNoMoves();
    }
  }, [isPlaying, hasMoves, game.stock.length, actions]);

  // Handle win
  useEffect(() => {
    if (game.status === 'won') {
      const bonus = timerBonus(elapsed);
      const finalScore = game.score + bonus;
      onRecordWin(finalScore, elapsed);
      onWin(elapsed, usedUndo);
      clearSavedKlondikeGame();
      soundManager.play('win');
      setShowCelebration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Handle loss
  useEffect(() => {
    if (game.status === 'no-moves') {
      onRecordLoss();
      clearSavedKlondikeGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Auto-save on every state change
  useEffect(() => {
    if (game.status === 'playing') {
      setSavedKlondikeGame({
        state: game,
        undoStack,
        savedAt: Date.now(),
        drawCount,
      });
    }
  }, [game, undoStack, drawCount]);

  // ── Handlers ──────────────────────────────────────────────

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setShowWinModal(true);
  }, []);

  const handleNewGame = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsAutoCompleting(false);
    setShowCelebration(false);
    setShowWinModal(false);

    if (game.status === 'playing' && gameStartedRef.current) {
      onRecordLoss();
    }

    actions.newGame();
    actions.setDrawCount(settingsDrawCount);
    resetTimer();
    clearSavedKlondikeGame();
    gameStartedRef.current = false;
    soundManager.play('shuffle');
  }, [game.status, actions, resetTimer, onRecordLoss, settingsDrawCount]);

  const handleAutoComplete = useCallback(() => {
    setIsAutoCompleting(true);
    autoRef.current = setInterval(() => {
      actions.autoComplete();
    }, 150);
  }, [actions]);

  const handleUndo = useCallback(() => {
    actions.undo();
    soundManager.play('cardFlip');
  }, [actions]);

  const handleDraw = useCallback(() => {
    actions.draw();
    soundManager.play('draw');
  }, [actions]);

  const handleTapWaste = useCallback(() => {
    actions.tapWaste();
    soundManager.play('cardPlace');
  }, [actions]);

  const handleTapTableau = useCallback(
    (pileIndex: number, cardIndex: number) => {
      actions.tapTableau(pileIndex, cardIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleTapFoundation = useCallback(
    (pileIndex: number) => {
      actions.tapFoundation(pileIndex);
    },
    [actions],
  );

  // Stop auto-complete when game is won
  useEffect(() => {
    if (isAutoCompleting && (game.status === 'won' || !canAutoComplete)) {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
      setIsAutoCompleting(false);
    }
  }, [isAutoCompleting, game.status, canAutoComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  return (
    <>
      <HUD
        score={game.score}
        moves={game.moves}
        elapsed={elapsed}
        canUndo={canUndo}
        canAutoComplete={canAutoComplete && !isAutoCompleting}
        onUndo={handleUndo}
        onNewGame={handleNewGame}
        onAutoComplete={handleAutoComplete}
        onSettings={onShowSettings}
        onStats={onShowStats}
        onChangeMode={onChangeMode}
        onAchievements={onShowAchievements}
      />

      <GameBoard
        game={game}
        cardBackImage={cardBackImage}
        drawCount={drawCount}
        onDraw={handleDraw}
        onTapWaste={handleTapWaste}
        onTapTableau={handleTapTableau}
        onTapFoundation={handleTapFoundation}
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

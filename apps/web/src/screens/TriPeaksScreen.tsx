import React, { useCallback } from 'react';
import { useTriPeaksState } from '../hooks/useTriPeaksState';
import { useScreenLifecycle } from '../hooks/useScreenLifecycle';
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

  const lifecycle = useScreenLifecycle({
    gameStatus: game.status,
    hasMoves,
    undoStack,
    restore: () => {
      const saved = getSavedTriPeaksGame();
      if (saved) actions.restoreGame(saved.state, saved.undoStack);
    },
    save: () => setSavedTriPeaksGame({ state: game, undoStack, savedAt: Date.now() }),
    clearSave: clearSavedTriPeaksGame,
    setElapsed: actions.setElapsed,
    setNoMoves: actions.setNoMoves,
    onRecordStart,
    onRecordLoss,
    onWinTriggered: (elapsed) => {
      const bonus = timerBonus(elapsed);
      const finalScore = game.score + bonus;
      onRecordWin(finalScore, elapsed);
      const peaksClearedInStreak = game.peaksCleared.every(Boolean) && game.streak > 0;
      onWin(elapsed, usedStock, peaksClearedInStreak);
    },
  });

  const { elapsed, showCelebration, showWinModal, gameStartedRef, handleCelebrationComplete } = lifecycle;

  // ── Handlers ──────────────────────────────────────────────

  const handleNewGame = useCallback(() => {
    if (game.status === 'playing' && gameStartedRef.current) {
      onRecordLoss();
    }

    lifecycle.resetForNewGame();
    actions.newGame();
    soundManager.play('shuffle');
  }, [game.status, actions, lifecycle, onRecordLoss, gameStartedRef]);

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
          showTimerBonus
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

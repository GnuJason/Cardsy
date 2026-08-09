import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useScreenLifecycle } from '../hooks/useScreenLifecycle';
import { PixiGameCanvas } from '../pixi/PixiGameCanvas';
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
import type { PixiGameEvent, PixiThemeColors } from '../pixi/types';

interface KlondikeScreenProps {
  cardBackImage: string | null;
  themeColors: PixiThemeColors;
  modeStats: GameModeStats;
  drawCount: 1 | 3;
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
  onWin: (elapsed: number, usedUndo: boolean) => void;
}

export const KlondikeScreen: React.FC<KlondikeScreenProps> = ({
  cardBackImage,
  themeColors,
  modeStats,
  drawCount: settingsDrawCount,
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
  const klondike = useGameState();
  const { game, canUndo, canAutoComplete, hasMoves, usedUndo, undoStack, drawCount, actions } = klondike;

  const lifecycle = useScreenLifecycle({
    gameStatus: game.status,
    hasMoves,
    undoStack,
    noMovesReady: game.stock.length === 0,
    restore: () => {
      const saved = getSavedKlondikeGame();
      if (saved) {
        actions.restoreGame(saved.state, saved.undoStack, saved.drawCount);
      } else {
        actions.setDrawCount(settingsDrawCount);
      }
    },
    save: () => setSavedKlondikeGame({ state: game, undoStack, savedAt: Date.now(), drawCount }),
    clearSave: clearSavedKlondikeGame,
    setElapsed: actions.setElapsed,
    setNoMoves: actions.setNoMoves,
    onRecordStart,
    onRecordLoss,
    onWinTriggered: (elapsed) => {
      const bonus = timerBonus(elapsed);
      const finalScore = game.score + bonus;
      onRecordWin(finalScore, elapsed);
      onWin(elapsed, usedUndo);
    },
  });

  const { elapsed, showCelebration, showWinModal, gameStartedRef, handleCelebrationComplete } = lifecycle;

  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const handleNewGame = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsAutoCompleting(false);

    if (game.status === 'playing' && gameStartedRef.current) {
      onRecordLoss();
    }

    lifecycle.resetForNewGame();
    actions.newGame();
    actions.setDrawCount(settingsDrawCount);
    soundManager.play('shuffle');
  }, [game.status, actions, lifecycle, onRecordLoss, settingsDrawCount, gameStartedRef]);

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
      if (event.type === 'TAP_TABLEAU') {
        handleTapTableau(event.pileIndex, event.cardIndex);
        return;
      }
      if (event.type === 'TAP_FOUNDATION') {
        handleTapFoundation(event.pileIndex);
        return;
      }
      if (event.type === 'DRAG_VALIDATED_MOVE') {
        if (
          (event.sourcePile === 'tableau' || event.sourcePile === 'waste') &&
          (event.targetPile === 'tableau' || event.targetPile === 'foundation')
        ) {
          actions.moveToTarget(
            event.sourcePile,
            event.sourcePileIndex,
            event.sourceCardIndex,
            event.targetPile,
            event.targetPileIndex,
          );
          soundManager.play('cardPlace');
        }
        return;
      }
    },
    [actions, handleDraw, handleTapFoundation, handleTapTableau, handleTapWaste],
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

      <PixiGameCanvas
        mode="klondike"
        gameState={game}
        cardBackImage={cardBackImage}
        reducedMotion={reducedMotion}
        themeColors={themeColors}
        highContrast={highContrast}
        cardScale={cardScale}
        drawCount={drawCount}
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

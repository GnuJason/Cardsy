import React, { useEffect, useCallback } from 'react';
import { useSpiderState } from '../hooks/useSpiderState';
import { useScreenLifecycle } from '../hooks/useScreenLifecycle';
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
  getSavedSpiderGame,
  setSavedSpiderGame,
  clearSavedSpiderGame,
  getSpiderDifficulty,
  setSpiderDifficulty,
} from '../services/storage';

interface SpiderScreenProps {
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

export const SpiderScreen: React.FC<SpiderScreenProps> = ({
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
  const savedDifficulty = getSpiderDifficulty();
  const spider = useSpiderState(savedDifficulty);
  const { game, canUndo, hasMoves, undoStack, actions } = spider;

  const lifecycle = useScreenLifecycle({
    gameStatus: game.status,
    hasMoves,
    undoStack,
    restore: () => {
      const saved = getSavedSpiderGame();
      if (saved) actions.restoreGame(saved.state, saved.undoStack);
    },
    save: () => setSavedSpiderGame({ state: game, undoStack, savedAt: Date.now(), difficulty: game.difficulty }),
    clearSave: clearSavedSpiderGame,
    setElapsed: actions.setElapsed,
    setNoMoves: actions.setNoMoves,
    onRecordStart,
    onRecordLoss,
    onWinTriggered: (elapsed) => {
      onRecordWin(game.score, elapsed);
      onWin(elapsed);
    },
  });

  const { elapsed, showCelebration, showWinModal, gameStartedRef, handleCelebrationComplete } = lifecycle;

  // ── Handlers ──────────────────────────────────────────────

  const handleNewGame = useCallback(() => {
    if (game.status === 'playing' && gameStartedRef.current) {
      onRecordLoss();
    }

    const diff = getSpiderDifficulty();
    lifecycle.resetForNewGame();
    actions.newGame(diff);
    soundManager.play('shuffle');
  }, [game.status, actions, lifecycle, onRecordLoss, gameStartedRef]);

  const handleUndo = useCallback(() => {
    actions.undo();
    soundManager.play('cardFlip');
  }, [actions]);

  const handleTapColumn = useCallback(
    (colIndex: number, cardIndex: number) => {
      actions.tapColumn(colIndex, cardIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleTapStock = useCallback(() => {
    actions.dealRow();
    soundManager.play('cardFlip');
  }, [actions]);

  const handleGameEvent = useCallback(
    (event: PixiGameEvent) => {
      if (event.type === 'TAP_STOCK') {
        handleTapStock();
        return;
      }
      if (event.type === 'TAP_COLUMN') {
        handleTapColumn(event.colIndex, event.cardIndex);
        return;
      }
      if (event.type === 'DRAG_VALIDATED_MOVE') {
        if (event.sourcePile === 'column' && event.targetPile === 'column') {
          actions.tapColumn(event.sourcePileIndex, event.sourceCardIndex);
          const targetColumn = game.columns[event.targetPileIndex] ?? [];
          const targetCardIndex = targetColumn.length === 0 ? 0 : targetColumn.length - 1;
          actions.tapColumn(event.targetPileIndex, targetCardIndex);
          soundManager.play('cardPlace');
        }
        return;
      }
    },
    [actions, game.columns, handleTapColumn, handleTapStock],
  );

  // Persist difficulty when user changes it via ModeSelector
  useEffect(() => {
    setSpiderDifficulty(game.difficulty);
  }, [game.difficulty]);

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
        mode="spider"
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
          statLines={[
            { label: 'Score', value: game.score },
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

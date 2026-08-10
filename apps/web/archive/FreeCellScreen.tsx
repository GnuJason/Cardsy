import React, { useCallback } from 'react';
import { useFreeCellState } from '../hooks/useFreeCellState';
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
  getSavedFreeCellGame,
  setSavedFreeCellGame,
  clearSavedFreeCellGame,
} from '../services/storage';

interface FreeCellScreenProps {
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

export const FreeCellScreen: React.FC<FreeCellScreenProps> = ({
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
  const fc = useFreeCellState();
  const { game, canUndo, hasMoves, undoStack, actions } = fc;

  const lifecycle = useScreenLifecycle({
    gameStatus: game.status,
    hasMoves,
    undoStack,
    restore: () => {
      const saved = getSavedFreeCellGame();
      if (saved) actions.restoreGame(saved.state, saved.undoStack);
    },
    save: () => setSavedFreeCellGame({ state: game, undoStack, savedAt: Date.now() }),
    clearSave: clearSavedFreeCellGame,
    setElapsed: actions.setElapsed,
    setNoMoves: actions.setNoMoves,
    onRecordStart,
    onRecordLoss,
    onWinTriggered: (elapsed) => {
      onRecordWin(game.moves, elapsed);
      onWin(elapsed);
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

  const handleTapColumn = useCallback(
    (colIndex: number, cardIndex: number) => {
      actions.tapColumn(colIndex, cardIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleTapFreeCell = useCallback(
    (cellIndex: number) => {
      actions.tapFreeCell(cellIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleTapFoundation = useCallback(
    (foundIndex: number) => {
      actions.tapFoundation(foundIndex);
      soundManager.play('cardPlace');
    },
    [actions],
  );

  const handleGameEvent = useCallback(
    (event: PixiGameEvent) => {
      if (event.type === 'TAP_COLUMN') {
        handleTapColumn(event.colIndex, event.cardIndex);
        return;
      }
      if (event.type === 'TAP_FREECELL') {
        handleTapFreeCell(event.cellIndex);
        return;
      }
      if (event.type === 'TAP_FOUNDATION') {
        handleTapFoundation(event.pileIndex);
        return;
      }
      if (event.type === 'DRAG_VALIDATED_MOVE') {
        if (event.sourcePile === 'column') {
          actions.tapColumn(event.sourcePileIndex, event.sourceCardIndex);
          if (event.targetPile === 'column') {
            const targetColumn = game.columns[event.targetPileIndex] ?? [];
            const targetCardIndex = targetColumn.length === 0 ? 0 : targetColumn.length - 1;
            actions.tapColumn(event.targetPileIndex, targetCardIndex);
            soundManager.play('cardPlace');
            return;
          }
          if (event.targetPile === 'freecell') {
            actions.tapFreeCell(event.targetPileIndex);
            soundManager.play('cardPlace');
            return;
          }
          if (event.targetPile === 'foundation') {
            actions.tapFoundation(event.targetPileIndex);
            soundManager.play('cardPlace');
            return;
          }
        }

        if (event.sourcePile === 'freecell') {
          actions.tapFreeCell(event.sourcePileIndex);
          if (event.targetPile === 'column') {
            const targetColumn = game.columns[event.targetPileIndex] ?? [];
            const targetCardIndex = targetColumn.length === 0 ? 0 : targetColumn.length - 1;
            actions.tapColumn(event.targetPileIndex, targetCardIndex);
            soundManager.play('cardPlace');
            return;
          }
          if (event.targetPile === 'foundation') {
            actions.tapFoundation(event.targetPileIndex);
            soundManager.play('cardPlace');
            return;
          }
        }
        return;
      }
    },
    [actions, game.columns, handleTapColumn, handleTapFoundation, handleTapFreeCell],
  );

  // Foundation count for HUD score display
  const foundationCount = game.foundations.reduce(
    (sum, pile) => sum + pile.length,
    0,
  );

  return (
    <>
      <HUD
        score={foundationCount}
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
        mode="freecell"
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
          onComplete={handleCelebrationComplete}          reducedMotion={reducedMotion}
        />
      )}

      {showWinModal && (
        <WinModal
          moves={game.moves}
          elapsed={elapsed}
          bestScore={modeStats.bestScore}
          onNewGame={handleNewGame}
          modeStats={modeStats}
          isNewBest={modeStats.bestScore === null || game.moves < modeStats.bestScore}
          statLines={[
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

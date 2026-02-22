import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useFreeCellState } from '../hooks/useFreeCellState';
import { useTimer } from '../hooks/useTimer';
import { PixiGameCanvas } from '../pixi/PixiGameCanvas';
import { HUD } from '../components/HUD/HUD';
import { WinCelebration } from '../components/WinCelebration/WinCelebration';
import { NoMovesModal } from '../components/NoMovesModal/NoMovesModal';
import { FreeCellWinModal } from '../components/FreeCellWinModal/FreeCellWinModal';
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
    const saved = getSavedFreeCellGame();
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
      // FreeCell score = moves (lower is better)
      onRecordWin(game.moves, elapsed);
      onWin(elapsed);
      clearSavedFreeCellGame();
      soundManager.play('win');
      setShowCelebration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Handle loss
  useEffect(() => {
    if (game.status === 'no-moves') {
      onRecordLoss();
      clearSavedFreeCellGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status]);

  // Auto-save on every state change
  useEffect(() => {
    if (game.status === 'playing') {
      setSavedFreeCellGame({
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
    clearSavedFreeCellGame();
    gameStartedRef.current = false;
    soundManager.play('shuffle');
  }, [game.status, actions, resetTimer, onRecordLoss]);

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
          onComplete={handleCelebrationComplete}
          reducedMotion={reducedMotion}
        />
      )}

      {showWinModal && (
        <FreeCellWinModal
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

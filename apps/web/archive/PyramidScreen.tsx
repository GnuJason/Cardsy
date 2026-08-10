import React, { useCallback } from 'react';
import { usePyramidState } from '../hooks/usePyramidState';
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

  const lifecycle = useScreenLifecycle({
    gameStatus: game.status,
    hasMoves,
    undoStack,
    restore: () => {
      const saved = getSavedPyramidGame();
      if (saved) actions.restoreGame(saved.state, saved.undoStack);
    },
    save: () => setSavedPyramidGame({ state: game, undoStack, savedAt: Date.now() }),
    clearSave: clearSavedPyramidGame,
    setElapsed: actions.setElapsed,
    setNoMoves: actions.setNoMoves,
    onRecordStart,
    onRecordLoss,
    onWinTriggered: (elapsed) => {
      onRecordWin(game.cardsRemaining, elapsed);
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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { useTriPeaksState } from './hooks/useTriPeaksState';
import { useTimer } from './hooks/useTimer';
import { useGameStats } from './hooks/useGameStats';
import { GameBoard } from './components/GameBoard/GameBoard';
import { TriPeaksBoard } from './components/TriPeaksBoard/TriPeaksBoard';
import { HUD } from './components/HUD/HUD';
import { SplashScreen } from './components/SplashScreen/SplashScreen';
import { ModeSelector } from './components/ModeSelector/ModeSelector';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { StatsModal } from './components/StatsModal/StatsModal';
import { WinModal } from './components/WinModal/WinModal';
import { NoMovesModal } from './components/NoMovesModal/NoMovesModal';
import { ConfirmModal } from './components/ConfirmModal/ConfirmModal';
import { timerBonus } from './logic/scoring';
import type { UserSettings, GameMode } from './logic/types';
import {
  getSplashSeen,
  setSplashSeen,
  getSettings,
  setSettings as saveSettings,
  getGameMode,
  setGameMode,
  migrateFromLegacy,
} from './services/storage';
import { cardBackUrl } from './config/cardArt';

// Run one-time migration on module load
migrateFromLegacy();

export const App: React.FC = () => {
  // ── Splash ────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(!getSplashSeen());

  // ── Mode selection ────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(() => {
    if (!getSplashSeen()) return null; // show splash first
    return getGameMode();
  });
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [confirmModeSwitch, setConfirmModeSwitch] = useState(false);

  // ── Settings ──────────────────────────────────────────────
  const [settings, setSettingsState] = useState<UserSettings>(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  // ── Stats ─────────────────────────────────────────────────
  const { stats, recordGameStart, recordWin, recordLoss, resetStats } = useGameStats();
  const [showStats, setShowStats] = useState(false);

  // ── Game states (both hooks always called — Rules of Hooks) ──
  const klondike = useGameState();
  const tripeaks = useTriPeaksState();

  const isKlondike = selectedMode === 'klondike';
  const isTriPeaks = selectedMode === 'tripeaks';

  // Unified accessors for the active game
  const activeGame = isKlondike ? klondike.game : isTriPeaks ? tripeaks.game : null;
  const activeScore = activeGame?.score ?? 0;
  const activeMoves = activeGame?.moves ?? 0;
  const activeStatus = activeGame?.status ?? 'playing';
  const activeCanUndo = isKlondike ? klondike.canUndo : isTriPeaks ? tripeaks.canUndo : false;

  // ── Timer ─────────────────────────────────────────────────
  const isPlaying = activeStatus === 'playing' && !showSplash && selectedMode !== null && !showModeSelector;
  const { elapsed, reset: resetTimer } = useTimer(isPlaying);

  // ── Auto-complete (Klondike only) ─────────────────────────
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // Track whether the current game has been recorded as started
  const gameStartedRef = useRef(false);

  // Sync elapsed time to active game state
  useEffect(() => {
    if (isKlondike) klondike.actions.setElapsed(elapsed);
    else if (isTriPeaks) tripeaks.actions.setElapsed(elapsed);
  }, [elapsed, isKlondike, isTriPeaks, klondike.actions, tripeaks.actions]);

  // Record game start when mode first becomes active
  useEffect(() => {
    if (selectedMode && !showModeSelector && !showSplash && !gameStartedRef.current) {
      recordGameStart(selectedMode);
      gameStartedRef.current = true;
    }
  }, [selectedMode, showModeSelector, showSplash, recordGameStart]);

  // Detect no-moves (Klondike)
  useEffect(() => {
    if (
      isKlondike &&
      klondike.game.status === 'playing' &&
      !klondike.hasMoves &&
      klondike.game.stock.length === 0
    ) {
      klondike.actions.setNoMoves();
    }
  }, [isKlondike, klondike.game, klondike.hasMoves, klondike.actions]);

  // Detect no-moves (TriPeaks) — handled in playCard/draw, but catch edge cases
  useEffect(() => {
    if (
      isTriPeaks &&
      tripeaks.game.status === 'playing' &&
      !tripeaks.hasMoves
    ) {
      tripeaks.actions.setNoMoves();
    }
  }, [isTriPeaks, tripeaks.game, tripeaks.hasMoves, tripeaks.actions]);

  // Handle win
  useEffect(() => {
    if (activeStatus === 'won' && selectedMode) {
      const bonus = timerBonus(elapsed);
      const finalScore = activeScore + bonus;
      recordWin(selectedMode, finalScore, elapsed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  // Handle loss (no-moves)
  useEffect(() => {
    if (activeStatus === 'no-moves' && selectedMode) {
      recordLoss(selectedMode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  // ── Handlers ──────────────────────────────────────────────

  const handleSplashDismiss = useCallback(() => {
    setSplashSeen();
    setShowSplash(false);
    setShowModeSelector(true);
  }, []);

  const handleModeSelect = useCallback(
    (mode: GameMode) => {
      setSelectedMode(mode);
      setGameMode(mode);
      setShowModeSelector(false);
      if (mode === 'klondike') klondike.actions.newGame();
      else tripeaks.actions.newGame();
      resetTimer();
      gameStartedRef.current = false; // will be recorded by effect
    },
    [klondike.actions, tripeaks.actions, resetTimer],
  );

  const handleNewGame = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsAutoCompleting(false);

    // If current game was still in progress, record as loss
    if (activeStatus === 'playing' && selectedMode && gameStartedRef.current) {
      recordLoss(selectedMode);
    }

    if (isKlondike) klondike.actions.newGame();
    else if (isTriPeaks) tripeaks.actions.newGame();
    resetTimer();
    gameStartedRef.current = false;
  }, [isKlondike, isTriPeaks, klondike.actions, tripeaks.actions, resetTimer, activeStatus, selectedMode, recordLoss]);

  const handleAutoComplete = useCallback(() => {
    setIsAutoCompleting(true);
    autoRef.current = setInterval(() => {
      klondike.actions.autoComplete();
    }, 150);
  }, [klondike.actions]);

  // Stop auto-complete when game is won or no more moves to auto-complete
  useEffect(() => {
    if (isAutoCompleting && (klondike.game.status === 'won' || !klondike.canAutoComplete)) {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
      setIsAutoCompleting(false);
    }
  }, [isAutoCompleting, klondike.game.status, klondike.canAutoComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  const handleChangeMode = useCallback(() => {
    if (activeStatus === 'playing' && gameStartedRef.current) {
      setConfirmModeSwitch(true);
    } else {
      setShowModeSelector(true);
    }
  }, [activeStatus]);

  const handleConfirmModeSwitch = useCallback(() => {
    if (selectedMode) recordLoss(selectedMode);
    setConfirmModeSwitch(false);
    setShowModeSelector(true);
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsAutoCompleting(false);
  }, [selectedMode, recordLoss]);

  const handleSettingsUpdate = useCallback(
    (newSettings: UserSettings) => {
      setSettingsState(newSettings);
      saveSettings(newSettings);
    },
    [],
  );

  // ── Card size class ───────────────────────────────────────
  const sizeClass =
    settings.cardSize === 'large'
      ? 'card-size-large'
      : settings.cardSize === 'small'
        ? 'card-size-small'
        : '';

  const rootClass = [
    sizeClass,
    settings.reducedMotion ? 'reduced-motion' : '',
    isTriPeaks ? 'tripeaks-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const cardBackImage =
    settings.cardBack !== 'default.png'
      ? cardBackUrl(settings.cardBack)
      : null;

  const modeStats = selectedMode ? stats[selectedMode] : undefined;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className={rootClass} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showSplash && <SplashScreen onStart={handleSplashDismiss} />}
      {showModeSelector && !showSplash && (
        <ModeSelector onSelect={handleModeSelect} />
      )}

      {selectedMode && !showModeSelector && !showSplash && (
        <>
          <HUD
            score={activeScore}
            moves={activeMoves}
            elapsed={elapsed}
            canUndo={activeCanUndo}
            canAutoComplete={isKlondike ? klondike.canAutoComplete && !isAutoCompleting : undefined}
            onUndo={isKlondike ? klondike.actions.undo : tripeaks.actions.undo}
            onNewGame={handleNewGame}
            onAutoComplete={isKlondike ? handleAutoComplete : undefined}
            onSettings={() => setShowSettings(true)}
            onStats={() => setShowStats(true)}
            onChangeMode={handleChangeMode}
          />

          {isKlondike && (
            <GameBoard
              game={klondike.game}
              cardBackImage={cardBackImage}
              onDraw={klondike.actions.draw}
              onTapWaste={klondike.actions.tapWaste}
              onTapTableau={klondike.actions.tapTableau}
              onTapFoundation={klondike.actions.tapFoundation}
            />
          )}

          {isTriPeaks && (
            <TriPeaksBoard
              game={tripeaks.game}
              cardBackImage={cardBackImage}
              onTapCard={tripeaks.actions.tapCard}
              onDraw={tripeaks.actions.draw}
            />
          )}

          {activeStatus === 'won' && (
            <WinModal
              score={activeScore}
              moves={activeMoves}
              elapsed={elapsed}
              bestScore={modeStats?.bestScore ?? null}
              onNewGame={handleNewGame}
              modeStats={modeStats}
              isTriPeaks={isTriPeaks}
            />
          )}

          {activeStatus === 'no-moves' && (
            <NoMovesModal
              onUndo={isKlondike ? klondike.actions.undo : tripeaks.actions.undo}
              onNewGame={handleNewGame}
              canUndo={activeCanUndo}
            />
          )}
        </>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={handleSettingsUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showStats && selectedMode && (
        <StatsModal
          stats={stats}
          currentMode={selectedMode}
          onResetStats={resetStats}
          onClose={() => setShowStats(false)}
        />
      )}

      {confirmModeSwitch && (
        <ConfirmModal
          title="Switch Game Mode?"
          message="Switching modes will abandon your current game. Continue?"
          confirmLabel="Switch"
          cancelLabel="Stay"
          onConfirm={handleConfirmModeSwitch}
          onCancel={() => setConfirmModeSwitch(false)}
        />
      )}
    </div>
  );
};

export default App;

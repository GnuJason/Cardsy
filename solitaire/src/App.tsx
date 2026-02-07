import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { useTimer } from './hooks/useTimer';
import { GameBoard } from './components/GameBoard/GameBoard';
import { HUD } from './components/HUD/HUD';
import { SplashScreen } from './components/SplashScreen/SplashScreen';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { WinModal } from './components/WinModal/WinModal';
import { NoMovesModal } from './components/NoMovesModal/NoMovesModal';
import { timerBonus } from './logic/scoring';
import type { UserSettings } from './logic/types';
import {
  getSplashSeen,
  setSplashSeen,
  getSettings,
  setSettings as saveSettings,
  getBestScore,
  setBestScore,
} from './services/storage';
import { cardBackUrl } from './config/cardArt';

export const App: React.FC = () => {
  // ── Splash ────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(!getSplashSeen());

  // ── Settings ──────────────────────────────────────────────
  const [settings, setSettingsState] = useState<UserSettings>(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  // ── Game state ────────────────────────────────────────────
  const { game, canUndo, canAutoComplete, hasMoves, actions } = useGameState();
  const isPlaying = game.status === 'playing' && !showSplash;
  const { elapsed, reset: resetTimer } = useTimer(isPlaying);

  // ── Best score ────────────────────────────────────────────
  const [bestScore, setBestScoreState] = useState<number | null>(getBestScore());

  // ── Auto-complete interval ────────────────────────────────
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);

  // Sync elapsed time to game state
  useEffect(() => {
    actions.setElapsed(elapsed);
  }, [elapsed, actions]);

  // Detect no-moves
  useEffect(() => {
    if (
      game.status === 'playing' &&
      !hasMoves &&
      game.stock.length === 0
    ) {
      actions.setNoMoves();
    }
  }, [game, hasMoves, actions]);

  // Handle win
  useEffect(() => {
    if (game.status === 'won') {
      const bonus = timerBonus(elapsed);
      const finalScore = game.score + bonus;
      if (bestScore === null || finalScore > bestScore) {
        setBestScore(finalScore);
        setBestScoreState(finalScore);
      }
    }
  }, [game.status, game.score, elapsed, bestScore]);

  // ── Handlers ──────────────────────────────────────────────

  const handleSplashDismiss = useCallback(() => {
    setSplashSeen();
    setShowSplash(false);
  }, []);

  const handleNewGame = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setIsAutoCompleting(false);
    actions.newGame();
    resetTimer();
  }, [actions, resetTimer]);

  const handleAutoComplete = useCallback(() => {
    setIsAutoCompleting(true);
    autoRef.current = setInterval(() => {
      actions.autoComplete();
    }, 150);
  }, [actions]);

  // Stop auto-complete when game is won or no more moves to auto-complete
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
  ]
    .filter(Boolean)
    .join(' ');

  const cardBackImage =
    settings.cardBack !== 'default.png'
      ? cardBackUrl(settings.cardBack)
      : null;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className={rootClass} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showSplash && <SplashScreen onStart={handleSplashDismiss} />}

      <HUD
        score={game.score}
        moves={game.moves}
        elapsed={elapsed}
        canUndo={canUndo}
        canAutoComplete={canAutoComplete && !isAutoCompleting}
        onUndo={actions.undo}
        onNewGame={handleNewGame}
        onAutoComplete={handleAutoComplete}
        onSettings={() => setShowSettings(true)}
      />

      <GameBoard
        game={game}
        cardBackImage={cardBackImage}
        onDraw={actions.draw}
        onTapWaste={actions.tapWaste}
        onTapTableau={actions.tapTableau}
        onTapFoundation={actions.tapFoundation}
      />

      {game.status === 'won' && (
        <WinModal
          score={game.score}
          moves={game.moves}
          elapsed={elapsed}
          bestScore={bestScore}
          onNewGame={handleNewGame}
        />
      )}

      {game.status === 'no-moves' && (
        <NoMovesModal
          onUndo={actions.undo}
          onNewGame={handleNewGame}
          canUndo={canUndo}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={handleSettingsUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;

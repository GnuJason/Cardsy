import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useGameStats } from './hooks/useGameStats';
import { useTheme } from './hooks/useTheme';
import { useAchievements } from './hooks/useAchievements';
import { SplashScreen } from './components/SplashScreen/SplashScreen';
import { ModeSelector } from './components/ModeSelector/ModeSelector';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { StatsModal } from './components/StatsModal/StatsModal';
import { AchievementsModal } from './components/AchievementsModal/AchievementsModal';
import { AchievementToast } from './components/AchievementToast/AchievementToast';
import { ConfirmModal } from './components/ConfirmModal/ConfirmModal';
import type { UserSettings, GameMode } from './logic/types';
import { soundManager } from './services/sound';
import {
  getSplashSeen,
  setSplashSeen,
  getSettings,
  setSettings as saveSettings,
  getGameMode,
  setGameMode,
  migrateFromLegacy,
  getSavedKlondikeGame,
  getSavedTriPeaksGame,
  getSavedGolfGame,
} from './services/storage';
import { cardBackUrl } from './config/cardArt';

// Lazy-load screen components for code splitting
const KlondikeScreen = lazy(() =>
  import('./screens/KlondikeScreen').then((m) => ({ default: m.KlondikeScreen })),
);
const TriPeaksScreen = lazy(() =>
  import('./screens/TriPeaksScreen').then((m) => ({ default: m.TriPeaksScreen })),
);
const GolfScreen = lazy(() =>
  import('./screens/GolfScreen').then((m) => ({ default: m.GolfScreen })),
);

// Run one-time migration on module load
migrateFromLegacy();

export const App: React.FC = () => {
  // ── Splash ────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(!getSplashSeen());

  // ── Mode selection ────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(() => {
    if (!getSplashSeen()) return null;
    return getGameMode();
  });
  const [showModeSelector, setShowModeSelector] = useState(() => {
    // Show mode selector if splash already seen but no saved game
    if (getSplashSeen()) {
      const mode = getGameMode();
      const hasSaved =
        mode === 'klondike'
          ? !!getSavedKlondikeGame()
          : mode === 'tripeaks'
            ? !!getSavedTriPeaksGame()
            : !!getSavedGolfGame();
      return !hasSaved;
    }
    return false;
  });
  const [confirmModeSwitch, setConfirmModeSwitch] = useState(false);

  // ── Settings ──────────────────────────────────────────────
  const [settings, setSettingsState] = useState<UserSettings>(getSettings());
  const [showSettings, setShowSettings] = useState(false);

  // Sync sound manager with settings
  soundManager.setEnabled(settings.soundEnabled);

  // ── Theme ─────────────────────────────────────────────────
  useTheme(settings.theme, selectedMode === 'tripeaks');

  // ── Stats ─────────────────────────────────────────────────
  const { stats, recordGameStart, recordWin, recordLoss, resetStats } = useGameStats();
  const [showStats, setShowStats] = useState(false);

  // ── Achievements ──────────────────────────────────────────
  const { unlocked, toastQueue, dismissToast, checkOnWin, checkOnGameStart } =
    useAchievements();
  const [showAchievements, setShowAchievements] = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const handleSplashDismiss = useCallback(() => {
    setSplashSeen();
    setShowSplash(false);
    setShowModeSelector(true);
    soundManager.play('buttonClick');
  }, []);

  const handleModeSelect = useCallback(
    (mode: GameMode) => {
      setSelectedMode(mode);
      setGameMode(mode);
      setShowModeSelector(false);
      soundManager.play('buttonClick');
    },
    [],
  );

  const handleContinue = useCallback(
    (mode: GameMode) => {
      setSelectedMode(mode);
      setGameMode(mode);
      setShowModeSelector(false);
      soundManager.play('buttonClick');
    },
    [],
  );

  const handleChangeMode = useCallback(() => {
    setConfirmModeSwitch(true);
  }, []);

  const handleConfirmModeSwitch = useCallback(() => {
    setConfirmModeSwitch(false);
    setShowModeSelector(true);
    setSelectedMode(null);
    soundManager.play('buttonClick');
  }, []);

  const handleSettingsUpdate = useCallback((newSettings: UserSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
    soundManager.setEnabled(newSettings.soundEnabled);
  }, []);

  // Stats callbacks passed to screens
  const handleRecordStart = useCallback(
    (mode: GameMode) => {
      recordGameStart(mode);
      checkOnGameStart(stats, mode);
    },
    [recordGameStart, checkOnGameStart, stats],
  );

  const handleRecordWin = useCallback(
    (mode: GameMode, score: number, time: number) => {
      recordWin(mode, score, time);
    },
    [recordWin],
  );

  const handleRecordLoss = useCallback(
    (mode: GameMode) => {
      recordLoss(mode);
    },
    [recordLoss],
  );

  // Achievement check on win — Klondike
  const handleKlondikeWin = useCallback(
    (elapsed: number, usedUndo: boolean) => {
      checkOnWin(stats, 'klondike', elapsed, usedUndo, false, false);
    },
    [checkOnWin, stats],
  );

  // Achievement check on win — TriPeaks
  const handleTriPeaksWin = useCallback(
    (elapsed: number, usedStock: boolean, peaksClearedInStreak: boolean) => {
      checkOnWin(stats, 'tripeaks', elapsed, false, usedStock, peaksClearedInStreak);
    },
    [checkOnWin, stats],
  );

  // Achievement check on win — Golf
  const handleGolfWin = useCallback(
    (elapsed: number) => {
      checkOnWin(stats, 'golf', elapsed, false, false, false);
    },
    [checkOnWin, stats],
  );

  // ── Card size class ───────────────────────────────────────
  const sizeClass =
    settings.cardSize === 'large'
      ? 'card-size-large'
      : settings.cardSize === 'small'
        ? 'card-size-small'
        : '';

  const rootClass = [sizeClass, settings.reducedMotion ? 'reduced-motion' : '']
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

      {showModeSelector && !showSplash && (
        <ModeSelector
          onSelect={handleModeSelect}
          savedKlondike={getSavedKlondikeGame()}
          savedTriPeaks={getSavedTriPeaksGame()}
          savedGolf={getSavedGolfGame()}
          onContinue={handleContinue}
        />
      )}

      {selectedMode && !showModeSelector && !showSplash && (
        <Suspense
          fallback={
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
              Loading…
            </div>
          }
        >
          {selectedMode === 'klondike' && (
            <KlondikeScreen
              cardBackImage={cardBackImage}
              modeStats={stats.klondike}
              drawCount={settings.drawCount}
              reducedMotion={settings.reducedMotion}
              onRecordStart={() => handleRecordStart('klondike')}
              onRecordWin={(score, time) => handleRecordWin('klondike', score, time)}
              onRecordLoss={() => handleRecordLoss('klondike')}
              onChangeMode={handleChangeMode}
              onShowSettings={() => setShowSettings(true)}
              onShowStats={() => setShowStats(true)}
              onShowAchievements={() => setShowAchievements(true)}
              onWin={handleKlondikeWin}
            />
          )}
          {selectedMode === 'tripeaks' && (
            <TriPeaksScreen
              cardBackImage={cardBackImage}
              modeStats={stats.tripeaks}
              reducedMotion={settings.reducedMotion}
              onRecordStart={() => handleRecordStart('tripeaks')}
              onRecordWin={(score, time) => handleRecordWin('tripeaks', score, time)}
              onRecordLoss={() => handleRecordLoss('tripeaks')}
              onChangeMode={handleChangeMode}
              onShowSettings={() => setShowSettings(true)}
              onShowStats={() => setShowStats(true)}
              onShowAchievements={() => setShowAchievements(true)}
              onWin={handleTriPeaksWin}
            />
          )}
          {selectedMode === 'golf' && (
            <GolfScreen
              cardBackImage={cardBackImage}
              modeStats={stats.golf}
              reducedMotion={settings.reducedMotion}
              onRecordStart={() => handleRecordStart('golf')}
              onRecordWin={(score, time) => handleRecordWin('golf', score, time)}
              onRecordLoss={() => handleRecordLoss('golf')}
              onChangeMode={handleChangeMode}
              onShowSettings={() => setShowSettings(true)}
              onShowStats={() => setShowStats(true)}
              onShowAchievements={() => setShowAchievements(true)}
              onWin={handleGolfWin}
            />
          )}
        </Suspense>
      )}

      {/* Global modals */}
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

      {showAchievements && (
        <AchievementsModal
          unlocked={unlocked}
          onClose={() => setShowAchievements(false)}
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

      {/* Achievement toasts */}
      {toastQueue.length > 0 && (
        <AchievementToast toast={toastQueue[0]} onDismiss={dismissToast} />
      )}
    </div>
  );
};

export default App;

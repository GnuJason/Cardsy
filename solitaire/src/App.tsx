import React, { useState, useCallback, lazy, Suspense, useMemo, useEffect } from 'react';
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
import { getCustomBack, createBackBlobUrl } from './services/customBacks';
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
  getSavedPyramidGame,
  getSavedFreeCellGame,
  getSavedSpiderGame,
} from './services/storage';
import { cardBackUrl } from './config/cardArt';
import { themeToPixiColors } from './pixi/ThemeAdapter';

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
const PyramidScreen = lazy(() =>
  import('./screens/PyramidScreen').then((m) => ({ default: m.PyramidScreen })),
);
const FreeCellScreen = lazy(() =>
  import('./screens/FreeCellScreen').then((m) => ({ default: m.FreeCellScreen })),
);
const SpiderScreen = lazy(() =>
  import('./screens/SpiderScreen').then((m) => ({ default: m.SpiderScreen })),
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
    // Always show mode selector after splash so player explicitly chooses
    // new game vs continue, rather than auto-resuming a saved state.
    if (getSplashSeen()) {
      return true;
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
  const { theme } = useTheme(settings.theme, selectedMode === 'tripeaks');
  const pixiThemeColors = useMemo(() => themeToPixiColors(theme), [theme]);

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

  // Achievement check on win — Pyramid
  const handlePyramidWin = useCallback(
    (elapsed: number) => {
      checkOnWin(stats, 'pyramid', elapsed, false, false, false);
    },
    [checkOnWin, stats],
  );

  // Achievement check on win — FreeCell
  const handleFreeCellWin = useCallback(
    (elapsed: number) => {
      checkOnWin(stats, 'freecell', elapsed, false, false, false);
    },
    [checkOnWin, stats],
  );

  // Achievement check on win — Spider
  const handleSpiderWin = useCallback(
    (elapsed: number) => {
      checkOnWin(stats, 'spider', elapsed, false, false, false);
    },
    [checkOnWin, stats],
  );

  const rootClass = [
    settings.reducedMotion ? 'reduced-motion' : '',
    `card-scale-${settings.cardScale}`,
  ]
    .filter(Boolean)
    .join(' ');

  // cardBackImage: null = family photos (default), string = uniform built-in back
  const cardBackImage =
    settings.cardBack !== 'default.png' && !settings.cardBack.startsWith('custom:')
      ? cardBackUrl(settings.cardBack)
      : null;

  // ── Custom card back blob URL ─────────────────────────────
  const [customBackUrl, setCustomBackUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.cardBack.startsWith('custom:')) {
      // Revoke previous blob URL if switching away
      setCustomBackUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const id = settings.cardBack.slice('custom:'.length);
    let revoked = false;
    getCustomBack(id).then((back) => {
      if (revoked) return;
      if (back) {
        const url = createBackBlobUrl(back);
        setCustomBackUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        // Custom back was deleted — reset to default so game always starts
        setCustomBackUrl(null);
        handleSettingsUpdate({ ...settings, cardBack: 'default.png' });
      }
    });
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cardBack]);

  // resolvedCardBack: null = per-card family photos, string = uniform back URL.
  // During custom-back async load, falls through to null (family photos) so
  // the game always renders immediately.
  const resolvedCardBack = settings.cardBack.startsWith('custom:')
    ? customBackUrl   // null while loading → family photos fallback
    : cardBackImage;  // null for 'default.png' → family photos

  // ── Dev-only card-back audit ───────────────────────────────
  if (import.meta.env.DEV) {
    const audit = {
      settingsCardBack: settings.cardBack,
      customBackUrl,
      cardBackImage,
      resolvedCardBack,
      willUseFamilyPhotos: resolvedCardBack === null,
    };
    if (settings.cardBack.startsWith('custom:') && !customBackUrl) {
      console.warn('[CardBack Audit] Custom back selected but blob not loaded yet — using family photos fallback', audit);
    }
  }

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
          savedPyramid={getSavedPyramidGame()}
          savedFreeCell={getSavedFreeCellGame()}
          savedSpider={getSavedSpiderGame()}
          onContinue={handleContinue}
        />
      )}

      {selectedMode && !showModeSelector && !showSplash && (
        <Suspense
          fallback={
            <div className="loading-fallback">Loading…</div>
          }
        >
          <div className="screen-enter" key={selectedMode} style={{ display: 'contents' }}>
          {selectedMode === 'klondike' && (
            <KlondikeScreen
              cardBackImage={resolvedCardBack}
              themeColors={pixiThemeColors}
              modeStats={stats.klondike}
              drawCount={settings.drawCount}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              cardScale={settings.cardScale}
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
              cardBackImage={resolvedCardBack}
              themeColors={pixiThemeColors}
              modeStats={stats.tripeaks}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              cardScale={settings.cardScale}
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
              cardBackImage={resolvedCardBack}
              themeColors={pixiThemeColors}
              modeStats={stats.golf}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              cardScale={settings.cardScale}
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
          {selectedMode === 'pyramid' && (
            <PyramidScreen
              cardBackImage={resolvedCardBack}
              themeColors={pixiThemeColors}
              modeStats={stats.pyramid}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              cardScale={settings.cardScale}
              onRecordStart={() => handleRecordStart('pyramid')}
              onRecordWin={(score, time) => handleRecordWin('pyramid', score, time)}
              onRecordLoss={() => handleRecordLoss('pyramid')}
              onChangeMode={handleChangeMode}
              onShowSettings={() => setShowSettings(true)}
              onShowStats={() => setShowStats(true)}
              onShowAchievements={() => setShowAchievements(true)}
              onWin={handlePyramidWin}
            />
          )}
          {selectedMode === 'freecell' && (
            <FreeCellScreen
              cardBackImage={resolvedCardBack}
              themeColors={pixiThemeColors}
              modeStats={stats.freecell}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              cardScale={settings.cardScale}
              onRecordStart={() => handleRecordStart('freecell')}
              onRecordWin={(score, time) => handleRecordWin('freecell', score, time)}
              onRecordLoss={() => handleRecordLoss('freecell')}
              onChangeMode={handleChangeMode}
              onShowSettings={() => setShowSettings(true)}
              onShowStats={() => setShowStats(true)}
              onShowAchievements={() => setShowAchievements(true)}
              onWin={handleFreeCellWin}
            />
          )}
          {selectedMode === 'spider' && (
            <SpiderScreen
              cardBackImage={resolvedCardBack}
              themeColors={pixiThemeColors}
              modeStats={stats.spider}
              reducedMotion={settings.reducedMotion}
              highContrast={settings.highContrast}
              cardScale={settings.cardScale}
              onRecordStart={() => handleRecordStart('spider')}
              onRecordWin={(score, time) => handleRecordWin('spider', score, time)}
              onRecordLoss={() => handleRecordLoss('spider')}
              onChangeMode={handleChangeMode}
              onShowSettings={() => setShowSettings(true)}
              onShowStats={() => setShowStats(true)}
              onShowAchievements={() => setShowAchievements(true)}
              onWin={handleSpiderWin}
            />
          )}
          </div>
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

      {/* ARIA live region for screen-reader announcements */}
      <div id="game-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  );
};

export default App;

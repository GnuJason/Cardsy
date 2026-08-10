import React, { useState, useCallback, lazy, Suspense, useMemo, useEffect, useRef } from 'react';
import { useGameStats } from './hooks/useGameStats';
import { useTheme } from './hooks/useTheme';
import { useAchievements } from './hooks/useAchievements';
import {
  AchievementToast,
  AchievementsModal,
  NoticeToast,
  SettingsModal,
  SplashScreen,
  StatsModal,
} from '@grandmagame/ui';
import type { UserSettings, GameMode } from '@grandmagame/card-engine';
import { soundManager } from './services/sound';
import { getCustomBack, createBackBlobUrl } from './services/customBacks';
import { loadFamilyDeck, createFamilyDeckBlobUrl } from './services/familyDeck';
import {
  getSplashSeen,
  setSplashSeen,
  getSettings,
  setSettings as saveSettings,
  migrateFromLegacy,
  getSavedKlondikeGame,
} from '@grandmagame/storage';
import { CARD_BACK_DEFAULT, cardBackUrl, setFamilyDeckOverlay, clearFamilyDeckOverlay } from '@grandmagame/themes';
import { themeToPixiColors } from '@grandmagame/pixi-engine';

// Lazy-load screen components for code splitting
const KlondikeScreen = lazy(() =>
  import('./screens/KlondikeScreen').then((m) => ({ default: m.KlondikeScreen })),
);

// Run one-time migration on module load
migrateFromLegacy();

export const App: React.FC = () => {
  const missingCustomBackNotice = 'Using default card backs — upload custom backs anytime in Settings.';

  // ── Splash ────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(!getSplashSeen());

  // Temporary runtime isolation: the web app exposes Klondike only.
  const selectedMode: GameMode = 'klondike';

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
  const [noticeToast, setNoticeToast] = useState<string | null>(null);
  const missingCustomBackToastKeyRef = useRef<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────

  const handleSplashDismiss = useCallback(() => {
    setSplashSeen();
    setShowSplash(false);
    soundManager.play('buttonClick');
  }, []);

  const handleChangeMode = useCallback(() => {
    setNoticeToast('Klondike is the only game available in this build.');
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

  const rootClass = [
    settings.reducedMotion ? 'reduced-motion' : '',
    `card-scale-${settings.cardScale}`,
  ]
    .filter(Boolean)
    .join(' ');

  const useFamilyBacks = settings.cardBack === 'default.png';
  const builtInCardBackImage =
    !useFamilyBacks && !settings.cardBack.startsWith('custom:')
      ? cardBackUrl(settings.cardBack)
      : null;

  // ── Custom card back blob URL ─────────────────────────────
  const [customBackUrl, setCustomBackUrl] = useState<string | null>(null);

  useEffect(() => {
    const image = new Image();
    image.src = CARD_BACK_DEFAULT;
  }, []);

  useEffect(() => {
    if (!settings.cardBack.startsWith('custom:')) {
      // Revoke previous blob URL if switching away
      setCustomBackUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const id = settings.cardBack.slice('custom:'.length);
    let revoked = false;
    setCustomBackUrl(CARD_BACK_DEFAULT);
    getCustomBack(id).then((back) => {
      if (revoked) return;
      if (back) {
        const url = createBackBlobUrl(back);
        setCustomBackUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        setCustomBackUrl(CARD_BACK_DEFAULT);
        if (missingCustomBackToastKeyRef.current !== id) {
          missingCustomBackToastKeyRef.current = id;
          setNoticeToast(missingCustomBackNotice);
        }
      }
    });
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.cardBack]);

  // ── Family deck overlay ───────────────────────────────────
  // Load user-uploaded per-card photos from IndexedDB and set them as
  // the overlay in cardArt. Runs once on mount.
  useEffect(() => {
    let cancelled = false;
    loadFamilyDeck().then((cards) => {
      if (cancelled) return;
      const overlay = new Map<string, string>();
      for (const c of cards) {
        overlay.set(c.id, createFamilyDeckBlobUrl(c));
      }
      setFamilyDeckOverlay(overlay);
    });
    return () => {
      cancelled = true;
      clearFamilyDeckOverlay();
    };
  }, []);

  // resolvedCardBack: null = per-card family photos, string = uniform back URL.
  const resolvedCardBack = settings.cardBack.startsWith('custom:')
    ? customBackUrl ?? CARD_BACK_DEFAULT
    : builtInCardBackImage;

  // ── Dev-only card-back audit ───────────────────────────────
  if (import.meta.env.DEV) {
    const audit = {
      settingsCardBack: settings.cardBack,
      customBackUrl,
      builtInCardBackImage,
      resolvedCardBack,
      willUseFamilyPhotos: resolvedCardBack === null,
    };
    if (settings.cardBack.startsWith('custom:') && customBackUrl === CARD_BACK_DEFAULT) {
      console.warn('[CardBack Audit] Custom back unavailable — using shipped fallback', audit);
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className={rootClass} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showSplash && <SplashScreen onStart={handleSplashDismiss} />}

      {!showSplash && (
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
          </div>
        </Suspense>
      )}

      {/* Global modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={handleSettingsUpdate}
          onClose={() => setShowSettings(false)}
          onFamilyDeckChange={() => {
            // Reload family deck overlay from IndexedDB
            clearFamilyDeckOverlay();
            loadFamilyDeck().then((cards) => {
              const overlay = new Map<string, string>();
              for (const c of cards) {
                overlay.set(c.id, createFamilyDeckBlobUrl(c));
              }
              setFamilyDeckOverlay(overlay);
            });
          }}
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

      {/* Achievement toasts */}
      {toastQueue.length > 0 && (
        <AchievementToast toast={toastQueue[0]} onDismiss={dismissToast} />
      )}

      {noticeToast && (
        <NoticeToast message={noticeToast} onDismiss={() => setNoticeToast(null)} />
      )}

      {/* ARIA live region for screen-reader announcements */}
      <div id="game-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  );
};

export default App;

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { UserSettings } from '../../logic/types';
import { THEMES } from '../../config/themes';
import { Modal } from '../Modal/Modal';
import {
  getAllCustomBacks,
  saveCustomBack,
  deleteCustomBack,
  createBackBlobUrl,
  type CustomCardBack,
} from '../../services/customBacks';
import { getFamilyDeckCount } from '../../services/familyDeck';
import { FamilyDeckBuilder } from '../FamilyDeckBuilder/FamilyDeckBuilder';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdate: (settings: UserSettings) => void;
  onClose: () => void;
  onFamilyDeckChange?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
  onFamilyDeckChange,
}) => {
  useEffect(() => {
    if (settings.highContrast) return;
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    if (contrastQuery.matches) {
      onUpdate({ ...settings, highContrast: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Custom card backs ───────────────────────────────────
  const [customBacks, setCustomBacks] = useState<CustomCardBack[]>([]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [familyDeckCount, setFamilyDeckCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAllCustomBacks().then((backs) => {
      if (cancelled) return;
      setCustomBacks(backs);
      const urls: Record<string, string> = {};
      for (const b of backs) {
        urls[b.id] = createBackBlobUrl(b);
      }
      setBlobUrls(urls);
    });
    getFamilyDeckCount().then((count) => {
      if (!cancelled) setFamilyDeckCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Validate type
      if (!file.type.startsWith('image/')) return;
      // Limit to 5 MB
      if (file.size > 5 * 1024 * 1024) return;

      const id = crypto.randomUUID();
      const back: CustomCardBack = {
        id,
        blob: file,
        name: file.name,
        createdAt: Date.now(),
      };
      await saveCustomBack(back);
      const url = createBackBlobUrl(back);
      setCustomBacks((prev) => [...prev, back]);
      setBlobUrls((prev) => ({ ...prev, [id]: url }));
      onUpdate({ ...settings, cardBack: `custom:${id}` });
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [settings, onUpdate],
  );

  const handleDeleteCustomBack = useCallback(
    async (id: string) => {
      await deleteCustomBack(id);
      setCustomBacks((prev) => prev.filter((b) => b.id !== id));
      setBlobUrls((prev) => {
        const next = { ...prev };
        if (next[id]) {
          URL.revokeObjectURL(next[id]);
          delete next[id];
        }
        return next;
      });
      // If this was the active back, reset to default
      if (settings.cardBack === `custom:${id}`) {
        onUpdate({ ...settings, cardBack: 'default.png' });
      }
    },
    [settings, onUpdate],
  );

  // ── PWA install prompt ──────────────────────────────────
  const { installState, promptInstall } = useInstallPrompt();

  // ── Clear app cache ─────────────────────────────────────

  const handleClearCache = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === 'CACHES_CLEARED') {
          navigator.serviceWorker.removeEventListener('message', onMessage);
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('message', onMessage);
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
    } else {
      // No SW controller — clear caches directly and unregister any SW
      const clearAndReload = async () => {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        }
        window.location.reload();
      };
      clearAndReload();
    }
  }, []);

  const cardSizes: Array<{ value: UserSettings['cardScale']; label: string }> = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' },
  ];

  return (
    <>
    <Modal onClose={onClose} ariaLabel="Settings">
        <h2 className={styles.title}>Settings</h2>

        {/* Card size */}
        <div className={styles.section}>
          <div className={styles.label}>Card Size</div>
          <div className={styles.options}>
            {cardSizes.map((size) => (
              <button
                key={size.value}
                className={
                  settings.cardScale === size.value
                    ? styles.optionBtnActive
                    : styles.optionBtn
                }
                onClick={() =>
                  onUpdate({ ...settings, cardScale: size.value })
                }
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Draw mode */}
        <div className={styles.section}>
          <div className={styles.label}>Draw Mode (Klondike)</div>
          <div className={styles.options}>
            <button
              className={
                settings.drawCount === 1
                  ? styles.optionBtnActive
                  : styles.optionBtn
              }
              onClick={() => onUpdate({ ...settings, drawCount: 1 })}
            >
              Draw 1
            </button>
            <button
              className={
                settings.drawCount === 3
                  ? styles.optionBtnActive
                  : styles.optionBtn
              }
              onClick={() => onUpdate({ ...settings, drawCount: 3 })}
            >
              Draw 3
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className={styles.section}>
          <div className={styles.label}>Theme</div>
          <div className={styles.themeGrid}>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={
                  settings.theme === theme.id
                    ? styles.themeSwatchActive
                    : styles.themeSwatch
                }
                onClick={() => onUpdate({ ...settings, theme: theme.id })}
                aria-label={theme.name}
                title={theme.name}
              >
                <span
                  className={styles.swatchColor}
                  style={{ backgroundColor: theme.swatch }}
                />
                <span className={styles.swatchName}>{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card back */}
        <div className={styles.section}>
          <div className={styles.label}>Card Back</div>
          <div className={styles.backPreviewGrid}>
            {/* Default: family photos */}
            <button
              className={
                settings.cardBack === 'default.png'
                  ? styles.backPreviewActive
                  : styles.backPreviewDefault
              }
              onClick={() => onUpdate({ ...settings, cardBack: 'default.png' })}
              aria-label="Family photos (default)"
              title="Family photos"
            >
              Family Photos
            </button>

            {/* Custom backs */}
            {customBacks.map((back) => (
              <button
                key={back.id}
                className={
                  settings.cardBack === `custom:${back.id}`
                    ? styles.backPreviewActive
                    : styles.backPreview
                }
                onClick={() =>
                  onUpdate({ ...settings, cardBack: `custom:${back.id}` })
                }
                aria-label={`Custom back: ${back.name}`}
                title={back.name}
              >
                {blobUrls[back.id] && (
                  <img
                    src={blobUrls[back.id]}
                    alt={back.name}
                    className={styles.backPreviewImg}
                  />
                )}
                <button
                  className={styles.backDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomBack(back.id);
                  }}
                  aria-label={`Delete ${back.name}`}
                  title="Delete"
                >
                  ×
                </button>
              </button>
            ))}
          </div>

          {/* Upload button */}
          <label className={styles.uploadBtn}>
            + Upload Image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </label>

          {/* Family deck builder */}
          {settings.cardBack === 'default.png' && (
            <button
              className={styles.editDeckBtn}
              onClick={() => setShowDeckBuilder(true)}
              aria-label="Edit Family Deck"
            >
              🖼 Edit Family Deck
              {familyDeckCount > 0 && (
                <span className={styles.deckCount}>
                  {familyDeckCount}/52
                </span>
              )}
            </button>
          )}
        </div>

        {/* Sound toggle */}
        <div className={styles.section}>
          <div className={styles.toggle}>
            <span className={styles.toggleLabel}>Sound effects</span>
            <button
              className={
                settings.soundEnabled
                  ? styles.toggleSwitchOn
                  : styles.toggleSwitch
              }
              onClick={() =>
                onUpdate({
                  ...settings,
                  soundEnabled: !settings.soundEnabled,
                })
              }
              aria-label="Toggle sound effects"
            >
              <div
                className={
                  settings.soundEnabled
                    ? styles.toggleKnobOn
                    : styles.toggleKnob
                }
              />
            </button>
          </div>
        </div>

        {/* Reduced motion */}
        <div className={styles.section}>
          <div className={styles.toggle}>
            <span className={styles.toggleLabel}>Reduce animations</span>
            <button
              className={
                settings.reducedMotion
                  ? styles.toggleSwitchOn
                  : styles.toggleSwitch
              }
              onClick={() =>
                onUpdate({
                  ...settings,
                  reducedMotion: !settings.reducedMotion,
                })
              }
              aria-label="Toggle reduced motion"
            >
              <div
                className={
                  settings.reducedMotion
                    ? styles.toggleKnobOn
                    : styles.toggleKnob
                }
              />
            </button>
          </div>
        </div>

        {/* High contrast */}
        <div className={styles.section}>
          <div className={styles.toggle}>
            <span className={styles.toggleLabel}>High contrast mode</span>
            <button
              className={
                settings.highContrast
                  ? styles.toggleSwitchOn
                  : styles.toggleSwitch
              }
              onClick={() =>
                onUpdate({
                  ...settings,
                  highContrast: !settings.highContrast,
                })
              }
              aria-label="Toggle high contrast"
            >
              <div
                className={
                  settings.highContrast
                    ? styles.toggleKnobOn
                    : styles.toggleKnob
                }
              />
            </button>
          </div>
        </div>

        {/* Install / Download app */}
        {installState === 'available' && (
          <div className={styles.section}>
            <div className={styles.label}>Download GrandmaGames</div>
            <button
              className={styles.installBtn}
              onClick={promptInstall}
              aria-label="Install GrandmaGames"
            >
              📲 Install GrandmaGames
            </button>
          </div>
        )}
        {installState === 'ios-safari' && (
          <div className={styles.section}>
            <div className={styles.label}>Download GrandmaGames</div>
            <div className={styles.iosInstallHint}>
              To install, tap{' '}
              <span aria-label="Share" role="img">⬆</span>{' '}
              then <strong>Add to Home Screen</strong>.
            </div>
          </div>
        )}
        {installState === 'installed' && (
          <div className={styles.section}>
            <div className={styles.iosInstallHint}>
              ✅ App installed
            </div>
          </div>
        )}

        {/* Clear app cache */}
        <div className={styles.section}>
            <button
              className={styles.clearCacheBtn}
              onClick={handleClearCache}
              aria-label="Clear app cache"
            >
              🗑 Clear App Cache
            </button>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          Done
        </button>
    </Modal>

    {showDeckBuilder && (
      <FamilyDeckBuilder
        onClose={() => {
          setShowDeckBuilder(false);
          // Refresh count after editing
          getFamilyDeckCount().then(setFamilyDeckCount);
          // Notify parent to reload the overlay
          onFamilyDeckChange?.();
        }}
      />
    )}
    </>
  );
};

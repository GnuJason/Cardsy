import React, { useEffect } from 'react';
import type { UserSettings } from '../../logic/types';
import { THEMES } from '../../config/themes';
import { Modal } from '../Modal/Modal';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdate: (settings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  useEffect(() => {
    if (settings.highContrast) return;
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    if (contrastQuery.matches) {
      onUpdate({ ...settings, highContrast: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardSizes: Array<{ value: UserSettings['cardScale']; label: string }> = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'Extra Large' },
  ];

  return (
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

        <button className={styles.closeBtn} onClick={onClose}>
          Done
        </button>
    </Modal>
  );
};

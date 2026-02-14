import React from 'react';
import type { UserSettings } from '../../logic/types';
import { THEMES } from '../../config/themes';
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
  const cardSizes: Array<{ value: UserSettings['cardSize']; label: string }> = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Settings</h2>

        {/* Card size */}
        <div className={styles.section}>
          <div className={styles.label}>Card Size</div>
          <div className={styles.options}>
            {cardSizes.map((size) => (
              <button
                key={size.value}
                className={
                  settings.cardSize === size.value
                    ? styles.optionBtnActive
                    : styles.optionBtn
                }
                onClick={() =>
                  onUpdate({ ...settings, cardSize: size.value })
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

        <button className={styles.closeBtn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import type { UserSettings } from '../../logic/types';
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

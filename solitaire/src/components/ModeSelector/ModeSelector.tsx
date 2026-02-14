import React from 'react';
import type { GameMode } from '../../logic/types';
import styles from './ModeSelector.module.css';

interface ModeSelectorProps {
  onSelect: (mode: GameMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose Your Game</h1>
        <div className={styles.modes}>
          <button
            className={styles.modeBtn}
            onClick={() => onSelect('klondike')}
          >
            <span className={styles.modeIcon}>🃏</span>
            <span className={styles.modeName}>Klondike</span>
            <span className={styles.modeDesc}>Classic Solitaire</span>
          </button>
          <button
            className={styles.modeBtn}
            onClick={() => onSelect('tripeaks')}
          >
            <span className={styles.modeIcon}>⛰️</span>
            <span className={styles.modeName}>TriPeaks</span>
            <span className={styles.modeDesc}>Clear the Peaks</span>
          </button>
        </div>
      </div>
    </div>
  );
};

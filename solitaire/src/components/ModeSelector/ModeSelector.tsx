import React from 'react';
import type { GameMode, SavedKlondikeGame, SavedTriPeaksGame } from '../../logic/types';
import styles from './ModeSelector.module.css';

interface ModeSelectorProps {
  onSelect: (mode: GameMode) => void;
  savedKlondike: SavedKlondikeGame | null;
  savedTriPeaks: SavedTriPeaksGame | null;
  onContinue: (mode: GameMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSelect,
  savedKlondike,
  savedTriPeaks,
  onContinue,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose Your Game</h1>
        <div className={styles.modes}>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedKlondike ? onContinue('klondike') : onSelect('klondike')
            }
          >
            <span className={styles.modeIcon}>🃏</span>
            <span className={styles.modeName}>Klondike</span>
            <span className={styles.modeDesc}>
              {savedKlondike
                ? `Continue — Score ${savedKlondike.state.score}`
                : 'Classic Solitaire'}
            </span>
          </button>
          <button
            className={styles.modeBtn}
            onClick={() =>
              savedTriPeaks ? onContinue('tripeaks') : onSelect('tripeaks')
            }
          >
            <span className={styles.modeIcon}>⛰️</span>
            <span className={styles.modeName}>TriPeaks</span>
            <span className={styles.modeDesc}>
              {savedTriPeaks
                ? `Continue — ${savedTriPeaks.state.peaksCleared.filter(Boolean).length}/3 peaks cleared`
                : 'Clear the Peaks'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

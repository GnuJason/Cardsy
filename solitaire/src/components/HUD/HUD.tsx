import React from 'react';
import { formatTime } from '../../hooks/useTimer';
import styles from './HUD.module.css';

interface HUDProps {
  score: number;
  moves: number;
  elapsed: number;
  canUndo: boolean;
  canAutoComplete: boolean;
  onUndo: () => void;
  onNewGame: () => void;
  onAutoComplete: () => void;
  onSettings: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  moves,
  elapsed,
  canUndo,
  canAutoComplete,
  onUndo,
  onNewGame,
  onAutoComplete,
  onSettings,
}) => {
  return (
    <div className={styles.hud}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{score}</span>
          <span className={styles.statLabel}>Score</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{moves}</span>
          <span className={styles.statLabel}>Moves</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatTime(elapsed)}</span>
          <span className={styles.statLabel}>Time</span>
        </div>
      </div>

      <div className={styles.controls}>
        {canAutoComplete && (
          <button
            className={styles.autoCompleteBtn}
            onClick={onAutoComplete}
            aria-label="Auto-complete"
          >
            ✨ Auto
          </button>
        )}
        <button
          className={styles.controlBtn}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          ↩ Undo
        </button>
        <button
          className={styles.controlBtn}
          onClick={onNewGame}
          aria-label="New game"
        >
          🃏 New
        </button>
        <button
          className={styles.controlBtn}
          onClick={onSettings}
          aria-label="Settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
};

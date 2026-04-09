import React, { useRef, useEffect } from 'react';
import { formatTime } from '../../hooks/useTimer';
import styles from './HUD.module.css';

interface HUDProps {
  score: number;
  moves: number;
  elapsed: number;
  canUndo: boolean;
  canAutoComplete?: boolean;
  onUndo: () => void;
  onNewGame: () => void;
  onAutoComplete?: () => void;
  onSettings: () => void;
  onStats?: () => void;
  onChangeMode?: () => void;
  onAchievements?: () => void;
}

/** Trigger a CSS animation bump on a ref element */
function useBump(value: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current && ref.current) {
      const el = ref.current;
      el.classList.remove(styles.statBump);
      // Force reflow so the animation restarts
      void el.offsetWidth;
      el.classList.add(styles.statBump);
    }
    prev.current = value;
  }, [value]);
  return ref;
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
  onStats,
  onChangeMode,
  onAchievements,
}) => {
  const scoreRef = useBump(score);
  const movesRef = useBump(moves);

  return (
    <div className={styles.hud}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span ref={scoreRef} className={styles.statValue}>{score}</span>
          <span className={styles.statLabel}>Score</span>
        </div>
        <div className={styles.stat}>
          <span ref={movesRef} className={styles.statValue}>{moves}</span>
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
        {onStats && (
          <button
            className={styles.controlBtn}
            onClick={onStats}
            aria-label="Statistics"
          >
            📊
          </button>
        )}
        {onAchievements && (
          <button
            className={styles.controlBtn}
            onClick={onAchievements}
            aria-label="Achievements"
          >
            🏆
          </button>
        )}
        <button
          className={styles.controlBtn}
          onClick={onSettings}
          aria-label="Settings"
        >
          ⚙
        </button>
        {onChangeMode && (
          <button
            className={styles.controlBtn}
            onClick={onChangeMode}
            aria-label="Change game mode"
          >
            🔀
          </button>
        )}
      </div>
    </div>
  );
};

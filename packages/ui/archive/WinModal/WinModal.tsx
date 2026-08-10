import React from 'react';
import { formatTime } from '../../hooks/useTimer';
import { timerBonus } from '../../logic/scoring';
import type { GameModeStats } from '../../logic/types';
import { Modal } from '../Modal/Modal';
import styles from './WinModal.module.css';

/** Stat line shown in the win modal */
interface StatLine {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface WinModalProps {
  onNewGame: () => void;
  modeStats?: GameModeStats;
  elapsed: number;
  moves: number;
  bestScore: number | null;
  /** Game-mode specific stat lines to display. If omitted, defaults to Klondike-style scoring. */
  statLines?: StatLine[];
  /** Override the "new best" check logic. If omitted, uses score-based comparison. */
  isNewBest?: boolean;
  /** For Klondike/TriPeaks: base score (timer bonus is computed automatically) */
  score?: number;
  /** Whether to show timer bonus (Klondike/TriPeaks style scoring) */
  showTimerBonus?: boolean;
}

export const WinModal: React.FC<WinModalProps> = ({
  onNewGame,
  modeStats,
  elapsed,
  moves,
  bestScore,
  statLines,
  isNewBest: isNewBestOverride,
  score,
  showTimerBonus = false,
}) => {
  // Compute timer bonus if applicable
  const bonus = showTimerBonus ? timerBonus(elapsed) : 0;
  const finalScore = score !== undefined ? score + bonus : undefined;

  // Determine if this is a new best
  const isNewBest =
    isNewBestOverride !== undefined
      ? isNewBestOverride
      : finalScore !== undefined && (bestScore === null || finalScore > bestScore);

  // Build stat lines if not provided
  const lines: StatLine[] = statLines ?? [
    ...(showTimerBonus && score !== undefined
      ? [
          { label: 'Score', value: score },
          { label: 'Time bonus', value: `+${bonus}` },
          { label: 'Final score', value: finalScore! },
        ]
      : []),
    { label: 'Moves', value: moves },
    { label: 'Time', value: formatTime(elapsed) },
  ];

  const isNewBestTime =
    modeStats && modeStats.bestTime !== null && elapsed <= modeStats.bestTime;

  return (
    <Modal onClose={onNewGame} ariaLabel="You won">
      <h2 className={styles.title}>🎉 You Won!</h2>
      <div className={styles.stats}>
        {lines.map((line) => (
          <div key={line.label} className={line.highlight ? styles.statHighlight : styles.stat}>
            <span className={styles.statLabel}>{line.label}</span>
            <strong className={styles.statValue}>{line.value}</strong>
          </div>
        ))}
      </div>
      {(isNewBest || isNewBestTime) && (
        <div className={styles.achievements}>
          {isNewBest && <div className={styles.badge}>🏆 New best score!</div>}
          {isNewBestTime && <div className={styles.badge}>⏱️ New best time!</div>}
        </div>
      )}
      {modeStats && (
        <p className={styles.streakInfo}>
          Win streak: <strong>{modeStats.currentWinStreak}</strong>
          {modeStats.currentWinStreak > 1 && ' 🔥'}
        </p>
      )}
      <div className={styles.buttons}>
        <button className={styles.primaryBtn} onClick={onNewGame}>
          Play Again
        </button>
      </div>
    </Modal>
  );
};

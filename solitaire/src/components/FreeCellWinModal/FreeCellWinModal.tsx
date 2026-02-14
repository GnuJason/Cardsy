import React from 'react';
import { formatTime } from '../../hooks/useTimer';
import type { GameModeStats } from '../../logic/types';
import styles from '../WinModal/WinModal.module.css';

interface FreeCellWinModalProps {
  moves: number;
  elapsed: number;
  bestScore: number | null;
  onNewGame: () => void;
  modeStats?: GameModeStats;
}

export const FreeCellWinModal: React.FC<FreeCellWinModalProps> = ({
  moves,
  elapsed,
  bestScore,
  onNewGame,
  modeStats,
}) => {
  // FreeCell: lower moves is better
  const isNewBest = bestScore === null || moves < bestScore;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🎉 You Won!</h2>
        <p className={styles.message}>
          Moves: <strong>{moves}</strong>
          <br />
          Time: <strong>{formatTime(elapsed)}</strong>
          {isNewBest && (
            <>
              <br />
              <br />
              🏆 <strong>New best (fewest moves)!</strong>
            </>
          )}
          {modeStats && modeStats.bestTime !== null && elapsed <= modeStats.bestTime && (
            <>
              <br />
              ⏱️ <strong>New best time!</strong>
            </>
          )}
        </p>
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
      </div>
    </div>
  );
};

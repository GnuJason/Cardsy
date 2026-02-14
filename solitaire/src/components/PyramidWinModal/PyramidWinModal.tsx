import React from 'react';
import { formatTime } from '../../hooks/useTimer';
import type { GameModeStats } from '../../logic/types';
import styles from '../WinModal/WinModal.module.css';

interface PyramidWinModalProps {
  cardsRemaining: number;
  moves: number;
  elapsed: number;
  bestScore: number | null;
  onNewGame: () => void;
  modeStats?: GameModeStats;
}

export const PyramidWinModal: React.FC<PyramidWinModalProps> = ({
  cardsRemaining,
  moves,
  elapsed,
  bestScore,
  onNewGame,
  modeStats,
}) => {
  // Pyramid: lower is better. A new best is when remaining < previous best.
  const isNewBest =
    bestScore === null || cardsRemaining < bestScore;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🎉 You Won!</h2>
        <p className={styles.message}>
          Cards remaining: <strong>{cardsRemaining}</strong>
          {cardsRemaining === 0 && (
            <>
              <br />
              ⭐ <strong>Perfect clear!</strong>
            </>
          )}
          <br />
          Moves: <strong>{moves}</strong>
          <br />
          Time: <strong>{formatTime(elapsed)}</strong>
          {isNewBest && (
            <>
              <br />
              <br />
              🏆 <strong>New best score!</strong>
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
        <button className={styles.newGameBtn} onClick={onNewGame}>
          Play Again
        </button>
      </div>
    </div>
  );
};

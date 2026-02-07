import React from 'react';
import { formatTime } from '../../hooks/useTimer';
import { timerBonus } from '../../logic/scoring';
import styles from './WinModal.module.css';

interface WinModalProps {
  score: number;
  moves: number;
  elapsed: number;
  bestScore: number | null;
  onNewGame: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  score,
  moves,
  elapsed,
  bestScore,
  onNewGame,
}) => {
  const bonus = timerBonus(elapsed);
  const finalScore = score + bonus;
  const isNewBest = bestScore === null || finalScore > bestScore;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🎉 You Won!</h2>
        <p className={styles.message}>
          Score: <strong>{score}</strong>
          <br />
          Time bonus: <strong>+{bonus}</strong>
          <br />
          Final score: <strong>{finalScore}</strong>
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
        </p>
        <div className={styles.buttons}>
          <button className={styles.primaryBtn} onClick={onNewGame}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

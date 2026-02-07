import React from 'react';
import styles from '../WinModal/WinModal.module.css'; // reuse same modal styles

interface NoMovesModalProps {
  onUndo: () => void;
  onNewGame: () => void;
  canUndo: boolean;
}

export const NoMovesModal: React.FC<NoMovesModalProps> = ({
  onUndo,
  onNewGame,
  canUndo,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>No Moves Available</h2>
        <p className={styles.message}>
          There are no more moves you can make. Would you like to undo or start a
          new game?
        </p>
        <div className={styles.buttons}>
          {canUndo && (
            <button className={styles.secondaryBtn} onClick={onUndo}>
              ↩ Undo
            </button>
          )}
          <button className={styles.primaryBtn} onClick={onNewGame}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

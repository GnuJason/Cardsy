import React from 'react';
import { Modal } from '../Modal/Modal';
import styles from '../WinModal/WinModal.module.css';

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
    <Modal onClose={canUndo ? onUndo : onNewGame} ariaLabel="No moves available">
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
    </Modal>
  );
};

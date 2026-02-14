import React, { useCallback } from 'react';
import type { FreeCellGameState } from '../../logic/types';
import { SUIT_SYMBOLS, SUITS } from '../../logic/types';
import { Card } from '../Card/Card';
import styles from './FreeCellBoard.module.css';

interface FreeCellBoardProps {
  game: FreeCellGameState;
  cardBackImage?: string | null;
  onTapColumn: (colIndex: number, cardIndex: number) => void;
  onTapFreeCell: (cellIndex: number) => void;
  onTapFoundation: (foundIndex: number) => void;
}

const OVERLAP_PX = 30; // vertical overlap between stacked cards

export const FreeCellBoard: React.FC<FreeCellBoardProps> = ({
  game,
  cardBackImage,
  onTapColumn,
  onTapFreeCell,
  onTapFoundation,
}) => {
  const { columns, freeCells, foundations, selectedSource } = game;

  // ── Free Cell slots ───────────────────────────────────────

  const renderFreeCells = () =>
    freeCells.map((card, idx) => {
      const isSelected =
        selectedSource?.type === 'freecell' && selectedSource.cellIndex === idx;
      return (
        <div
          key={`fc-${idx}`}
          className={`${styles.cellSlot} ${isSelected ? styles.selected : ''}`}
          onClick={() => onTapFreeCell(idx)}
        >
          {card ? <Card card={card} cardBackImage={cardBackImage} /> : null}
        </div>
      );
    });

  // ── Foundation slots ──────────────────────────────────────

  const renderFoundations = () =>
    foundations.map((pile, idx) => {
      const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
      return (
        <div
          key={`fd-${idx}`}
          className={`${styles.foundSlot} ${!topCard ? '' : ''}`}
          onClick={() => onTapFoundation(idx)}
        >
          {topCard ? (
            <Card card={topCard} cardBackImage={cardBackImage} />
          ) : (
            <span className={styles.foundIcon}>{SUIT_SYMBOLS[SUITS[idx]]}</span>
          )}
        </div>
      );
    });

  // ── Tableau columns ───────────────────────────────────────

  const handleColumnTap = useCallback(
    (colIndex: number, cardIndex: number) => {
      onTapColumn(colIndex, cardIndex);
    },
    [onTapColumn],
  );

  const renderColumns = () =>
    columns.map((col, colIdx) => {
      if (col.length === 0) {
        return (
          <div
            key={`col-${colIdx}`}
            className={styles.columnEmpty}
            onClick={() => handleColumnTap(colIdx, 0)}
          />
        );
      }

      // Determine selected card range in this column
      let selStart = -1;
      if (
        selectedSource?.type === 'column' &&
        selectedSource.colIndex === colIdx
      ) {
        selStart = selectedSource.cardIndex;
      }

      const columnHeight = (col.length - 1) * OVERLAP_PX;

      return (
        <div
          key={`col-${colIdx}`}
          className={styles.column}
          style={{ height: `calc(var(--card-height) + ${columnHeight}px)` }}
        >
          {col.map((card, cardIdx) => {
            const isInSelection = selStart >= 0 && cardIdx >= selStart;

            return (
              <div
                key={card.id}
                className={`${styles.columnCard} ${isInSelection ? styles.selectedCard : ''}`}
                style={{ top: `${cardIdx * OVERLAP_PX}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColumnTap(colIdx, cardIdx);
                }}
              >
                <Card card={card} cardBackImage={cardBackImage} />
              </div>
            );
          })}
        </div>
      );
    });

  return (
    <div className={styles.board}>
      {/* Moves indicator */}
      <div className={styles.movesBadge}>
        <span className={styles.movesCount}>{game.moves}</span> moves
      </div>

      {/* Top row: free cells + foundations */}
      <div className={styles.topRow}>
        <div className={styles.cellGroup}>{renderFreeCells()}</div>
        <div className={styles.spacer} />
        <div className={styles.cellGroup}>{renderFoundations()}</div>
      </div>

      {/* Tableau */}
      <div className={styles.tableau}>{renderColumns()}</div>
    </div>
  );
};

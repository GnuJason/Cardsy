import React, { useCallback } from 'react';
import type { SpiderGameState } from '../../logic/types';
import { canDealRow } from '../../logic/spider/rules';
import { Card } from '../Card/Card';
import styles from './SpiderBoard.module.css';

interface SpiderBoardProps {
  game: SpiderGameState;
  cardBackImage?: string | null;
  onTapColumn: (colIndex: number, cardIndex: number) => void;
  onTapStock: () => void;
}

export const SpiderBoard: React.FC<SpiderBoardProps> = ({
  game,
  cardBackImage,
  onTapColumn,
  onTapStock,
}) => {
  const { columns, stock, completedRuns, selectedSource } = game;

  const handleColumnTap = useCallback(
    (colIndex: number, cardIndex: number) => {
      onTapColumn(colIndex, cardIndex);
    },
    [onTapColumn],
  );

  const canDeal = canDealRow(game);

  // ── Foundation display (8 slots) ──────────────────────────

  const renderFoundations = () => {
    const slots = [];
    for (let i = 0; i < 8; i++) {
      const filled = i < completedRuns;
      slots.push(
        <div
          key={`found-${i}`}
          className={`${styles.foundSlot} ${filled ? styles.foundFilled : ''}`}
        >
          <span className={styles.foundLabel}>
            {filled ? '✓' : `${i + 1}`}
          </span>
        </div>,
      );
    }
    return slots;
  };

  // ── Stock pile ────────────────────────────────────────────

  const renderStock = () => {
    if (stock.length === 0) {
      return (
        <div className={styles.stockEmpty}>
          <span>Empty</span>
        </div>
      );
    }

    return (
      <div
        className={`${styles.stockPile} ${!canDeal ? styles.stockDisabled : ''}`}
        onClick={canDeal ? onTapStock : undefined}
      >
        <Card
          card={{ ...stock[stock.length - 1], faceUp: false }}
          cardBackImage={cardBackImage}
        />
        <span className={styles.stockCount}>{stock.length}</span>
      </div>
    );
  };

  // ── Tableau columns ───────────────────────────────────────

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
      if (selectedSource && selectedSource.colIndex === colIdx) {
        selStart = selectedSource.cardIndex;
      }

      const faceDownCount = col.filter((c) => !c.faceUp).length;
      const colLen = col.length;

      return (
        <div
          key={`col-${colIdx}`}
          className={styles.column}
          style={{
            height: `calc(var(--card-height) + ${faceDownCount} * var(--fan-offset-up) + ${colLen - 1 - faceDownCount} * var(--fan-offset-down))`,
          }}
        >
          {col.map((card, cardIdx) => {
            const isInSelection = selStart >= 0 && cardIdx >= selStart;

            // face-down cards get a smaller offset
            let topOffset: string;
            if (cardIdx === 0) {
              topOffset = '0px';
            } else {
              // Sum offsets for all previous cards
              let sumParts: string[] = [];
              for (let i = 0; i < cardIdx; i++) {
                sumParts.push(
                  col[i].faceUp
                    ? 'var(--fan-offset-down)'
                    : 'var(--fan-offset-up)',
                );
              }
              topOffset = `calc(${sumParts.join(' + ')})`;
            }

            return (
              <div
                key={card.id}
                className={`${styles.columnCard} ${isInSelection ? styles.selectedCard : ''}`}
                style={{ top: topOffset }}
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
      {/* Top row: foundations + stock */}
      <div className={styles.topRow}>
        <div className={styles.foundationInfo}>
          {renderFoundations()}
        </div>
        {renderStock()}
      </div>

      {/* Tableau */}
      <div className={styles.tableau}>{renderColumns()}</div>
    </div>
  );
};

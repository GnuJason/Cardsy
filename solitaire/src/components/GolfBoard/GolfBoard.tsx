import React, { useCallback } from 'react';
import type { GolfGameState } from '../../logic/types';
import { Card, EmptyPile } from '../Card/Card';
import styles from './GolfBoard.module.css';

interface GolfBoardProps {
  game: GolfGameState;
  cardBackImage?: string | null;
  onTapCard: (colIndex: number) => void;
  onDraw: () => void;
}

export const GolfBoard: React.FC<GolfBoardProps> = ({
  game,
  cardBackImage,
  onTapCard,
  onDraw,
}) => {
  const wasteTop =
    game.waste.length > 0 ? game.waste[game.waste.length - 1] : null;

  // Stable callback — uses column index
  const handleTapColumn = useCallback(
    (colIndex: number) => {
      if (game.tableau[colIndex].length > 0) {
        onTapCard(colIndex);
      }
    },
    [onTapCard, game.tableau],
  );

  return (
    <div className={styles.board}>
      {/* Cards remaining indicator */}
      <div className={styles.remainingBadge}>
        <span className={styles.remainingCount}>{game.cardsRemaining}</span>{' '}
        cards remaining
      </div>

      {/* Tableau — 7 columns */}
      <div className={styles.tableau}>
        {game.tableau.map((column, colIdx) => (
          <div key={colIdx} className={styles.column}>
            {column.length === 0 ? (
              <div className={styles.emptyColumn} />
            ) : (
              column.map((card, cardIdx) => {
                const isBottom = cardIdx === column.length - 1;
                return (
                  <div
                    key={card.id}
                    className={`${styles.columnCard} ${isBottom ? styles.exposed : ''}`}
                  >
                    <Card
                      card={card}
                      cardIndex={colIdx}
                      onTapCard={isBottom ? handleTapColumn : undefined}
                      cardBackImage={cardBackImage}
                    />
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      {/* Stock + Waste */}
      <div className={styles.bottomRow}>
        <div className={styles.stockPile} onClick={onDraw}>
          {game.stock.length > 0 ? (
            <Card
              card={{ ...game.stock[game.stock.length - 1], faceUp: false }}
              cardBackImage={cardBackImage}
            />
          ) : (
            <EmptyPile />
          )}
          {game.stock.length > 0 && (
            <span className={styles.stockCount}>{game.stock.length}</span>
          )}
        </div>

        <div className={styles.wastePile}>
          {wasteTop ? <Card card={wasteTop} /> : <EmptyPile />}
        </div>
      </div>
    </div>
  );
};

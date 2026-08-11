import React, { useMemo, useCallback } from 'react';
import type { PyramidGameState } from '../../logic/types';
import { PYRAMID_POSITIONS } from '../../logic/pyramid/layout';
import { isUncovered } from '../../logic/pyramid/rules';
import { Card, EmptyPile } from '../Card/Card';
import styles from './PyramidBoard.module.css';

interface PyramidBoardProps {
  game: PyramidGameState;
  cardBackImage?: string | null;
  onTapPyramid: (pyramidIndex: number) => void;
  onTapWaste: () => void;
  onDraw: () => void;
}

export const PyramidBoard: React.FC<PyramidBoardProps> = ({
  game,
  cardBackImage,
  onTapPyramid,
  onTapWaste,
  onDraw,
}) => {
  const wasteTop =
    game.waste.length > 0 ? game.waste[game.waste.length - 1] : null;

  // Pre-compute uncovered status for all cards once per render
  const uncoveredFlags = useMemo(
    () => game.pyramid.map((card, idx) => !card.removed && isUncovered(idx, game.pyramid)),
    [game.pyramid],
  );

  // Stable callback — Card uses cardIndex + onTapCard pattern
  const handleTapCard = useCallback(
    (idx: number) => {
      if (uncoveredFlags[idx]) onTapPyramid(idx);
    },
    [onTapPyramid, uncoveredFlags],
  );

  // Is waste top selected?
  const wasteSelected = game.selectedIndex === -1;

  return (
    <div className={styles.board}>
      {/* Cards remaining indicator */}
      <div className={styles.remainingBadge}>
        <span className={styles.remainingCount}>{game.cardsRemaining}</span>{' '}
        cards remaining
      </div>

      {/* Pyramid */}
      <div className={styles.pyramid}>
        {game.pyramid.map((card, idx) => {
          if (card.removed) {
            return (
              <div
                key={idx}
                className={styles.pyramidSlot}
                style={{
                  gridRow: PYRAMID_POSITIONS[idx].row + 1,
                  gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
                }}
              />
            );
          }

          const uncovered = uncoveredFlags[idx];
          const isSelected = game.selectedIndex === idx;

          return (
            <div
              key={idx}
              className={`${styles.pyramidSlot} ${uncovered ? styles.uncovered : ''} ${isSelected ? styles.selected : ''}`}
              style={{
                gridRow: PYRAMID_POSITIONS[idx].row + 1,
                gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
              }}
            >
              <Card
                card={card}
                cardIndex={idx}
                onTapCard={uncovered ? handleTapCard : undefined}
                cardBackImage={cardBackImage}
              />
            </div>
          );
        })}
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

        <div
          className={`${styles.wastePile} ${wasteSelected ? styles.selected : ''}`}
          onClick={onTapWaste}
        >
          {wasteTop ? <Card card={wasteTop} /> : <EmptyPile />}
        </div>
      </div>
    </div>
  );
};

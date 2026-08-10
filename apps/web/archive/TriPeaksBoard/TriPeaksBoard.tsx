import React, { useMemo, useCallback } from 'react';
import type { TriPeaksGameState } from '../../logic/types';
import { PYRAMID_POSITIONS } from '../../logic/tripeaks/layout';
import { isExposed } from '../../logic/tripeaks/rules';
import { Card, EmptyPile } from '../Card/Card';
import styles from './TriPeaksBoard.module.css';

interface TriPeaksBoardProps {
  game: TriPeaksGameState;
  cardBackImage?: string | null;
  onTapCard: (pyramidIndex: number) => void;
  onDraw: () => void;
}

export const TriPeaksBoard: React.FC<TriPeaksBoardProps> = ({
  game,
  cardBackImage,
  onTapCard,
  onDraw,
}) => {
  const wasteTop =
    game.waste.length > 0 ? game.waste[game.waste.length - 1] : null;

  // Pre-compute exposed status for all cards once per render
  const exposedFlags = useMemo(
    () => game.pyramid.map((card, idx) => !card.removed && isExposed(idx, game.pyramid)),
    [game.pyramid],
  );

  // Stable callback — Card uses cardIndex + onTapCard pattern
  const handleTapCard = useCallback(
    (idx: number) => {
      if (exposedFlags[idx]) onTapCard(idx);
    },
    [onTapCard, exposedFlags],
  );

  return (
    <div className={styles.board}>
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

          const exposed = exposedFlags[idx];

          return (
            <div
              key={idx}
              className={`${styles.pyramidSlot} ${exposed ? styles.exposed : ''}`}
              style={{
                gridRow: PYRAMID_POSITIONS[idx].row + 1,
                gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
              }}
            >
              <Card
                card={card}
                cardIndex={idx}
                onTapCard={exposed ? handleTapCard : undefined}
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

        <div className={styles.wastePile}>
          {wasteTop ? (
            <Card card={wasteTop} />
          ) : (
            <EmptyPile />
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useCallback } from 'react';
import type { Card as CardType } from '../../logic/types';
import { Card, EmptyPile } from '../Card/Card';
import styles from './Piles.module.css';

interface TableauPileProps {
  cards: CardType[];
  pileIndex: number;
  onCardTap: (pileIndex: number, cardIndex: number) => void;
  cardBackImage?: string | null;
}

export const TableauPile: React.FC<TableauPileProps> = ({
  cards,
  pileIndex,
  onCardTap,
  cardBackImage,
}) => {
  // Stable callback: bind pileIndex once, Card passes cardIndex via onTapCard
  const handleTap = useCallback(
    (cardIndex: number) => onCardTap(pileIndex, cardIndex),
    [onCardTap, pileIndex],
  );

  if (cards.length === 0) {
    return <EmptyPile />;
  }

  return (
    <div className={styles.tableauPile}>
      {cards.map((card, idx) => (
        <div
          key={card.id}
          className={styles.tableauCard}
          style={{
            marginTop: idx === 0 ? 0 : card.faceUp ? `calc(-1 * var(--card-height) + var(--fan-offset-down))` : `calc(-1 * var(--card-height) + var(--fan-offset-up, 14px))`,
            zIndex: idx,
          }}
        >
          <Card
            card={card}
            cardIndex={idx}
            onTapCard={handleTap}
            cardBackImage={cardBackImage}
          />
        </div>
      ))}
    </div>
  );
};

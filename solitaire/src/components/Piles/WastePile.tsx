import React from 'react';
import type { Card as CardType } from '../../logic/types';
import { Card, EmptyPile } from '../Card/Card';
import styles from './Piles.module.css';

interface WastePileProps {
  waste: CardType[];
  onTap: () => void;
  drawCount?: 1 | 3;
}

export const WastePile: React.FC<WastePileProps> = ({ waste, onTap, drawCount = 1 }) => {
  if (waste.length === 0) {
    return <EmptyPile />;
  }

  // Draw-1: show only the top card
  if (drawCount === 1) {
    const topCard = waste[waste.length - 1];
    return <Card card={{ ...topCard, faceUp: true }} onClick={onTap} />;
  }

  // Draw-3: show up to 3 fanned cards, only top is clickable
  const fanCards = waste.slice(-3);

  return (
    <div className={styles.wasteFan}>
      {fanCards.map((card, i) => {
        const isTop = i === fanCards.length - 1;
        return (
          <div
            key={card.id}
            className={styles.wasteFanCard}
            style={{ '--fan-index': i } as React.CSSProperties}
          >
            <Card
              card={{ ...card, faceUp: true }}
              onClick={isTop ? onTap : undefined}
            />
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import type { Card as CardType } from '../../logic/types';
import { Card } from '../Card/Card';
import styles from './Piles.module.css';

interface StockPileProps {
  stock: CardType[];
  onDraw: () => void;
  cardBackImage?: string | null;
}

export const StockPile: React.FC<StockPileProps> = ({ stock, onDraw, cardBackImage }) => {
  if (stock.length === 0) {
    return (
      <div
        className={styles.refreshIcon}
        onClick={onDraw}
        role="button"
        aria-label="Recycle waste pile"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onDraw()}
      >
        ↻
      </div>
    );
  }

  return (
    <div className={styles.stockPile}>
      <Card
        card={{ ...stock[stock.length - 1], faceUp: false }}
        onClick={onDraw}
        cardBackImage={cardBackImage}
      />
    </div>
  );
};

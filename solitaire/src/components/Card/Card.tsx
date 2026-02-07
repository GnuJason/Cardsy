import React from 'react';
import type { Card as CardType } from '../../logic/types';
import { suitColor, SUIT_SYMBOLS, RANK_LABELS } from '../../logic/types';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  style?: React.CSSProperties;
  cardBackImage?: string | null;
}

export const Card: React.FC<CardProps> = React.memo(
  ({ card, onClick, style, cardBackImage }) => {
    if (!card.faceUp) {
      return (
        <div
          className={styles.card}
          style={style}
          onClick={onClick}
          role="button"
          aria-label="Face-down card"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        >
          <div className={styles.back}>
            {cardBackImage ? (
              <img
                src={cardBackImage}
                alt=""
                className={styles.backImage}
                draggable={false}
              />
            ) : (
              <div className={styles.backPattern} />
            )}
          </div>
        </div>
      );
    }

    const color = suitColor(card.suit);
    const colorClass = color === 'red' ? styles.red : styles.black;
    const symbol = SUIT_SYMBOLS[card.suit];
    const rankLabel = RANK_LABELS[card.rank];

    return (
      <div
        className={styles.card}
        style={style}
        onClick={onClick}
        role="button"
        aria-label={`${rankLabel} of ${card.suit}`}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        <div className={styles.face}>
          <div className={`${styles.topLabel} ${colorClass}`}>
            <span className={styles.rank}>{rankLabel}</span>
            <span className={styles.suit}>{symbol}</span>
          </div>
          <div className={`${styles.centerPip} ${colorClass}`}>{symbol}</div>
          <div className={`${styles.bottomLabel} ${colorClass}`}>
            <span className={styles.rank}>{rankLabel}</span>
            <span className={styles.suit}>{symbol}</span>
          </div>
        </div>
      </div>
    );
  },
);

Card.displayName = 'Card';

// ── Empty Pile Placeholder ──────────────────────────────────

interface EmptyPileProps {
  onClick?: () => void;
  suitSymbol?: string;
}

export const EmptyPile: React.FC<EmptyPileProps> = ({ onClick, suitSymbol }) => {
  if (suitSymbol) {
    return (
      <div
        className={styles.emptyFoundation}
        onClick={onClick}
        role="button"
        aria-label={`Empty foundation for ${suitSymbol}`}
        tabIndex={0}
      >
        {suitSymbol}
      </div>
    );
  }

  return (
    <div
      className={styles.empty}
      onClick={onClick}
      role="button"
      aria-label="Empty pile"
      tabIndex={0}
    />
  );
};

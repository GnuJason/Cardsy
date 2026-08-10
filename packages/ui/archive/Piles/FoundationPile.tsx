import React from 'react';
import type { Card as CardType } from '../../logic/types';
import { SUIT_SYMBOLS, SUITS } from '../../logic/types';
import { Card, EmptyPile } from '../Card/Card';

interface FoundationPileProps {
  cards: CardType[];
  suitIndex: number;
  onTap: () => void;
}

export const FoundationPile: React.FC<FoundationPileProps> = ({
  cards,
  suitIndex,
  onTap,
}) => {
  const suitSymbol = SUIT_SYMBOLS[SUITS[suitIndex]];

  if (cards.length === 0) {
    return <EmptyPile suitSymbol={suitSymbol} onClick={onTap} />;
  }

  const topCard = cards[cards.length - 1];
  return <Card card={{ ...topCard, faceUp: true }} onClick={onTap} />;
};

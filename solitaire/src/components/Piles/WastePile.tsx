import React from 'react';
import type { Card as CardType } from '../../logic/types';
import { Card, EmptyPile } from '../Card/Card';

interface WastePileProps {
  waste: CardType[];
  onTap: () => void;
}

export const WastePile: React.FC<WastePileProps> = ({ waste, onTap }) => {
  if (waste.length === 0) {
    return <EmptyPile />;
  }

  const topCard = waste[waste.length - 1];

  return (
    <Card card={{ ...topCard, faceUp: true }} onClick={onTap} />
  );
};

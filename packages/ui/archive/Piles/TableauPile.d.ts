import React from 'react';
import type { Card as CardType } from '../../logic/types';
interface TableauPileProps {
    cards: CardType[];
    pileIndex: number;
    onCardTap: (pileIndex: number, cardIndex: number) => void;
    cardBackImage?: string | null;
}
export declare const TableauPile: React.FC<TableauPileProps>;
export {};

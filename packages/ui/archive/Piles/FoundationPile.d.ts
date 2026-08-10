import React from 'react';
import type { Card as CardType } from '../../logic/types';
interface FoundationPileProps {
    cards: CardType[];
    suitIndex: number;
    onTap: () => void;
}
export declare const FoundationPile: React.FC<FoundationPileProps>;
export {};

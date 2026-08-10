import React from 'react';
import type { Card as CardType } from '../../logic/types';
interface StockPileProps {
    stock: CardType[];
    onDraw: () => void;
    cardBackImage?: string | null;
}
export declare const StockPile: React.FC<StockPileProps>;
export {};

import React from 'react';
import type { Card as CardType } from '../../logic/types';
interface CardProps {
    card: CardType;
    onClick?: () => void;
    /** Stable callback pattern: pass index + handler separately to avoid inline closures */
    cardIndex?: number;
    onTapCard?: (index: number) => void;
    style?: React.CSSProperties;
    cardBackImage?: string | null;
}
export declare const Card: React.FC<CardProps>;
interface EmptyPileProps {
    onClick?: () => void;
    suitSymbol?: string;
}
export declare const EmptyPile: React.FC<EmptyPileProps>;
export {};

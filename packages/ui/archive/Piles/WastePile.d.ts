import React from 'react';
import type { Card as CardType } from '../../logic/types';
interface WastePileProps {
    waste: CardType[];
    onTap: () => void;
    drawCount?: 1 | 3;
}
export declare const WastePile: React.FC<WastePileProps>;
export {};

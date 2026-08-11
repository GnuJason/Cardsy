import React from 'react';
import type { GolfGameState } from '../../logic/types';
interface GolfBoardProps {
    game: GolfGameState;
    cardBackImage?: string | null;
    onTapCard: (colIndex: number) => void;
    onDraw: () => void;
}
export declare const GolfBoard: React.FC<GolfBoardProps>;
export {};

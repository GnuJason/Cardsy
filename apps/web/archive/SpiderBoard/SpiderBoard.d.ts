import React from 'react';
import type { SpiderGameState } from '../../logic/types';
interface SpiderBoardProps {
    game: SpiderGameState;
    cardBackImage?: string | null;
    onTapColumn: (colIndex: number, cardIndex: number) => void;
    onTapStock: () => void;
}
export declare const SpiderBoard: React.FC<SpiderBoardProps>;
export {};

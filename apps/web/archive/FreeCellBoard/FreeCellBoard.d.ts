import React from 'react';
import type { FreeCellGameState } from '../../logic/types';
interface FreeCellBoardProps {
    game: FreeCellGameState;
    cardBackImage?: string | null;
    onTapColumn: (colIndex: number, cardIndex: number) => void;
    onTapFreeCell: (cellIndex: number) => void;
    onTapFoundation: (foundIndex: number) => void;
}
export declare const FreeCellBoard: React.FC<FreeCellBoardProps>;
export {};

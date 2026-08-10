import React from 'react';
import type { GameState } from '../../logic/types';
interface GameBoardProps {
    game: GameState;
    cardBackImage?: string | null;
    drawCount?: 1 | 3;
    onDraw: () => void;
    onTapWaste: () => void;
    onTapTableau: (pileIndex: number, cardIndex: number) => void;
    onTapFoundation: (pileIndex: number) => void;
}
export declare const GameBoard: React.FC<GameBoardProps>;
export {};

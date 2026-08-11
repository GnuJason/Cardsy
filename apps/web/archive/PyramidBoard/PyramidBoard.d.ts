import React from 'react';
import type { PyramidGameState } from '../../logic/types';
interface PyramidBoardProps {
    game: PyramidGameState;
    cardBackImage?: string | null;
    onTapPyramid: (pyramidIndex: number) => void;
    onTapWaste: () => void;
    onDraw: () => void;
}
export declare const PyramidBoard: React.FC<PyramidBoardProps>;
export {};

import React from 'react';
import type { TriPeaksGameState } from '../../logic/types';
interface TriPeaksBoardProps {
    game: TriPeaksGameState;
    cardBackImage?: string | null;
    onTapCard: (pyramidIndex: number) => void;
    onDraw: () => void;
}
export declare const TriPeaksBoard: React.FC<TriPeaksBoardProps>;
export {};

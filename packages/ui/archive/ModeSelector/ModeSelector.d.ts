import React from 'react';
import type { GameMode, SavedKlondikeGame, SavedTriPeaksGame, SavedGolfGame, SavedPyramidGame, SavedFreeCellGame, SavedSpiderGame } from '../../logic/types';
interface ModeSelectorProps {
    onSelect: (mode: GameMode) => void;
    savedKlondike: SavedKlondikeGame | null;
    savedTriPeaks: SavedTriPeaksGame | null;
    savedGolf: SavedGolfGame | null;
    savedPyramid: SavedPyramidGame | null;
    savedFreeCell: SavedFreeCellGame | null;
    savedSpider: SavedSpiderGame | null;
    onContinue: (mode: GameMode) => void;
}
export declare const ModeSelector: React.FC<ModeSelectorProps>;
export {};

import React from 'react';
interface HUDProps {
    score: number;
    moves: number;
    elapsed: number;
    canUndo: boolean;
    canAutoComplete?: boolean;
    onUndo: () => void;
    onNewGame: () => void;
    onAutoComplete?: () => void;
    onSettings: () => void;
    onStats?: () => void;
    onChangeMode?: () => void;
    onAchievements?: () => void;
}
export declare const HUD: React.FC<HUDProps>;
export {};

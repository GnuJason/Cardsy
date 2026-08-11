import React from 'react';
import type { GameModeStats } from '../logic/types';
import type { PixiThemeColors } from '../pixi/types';
interface KlondikeScreenProps {
    cardBackImage: string | null;
    themeColors: PixiThemeColors;
    modeStats: GameModeStats;
    drawCount: 1 | 3;
    reducedMotion: boolean;
    highContrast: boolean;
    cardScale: string;
    onRecordStart: () => void;
    onRecordWin: (score: number, time: number) => void;
    onRecordLoss: () => void;
    onChangeMode: () => void;
    onShowSettings: () => void;
    onShowStats: () => void;
    onShowAchievements: () => void;
    onWin: (elapsed: number, usedUndo: boolean) => void;
}
export declare const KlondikeScreen: React.FC<KlondikeScreenProps>;
export {};

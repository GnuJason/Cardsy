import React from 'react';
import type { AllStats, GameMode } from '../../logic/types';
interface StatsModalProps {
    stats: AllStats;
    currentMode: GameMode;
    onResetStats: (mode: GameMode) => void;
    onClose: () => void;
}
export declare const StatsModal: React.FC<StatsModalProps>;
export {};

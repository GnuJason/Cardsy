import React from 'react';
import type { GameModeStats } from '../../logic/types';
/** Stat line shown in the win modal */
interface StatLine {
    label: string;
    value: string | number;
    highlight?: boolean;
}
interface WinModalProps {
    onNewGame: () => void;
    modeStats?: GameModeStats;
    elapsed: number;
    moves: number;
    bestScore: number | null;
    /** Game-mode specific stat lines to display. If omitted, defaults to Klondike-style scoring. */
    statLines?: StatLine[];
    /** Override the "new best" check logic. If omitted, uses score-based comparison. */
    isNewBest?: boolean;
    /** For Klondike/TriPeaks: base score (timer bonus is computed automatically) */
    score?: number;
    /** Whether to show timer bonus (Klondike/TriPeaks style scoring) */
    showTimerBonus?: boolean;
}
export declare const WinModal: React.FC<WinModalProps>;
export {};

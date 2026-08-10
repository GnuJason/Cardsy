import type { GameMode, AllStats } from '../logic/types';
export declare function useGameStats(): {
    stats: AllStats;
    recordGameStart: (mode: GameMode) => void;
    recordWin: (mode: GameMode, score: number, timeSeconds: number) => void;
    recordLoss: (mode: GameMode) => void;
    resetStats: (mode: GameMode) => void;
};

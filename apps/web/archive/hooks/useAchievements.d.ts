import type { UnlockedAchievement, AllStats, GameMode, TriPeaksGameState } from '../logic/types';
export interface AchievementToastData {
    id: string;
    name: string;
    icon: string;
    tier?: number;
}
export declare function useAchievements(): {
    unlocked: UnlockedAchievement[];
    toastQueue: AchievementToastData[];
    dismissToast: () => void;
    checkOnWin: (stats: AllStats, mode: GameMode, elapsed: number, usedUndo: boolean, usedStock: boolean, peaksClearedInStreak: boolean, tripeaksState?: TriPeaksGameState) => void;
    checkOnGameStart: (stats: AllStats, mode: GameMode) => void;
};

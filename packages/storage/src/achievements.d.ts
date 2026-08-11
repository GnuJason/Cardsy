/**
 * Achievement definitions and checking logic.
 */
import type { AchievementDef, UnlockedAchievement, AllStats, GameMode, TriPeaksGameState } from './logic/types';
export declare const ACHIEVEMENTS: AchievementDef[];
export interface AchievementContext {
    stats: AllStats;
    mode: GameMode;
    elapsed: number;
    usedUndo: boolean;
    usedStock: boolean;
    peaksClearedInStreak: boolean;
    playDates: string[];
    tripeaksState?: TriPeaksGameState;
}
/**
 * Check all achievements and return newly unlocked ones.
 */
export declare function checkAchievements(ctx: AchievementContext, currentlyUnlocked: UnlockedAchievement[]): UnlockedAchievement[];
/**
 * Get the achievement definition by ID.
 */
export declare function getAchievementDef(id: string): AchievementDef | undefined;
/**
 * Get progress description for a tiered achievement.
 */
export declare function getTierProgress(def: AchievementDef, unlocked: UnlockedAchievement | undefined): {
    currentTier: number;
    nextTier: number | null;
    maxTier: number;
};

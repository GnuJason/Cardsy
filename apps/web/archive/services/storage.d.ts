import type { UserSettings, AllStats, GameMode, SavedKlondikeGame, SavedTriPeaksGame, SavedGolfGame, SavedPyramidGame, SavedFreeCellGame, SavedSpiderGame, SpiderDifficulty, UnlockedAchievement } from './logic/types';
export declare function getBestScore(): number | null;
export declare function setBestScore(score: number): void;
export declare function getSettings(): UserSettings;
export declare function setSettings(settings: UserSettings): void;
export declare function getSplashSeen(): boolean;
export declare function setSplashSeen(): void;
export declare function getStats(): AllStats;
export declare function setStats(stats: AllStats): void;
/**
 * One-time migration: move legacy `solitaire_best_score` into
 * the new per-mode stats structure as the Klondike best score.
 */
export declare function migrateFromLegacy(): void;
export declare function getGameMode(): GameMode;
export declare function setGameMode(mode: GameMode): void;
export declare function getSavedKlondikeGame(): SavedKlondikeGame | null;
export declare function setSavedKlondikeGame(save: SavedKlondikeGame): void;
export declare function clearSavedKlondikeGame(): void;
export declare function getSavedTriPeaksGame(): SavedTriPeaksGame | null;
export declare function setSavedTriPeaksGame(save: SavedTriPeaksGame): void;
export declare function clearSavedTriPeaksGame(): void;
export declare function getSavedGolfGame(): SavedGolfGame | null;
export declare function setSavedGolfGame(save: SavedGolfGame): void;
export declare function clearSavedGolfGame(): void;
export declare function getSavedPyramidGame(): SavedPyramidGame | null;
export declare function setSavedPyramidGame(save: SavedPyramidGame): void;
export declare function clearSavedPyramidGame(): void;
export declare function getSavedFreeCellGame(): SavedFreeCellGame | null;
export declare function setSavedFreeCellGame(save: SavedFreeCellGame): void;
export declare function clearSavedFreeCellGame(): void;
export declare function getSavedSpiderGame(): SavedSpiderGame | null;
export declare function setSavedSpiderGame(save: SavedSpiderGame): void;
export declare function clearSavedSpiderGame(): void;
export declare function getSpiderDifficulty(): SpiderDifficulty;
export declare function setSpiderDifficulty(difficulty: SpiderDifficulty): void;
export declare function getAchievements(): UnlockedAchievement[];
export declare function setAchievements(achievements: UnlockedAchievement[]): void;
export declare function getPlayDates(): string[];
export declare function recordPlayDate(): void;

import type {
  UserSettings,
  AllStats,
  GameModeStats,
  GameMode,
  SavedKlondikeGame,
  SavedTriPeaksGame,
  SavedGolfGame,
  SavedPyramidGame,
  SavedFreeCellGame,
  SavedSpiderGame,
  SpiderDifficulty,
  UnlockedAchievement,
} from '../logic/types';
import { DEFAULT_MODE_STATS } from '../logic/types';
import { DEFAULT_THEME_ID } from '../config/themes';

const KEYS = {
  bestScore: 'solitaire_best_score',
  settings: 'solitaire_settings',
  splashSeen: 'solitaire_splash_seen',
  stats: 'solitaire_stats',
  gameMode: 'solitaire_mode',
  savedKlondike: 'solitaire_saved_klondike',
  savedTripeaks: 'solitaire_saved_tripeaks',
  savedGolf: 'solitaire_saved_golf',
  savedPyramid: 'solitaire_saved_pyramid',
  savedFreeCell: 'solitaire_saved_freecell',
  savedSpider: 'solitaire_saved_spider',
  spiderDifficulty: 'solitaire_spider_difficulty',
  achievements: 'solitaire_achievements',
  playDates: 'solitaire_play_dates',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  reducedMotion: false,
  cardScale: 'medium',
  highContrast: false,
  cardBack: 'default.png',
  soundEnabled: true,
  theme: DEFAULT_THEME_ID,
  drawCount: 1,
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable — silent fail
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable — silent fail
  }
}

// ── Public API (backend-ready interface) ──

export function getBestScore(): number | null {
  const raw = safeGet(KEYS.bestScore);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setBestScore(score: number): void {
  safeSet(KEYS.bestScore, String(score));
}

export function getSettings(): UserSettings {
  const raw = safeGet(KEYS.settings);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = { ...parsed };
    if ('cardSize' in migrated && !('cardScale' in migrated)) {
      migrated.cardScale = migrated.cardSize;
      delete migrated.cardSize;
    }
    if (!('highContrast' in migrated)) {
      migrated.highContrast = DEFAULT_SETTINGS.highContrast;
    }

    return {
      reducedMotion: typeof migrated.reducedMotion === 'boolean' ? migrated.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      cardScale: ['small', 'medium', 'large', 'xlarge'].includes(String(migrated.cardScale))
        ? (migrated.cardScale as UserSettings['cardScale'])
        : DEFAULT_SETTINGS.cardScale,
      highContrast: typeof migrated.highContrast === 'boolean' ? migrated.highContrast : DEFAULT_SETTINGS.highContrast,
      cardBack: typeof migrated.cardBack === 'string' ? migrated.cardBack : DEFAULT_SETTINGS.cardBack,
      soundEnabled: typeof migrated.soundEnabled === 'boolean' ? migrated.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      theme: typeof migrated.theme === 'string' ? migrated.theme : DEFAULT_SETTINGS.theme,
      drawCount: migrated.drawCount === 1 || migrated.drawCount === 3 ? migrated.drawCount : DEFAULT_SETTINGS.drawCount,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setSettings(settings: UserSettings): void {
  safeSet(KEYS.settings, JSON.stringify(settings));
}

export function getSplashSeen(): boolean {
  return safeGet(KEYS.splashSeen) === 'true';
}

export function setSplashSeen(): void {
  safeSet(KEYS.splashSeen, 'true');
}

// ── Statistics ──────────────────────────────────────────────

const DEFAULT_ALL_STATS: AllStats = {
  klondike: { ...DEFAULT_MODE_STATS },
  tripeaks: { ...DEFAULT_MODE_STATS },
  golf: { ...DEFAULT_MODE_STATS },
  pyramid: { ...DEFAULT_MODE_STATS },
  freecell: { ...DEFAULT_MODE_STATS },
  spider: { ...DEFAULT_MODE_STATS },
};

function validateModeStats(raw: unknown): GameModeStats {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_MODE_STATS };
  const obj = raw as Record<string, unknown>;
  return {
    bestScore:
      typeof obj.bestScore === 'number' && Number.isFinite(obj.bestScore)
        ? obj.bestScore
        : null,
    bestTime:
      typeof obj.bestTime === 'number' && Number.isFinite(obj.bestTime)
        ? obj.bestTime
        : null,
    currentWinStreak:
      typeof obj.currentWinStreak === 'number' ? obj.currentWinStreak : 0,
    bestWinStreak:
      typeof obj.bestWinStreak === 'number' ? obj.bestWinStreak : 0,
    totalWins: typeof obj.totalWins === 'number' ? obj.totalWins : 0,
    totalGamesPlayed:
      typeof obj.totalGamesPlayed === 'number' ? obj.totalGamesPlayed : 0,
  };
}

export function getStats(): AllStats {
  const raw = safeGet(KEYS.stats);
  if (!raw) return { ...DEFAULT_ALL_STATS, klondike: { ...DEFAULT_MODE_STATS }, tripeaks: { ...DEFAULT_MODE_STATS }, golf: { ...DEFAULT_MODE_STATS }, pyramid: { ...DEFAULT_MODE_STATS }, freecell: { ...DEFAULT_MODE_STATS }, spider: { ...DEFAULT_MODE_STATS } };
  try {
    const parsed = JSON.parse(raw);
    return {
      klondike: validateModeStats(parsed?.klondike),
      tripeaks: validateModeStats(parsed?.tripeaks),
      golf: validateModeStats(parsed?.golf),
      pyramid: validateModeStats(parsed?.pyramid),
      freecell: validateModeStats(parsed?.freecell),
      spider: validateModeStats(parsed?.spider),
    };
  } catch {
    return { klondike: { ...DEFAULT_MODE_STATS }, tripeaks: { ...DEFAULT_MODE_STATS }, golf: { ...DEFAULT_MODE_STATS }, pyramid: { ...DEFAULT_MODE_STATS }, freecell: { ...DEFAULT_MODE_STATS }, spider: { ...DEFAULT_MODE_STATS } };
  }
}

export function setStats(stats: AllStats): void {
  safeSet(KEYS.stats, JSON.stringify(stats));
}

/**
 * One-time migration: move legacy `solitaire_best_score` into
 * the new per-mode stats structure as the Klondike best score.
 */
export function migrateFromLegacy(): void {
  const legacyScore = safeGet(KEYS.bestScore);
  if (legacyScore === null) return;

  const score = Number(legacyScore);
  if (!Number.isFinite(score)) {
    safeRemove(KEYS.bestScore);
    return;
  }

  const stats = getStats();
  if (stats.klondike.bestScore === null || score > stats.klondike.bestScore) {
    stats.klondike.bestScore = score;
  }
  setStats(stats);
  safeRemove(KEYS.bestScore);
}

// ── Game Mode Persistence ───────────────────────────────────

export function getGameMode(): GameMode {
  const raw = safeGet(KEYS.gameMode);
  if (raw === 'klondike' || raw === 'tripeaks' || raw === 'golf' || raw === 'pyramid' || raw === 'freecell' || raw === 'spider') return raw;
  return 'klondike';
}

export function setGameMode(mode: GameMode): void {
  safeSet(KEYS.gameMode, mode);
}

// ── Saved Games (Continue Last Game) ────────────────────────

export function getSavedKlondikeGame(): SavedKlondikeGame | null {
  const raw = safeGet(KEYS.savedKlondike);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.state ||
      typeof parsed.state !== 'object' ||
      !Array.isArray(parsed.undoStack) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedKlondikeGame;
  } catch {
    return null;
  }
}

export function setSavedKlondikeGame(save: SavedKlondikeGame): void {
  safeSet(KEYS.savedKlondike, JSON.stringify(save));
}

export function clearSavedKlondikeGame(): void {
  safeRemove(KEYS.savedKlondike);
}

export function getSavedTriPeaksGame(): SavedTriPeaksGame | null {
  const raw = safeGet(KEYS.savedTripeaks);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.state ||
      typeof parsed.state !== 'object' ||
      !Array.isArray(parsed.undoStack) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedTriPeaksGame;
  } catch {
    return null;
  }
}

export function setSavedTriPeaksGame(save: SavedTriPeaksGame): void {
  safeSet(KEYS.savedTripeaks, JSON.stringify(save));
}

export function clearSavedTriPeaksGame(): void {
  safeRemove(KEYS.savedTripeaks);
}

// ── Golf Saved Game ─────────────────────────────────────────

export function getSavedGolfGame(): SavedGolfGame | null {
  const raw = safeGet(KEYS.savedGolf);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.state ||
      typeof parsed.state !== 'object' ||
      !Array.isArray(parsed.undoStack) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedGolfGame;
  } catch {
    return null;
  }
}

export function setSavedGolfGame(save: SavedGolfGame): void {
  safeSet(KEYS.savedGolf, JSON.stringify(save));
}

export function clearSavedGolfGame(): void {
  safeRemove(KEYS.savedGolf);
}

// ── Pyramid Saved Game ──────────────────────────────────────

export function getSavedPyramidGame(): SavedPyramidGame | null {
  const raw = safeGet(KEYS.savedPyramid);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.state ||
      typeof parsed.state !== 'object' ||
      !Array.isArray(parsed.undoStack) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedPyramidGame;
  } catch {
    return null;
  }
}

export function setSavedPyramidGame(save: SavedPyramidGame): void {
  safeSet(KEYS.savedPyramid, JSON.stringify(save));
}

export function clearSavedPyramidGame(): void {
  safeRemove(KEYS.savedPyramid);
}

// ── FreeCell Saved Game ─────────────────────────────────────

export function getSavedFreeCellGame(): SavedFreeCellGame | null {
  const raw = safeGet(KEYS.savedFreeCell);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.state ||
      typeof parsed.state !== 'object' ||
      !Array.isArray(parsed.undoStack) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedFreeCellGame;
  } catch {
    return null;
  }
}

export function setSavedFreeCellGame(save: SavedFreeCellGame): void {
  safeSet(KEYS.savedFreeCell, JSON.stringify(save));
}

export function clearSavedFreeCellGame(): void {
  safeRemove(KEYS.savedFreeCell);
}

// ── Spider Saved Game ───────────────────────────────────────

export function getSavedSpiderGame(): SavedSpiderGame | null {
  const raw = safeGet(KEYS.savedSpider);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.state ||
      typeof parsed.state !== 'object' ||
      !Array.isArray(parsed.undoStack) ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedSpiderGame;
  } catch {
    return null;
  }
}

export function setSavedSpiderGame(save: SavedSpiderGame): void {
  safeSet(KEYS.savedSpider, JSON.stringify(save));
}

export function clearSavedSpiderGame(): void {
  safeRemove(KEYS.savedSpider);
}

// ── Spider Difficulty Preference ────────────────────────────

export function getSpiderDifficulty(): SpiderDifficulty {
  const raw = safeGet(KEYS.spiderDifficulty);
  if (raw === '1' || raw === '2' || raw === '4') return Number(raw) as SpiderDifficulty;
  return 1;
}

export function setSpiderDifficulty(difficulty: SpiderDifficulty): void {
  safeSet(KEYS.spiderDifficulty, String(difficulty));
}

// ── Achievements ────────────────────────────────────────────

export function getAchievements(): UnlockedAchievement[] {
  const raw = safeGet(KEYS.achievements);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setAchievements(achievements: UnlockedAchievement[]): void {
  safeSet(KEYS.achievements, JSON.stringify(achievements));
}

// ── Play Dates (for Dedicated achievement) ──────────────────

export function getPlayDates(): string[] {
  const raw = safeGet(KEYS.playDates);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordPlayDate(): void {
  const today = new Date().toISOString().slice(0, 10);
  const dates = getPlayDates();
  if (!dates.includes(today)) {
    // Keep only last 30 days to prevent unbounded growth
    const updated = [...dates, today].slice(-30);
    safeSet(KEYS.playDates, JSON.stringify(updated));
  }
}

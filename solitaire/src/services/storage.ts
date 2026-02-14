import type {
  UserSettings,
  AllStats,
  GameModeStats,
  GameMode,
  SavedKlondikeGame,
  SavedTriPeaksGame,
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
  achievements: 'solitaire_achievements',
  playDates: 'solitaire_play_dates',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  reducedMotion: false,
  cardSize: 'medium',
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
    const parsed = JSON.parse(raw);
    return {
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
      cardSize: ['small', 'medium', 'large'].includes(parsed.cardSize) ? parsed.cardSize : DEFAULT_SETTINGS.cardSize,
      cardBack: typeof parsed.cardBack === 'string' ? parsed.cardBack : DEFAULT_SETTINGS.cardBack,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      theme: typeof parsed.theme === 'string' ? parsed.theme : DEFAULT_SETTINGS.theme,
      drawCount: parsed.drawCount === 1 || parsed.drawCount === 3 ? parsed.drawCount : DEFAULT_SETTINGS.drawCount,
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
  if (!raw) return { ...DEFAULT_ALL_STATS, klondike: { ...DEFAULT_MODE_STATS }, tripeaks: { ...DEFAULT_MODE_STATS } };
  try {
    const parsed = JSON.parse(raw);
    return {
      klondike: validateModeStats(parsed?.klondike),
      tripeaks: validateModeStats(parsed?.tripeaks),
    };
  } catch {
    return { klondike: { ...DEFAULT_MODE_STATS }, tripeaks: { ...DEFAULT_MODE_STATS } };
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
  if (raw === 'klondike' || raw === 'tripeaks') return raw;
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
    return JSON.parse(raw) as SavedKlondikeGame;
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
    return JSON.parse(raw) as SavedTriPeaksGame;
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

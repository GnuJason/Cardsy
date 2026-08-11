/**
 * Achievement definitions and checking logic.
 */
import type { AchievementDef, UnlockedAchievement, AllStats, GameMode, TriPeaksGameState } from './logic/types';

// ── Definitions ─────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'klondike_first_win',
    name: 'First Win',
    description: 'Win your first Klondike game',
    icon: '🏅',
    mode: 'klondike',
  },
  {
    id: 'tripeaks_first_win',
    name: 'First Win',
    description: 'Win your first TriPeaks game',
    icon: '🏅',
    mode: 'tripeaks',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win any game in under 2 minutes',
    icon: '⚡',
    mode: 'global',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Win 5 games in a row (any mode)',
    icon: '🔥',
    mode: 'global',
    tiers: [5, 10],
  },
  {
    id: 'peak_destroyer',
    name: 'Peak Destroyer',
    description: 'Clear all 3 peaks in one streak (no stock draws between)',
    icon: '⛰️',
    mode: 'tripeaks',
  },
  {
    id: 'perfect_klondike',
    name: 'Perfect Game',
    description: 'Win a Klondike game without using undo',
    icon: '💎',
    mode: 'klondike',
  },
  {
    id: 'perfect_tripeaks',
    name: 'Perfect Game',
    description: 'Win a TriPeaks game without drawing from stock',
    icon: '💎',
    mode: 'tripeaks',
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Play 50 total games',
    icon: '🎖️',
    mode: 'global',
    tiers: [50, 100],
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Play on 7 consecutive days',
    icon: '📅',
    mode: 'global',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Win at least once in each game mode',
    icon: '🧭',
    mode: 'global',
  },
  {
    id: 'win_master',
    name: 'Win Master',
    description: 'Win 5 total games',
    icon: '👑',
    mode: 'global',
    tiers: [5, 25, 100],
  },
];

// ── Check context ───────────────────────────────────────────

export interface AchievementContext {
  stats: AllStats;
  mode: GameMode;
  elapsed: number;
  usedUndo: boolean; // for Klondike perfect game
  usedStock: boolean; // for TriPeaks perfect game — any stock draws?
  peaksClearedInStreak: boolean; // all 3 peaks cleared while streak > 0
  playDates: string[]; // ISO date strings e.g. "2026-02-14"
  tripeaksState?: TriPeaksGameState;
}

/**
 * Check all achievements and return newly unlocked ones.
 */
export function checkAchievements(
  ctx: AchievementContext,
  currentlyUnlocked: UnlockedAchievement[],
): UnlockedAchievement[] {
  const unlockedIds = new Map<string, UnlockedAchievement>();
  for (const u of currentlyUnlocked) {
    unlockedIds.set(u.id, u);
  }

  const newUnlocks: UnlockedAchievement[] = [];
  const now = Date.now();

  for (const def of ACHIEVEMENTS) {
    const existing = unlockedIds.get(def.id);

    if (def.tiers) {
      // Tiered: check if a higher tier was reached
      const currentTier = existing?.tier ?? 0;
      const value = getTieredValue(def.id, ctx);
      let reachedTier = currentTier;
      for (const threshold of def.tiers) {
        if (value >= threshold) {
          reachedTier = threshold;
        }
      }
      if (reachedTier > currentTier) {
        newUnlocks.push({ id: def.id, unlockedAt: now, tier: reachedTier });
      }
    } else {
      // Binary: check if newly unlocked
      if (existing) continue;
      if (isBinaryUnlocked(def.id, ctx)) {
        newUnlocks.push({ id: def.id, unlockedAt: now });
      }
    }
  }

  return newUnlocks;
}

function getTieredValue(id: string, ctx: AchievementContext): number {
  const totalGames = ctx.stats.klondike.totalGamesPlayed + ctx.stats.tripeaks.totalGamesPlayed;
  const totalWins = ctx.stats.klondike.totalWins + ctx.stats.tripeaks.totalWins;

  switch (id) {
    case 'streak_master':
      return Math.max(ctx.stats.klondike.currentWinStreak, ctx.stats.tripeaks.currentWinStreak);
    case 'centurion':
      return totalGames;
    case 'win_master':
      return totalWins;
    default:
      return 0;
  }
}

function isBinaryUnlocked(id: string, ctx: AchievementContext): boolean {
  switch (id) {
    case 'klondike_first_win':
      return ctx.stats.klondike.totalWins >= 1;
    case 'tripeaks_first_win':
      return ctx.stats.tripeaks.totalWins >= 1;
    case 'speed_demon':
      return ctx.elapsed > 0 && ctx.elapsed < 120;
    case 'peak_destroyer':
      return ctx.peaksClearedInStreak;
    case 'perfect_klondike':
      return ctx.mode === 'klondike' && !ctx.usedUndo;
    case 'perfect_tripeaks':
      return ctx.mode === 'tripeaks' && !ctx.usedStock;
    case 'dedicated':
      return hasConsecutiveDays(ctx.playDates, 7);
    case 'explorer':
      return ctx.stats.klondike.totalWins >= 1 && ctx.stats.tripeaks.totalWins >= 1;
    default:
      return false;
  }
}

/**
 * Check if the play dates include at least `count` consecutive days
 * up to and including today.
 */
function hasConsecutiveDays(dates: string[], count: number): boolean {
  if (dates.length < count) return false;
  const unique = [...new Set(dates)].sort().reverse(); // most recent first
  let streak = 1;
  for (let i = 1; i < unique.length && streak < count; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffMs = prev.getTime() - curr.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak >= count;
}

/**
 * Get the achievement definition by ID.
 */
export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get progress description for a tiered achievement.
 */
export function getTierProgress(
  def: AchievementDef,
  unlocked: UnlockedAchievement | undefined,
): { currentTier: number; nextTier: number | null; maxTier: number } {
  if (!def.tiers) return { currentTier: 0, nextTier: null, maxTier: 0 };
  const currentTier = unlocked?.tier ?? 0;
  const nextTier = def.tiers.find((t) => t > currentTier) ?? null;
  const maxTier = def.tiers[def.tiers.length - 1];
  return { currentTier, nextTier, maxTier };
}

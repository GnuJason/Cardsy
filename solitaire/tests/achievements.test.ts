import { describe, it, expect } from 'vitest';
import {
  checkAchievements,
  ACHIEVEMENTS,
  getAchievementDef,
  getTierProgress,
} from '../src/logic/achievements';
import type { AchievementContext } from '../src/logic/achievements';
import type { UnlockedAchievement } from '../src/logic/types';
import { DEFAULT_MODE_STATS } from '../src/logic/types';

function baseContext(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    stats: {
      klondike: { ...DEFAULT_MODE_STATS },
      tripeaks: { ...DEFAULT_MODE_STATS },
    },
    mode: 'klondike',
    elapsed: 300,
    usedUndo: false,
    usedStock: false,
    peaksClearedInStreak: false,
    playDates: [],
    ...overrides,
  };
}

describe('Achievement definitions', () => {
  it('has 11 achievements', () => {
    expect(ACHIEVEMENTS.length).toBe(11);
  });

  it('each achievement has unique id', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getAchievementDef finds by id', () => {
    const def = getAchievementDef('speed_demon');
    expect(def).toBeDefined();
    expect(def!.name).toBe('Speed Demon');
  });

  it('getAchievementDef returns undefined for unknown id', () => {
    expect(getAchievementDef('nonexistent')).toBeUndefined();
  });
});

describe('Binary achievement checks', () => {
  it('klondike_first_win unlocks on first Klondike win', () => {
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, totalWins: 1 },
        tripeaks: { ...DEFAULT_MODE_STATS },
      },
    });
    const unlocks = checkAchievements(ctx, []);
    const ids = unlocks.map((u) => u.id);
    expect(ids).toContain('klondike_first_win');
  });

  it('tripeaks_first_win unlocks on first TriPeaks win', () => {
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS },
        tripeaks: { ...DEFAULT_MODE_STATS, totalWins: 1 },
      },
      mode: 'tripeaks',
    });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('tripeaks_first_win');
  });

  it('speed_demon unlocks for wins under 2 minutes', () => {
    const ctx = baseContext({ elapsed: 90 });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('speed_demon');
  });

  it('speed_demon does NOT unlock for 2+ minutes', () => {
    const ctx = baseContext({ elapsed: 120 });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).not.toContain('speed_demon');
  });

  it('perfect_klondike unlocks when no undo used', () => {
    const ctx = baseContext({ mode: 'klondike', usedUndo: false });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('perfect_klondike');
  });

  it('perfect_klondike does NOT unlock when undo was used', () => {
    const ctx = baseContext({ mode: 'klondike', usedUndo: true });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).not.toContain('perfect_klondike');
  });

  it('perfect_tripeaks unlocks when no stock draws', () => {
    const ctx = baseContext({ mode: 'tripeaks', usedStock: false });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('perfect_tripeaks');
  });

  it('peak_destroyer unlocks when all peaks cleared in streak', () => {
    const ctx = baseContext({
      mode: 'tripeaks',
      peaksClearedInStreak: true,
    });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('peak_destroyer');
  });

  it('explorer unlocks when both modes have wins', () => {
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, totalWins: 1 },
        tripeaks: { ...DEFAULT_MODE_STATS, totalWins: 1 },
      },
    });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('explorer');
  });

  it('dedicated unlocks with 7 consecutive days', () => {
    const dates: string[] = [];
    const base = new Date('2026-02-14');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const ctx = baseContext({ playDates: dates });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).toContain('dedicated');
  });

  it('dedicated does NOT unlock with 6 consecutive days', () => {
    const dates: string[] = [];
    const base = new Date('2026-02-14');
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const ctx = baseContext({ playDates: dates });
    const unlocks = checkAchievements(ctx, []);
    expect(unlocks.map((u) => u.id)).not.toContain('dedicated');
  });
});

describe('Tiered achievement checks', () => {
  it('streak_master unlocks tier 5 when streak >= 5', () => {
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, currentWinStreak: 5 },
        tripeaks: { ...DEFAULT_MODE_STATS },
      },
    });
    const unlocks = checkAchievements(ctx, []);
    const sm = unlocks.find((u) => u.id === 'streak_master');
    expect(sm).toBeDefined();
    expect(sm!.tier).toBe(5);
  });

  it('streak_master upgrades from tier 5 to tier 10', () => {
    const existing: UnlockedAchievement[] = [
      { id: 'streak_master', unlockedAt: 1000, tier: 5 },
    ];
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, currentWinStreak: 10 },
        tripeaks: { ...DEFAULT_MODE_STATS },
      },
    });
    const unlocks = checkAchievements(ctx, existing);
    const sm = unlocks.find((u) => u.id === 'streak_master');
    expect(sm).toBeDefined();
    expect(sm!.tier).toBe(10);
  });

  it('streak_master does NOT re-unlock if already at same tier', () => {
    const existing: UnlockedAchievement[] = [
      { id: 'streak_master', unlockedAt: 1000, tier: 5 },
    ];
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, currentWinStreak: 5 },
        tripeaks: { ...DEFAULT_MODE_STATS },
      },
    });
    const unlocks = checkAchievements(ctx, existing);
    expect(unlocks.find((u) => u.id === 'streak_master')).toBeUndefined();
  });

  it('centurion unlocks at 50 total games', () => {
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, totalGamesPlayed: 30 },
        tripeaks: { ...DEFAULT_MODE_STATS, totalGamesPlayed: 20 },
      },
    });
    const unlocks = checkAchievements(ctx, []);
    const c = unlocks.find((u) => u.id === 'centurion');
    expect(c).toBeDefined();
    expect(c!.tier).toBe(50);
  });

  it('win_master progresses through tiers', () => {
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, totalWins: 30 },
        tripeaks: { ...DEFAULT_MODE_STATS, totalWins: 0 },
      },
    });
    const unlocks = checkAchievements(ctx, []);
    const wm = unlocks.find((u) => u.id === 'win_master');
    expect(wm).toBeDefined();
    expect(wm!.tier).toBe(25);
  });
});

describe('Already-unlocked binary achievements', () => {
  it('does not re-unlock already unlocked binary achievements', () => {
    const existing: UnlockedAchievement[] = [
      { id: 'klondike_first_win', unlockedAt: 1000 },
    ];
    const ctx = baseContext({
      stats: {
        klondike: { ...DEFAULT_MODE_STATS, totalWins: 5 },
        tripeaks: { ...DEFAULT_MODE_STATS },
      },
    });
    const unlocks = checkAchievements(ctx, existing);
    expect(unlocks.find((u) => u.id === 'klondike_first_win')).toBeUndefined();
  });
});

describe('getTierProgress', () => {
  it('returns correct progress for partially unlocked tiered achievement', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'win_master')!;
    const unlocked: UnlockedAchievement = { id: 'win_master', unlockedAt: 1000, tier: 25 };
    const progress = getTierProgress(def, unlocked);
    expect(progress.currentTier).toBe(25);
    expect(progress.nextTier).toBe(100);
    expect(progress.maxTier).toBe(100);
  });

  it('returns null nextTier when max reached', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'win_master')!;
    const unlocked: UnlockedAchievement = { id: 'win_master', unlockedAt: 1000, tier: 100 };
    const progress = getTierProgress(def, unlocked);
    expect(progress.nextTier).toBeNull();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide a localStorage mock for Node environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
import type { AllStats, GameModeStats } from '../src/logic/types';
import { DEFAULT_MODE_STATS } from '../src/logic/types';

// We test the storage functions directly (not the hook, which needs React)
import {
  getStats,
  setStats,
  migrateFromLegacy,
  getGameMode,
  setGameMode,
} from '../src/services/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('getStats / setStats', () => {
  it('returns defaults when nothing stored', () => {
    const stats = getStats();
    expect(stats.klondike).toEqual(DEFAULT_MODE_STATS);
    expect(stats.tripeaks).toEqual(DEFAULT_MODE_STATS);
  });

  it('persists and retrieves stats', () => {
    const stats: AllStats = {
      klondike: {
        bestScore: 500,
        bestTime: 120,
        currentWinStreak: 3,
        bestWinStreak: 5,
        totalWins: 10,
        totalGamesPlayed: 20,
      },
      tripeaks: { ...DEFAULT_MODE_STATS, totalGamesPlayed: 1 },
    };
    setStats(stats);
    const loaded = getStats();
    expect(loaded.klondike.bestScore).toBe(500);
    expect(loaded.klondike.bestTime).toBe(120);
    expect(loaded.klondike.currentWinStreak).toBe(3);
    expect(loaded.tripeaks.totalGamesPlayed).toBe(1);
  });

  it('recovers from corrupt JSON', () => {
    localStorage.setItem('solitaire_stats', 'not-json');
    const stats = getStats();
    expect(stats.klondike).toEqual(DEFAULT_MODE_STATS);
  });

  it('validates individual fields', () => {
    localStorage.setItem(
      'solitaire_stats',
      JSON.stringify({
        klondike: { bestScore: 'not-a-number', totalWins: 5 },
        tripeaks: null,
      }),
    );
    const stats = getStats();
    expect(stats.klondike.bestScore).toBeNull(); // invalid → null
    expect(stats.klondike.totalWins).toBe(5); // valid field preserved
    expect(stats.tripeaks).toEqual(DEFAULT_MODE_STATS); // null → defaults
  });
});

describe('migrateFromLegacy', () => {
  it('migrates solitaire_best_score to klondike.bestScore', () => {
    localStorage.setItem('solitaire_best_score', '1234');
    migrateFromLegacy();

    const stats = getStats();
    expect(stats.klondike.bestScore).toBe(1234);
    expect(localStorage.getItem('solitaire_best_score')).toBeNull();
  });

  it('does nothing when no legacy key exists', () => {
    migrateFromLegacy();
    const stats = getStats();
    expect(stats.klondike.bestScore).toBeNull();
  });

  it('removes corrupt legacy key without crashing', () => {
    localStorage.setItem('solitaire_best_score', 'garbage');
    migrateFromLegacy();
    expect(localStorage.getItem('solitaire_best_score')).toBeNull();
  });

  it('does not overwrite higher existing score', () => {
    const stats: AllStats = {
      klondike: { ...DEFAULT_MODE_STATS, bestScore: 9999 },
      tripeaks: { ...DEFAULT_MODE_STATS },
    };
    setStats(stats);
    localStorage.setItem('solitaire_best_score', '500');
    migrateFromLegacy();

    const loaded = getStats();
    expect(loaded.klondike.bestScore).toBe(9999);
  });
});

describe('getGameMode / setGameMode', () => {
  it('defaults to klondike', () => {
    expect(getGameMode()).toBe('klondike');
  });

  it('persists and retrieves mode', () => {
    setGameMode('tripeaks');
    expect(getGameMode()).toBe('tripeaks');
  });

  it('falls back to klondike for invalid values', () => {
    localStorage.setItem('solitaire_mode', 'invalid');
    expect(getGameMode()).toBe('klondike');
  });
});

describe('stats mutation patterns', () => {
  it('recordGameStart increments totalGamesPlayed', () => {
    const stats = getStats();
    stats.klondike.totalGamesPlayed += 1;
    setStats(stats);
    expect(getStats().klondike.totalGamesPlayed).toBe(1);
  });

  it('recordWin updates all win fields correctly', () => {
    const stats = getStats();
    const m = stats.klondike;
    m.totalWins += 1;
    m.totalGamesPlayed += 1;
    m.currentWinStreak += 1;
    if (m.currentWinStreak > m.bestWinStreak) m.bestWinStreak = m.currentWinStreak;
    m.bestScore = 500;
    m.bestTime = 120;
    setStats(stats);

    const loaded = getStats();
    expect(loaded.klondike.totalWins).toBe(1);
    expect(loaded.klondike.currentWinStreak).toBe(1);
    expect(loaded.klondike.bestWinStreak).toBe(1);
    expect(loaded.klondike.bestScore).toBe(500);
    expect(loaded.klondike.bestTime).toBe(120);
  });

  it('recordLoss resets currentWinStreak but not bestWinStreak', () => {
    const stats = getStats();
    stats.klondike.currentWinStreak = 5;
    stats.klondike.bestWinStreak = 5;
    setStats(stats);

    const updated = getStats();
    updated.klondike.currentWinStreak = 0;
    setStats(updated);

    const final = getStats();
    expect(final.klondike.currentWinStreak).toBe(0);
    expect(final.klondike.bestWinStreak).toBe(5);
  });

  it('resetStats resets one mode without affecting the other', () => {
    const stats = getStats();
    stats.klondike.totalWins = 10;
    stats.tripeaks.totalWins = 5;
    setStats(stats);

    const loaded = getStats();
    loaded.klondike = { ...DEFAULT_MODE_STATS };
    setStats(loaded);

    const final = getStats();
    expect(final.klondike.totalWins).toBe(0);
    expect(final.tripeaks.totalWins).toBe(5);
  });
});

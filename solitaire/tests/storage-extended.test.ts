import { describe, it, expect, beforeEach } from 'vitest';

// Provide a localStorage mock for Node environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import {
  getSettings,
  setSettings,
  getSavedKlondikeGame,
  setSavedKlondikeGame,
  clearSavedKlondikeGame,
  getSavedTriPeaksGame,
  setSavedTriPeaksGame,
  clearSavedTriPeaksGame,
  getAchievements,
  setAchievements,
  getPlayDates,
  recordPlayDate,
} from '../src/services/storage';
import type {
  SavedKlondikeGame,
  SavedTriPeaksGame,
  UnlockedAchievement,
  GameState,
  TriPeaksGameState,
} from '../src/logic/types';

beforeEach(() => {
  localStorage.clear();
});

// ── Settings ────────────────────────────────────────────────

describe('getSettings – new fields', () => {
  it('returns default soundEnabled and theme when nothing stored', () => {
    const s = getSettings();
    expect(s.soundEnabled).toBe(true);
    expect(s.theme).toBe('classic-green');
  });

  it('preserves soundEnabled and theme after round-trip', () => {
    const s = getSettings();
    s.soundEnabled = false;
    s.theme = 'midnight-blue';
    setSettings(s);
    const loaded = getSettings();
    expect(loaded.soundEnabled).toBe(false);
    expect(loaded.theme).toBe('midnight-blue');
  });

  it('falls back to defaults for corrupt soundEnabled', () => {
    localStorage.setItem('solitaire_settings', JSON.stringify({
      reducedMotion: false,
      cardSize: 'medium',
      cardBack: 'default.png',
      soundEnabled: 'NOT_BOOL',
      theme: 42,
    }));
    const s = getSettings();
    expect(s.soundEnabled).toBe(true);
    expect(s.theme).toBe('classic-green');
  });
});

// ── Saved Klondike Game ─────────────────────────────────────

describe('Saved Klondike game', () => {
  const fakeState: GameState = {
    stock: [],
    waste: [],
    tableau: [[], [], [], [], [], [], []],
    foundations: [[], [], [], []],
    score: 42,
    moves: 10,
    elapsedSeconds: 60,
    status: 'playing',
  };

  const saved: SavedKlondikeGame = {
    state: fakeState,
    undoStack: [fakeState],
    savedAt: Date.now(),
  };

  it('returns null when nothing saved', () => {
    expect(getSavedKlondikeGame()).toBeNull();
  });

  it('round-trips save/load', () => {
    setSavedKlondikeGame(saved);
    const loaded = getSavedKlondikeGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.state.score).toBe(42);
    expect(loaded!.undoStack.length).toBe(1);
  });

  it('clear removes the save', () => {
    setSavedKlondikeGame(saved);
    clearSavedKlondikeGame();
    expect(getSavedKlondikeGame()).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem('solitaire_saved_klondike', '{bad json');
    expect(getSavedKlondikeGame()).toBeNull();
  });
});

// ── Saved TriPeaks Game ─────────────────────────────────────

describe('Saved TriPeaks game', () => {
  const fakeState: TriPeaksGameState = {
    pyramid: [],
    stock: [],
    waste: [],
    score: 100,
    moves: 5,
    streak: 3,
    elapsedSeconds: 45,
    status: 'playing',
    peaksCleared: [true, false, false],
  };

  const saved: SavedTriPeaksGame = {
    state: fakeState,
    undoStack: [],
    savedAt: Date.now(),
  };

  it('returns null when nothing saved', () => {
    expect(getSavedTriPeaksGame()).toBeNull();
  });

  it('round-trips save/load', () => {
    setSavedTriPeaksGame(saved);
    const loaded = getSavedTriPeaksGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.state.score).toBe(100);
    expect(loaded!.state.peaksCleared).toEqual([true, false, false]);
  });

  it('clear removes the save', () => {
    setSavedTriPeaksGame(saved);
    clearSavedTriPeaksGame();
    expect(getSavedTriPeaksGame()).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem('solitaire_saved_tripeaks', '{garbage');
    expect(getSavedTriPeaksGame()).toBeNull();
  });
});

// ── Achievements ────────────────────────────────────────────

describe('Achievements storage', () => {
  it('returns empty array when nothing stored', () => {
    expect(getAchievements()).toEqual([]);
  });

  it('round-trips achievements', () => {
    const achievements: UnlockedAchievement[] = [
      { id: 'klondike_first_win', unlockedAt: 1000 },
      { id: 'win_master', unlockedAt: 2000, tier: 5 },
    ];
    setAchievements(achievements);
    const loaded = getAchievements();
    expect(loaded.length).toBe(2);
    expect(loaded[0].id).toBe('klondike_first_win');
    expect(loaded[1].tier).toBe(5);
  });

  it('returns empty array for corrupt JSON', () => {
    localStorage.setItem('solitaire_achievements', 'NOT_JSON');
    expect(getAchievements()).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    localStorage.setItem('solitaire_achievements', '{"id":"x"}');
    expect(getAchievements()).toEqual([]);
  });
});

// ── Play Dates ──────────────────────────────────────────────

describe('Play dates', () => {
  it('returns empty array when nothing stored', () => {
    expect(getPlayDates()).toEqual([]);
  });

  it('recordPlayDate adds today', () => {
    recordPlayDate();
    const dates = getPlayDates();
    const today = new Date().toISOString().slice(0, 10);
    expect(dates).toContain(today);
  });

  it('recordPlayDate does not duplicate same day', () => {
    recordPlayDate();
    recordPlayDate();
    const dates = getPlayDates();
    const today = new Date().toISOString().slice(0, 10);
    expect(dates.filter((d) => d === today).length).toBe(1);
  });

  it('returns empty array for corrupt JSON', () => {
    localStorage.setItem('solitaire_play_dates', '{bad}');
    expect(getPlayDates()).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    localStorage.setItem('solitaire_play_dates', '"single_string"');
    expect(getPlayDates()).toEqual([]);
  });
});

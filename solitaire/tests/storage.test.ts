import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Storage tests for the drawCount field introduced with Draw-3 mode.
 */

// Provide a localStorage mock for Node environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import { getSettings, setSettings } from '../src/services/storage';

// Wipe relevant keys before each test
beforeEach(() => {
  localStorageMock.clear();
});

describe('storage — drawCount setting', () => {
  it('defaults drawCount to 1 when no settings stored', () => {
    const s = getSettings();
    expect(s.drawCount).toBe(1);
  });

  it('round-trips drawCount = 3', () => {
    const s = getSettings();
    s.drawCount = 3;
    setSettings(s);

    const loaded = getSettings();
    expect(loaded.drawCount).toBe(3);
  });

  it('round-trips drawCount = 1', () => {
    const s = getSettings();
    s.drawCount = 1;
    setSettings(s);

    const loaded = getSettings();
    expect(loaded.drawCount).toBe(1);
  });

  it('falls back to 1 when drawCount is invalid number', () => {
    localStorage.setItem(
      'solitaire_settings',
      JSON.stringify({ drawCount: 5, reducedMotion: false, cardSize: 'medium', cardBack: 'default.png', soundEnabled: true, theme: 'classic' })
    );
    const s = getSettings();
    expect(s.drawCount).toBe(1);
  });

  it('falls back to 1 when drawCount is a string', () => {
    localStorage.setItem(
      'solitaire_settings',
      JSON.stringify({ drawCount: 'three', reducedMotion: false, cardSize: 'medium', cardBack: 'default.png', soundEnabled: true, theme: 'classic' })
    );
    const s = getSettings();
    expect(s.drawCount).toBe(1);
  });

  it('falls back to 1 when drawCount is missing from stored object', () => {
    localStorage.setItem(
      'solitaire_settings',
      JSON.stringify({ reducedMotion: false, cardSize: 'medium', cardBack: 'default.png', soundEnabled: true, theme: 'classic' })
    );
    const s = getSettings();
    expect(s.drawCount).toBe(1);
  });

  it('falls back to default settings when stored JSON is corrupt', () => {
    localStorage.setItem('solitaire_settings', 'NOT_VALID_JSON!!!');
    const s = getSettings();
    expect(s.drawCount).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME_ID, getThemeById } from '../src/config/themes';
import type { ThemeDef } from '../src/config/themes';

describe('Theme definitions', () => {
  it('has 4 preset themes', () => {
    expect(THEMES.length).toBe(4);
  });

  it('each theme has unique id', () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each theme has all required color keys', () => {
    const requiredKeys: (keyof ThemeDef['colors'])[] = [
      'felt', 'feltDark', 'hudBg', 'hudText', 'buttonBg',
      'buttonText', 'buttonHover', 'modalBg', 'modalOverlay', 'accent',
    ];
    for (const theme of THEMES) {
      for (const key of requiredKeys) {
        expect(theme.colors[key]).toBeDefined();
        expect(typeof theme.colors[key]).toBe('string');
      }
    }
  });

  it('each theme has a swatch color', () => {
    for (const theme of THEMES) {
      expect(theme.swatch).toBeDefined();
      expect(theme.swatch.length).toBeGreaterThan(0);
    }
  });

  it('DEFAULT_THEME_ID matches a known theme', () => {
    const found = THEMES.find((t) => t.id === DEFAULT_THEME_ID);
    expect(found).toBeDefined();
  });
});

describe('getThemeById', () => {
  it('returns the correct theme for a valid id', () => {
    const theme = getThemeById('midnight-blue');
    expect(theme.id).toBe('midnight-blue');
    expect(theme.name).toBe('Midnight Blue');
  });

  it('returns the first theme for an unknown id', () => {
    const theme = getThemeById('nonexistent');
    expect(theme.id).toBe(THEMES[0].id);
  });

  it('returns the default theme with classic-green id', () => {
    const theme = getThemeById('classic-green');
    expect(theme.name).toBe('Classic Green');
  });
});

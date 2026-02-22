import { describe, expect, it } from 'vitest';
import { THEMES } from '../../src/config/themes';
import { themeToPixiColors } from '../../src/pixi/ThemeAdapter';

describe('themeToPixiColors', () => {
  it.each(THEMES)('maps theme "$name" without NaN', (theme) => {
    const colors = themeToPixiColors(theme);
    expect(colors.feltColor).not.toBeNaN();
    expect(colors.cardBackground).not.toBeNaN();
    expect(colors.cardBorder).not.toBeNaN();
    expect(colors.redCardColor).not.toBeNaN();
    expect(colors.blackCardColor).not.toBeNaN();
    expect(colors.placeholderStroke).not.toBeNaN();
    expect(colors.placeholderAlpha).toBeGreaterThan(0);
  });

  it('returns integer hex values', () => {
    const colors = themeToPixiColors(THEMES[0]);
    expect(Number.isInteger(colors.feltColor)).toBe(true);
    expect(colors.feltColor).toBeGreaterThanOrEqual(0);
    expect(colors.feltColor).toBeLessThanOrEqual(0xffffff);
  });
});

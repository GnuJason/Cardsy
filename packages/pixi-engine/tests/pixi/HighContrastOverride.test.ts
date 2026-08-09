import { describe, expect, it } from 'vitest';
import { highContrastOverride } from '../../src/pixi/HighContrastOverride';
import { themeToPixiColors } from '../../src/pixi/ThemeAdapter';
import { THEMES } from '../../src/config/themes';

function luminance(hex: number): number {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg: number, bg: number): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('highContrastOverride', () => {
  it('red card vs white background ≥ 4.5:1', () => {
    const hc = highContrastOverride(themeToPixiColors(THEMES[0]));
    expect(contrastRatio(hc.redCardColor, hc.cardBackground)).toBeGreaterThanOrEqual(4.5);
  });

  it('black card vs white background ≥ 7:1 (AAA)', () => {
    const hc = highContrastOverride(themeToPixiColors(THEMES[0]));
    expect(contrastRatio(hc.blackCardColor, hc.cardBackground)).toBeGreaterThanOrEqual(7);
  });

  it('placeholder stroke vs felt ≥ 7:1', () => {
    const hc = highContrastOverride(themeToPixiColors(THEMES[0]));
    expect(contrastRatio(hc.placeholderStroke, hc.feltColor)).toBeGreaterThanOrEqual(7);
  });

  it('returns all-integer hex values', () => {
    const hc = highContrastOverride(themeToPixiColors(THEMES[0]));
    for (const val of Object.values(hc)) {
      if (typeof val === 'number') {
        expect(Number.isInteger(val)).toBe(true);
      }
    }
  });
});

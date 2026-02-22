import type { PixiThemeColors } from './types';

export function highContrastOverride(_base: PixiThemeColors): PixiThemeColors {
  return {
    feltColor: 0x000000,
    cardBackground: 0xffffff,
    cardBorder: 0x000000,
    redCardColor: 0xcc0000,
    blackCardColor: 0x000000,
    placeholderStroke: 0xffffff,
    placeholderAlpha: 1.0,
  };
}

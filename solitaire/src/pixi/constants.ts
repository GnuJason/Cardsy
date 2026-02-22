import type { PixiLayoutConfig, PixiScalingConfig } from './types';

export const DEFAULT_SCALING_CONFIG: PixiScalingConfig = {
  minCardWidth: 60,
  maxCardWidth: 160,
};

export const DEFAULT_LAYOUT_CONFIG: PixiLayoutConfig = {
  padding: 16,
  topRowGap: 18,
  columnGap: 12,
  rowGap: 12,
};

export const RED_CARD_COLOR = 0xc21807;
export const BLACK_CARD_COLOR = 0x101010;
export const CARD_BACKGROUND = 0xffffff;
export const CARD_BORDER = 0x0d2233;
export const TABLE_BACKGROUND = 0x0b6b3a;

export const MODE_COLUMN_BASIS: Record<string, number> = {
  klondike: 7,
  freecell: 8,
  spider: 10,
  tripeaks: 10,
  pyramid: 7,
  golf: 7,
};

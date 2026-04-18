import type { PixiLayoutConfig, PixiScalingConfig } from './types';

export const CARD_WIDTH_RATIO = 0.12;
export const CARD_HEIGHT_RATIO = 1.4;
export const CARD_CORNER_RADIUS_RATIO = 0.06;
export const CARD_FONT_SIZE_RATIO = 0.31;
export const CARD_PIP_SIZE_RATIO = 0.42;

export const CARD_LAYOUT_RATIOS = {
  padding: 0.13,
  topY: 0.15,
  rowGap: 0.17,
  colGap: 0.1,
  wasteFan: 0.2,
  tableauFan: 0.2,
  freeCellFan: 0.18,
  spiderFan: 0.16,
  tripeaksWasteGap: 0.2,
  pyramidWasteGap: 0.2,
  viewportEdge: 0.17,
  minFan: 0.06,
  spiderFoundationGap: 0.08,
  foundationBridge: 1.1,
  foundationBridgeMax: 1.6,
} as const;

export const DEFAULT_SCALING_CONFIG: PixiScalingConfig = {
  minCardWidth: 60,
  maxCardWidth: 160,
};

export const CARD_SCALE_BOUNDS: Record<string, { min: number; max: number }> = {
  small: { min: 48, max: 80 },
  medium: { min: 60, max: 160 },
  large: { min: 80, max: 200 },
  xlarge: { min: 120, max: 280 },
};

export const DEFAULT_LAYOUT_CONFIG: PixiLayoutConfig = {
  padding: CARD_LAYOUT_RATIOS.padding,
  topRowGap: CARD_LAYOUT_RATIOS.topY,
  columnGap: CARD_LAYOUT_RATIOS.colGap,
  rowGap: CARD_LAYOUT_RATIOS.rowGap,
};

export const RED_CARD_COLOR = 0xd00000;
export const BLACK_CARD_COLOR = 0x000000;
export const CARD_BACKGROUND = 0xffffff;
export const CARD_BORDER = 0x222222;
export const TABLE_BACKGROUND = 0x0b6b3a;

export const MODE_COLUMN_BASIS: Record<string, number> = {
  klondike: 7,
  freecell: 8,
  spider: 10,
  tripeaks: 10,
  pyramid: 7,
  golf: 7,
};

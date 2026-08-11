import {
  CARD_CORNER_RADIUS_RATIO,
  CARD_FONT_SIZE_RATIO,
  CARD_HEIGHT_RATIO,
  CARD_LAYOUT_RATIOS,
  CARD_PIP_SIZE_RATIO,
  CARD_SCALE_BOUNDS,
  CARD_WIDTH_RATIO,
  DEFAULT_SCALING_CONFIG,
  MODE_COLUMN_BASIS,
} from '../constants';
import type { CardSize, GameMode, ViewportInfo } from '../types';

function dpiFactor(dpi: number): number {
  if (dpi >= 3) return 1.12;
  if (dpi >= 2) return 1.08;
  if (dpi >= 1.5) return 1.04;
  return 1;
}

export function computeCardSize(
  viewport: ViewportInfo,
  dpi: number,
  mode: GameMode,
  cardScale?: string,
): CardSize {
  const cols = MODE_COLUMN_BASIS[mode] ?? 7;
  const proportionalWidth = Math.floor(viewport.width * CARD_WIDTH_RATIO);
  const columnGap = Math.round(proportionalWidth * CARD_LAYOUT_RATIOS.colGap);
  const sidePadding = Math.round(proportionalWidth * CARD_LAYOUT_RATIOS.padding);
  const availableByColumns = Math.floor(
    (viewport.width - sidePadding * 2 - columnGap * Math.max(0, cols - 1)) / cols,
  );
  const candidate = Math.min(proportionalWidth, availableByColumns);
  const scaled = Math.floor(candidate * dpiFactor(dpi));
  const scaleBounds = CARD_SCALE_BOUNDS[cardScale ?? 'medium'];
  const minWidth = scaleBounds?.min ?? DEFAULT_SCALING_CONFIG.minCardWidth;
  const maxWidth = scaleBounds?.max ?? DEFAULT_SCALING_CONFIG.maxCardWidth;
  const width = Math.max(
    minWidth,
    Math.min(maxWidth, scaled),
  );

  return {
    width,
    height: Math.round(width * CARD_HEIGHT_RATIO),
    fontSize: Math.max(18, Math.round(width * CARD_FONT_SIZE_RATIO)),
    pipSize: Math.max(24, Math.round(width * CARD_PIP_SIZE_RATIO)),
    cornerRadius: Math.max(6, Math.round(width * CARD_CORNER_RADIUS_RATIO)),
  };
}

export function getViewportInfo(container: HTMLDivElement): ViewportInfo {
  const rect = container.getBoundingClientRect();
  return {
    width: Math.max(320, Math.floor(rect.width)),
    height: Math.max(380, Math.floor(rect.height)),
    dpi: window.devicePixelRatio || 1,
  };
}

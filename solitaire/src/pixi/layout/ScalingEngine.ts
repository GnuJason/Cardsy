import { DEFAULT_SCALING_CONFIG, MODE_COLUMN_BASIS } from '../constants';
import type { CardSize, GameMode, ViewportInfo } from '../types';

function dpiFactor(dpi: number): number {
  if (dpi >= 3) return 1.12;
  if (dpi >= 2) return 1.08;
  if (dpi >= 1.5) return 1.04;
  return 1;
}

export function computeCardSize(viewport: ViewportInfo, dpi: number, mode: GameMode): CardSize {
  const cols = MODE_COLUMN_BASIS[mode] ?? 7;
  const gutter = cols + 1;
  const candidate = Math.floor((viewport.width - gutter * 12) / cols);
  const scaled = Math.floor(candidate * dpiFactor(dpi));
  const width = Math.max(
    DEFAULT_SCALING_CONFIG.minCardWidth,
    Math.min(DEFAULT_SCALING_CONFIG.maxCardWidth, scaled),
  );

  return {
    width,
    height: Math.round(width * 1.4),
    fontSize: Math.max(18, Math.round(width * 0.31)),
    pipSize: Math.max(24, Math.round(width * 0.42)),
    cornerRadius: Math.max(8, Math.round(width * 0.11)),
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

import type { GameMode } from '../../logic/types';
import type { PileType, PixiGameEvent } from '../types';

export function mapTapToEvent(
  mode: GameMode,
  pileType: PileType,
  pileIndex: number,
  cardIndex: number,
): PixiGameEvent | null {
  if (mode === 'klondike') {
    if (pileType === 'stock') return { type: 'DRAW' };
    if (pileType === 'waste') return { type: 'TAP_WASTE' };
    if (pileType === 'tableau') return { type: 'TAP_TABLEAU', pileIndex, cardIndex };
    if (pileType === 'foundation') return { type: 'TAP_FOUNDATION', pileIndex };
    return null;
  }

  if (mode === 'freecell') {
    if (pileType === 'column') return { type: 'TAP_COLUMN', colIndex: pileIndex, cardIndex };
    if (pileType === 'freecell') return { type: 'TAP_FREECELL', cellIndex: pileIndex };
    if (pileType === 'foundation') return { type: 'TAP_FOUNDATION', pileIndex };
    return null;
  }

  if (mode === 'spider') {
    if (pileType === 'stock') return { type: 'TAP_STOCK' };
    if (pileType === 'column') return { type: 'TAP_COLUMN', colIndex: pileIndex, cardIndex };
    return null;
  }

  if (mode === 'tripeaks') {
    if (pileType === 'stock') return { type: 'DRAW' };
    if (pileType === 'pyramid') return { type: 'TAP_PYRAMID', pyramidIndex: pileIndex };
    return null;
  }

  if (mode === 'pyramid') {
    if (pileType === 'stock') return { type: 'DRAW' };
    if (pileType === 'waste') return { type: 'TAP_WASTE' };
    if (pileType === 'pyramid') return { type: 'TAP_PYRAMID', pyramidIndex: pileIndex };
    return null;
  }

  if (pileType === 'stock') return { type: 'DRAW' };
  if (pileType === 'column') return { type: 'TAP_CARD', colIndex: pileIndex };
  return null;
}

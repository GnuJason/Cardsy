import type { LayoutResult, PileLayout } from '../types';

export interface HitResult {
  pileType: PileLayout['pileType'];
  pileIndex: number;
  cardIndex: number;
}

export function hitTestPile(
  point: { x: number; y: number },
  layout: LayoutResult,
): HitResult | null {
  for (const pile of layout.piles) {
    const maxY = pile.y + pile.dropHeight + (pile.fanDirection === 'down' ? pile.fanOffset * 20 : 0);
    const maxX = pile.x + pile.dropWidth + (pile.fanDirection === 'right' ? pile.fanOffset * 4 : 0);
    if (point.x >= pile.x && point.x <= maxX && point.y >= pile.y && point.y <= maxY) {
      const relY = point.y - pile.y;
      const relX = point.x - pile.x;
      const offset = pile.fanDirection === 'down' ? pile.fanOffset : pile.fanDirection === 'right' ? pile.fanOffset : 1;
      const rawIndex = Math.floor((pile.fanDirection === 'down' ? relY : relX) / Math.max(1, offset));
      return {
        pileType: pile.pileType,
        pileIndex: pile.pileIndex,
        cardIndex: Math.max(0, rawIndex),
      };
    }
  }
  return null;
}

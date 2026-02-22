import { describe, expect, it } from 'vitest';
import { computeLayout } from '../../src/pixi/layout/LayoutEngine';

const viewport = { width: 1280, height: 800, dpi: 2 };
const cardSize = { width: 120, height: 168, fontSize: 34, pipSize: 44, cornerRadius: 12 };

describe('computeLayout', () => {
  it('builds Klondike stock/waste/foundation/tableau piles', () => {
    const layout = computeLayout('klondike', viewport, cardSize);
    const tableau = layout.piles.filter((pile) => pile.pileType === 'tableau');
    const foundations = layout.piles.filter((pile) => pile.pileType === 'foundation');
    expect(layout.piles.some((pile) => pile.pileType === 'stock')).toBe(true);
    expect(layout.piles.some((pile) => pile.pileType === 'waste')).toBe(true);
    expect(tableau).toHaveLength(7);
    expect(foundations).toHaveLength(4);
  });

  it('builds FreeCell freecell/foundation/column piles', () => {
    const layout = computeLayout('freecell', viewport, cardSize);
    expect(layout.piles.filter((pile) => pile.pileType === 'freecell')).toHaveLength(4);
    expect(layout.piles.filter((pile) => pile.pileType === 'foundation')).toHaveLength(4);
    expect(layout.piles.filter((pile) => pile.pileType === 'column')).toHaveLength(8);
  });

  it('builds 28 pyramid slots in pyramid mode', () => {
    const layout = computeLayout('pyramid', viewport, cardSize);
    expect(layout.piles.filter((pile) => pile.pileType === 'pyramid')).toHaveLength(28);
  });

  it('clamps fan offset for deep columns when pile counts are provided', () => {
    const pileCounts = new Map<string, number>([['column-0', 30]]);
    const layout = computeLayout('spider', viewport, cardSize, pileCounts);
    const col0 = layout.piles.find((pile) => pile.pileType === 'column' && pile.pileIndex === 0);
    expect(col0).toBeDefined();
    expect(col0?.fanOffset).toBeLessThanOrEqual(Math.round(cardSize.width * 0.22));
  });

  it('keeps Klondike foundations from drifting too far right on wide viewports', () => {
    const wideViewport = { width: 2048, height: 900, dpi: 1 };
    const layout = computeLayout('klondike', wideViewport, cardSize);
    const waste = layout.piles.find((pile) => pile.pileType === 'waste' && pile.pileIndex === 0);
    const foundation0 = layout.piles.find((pile) => pile.pileType === 'foundation' && pile.pileIndex === 0);
    expect(waste).toBeDefined();
    expect(foundation0).toBeDefined();
    expect((foundation0?.x ?? 0) - ((waste?.x ?? 0) + (waste?.dropWidth ?? 0))).toBeLessThanOrEqual(Math.round(cardSize.width * 1.8));
  });
});

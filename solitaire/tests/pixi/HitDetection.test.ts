import { describe, expect, it } from 'vitest';
import { hitTestPile } from '../../src/pixi/interaction/HitDetection';

const layout = {
  piles: [
    {
      pileType: 'tableau' as const,
      pileIndex: 2,
      x: 100,
      y: 120,
      fanDirection: 'down' as const,
      fanOffset: 24,
      dropWidth: 120,
      dropHeight: 168,
    },
    {
      pileType: 'stock' as const,
      pileIndex: 0,
      x: 20,
      y: 20,
      fanDirection: 'none' as const,
      fanOffset: 0,
      dropWidth: 120,
      dropHeight: 168,
    },
  ],
  canvasWidth: 1280,
  canvasHeight: 800,
  cardSize: { width: 120, height: 168, fontSize: 34, pipSize: 44, cornerRadius: 12 },
};

describe('hitTestPile', () => {
  it('returns tableau pile and inferred card index for stacked cards', () => {
    const hit = hitTestPile({ x: 140, y: 220 }, layout);
    expect(hit).not.toBeNull();
    expect(hit?.pileType).toBe('tableau');
    expect(hit?.pileIndex).toBe(2);
    expect(hit?.cardIndex).toBeGreaterThanOrEqual(0);
  });

  it('returns null when point is outside all pile bounds', () => {
    const hit = hitTestPile({ x: 900, y: 700 }, layout);
    expect(hit).toBeNull();
  });
});

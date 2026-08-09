import { describe, expect, it } from 'vitest';
import { computeCardSize } from '../../src/pixi/layout/ScalingEngine';

describe('computeCardSize', () => {
  it('uses larger cards on high DPI tablet viewports', () => {
    const size = computeCardSize({ width: 1024, height: 768, dpi: 2 }, 2, 'klondike');
    expect(size.width).toBeGreaterThan(100);
    expect(size.height).toBe(Math.round(size.width * 1.4));
  });

  it('clamps to minimum size for narrow viewports', () => {
    const size = computeCardSize({ width: 320, height: 568, dpi: 1 }, 1, 'spider');
    expect(size.width).toBeGreaterThanOrEqual(60);
  });

  it('clamps to maximum size for very wide viewports', () => {
    const size = computeCardSize({ width: 3840, height: 2160, dpi: 2 }, 2, 'golf');
    expect(size.width).toBeLessThanOrEqual(160);
  });
});

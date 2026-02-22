import { describe, expect, it } from 'vitest';
import { linear, easeOut, easeInOut } from '../../src/pixi/animation/Easing';

describe('easing functions', () => {
  for (const [name, fn] of [['linear', linear], ['easeOut', easeOut], ['easeInOut', easeInOut]] as const) {
    it(`${name}(0) = 0`, () => expect(fn(0)).toBeCloseTo(0));
    it(`${name}(1) = 1`, () => expect(fn(1)).toBeCloseTo(1));
    it(`${name}(0.5) is in (0, 1)`, () => {
      const mid = fn(0.5);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
    });
  }
});

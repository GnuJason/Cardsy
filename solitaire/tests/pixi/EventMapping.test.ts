import { describe, expect, it } from 'vitest';
import { mapTapToEvent } from '../../src/pixi/interaction/EventMapping';

describe('mapTapToEvent', () => {
  it('maps Klondike stock to DRAW', () => {
    expect(mapTapToEvent('klondike', 'stock', 0, 0)).toEqual({ type: 'DRAW' });
  });

  it('maps FreeCell column to TAP_COLUMN', () => {
    expect(mapTapToEvent('freecell', 'column', 3, 5)).toEqual({
      type: 'TAP_COLUMN',
      colIndex: 3,
      cardIndex: 5,
    });
  });

  it('maps Golf column to TAP_CARD', () => {
    expect(mapTapToEvent('golf', 'column', 1, 0)).toEqual({
      type: 'TAP_CARD',
      colIndex: 1,
    });
  });

  it('returns null for unsupported pile/mode combinations', () => {
    expect(mapTapToEvent('spider', 'waste', 0, 0)).toBeNull();
  });
});

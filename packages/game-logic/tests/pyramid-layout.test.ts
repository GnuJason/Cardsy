import { describe, it, expect } from 'vitest';
import {
  pyramidRow,
  pyramidCol,
  rowStartIndex,
  CHILDREN,
  PYRAMID_SIZE,
  PYRAMID_ROWS,
  PYRAMID_POSITIONS,
  BOTTOM_ROW,
} from '../src/logic/pyramid/layout';

describe('pyramidRow', () => {
  it('row 0 has index 0', () => {
    expect(pyramidRow(0)).toBe(0);
  });

  it('row 1 has indices 1-2', () => {
    expect(pyramidRow(1)).toBe(1);
    expect(pyramidRow(2)).toBe(1);
  });

  it('row 2 has indices 3-5', () => {
    expect(pyramidRow(3)).toBe(2);
    expect(pyramidRow(5)).toBe(2);
  });

  it('row 6 has indices 21-27', () => {
    for (let i = 21; i <= 27; i++) {
      expect(pyramidRow(i)).toBe(6);
    }
  });
});

describe('pyramidCol', () => {
  it('row 0 col 0', () => {
    expect(pyramidCol(0)).toBe(0);
  });

  it('row 1 cols 0-1', () => {
    expect(pyramidCol(1)).toBe(0);
    expect(pyramidCol(2)).toBe(1);
  });

  it('row 6 cols 0-6', () => {
    for (let c = 0; c < 7; c++) {
      expect(pyramidCol(21 + c)).toBe(c);
    }
  });
});

describe('rowStartIndex', () => {
  it('row 0 starts at 0', () => {
    expect(rowStartIndex(0)).toBe(0);
  });

  it('row 1 starts at 1', () => {
    expect(rowStartIndex(1)).toBe(1);
  });

  it('row 6 starts at 21', () => {
    expect(rowStartIndex(6)).toBe(21);
  });
});

describe('CHILDREN', () => {
  it('has 28 entries', () => {
    expect(CHILDREN).toHaveLength(PYRAMID_SIZE);
  });

  it('bottom row has sentinel children [-1, -1]', () => {
    for (const idx of BOTTOM_ROW) {
      expect(CHILDREN[idx]).toEqual([-1, -1]);
    }
  });

  it('index 0 (row 0) has children [1, 2]', () => {
    expect(CHILDREN[0]).toEqual([1, 2]);
  });

  it('index 1 (row 1) has children [3, 4]', () => {
    expect(CHILDREN[1]).toEqual([3, 4]);
  });

  it('index 2 (row 1) has children [4, 5]', () => {
    expect(CHILDREN[2]).toEqual([4, 5]);
  });

  it('index 6 (row 3) has children [10, 11]', () => {
    // row 3, col 0: children in row 4
    expect(CHILDREN[6]).toEqual([10, 11]);
  });

  it('all non-bottom children are within [0, 27]', () => {
    for (let i = 0; i < PYRAMID_SIZE; i++) {
      const [left, right] = CHILDREN[i];
      if (left !== -1) {
        expect(left).toBeGreaterThanOrEqual(0);
        expect(left).toBeLessThan(PYRAMID_SIZE);
        expect(right).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThan(PYRAMID_SIZE);
        expect(right).toBe(left + 1);
      }
    }
  });
});

describe('PYRAMID_POSITIONS', () => {
  it('has 28 entries', () => {
    expect(PYRAMID_POSITIONS).toHaveLength(PYRAMID_SIZE);
  });

  it('row 0 has 1 card, row 6 has 7 cards', () => {
    const row0 = PYRAMID_POSITIONS.filter((p) => p.row === 0);
    const row6 = PYRAMID_POSITIONS.filter((p) => p.row === 6);
    expect(row0).toHaveLength(1);
    expect(row6).toHaveLength(7);
  });

  it('all rows are present (0-6)', () => {
    const rows = new Set(PYRAMID_POSITIONS.map((p) => p.row));
    expect(rows.size).toBe(PYRAMID_ROWS);
    for (let r = 0; r < PYRAMID_ROWS; r++) {
      expect(rows.has(r)).toBe(true);
    }
  });
});

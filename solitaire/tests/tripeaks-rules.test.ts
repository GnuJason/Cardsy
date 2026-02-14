import { describe, it, expect } from 'vitest';
import { isExposed, canPlayCard, isPeakCleared, isWon, hasAnyMoves } from '../src/logic/tripeaks/rules';
import type { TriPeaksCard, TriPeaksGameState, Card } from '../src/logic/types';

function makeCard(rank: number, removed = false, faceUp = true, index = 0): TriPeaksCard {
  return {
    suit: 'hearts',
    rank: rank as Card['rank'],
    faceUp,
    id: `hearts-${rank}`,
    pyramidIndex: index,
    removed,
  };
}

function makePyramid(removedIndices: number[] = []): TriPeaksCard[] {
  const removed = new Set(removedIndices);
  return Array.from({ length: 28 }, (_, i) =>
    makeCard((i % 13) + 1, removed.has(i), true, i),
  );
}

describe('isExposed', () => {
  it('bottom row cards are always exposed when not removed', () => {
    const pyramid = makePyramid();
    for (let i = 18; i <= 27; i++) {
      expect(isExposed(i, pyramid)).toBe(true);
    }
  });

  it('upper cards are NOT exposed when blockers present', () => {
    const pyramid = makePyramid();
    // Card 0 is blocked by 3 and 4
    expect(isExposed(0, pyramid)).toBe(false);
  });

  it('upper card IS exposed when both blockers removed', () => {
    // Card 3 is blocked by 9 and 10
    const pyramid = makePyramid([9, 10]);
    expect(isExposed(3, pyramid)).toBe(true);
  });

  it('removed cards are NOT exposed', () => {
    const pyramid = makePyramid([18]);
    expect(isExposed(18, pyramid)).toBe(false);
  });

  it('card with only one blocker removed is NOT exposed', () => {
    // Card 3 blocked by [9, 10]; only remove 9
    const pyramid = makePyramid([9]);
    expect(isExposed(3, pyramid)).toBe(false);
  });

  it('peak top exposed once entire chain removed', () => {
    // Card 0 blocked by [3,4], 3 by [9,10], 4 by [10,11]
    // Remove 9, 10, 11 → 3 and 4 exposed
    // Remove 3 and 4 → 0 exposed
    const pyramid = makePyramid([3, 4, 9, 10, 11]);
    expect(isExposed(0, pyramid)).toBe(true);
  });
});

describe('canPlayCard', () => {
  const wasteTop = (rank: number): Card => ({
    suit: 'spades',
    rank: rank as Card['rank'],
    faceUp: true,
    id: `spades-${rank}`,
  });

  it('allows ±1 rank', () => {
    expect(canPlayCard(makeCard(5), wasteTop(4))).toBe(true);
    expect(canPlayCard(makeCard(5), wasteTop(6))).toBe(true);
  });

  it('disallows same rank', () => {
    expect(canPlayCard(makeCard(5), wasteTop(5))).toBe(false);
  });

  it('disallows ±2', () => {
    expect(canPlayCard(makeCard(5), wasteTop(3))).toBe(false);
    expect(canPlayCard(makeCard(5), wasteTop(7))).toBe(false);
  });

  it('wraps King → Ace', () => {
    expect(canPlayCard(makeCard(1), wasteTop(13))).toBe(true);
  });

  it('wraps Ace → King', () => {
    expect(canPlayCard(makeCard(13), wasteTop(1))).toBe(true);
  });

  it('ignores suit (cross-suit allowed)', () => {
    const card: TriPeaksCard = {
      suit: 'diamonds',
      rank: 7,
      faceUp: true,
      id: 'diamonds-7',
      pyramidIndex: 0,
      removed: false,
    };
    expect(canPlayCard(card, wasteTop(6))).toBe(true);
  });
});

describe('isPeakCleared', () => {
  it('peak 0 is cleared when index 0 removed', () => {
    const pyramid = makePyramid([0]);
    expect(isPeakCleared(0, pyramid)).toBe(true);
  });

  it('peak 1 is NOT cleared when index 1 present', () => {
    const pyramid = makePyramid([]);
    expect(isPeakCleared(1, pyramid)).toBe(false);
  });
});

describe('isWon', () => {
  it('returns true when all 28 removed', () => {
    const allRemoved = Array.from({ length: 28 }, (_, i) => i);
    const state = {
      pyramid: makePyramid(allRemoved),
    } as TriPeaksGameState;
    expect(isWon(state)).toBe(true);
  });

  it('returns false when any card remains', () => {
    const allButOne = Array.from({ length: 27 }, (_, i) => i);
    const state = {
      pyramid: makePyramid(allButOne),
    } as TriPeaksGameState;
    expect(isWon(state)).toBe(false);
  });
});

describe('hasAnyMoves', () => {
  it('returns true when stock has cards (even if no match)', () => {
    const state = {
      pyramid: makePyramid(),
      stock: [{ suit: 'hearts', rank: 1, faceUp: false, id: 'hearts-1' }],
      waste: [{ suit: 'spades', rank: 7, faceUp: true, id: 'spades-7' }],
      status: 'playing',
    } as unknown as TriPeaksGameState;
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when exposed card matches waste top', () => {
    // Bottom row card at index 18 has rank = (18%13)+1 = 6
    // Make waste top rank 5 or 7 for ±1 match
    const pyramid = makePyramid();
    pyramid[18] = makeCard(6, false, true, 18);
    const state = {
      pyramid,
      stock: [],
      waste: [{ suit: 'spades', rank: 7, faceUp: true, id: 'spades-7' }],
      status: 'playing',
    } as unknown as TriPeaksGameState;
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns false when stock empty and no match', () => {
    // Make all bottom row cards rank 1, waste top rank 5 (diff=4, no wrap)
    const pyramid = makePyramid();
    for (let i = 18; i <= 27; i++) {
      pyramid[i] = makeCard(5, false, true, i);
    }
    const state = {
      pyramid,
      stock: [],
      waste: [{ suit: 'spades', rank: 8, faceUp: true, id: 'spades-8' }],
      status: 'playing',
    } as unknown as TriPeaksGameState;
    expect(hasAnyMoves(state)).toBe(false);
  });
});

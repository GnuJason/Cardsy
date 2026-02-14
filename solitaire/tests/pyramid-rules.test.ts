import { describe, it, expect } from 'vitest';
import { isUncovered, canPair, isKing, isWon, hasAnyMoves } from '../src/logic/pyramid/rules';
import type { Card, PyramidCard, PyramidGameState } from '../src/logic/types';

function card(rank: number, suit = 'hearts' as const, faceUp = true): Card {
  return { suit, rank: rank as Card['rank'], faceUp, id: `${suit}-${rank}` };
}

function pcard(
  rank: number,
  index: number,
  removed = false,
  suit = 'hearts' as const,
): PyramidCard {
  return {
    suit,
    rank: rank as Card['rank'],
    faceUp: true,
    id: `${suit}-${rank}-${index}`,
    pyramidIndex: index,
    removed,
  };
}

/**
 * Make a minimal pyramid (28 cards) with all removed except given active indices.
 * Active cards get rank specified in the map, or rank 5 by default.
 */
function makePyramid(
  activeCards: Record<number, number> = {},
): PyramidCard[] {
  const pyramid: PyramidCard[] = [];
  for (let i = 0; i < 28; i++) {
    const rank = activeCards[i] ?? 5;
    const removed = !(i in activeCards);
    pyramid.push(pcard(rank, i, removed));
  }
  return pyramid;
}

function makeState(overrides: Partial<PyramidGameState> = {}): PyramidGameState {
  return {
    pyramid: makePyramid({ 21: 5, 22: 8, 23: 6, 24: 7 }), // bottom row cards
    stock: [card(2, 'clubs', false), card(3, 'diamonds', false)],
    waste: [card(10, 'spades')],
    cardsRemaining: 4,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    selectedIndex: null,
    ...overrides,
  };
}

describe('isUncovered', () => {
  it('bottom row cards are always uncovered', () => {
    const pyramid = makePyramid({ 21: 5, 22: 8 });
    expect(isUncovered(21, pyramid)).toBe(true);
    expect(isUncovered(22, pyramid)).toBe(true);
  });

  it('a card with both children removed is uncovered', () => {
    // Index 0 has children [1, 2] - both removed
    const pyramid = makePyramid({ 0: 5 }); // only index 0 active, rest removed
    expect(isUncovered(0, pyramid)).toBe(true);
  });

  it('a card with one child still present is not uncovered', () => {
    // Index 0 has children [1, 2] - index 1 still present
    const pyramid = makePyramid({ 0: 5, 1: 3 });
    expect(isUncovered(0, pyramid)).toBe(false);
  });

  it('a card with both children still present is not uncovered', () => {
    const pyramid = makePyramid({ 0: 5, 1: 3, 2: 10 });
    expect(isUncovered(0, pyramid)).toBe(false);
  });
});

describe('canPair', () => {
  it('Ace(1) + Queen(12) = 13 → true', () => {
    expect(canPair(card(1), card(12))).toBe(true);
  });

  it('2 + Jack(11) = 13 → true', () => {
    expect(canPair(card(2), card(11))).toBe(true);
  });

  it('6 + 7 = 13 → true', () => {
    expect(canPair(card(6), card(7))).toBe(true);
  });

  it('5 + 5 = 10 → false', () => {
    expect(canPair(card(5), card(5))).toBe(false);
  });

  it('King(13) + anything → false (King removes solo)', () => {
    expect(canPair(card(13), card(1))).toBe(false);
    expect(canPair(card(13), card(13))).toBe(false);
  });

  it('3 + 9 = 12 → false', () => {
    expect(canPair(card(3), card(9))).toBe(false);
  });
});

describe('isKing', () => {
  it('rank 13 is a King', () => {
    expect(isKing(card(13))).toBe(true);
  });

  it('rank 12 is not a King', () => {
    expect(isKing(card(12))).toBe(false);
  });

  it('rank 1 is not a King', () => {
    expect(isKing(card(1))).toBe(false);
  });
});

describe('isWon', () => {
  it('returns true when cardsRemaining is 0', () => {
    expect(isWon({ cardsRemaining: 0 } as PyramidGameState)).toBe(true);
  });

  it('returns false when cardsRemaining > 0', () => {
    expect(isWon({ cardsRemaining: 5 } as PyramidGameState)).toBe(false);
  });
});

describe('hasAnyMoves', () => {
  it('returns true when an uncovered King exists', () => {
    const state = makeState({
      pyramid: makePyramid({ 21: 13 }), // bottom row King
      stock: [],
      waste: [],
      cardsRemaining: 1,
    });
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when two uncovered pyramid cards sum to 13', () => {
    const state = makeState({
      pyramid: makePyramid({ 21: 6, 22: 7 }), // 6 + 7 = 13
      stock: [],
      waste: [],
      cardsRemaining: 2,
    });
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when pyramid card + waste top sum to 13', () => {
    const state = makeState({
      pyramid: makePyramid({ 21: 3 }),
      stock: [],
      waste: [card(10)], // 3 + 10 = 13
      cardsRemaining: 1,
    });
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when waste top is a King', () => {
    const state = makeState({
      pyramid: makePyramid({ 21: 2 }),
      stock: [],
      waste: [card(13)],
      cardsRemaining: 1,
    });
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when stock has cards', () => {
    const state = makeState({
      pyramid: makePyramid({ 21: 2 }), // no pairs possible
      stock: [card(4)],
      waste: [card(5)], // 2 + 5 ≠ 13
      cardsRemaining: 1,
    });
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns false when no moves available', () => {
    const state = makeState({
      pyramid: makePyramid({ 21: 2, 22: 4 }), // 2+4=6 ≠ 13
      stock: [],
      waste: [card(8)], // 2+8=10, 4+8=12, none = 13
      cardsRemaining: 2,
    });
    expect(hasAnyMoves(state)).toBe(false);
  });

  it('returns false when pyramid empty and stock empty', () => {
    const state = makeState({
      pyramid: makePyramid({}), // all removed
      stock: [],
      waste: [card(5)],
      cardsRemaining: 0,
    });
    // Actually cardsRemaining=0 is a win, but hasAnyMoves should still return false
    expect(hasAnyMoves(state)).toBe(false);
  });

  it('does not consider covered cards for pairing', () => {
    // Index 0 (row 0) is covered by index 1 and 2 (row 1)
    // Only 1 and 2 are uncovered on row 1 (their children 3,4,5 are removed)
    const pyramid = makePyramid({ 0: 6, 1: 7, 2: 4 });
    // 0 is covered (children 1 and 2 present)
    // 1+2: 7+4=11 ≠ 13
    // Only 1 & 2 are uncovered (their children all removed)
    const state = makeState({
      pyramid,
      stock: [],
      waste: [],
      cardsRemaining: 3,
    });
    expect(hasAnyMoves(state)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  cloneState,
  drawFromStock,
  removeKing,
  removeWasteKing,
  removePyramidPair,
  removePyramidWastePair,
} from '../src/logic/pyramid/moves';
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

function makePyramid(
  activeCards: Record<number, number> = {},
  suitMap: Record<number, 'hearts' | 'diamonds' | 'clubs' | 'spades'> = {},
): PyramidCard[] {
  const pyramid: PyramidCard[] = [];
  for (let i = 0; i < 28; i++) {
    const rank = activeCards[i] ?? 5;
    const removed = !(i in activeCards);
    const suit = suitMap[i] ?? 'hearts';
    pyramid.push(pcard(rank, i, removed, suit));
  }
  return pyramid;
}

function makeState(overrides: Partial<PyramidGameState> = {}): PyramidGameState {
  return {
    pyramid: makePyramid({ 21: 6, 22: 7, 23: 13, 24: 3 }),
    stock: [card(2, 'clubs', false), card(4, 'diamonds', false)],
    waste: [card(10, 'spades')],
    cardsRemaining: 4,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    selectedIndex: null,
    ...overrides,
  };
}

describe('cloneState', () => {
  it('returns a deep copy', () => {
    const state = makeState();
    const clone = cloneState(state);
    expect(clone).toEqual(state);
    expect(clone).not.toBe(state);
    expect(clone.pyramid).not.toBe(state.pyramid);
    expect(clone.stock).not.toBe(state.stock);
    expect(clone.waste).not.toBe(state.waste);
  });

  it('modifying clone does not affect original', () => {
    const state = makeState();
    const clone = cloneState(state);
    clone.pyramid[21].removed = true;
    expect(state.pyramid[21].removed).toBe(false);
  });
});

describe('drawFromStock', () => {
  it('moves top stock card to waste face-up', () => {
    const state = makeState();
    const next = drawFromStock(state);
    expect(next).not.toBeNull();
    expect(next!.stock).toHaveLength(1);
    expect(next!.waste).toHaveLength(2);
    expect(next!.waste[next!.waste.length - 1].faceUp).toBe(true);
  });

  it('increments moves', () => {
    const state = makeState();
    const next = drawFromStock(state);
    expect(next!.moves).toBe(1);
  });

  it('clears selection', () => {
    const state = makeState({ selectedIndex: 21 });
    const next = drawFromStock(state);
    expect(next!.selectedIndex).toBeNull();
  });

  it('does not change cardsRemaining', () => {
    const state = makeState();
    const next = drawFromStock(state);
    expect(next!.cardsRemaining).toBe(state.cardsRemaining);
  });

  it('returns null when stock is empty', () => {
    const state = makeState({ stock: [] });
    expect(drawFromStock(state)).toBeNull();
  });

  it('does not mutate original state', () => {
    const state = makeState();
    const origStockLen = state.stock.length;
    drawFromStock(state);
    expect(state.stock).toHaveLength(origStockLen);
  });
});

describe('removeKing', () => {
  it('removes an uncovered King from the pyramid', () => {
    // Index 23 is a King on the bottom row (uncovered)
    const state = makeState();
    const next = removeKing(state, 23);
    expect(next).not.toBeNull();
    expect(next!.pyramid[23].removed).toBe(true);
    expect(next!.cardsRemaining).toBe(3);
    expect(next!.moves).toBe(1);
    expect(next!.selectedIndex).toBeNull();
  });

  it('returns null for non-King card', () => {
    const state = makeState();
    expect(removeKing(state, 21)).toBeNull(); // rank 6, not King
  });

  it('returns null for removed card', () => {
    const state = makeState();
    expect(removeKing(state, 0)).toBeNull(); // already removed
  });

  it('returns null for covered card', () => {
    // Index 0 has children 1,2 which are not removed in this pyramid
    const pyramid = makePyramid({ 0: 13, 1: 5, 2: 8 });
    const state = makeState({ pyramid, cardsRemaining: 3 });
    expect(removeKing(state, 0)).toBeNull();
  });

  it('returns null for out of range index', () => {
    const state = makeState();
    expect(removeKing(state, -1)).toBeNull();
    expect(removeKing(state, 28)).toBeNull();
  });

  it('does not mutate original state', () => {
    const state = makeState();
    removeKing(state, 23);
    expect(state.pyramid[23].removed).toBe(false);
  });
});

describe('removeWasteKing', () => {
  it('removes waste top King', () => {
    const state = makeState({ waste: [card(5), card(13)] });
    const next = removeWasteKing(state);
    expect(next).not.toBeNull();
    expect(next!.waste).toHaveLength(1);
    expect(next!.moves).toBe(1);
  });

  it('returns null when waste top is not King', () => {
    const state = makeState({ waste: [card(5)] });
    expect(removeWasteKing(state)).toBeNull();
  });

  it('returns null when waste is empty', () => {
    const state = makeState({ waste: [] });
    expect(removeWasteKing(state)).toBeNull();
  });
});

describe('removePyramidPair', () => {
  it('removes two uncovered cards that sum to 13', () => {
    // Indices 21 (rank 6) and 22 (rank 7) → 6+7=13
    const state = makeState();
    const next = removePyramidPair(state, 21, 22);
    expect(next).not.toBeNull();
    expect(next!.pyramid[21].removed).toBe(true);
    expect(next!.pyramid[22].removed).toBe(true);
    expect(next!.cardsRemaining).toBe(2);
    expect(next!.moves).toBe(1);
  });

  it('returns null if cards do not sum to 13', () => {
    // 21 (rank 6) + 24 (rank 3) = 9 ≠ 13
    const state = makeState();
    expect(removePyramidPair(state, 21, 24)).toBeNull();
  });

  it('returns null if same index', () => {
    const state = makeState();
    expect(removePyramidPair(state, 21, 21)).toBeNull();
  });

  it('returns null if one card is removed', () => {
    const state = makeState();
    state.pyramid[21] = { ...state.pyramid[21] }; // don't mutate original test
    // We need to test with a state where one card is already removed
    const pyramid = makePyramid({ 22: 7 }); // 21 removed
    const s2 = makeState({ pyramid, cardsRemaining: 1 });
    expect(removePyramidPair(s2, 21, 22)).toBeNull();
  });

  it('returns null if card is covered', () => {
    // Index 0 covered by children 1 and 2
    const pyramid = makePyramid({ 0: 6, 1: 7, 2: 8, 21: 4 });
    // 0 is covered, 21 and 1 are uncovered; 0+1: diff doesn't matter since 0 is covered
    const state = makeState({ pyramid, cardsRemaining: 4 });
    expect(removePyramidPair(state, 0, 21)).toBeNull();
  });

  it('detects win when last cards removed', () => {
    const pyramid = makePyramid({ 21: 6, 22: 7 });
    const state = makeState({ pyramid, stock: [], waste: [], cardsRemaining: 2 });
    const next = removePyramidPair(state, 21, 22);
    expect(next).not.toBeNull();
    expect(next!.status).toBe('won');
    expect(next!.cardsRemaining).toBe(0);
  });

  it('detects no-moves after pair removal', () => {
    // After removing 21+22 (6+7), only 23 (rank 2) left, no stock, waste has 8
    // 2+8=10≠13, so no moves
    const pyramid = makePyramid({ 21: 6, 22: 7, 23: 2 });
    const state = makeState({ pyramid, stock: [], waste: [card(8)], cardsRemaining: 3 });
    const next = removePyramidPair(state, 21, 22);
    expect(next).not.toBeNull();
    expect(next!.status).toBe('no-moves');
  });

  it('does not mutate original state', () => {
    const state = makeState();
    removePyramidPair(state, 21, 22);
    expect(state.pyramid[21].removed).toBe(false);
    expect(state.pyramid[22].removed).toBe(false);
  });
});

describe('removePyramidWastePair', () => {
  it('removes pyramid card + waste top that sum to 13', () => {
    // Index 24 (rank 3) + waste top (rank 10) = 13
    const state = makeState();
    const next = removePyramidWastePair(state, 24);
    expect(next).not.toBeNull();
    expect(next!.pyramid[24].removed).toBe(true);
    expect(next!.waste).toHaveLength(0); // waste top removed
    expect(next!.cardsRemaining).toBe(3);
    expect(next!.moves).toBe(1);
  });

  it('returns null if they do not sum to 13', () => {
    // Index 21 (rank 6) + waste top (rank 10) = 16 ≠ 13
    const state = makeState();
    expect(removePyramidWastePair(state, 21)).toBeNull();
  });

  it('returns null if waste is empty', () => {
    const state = makeState({ waste: [] });
    expect(removePyramidWastePair(state, 24)).toBeNull();
  });

  it('returns null if pyramid card is removed', () => {
    const pyramid = makePyramid({ 22: 3 }); // 21 is removed
    const state = makeState({ pyramid, waste: [card(10)], cardsRemaining: 1 });
    expect(removePyramidWastePair(state, 21)).toBeNull();
  });

  it('returns null if pyramid card is covered', () => {
    const pyramid = makePyramid({ 0: 3, 1: 5, 2: 8 });
    const state = makeState({ pyramid, waste: [card(10)], cardsRemaining: 3 });
    expect(removePyramidWastePair(state, 0)).toBeNull();
  });

  it('does not mutate original state', () => {
    const state = makeState();
    removePyramidWastePair(state, 24);
    expect(state.pyramid[24].removed).toBe(false);
    expect(state.waste).toHaveLength(1);
  });
});

import { describe, it, expect } from 'vitest';
import { cardsRemaining, undoPenalty } from '../src/logic/pyramid/scoring';
import type { PyramidGameState } from '../src/logic/types';

function makeState(remaining: number): PyramidGameState {
  return {
    pyramid: [],
    stock: [],
    waste: [],
    cardsRemaining: remaining,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    selectedIndex: null,
  };
}

describe('cardsRemaining', () => {
  it('returns the cardsRemaining field', () => {
    expect(cardsRemaining(makeState(28))).toBe(28);
    expect(cardsRemaining(makeState(10))).toBe(10);
    expect(cardsRemaining(makeState(0))).toBe(0);
  });
});

describe('undoPenalty', () => {
  it('returns 0 (no penalty in Pyramid)', () => {
    expect(undoPenalty()).toBe(0);
  });
});

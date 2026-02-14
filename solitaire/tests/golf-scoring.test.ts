import { describe, it, expect } from 'vitest';
import { cardsRemaining, undoPenalty } from '../src/logic/golf/scoring';
import type { GolfGameState } from '../src/logic/types';

function makeState(remaining: number): GolfGameState {
  return {
    tableau: [],
    stock: [],
    waste: [],
    cardsRemaining: remaining,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
  };
}

describe('cardsRemaining', () => {
  it('returns the cardsRemaining field', () => {
    expect(cardsRemaining(makeState(35))).toBe(35);
    expect(cardsRemaining(makeState(10))).toBe(10);
    expect(cardsRemaining(makeState(0))).toBe(0);
  });
});

describe('undoPenalty', () => {
  it('returns 0 (no penalty in Golf)', () => {
    expect(undoPenalty()).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { canPlayCard, isExposed, isWon, hasAnyMoves } from '../src/logic/golf/rules';
import type { Card, GolfGameState } from '../src/logic/types';

function card(rank: number, suit = 'hearts' as const, faceUp = true): Card {
  return { suit, rank: rank as Card['rank'], faceUp, id: `${suit}-${rank}` };
}

describe('canPlayCard', () => {
  it('allows +1 rank', () => {
    expect(canPlayCard(card(6), card(5))).toBe(true);
  });

  it('allows -1 rank', () => {
    expect(canPlayCard(card(4), card(5))).toBe(true);
  });

  it('rejects same rank', () => {
    expect(canPlayCard(card(5), card(5))).toBe(false);
  });

  it('rejects rank difference > 1', () => {
    expect(canPlayCard(card(3), card(5))).toBe(false);
    expect(canPlayCard(card(7), card(5))).toBe(false);
  });

  it('allows King→Ace wrapping', () => {
    expect(canPlayCard(card(13), card(1))).toBe(true);
  });

  it('allows Ace→King wrapping', () => {
    expect(canPlayCard(card(1), card(13))).toBe(true);
  });

  it('rejects Queen→Ace (gap=11)', () => {
    expect(canPlayCard(card(12), card(1))).toBe(false);
  });
});

describe('isExposed', () => {
  it('returns true for non-empty column', () => {
    const tableau = [[card(5)], [card(6)]];
    expect(isExposed(0, tableau)).toBe(true);
  });

  it('returns false for empty column', () => {
    const tableau: Card[][] = [[], [card(6)]];
    expect(isExposed(0, tableau)).toBe(false);
  });
});

describe('isWon', () => {
  it('returns true when cardsRemaining is 0', () => {
    expect(isWon({ cardsRemaining: 0 } as GolfGameState)).toBe(true);
  });

  it('returns false when cardsRemaining > 0', () => {
    expect(isWon({ cardsRemaining: 5 } as GolfGameState)).toBe(false);
  });
});

describe('hasAnyMoves', () => {
  it('returns true when an exposed card can be played', () => {
    const state: GolfGameState = {
      tableau: [[card(5)], [card(10)]],
      stock: [],
      waste: [card(6)],
      cardsRemaining: 2,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when stock has cards (even if no tableau match)', () => {
    const state: GolfGameState = {
      tableau: [[card(10)]],
      stock: [card(1)],
      waste: [card(5)],
      cardsRemaining: 1,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns false when stock empty and no playable card', () => {
    const state: GolfGameState = {
      tableau: [[card(10)]],
      stock: [],
      waste: [card(5)],
      cardsRemaining: 1,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    expect(hasAnyMoves(state)).toBe(false);
  });

  it('returns false when tableau empty and stock empty', () => {
    const state: GolfGameState = {
      tableau: [[], []],
      stock: [],
      waste: [card(5)],
      cardsRemaining: 0,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    expect(hasAnyMoves(state)).toBe(false);
  });

  it('respects wrapping: Ace playable on King', () => {
    const state: GolfGameState = {
      tableau: [[card(1)]],
      stock: [],
      waste: [card(13)],
      cardsRemaining: 1,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    expect(hasAnyMoves(state)).toBe(true);
  });
});

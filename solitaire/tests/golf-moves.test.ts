import { describe, it, expect } from 'vitest';
import { drawFromStock, playCard, cloneState } from '../src/logic/golf/moves';
import type { Card, GolfGameState } from '../src/logic/types';

function card(rank: number, suit = 'hearts' as const, faceUp = true): Card {
  return { suit, rank: rank as Card['rank'], faceUp, id: `${suit}-${rank}` };
}

function makeState(overrides: Partial<GolfGameState> = {}): GolfGameState {
  return {
    tableau: [[card(5), card(6), card(7)], [card(8), card(9), card(10)]],
    stock: [card(2, 'clubs', false), card(3, 'diamonds', false)],
    waste: [card(6, 'spades')],
    cardsRemaining: 6,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    ...overrides,
  };
}

describe('cloneState', () => {
  it('returns a deep copy', () => {
    const state = makeState();
    const clone = cloneState(state);
    expect(clone).toEqual(state);
    expect(clone).not.toBe(state);
    expect(clone.tableau).not.toBe(state.tableau);
    expect(clone.tableau[0]).not.toBe(state.tableau[0]);
    expect(clone.stock).not.toBe(state.stock);
    expect(clone.waste).not.toBe(state.waste);
  });

  it('modifying clone does not affect original', () => {
    const state = makeState();
    const clone = cloneState(state);
    clone.tableau[0].pop();
    expect(state.tableau[0]).toHaveLength(3);
    expect(clone.tableau[0]).toHaveLength(2);
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

describe('playCard', () => {
  it('plays bottom card of column onto waste when ±1 rank', () => {
    // Bottom of column 0 is card(7), waste top is card(6) → diff=1 → legal
    const state = makeState();
    const next = playCard(state, 0);
    expect(next).not.toBeNull();
    expect(next!.tableau[0]).toHaveLength(2);
    expect(next!.waste[next!.waste.length - 1].rank).toBe(7);
    expect(next!.cardsRemaining).toBe(5);
    expect(next!.moves).toBe(1);
  });

  it('returns null for illegal move (rank difference > 1)', () => {
    // Bottom of column 1 is card(10), waste top is card(6) → diff=4 → illegal
    const state = makeState();
    expect(playCard(state, 1)).toBeNull();
  });

  it('returns null for empty column', () => {
    const state = makeState({ tableau: [[], [card(7)]] });
    expect(playCard(state, 0)).toBeNull();
  });

  it('returns null for invalid column index', () => {
    const state = makeState();
    expect(playCard(state, -1)).toBeNull();
    expect(playCard(state, 99)).toBeNull();
  });

  it('returns null when waste is empty', () => {
    const state = makeState({ waste: [] });
    expect(playCard(state, 0)).toBeNull();
  });

  it('detects win when all tableau cleared', () => {
    // One card left → playing it should win
    const state: GolfGameState = {
      tableau: [[card(5)]],
      stock: [],
      waste: [card(6)],
      cardsRemaining: 1,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    const next = playCard(state, 0);
    expect(next).not.toBeNull();
    expect(next!.status).toBe('won');
    expect(next!.cardsRemaining).toBe(0);
  });

  it('detects no-moves when stock empty and no playable card after play', () => {
    // After playing this card, remaining card(10) won't match card(5)
    const state: GolfGameState = {
      tableau: [[card(10)], [card(5)]],
      stock: [],
      waste: [card(6)],
      cardsRemaining: 2,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    const next = playCard(state, 1); // play card(5) onto card(6)
    expect(next).not.toBeNull();
    expect(next!.status).toBe('no-moves');
  });

  it('allows K↔A wrapping', () => {
    const state: GolfGameState = {
      tableau: [[card(1)]],
      stock: [card(3)],
      waste: [card(13)],
      cardsRemaining: 1,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };
    const next = playCard(state, 0);
    expect(next).not.toBeNull();
    expect(next!.cardsRemaining).toBe(0);
    expect(next!.status).toBe('won');
  });

  it('does not mutate original state', () => {
    const state = makeState();
    const origTableauLen = state.tableau[0].length;
    playCard(state, 0);
    expect(state.tableau[0]).toHaveLength(origTableauLen);
  });
});

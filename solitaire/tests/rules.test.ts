import { describe, it, expect } from 'vitest';
import { canPlaceOnTableau, canPlaceOnFoundation, isWon, hasAnyMoves, canAutoComplete, findBestMove } from '../src/logic/rules';
import type { Card, GameState } from '../src/logic/types';

function makeCard(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}` };
}

function emptyGameState(): GameState {
  return {
    stock: [],
    waste: [],
    tableau: [[], [], [], [], [], [], []],
    foundations: [[], [], [], []],
    score: 0,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
  };
}

describe('canPlaceOnTableau', () => {
  it('allows King on empty pile', () => {
    expect(canPlaceOnTableau(makeCard('hearts', 13), [])).toBe(true);
  });

  it('rejects non-King on empty pile', () => {
    expect(canPlaceOnTableau(makeCard('hearts', 12), [])).toBe(false);
  });

  it('allows alternating color descending rank', () => {
    const pile = [makeCard('spades', 10)]; // black 10
    expect(canPlaceOnTableau(makeCard('hearts', 9), pile)).toBe(true); // red 9
    expect(canPlaceOnTableau(makeCard('diamonds', 9), pile)).toBe(true); // red 9
  });

  it('rejects same color', () => {
    const pile = [makeCard('spades', 10)]; // black 10
    expect(canPlaceOnTableau(makeCard('clubs', 9), pile)).toBe(false); // also black
  });

  it('rejects non-descending rank', () => {
    const pile = [makeCard('spades', 10)];
    expect(canPlaceOnTableau(makeCard('hearts', 8), pile)).toBe(false);
    expect(canPlaceOnTableau(makeCard('hearts', 10), pile)).toBe(false);
  });

  it('rejects placement on face-down top card', () => {
    const pile = [makeCard('spades', 10, false)];
    expect(canPlaceOnTableau(makeCard('hearts', 9), pile)).toBe(false);
  });
});

describe('canPlaceOnFoundation', () => {
  it('allows Ace on empty foundation', () => {
    expect(canPlaceOnFoundation(makeCard('hearts', 1), [])).toBe(true);
  });

  it('rejects non-Ace on empty foundation', () => {
    expect(canPlaceOnFoundation(makeCard('hearts', 2), [])).toBe(false);
  });

  it('allows same suit ascending', () => {
    const foundation = [makeCard('hearts', 1), makeCard('hearts', 2)];
    expect(canPlaceOnFoundation(makeCard('hearts', 3), foundation)).toBe(true);
  });

  it('rejects different suit', () => {
    const foundation = [makeCard('hearts', 1)];
    expect(canPlaceOnFoundation(makeCard('diamonds', 2), foundation)).toBe(false);
  });

  it('rejects non-ascending rank', () => {
    const foundation = [makeCard('hearts', 1)];
    expect(canPlaceOnFoundation(makeCard('hearts', 3), foundation)).toBe(false);
  });
});

describe('isWon', () => {
  it('returns false for empty foundations', () => {
    expect(isWon(emptyGameState())).toBe(false);
  });

  it('returns true when all foundations are full', () => {
    const state = emptyGameState();
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    state.foundations = suits.map((suit) =>
      Array.from({ length: 13 }, (_, i) => makeCard(suit, (i + 1) as Card['rank'])),
    );
    expect(isWon(state)).toBe(true);
  });
});

describe('hasAnyMoves', () => {
  it('returns true when stock has cards', () => {
    const state = emptyGameState();
    state.stock = [makeCard('hearts', 1, false)];
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when waste has cards (can recycle)', () => {
    const state = emptyGameState();
    state.waste = [makeCard('hearts', 1)];
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns false when everything is empty', () => {
    const state = emptyGameState();
    expect(hasAnyMoves(state)).toBe(false);
  });
});

describe('canAutoComplete', () => {
  it('returns false with stock remaining', () => {
    const state = emptyGameState();
    state.stock = [makeCard('hearts', 1, false)];
    expect(canAutoComplete(state)).toBe(false);
  });

  it('returns false with face-down tableau cards', () => {
    const state = emptyGameState();
    state.tableau[0] = [makeCard('hearts', 13, false), makeCard('clubs', 12)];
    expect(canAutoComplete(state)).toBe(false);
  });

  it('returns true when all remaining cards are face-up in tableau', () => {
    const state = emptyGameState();
    state.tableau[0] = [makeCard('hearts', 1)];
    expect(canAutoComplete(state)).toBe(true);
  });
});

describe('findBestMove', () => {
  it('prefers foundation for single cards', () => {
    const state = emptyGameState();
    // Ace of hearts should go to foundation
    const result = findBestMove(makeCard('hearts', 1), state);
    expect(result).toEqual({ zone: 'foundation', pileIndex: 0 });
  });

  it('finds tableau placement', () => {
    const state = emptyGameState();
    state.tableau[0] = [makeCard('spades', 10)]; // black 10
    const result = findBestMove(makeCard('hearts', 9), state); // red 9
    expect(result).toEqual({ zone: 'tableau', pileIndex: 0 });
  });

  it('returns null when no valid move exists', () => {
    const state = emptyGameState();
    state.tableau[0] = [makeCard('spades', 10)]; // black 10
    const result = findBestMove(makeCard('clubs', 5), state); // black 5 — no match
    expect(result).toBe(null);
  });
});

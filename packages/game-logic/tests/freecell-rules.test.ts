import { describe, it, expect } from 'vitest';
import type { Card, FreeCellGameState } from '../src/logic/types';
import {
  isValidSequence,
  moveCapacity,
  canPlaceOnColumn,
  canPlaceOnFoundation,
  canSafeAutoMove,
  isWon,
  isTriviallyWon,
  hasAnyMoves,
} from '../src/logic/freecell/rules';

// ── Test Helpers ────────────────────────────────────────────

function card(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}` };
}

function emptyState(): FreeCellGameState {
  return {
    columns: Array.from({ length: 8 }, () => []),
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    selectedSource: null,
  };
}

// ── isValidSequence ─────────────────────────────────────────

describe('isValidSequence', () => {
  it('single card is always a valid sequence', () => {
    const col = [card('hearts', 5)];
    expect(isValidSequence(col, 0)).toBe(true);
  });

  it('valid alternating-color descending sequence', () => {
    const col = [card('hearts', 6), card('clubs', 5), card('diamonds', 4)];
    expect(isValidSequence(col, 0)).toBe(true);
  });

  it('invalid when same color', () => {
    const col = [card('hearts', 6), card('diamonds', 5)];
    expect(isValidSequence(col, 0)).toBe(false);
  });

  it('invalid when ranks not descending', () => {
    const col = [card('hearts', 5), card('clubs', 5)];
    expect(isValidSequence(col, 0)).toBe(false);
  });

  it('partial sequence starting from middle', () => {
    const col = [
      card('spades', 10),
      card('hearts', 5), // start checking here
      card('clubs', 4),
    ];
    expect(isValidSequence(col, 1)).toBe(true);
    expect(isValidSequence(col, 0)).toBe(false);
  });
});

// ── moveCapacity ────────────────────────────────────────────

describe('moveCapacity', () => {
  it('with all cells full and all columns occupied: capacity = 1', () => {
    const state = emptyState();
    state.freeCells = [card('hearts', 1), card('clubs', 1), card('diamonds', 1), card('spades', 1)];
    // Put a card in each column
    for (let i = 0; i < 8; i++) {
      state.columns[i] = [card('hearts', (i + 2) as Card['rank'])];
    }
    expect(moveCapacity(state)).toBe(1);
  });

  it('with 2 empty free cells and 0 empty columns: capacity = 3', () => {
    const state = emptyState();
    state.freeCells = [card('hearts', 1), null, card('clubs', 1), null];
    for (let i = 0; i < 8; i++) {
      state.columns[i] = [card('hearts', (i + 2) as Card['rank'])];
    }
    expect(moveCapacity(state)).toBe(3);
  });

  it('with 0 empty free cells and 1 empty column: capacity = 2', () => {
    const state = emptyState();
    state.freeCells = [card('hearts', 1), card('clubs', 1), card('diamonds', 1), card('spades', 1)];
    for (let i = 0; i < 7; i++) {
      state.columns[i] = [card('hearts', (i + 2) as Card['rank'])];
    }
    state.columns[7] = [];
    expect(moveCapacity(state)).toBe(2);
  });

  it('with 4 empty free cells and 4 empty columns: capacity = 80', () => {
    const state = emptyState();
    for (let i = 0; i < 4; i++) {
      state.columns[i] = [card('hearts', (i + 2) as Card['rank'])];
    }
    // Columns 4-7 empty, all free cells empty
    expect(moveCapacity(state)).toBe(5 * 16); // 80
  });

  it('subtracts 1 from empty columns when target is empty column', () => {
    const state = emptyState();
    for (let i = 0; i < 7; i++) {
      state.columns[i] = [card('hearts', (i + 2) as Card['rank'])];
    }
    // 1 empty column, 4 empty free cells
    const withTarget = moveCapacity(state, true);
    const without = moveCapacity(state, false);
    expect(without).toBe(5 * 2); // 10
    expect(withTarget).toBe(5 * 1); // 5
  });
});

// ── canPlaceOnColumn ────────────────────────────────────────

describe('canPlaceOnColumn', () => {
  it('any card can go on empty column', () => {
    expect(canPlaceOnColumn(card('hearts', 13), [])).toBe(true);
    expect(canPlaceOnColumn(card('clubs', 1), [])).toBe(true);
  });

  it('opposite color and rank-1 is valid', () => {
    const col = [card('hearts', 6)];
    expect(canPlaceOnColumn(card('clubs', 5), col)).toBe(true);
    expect(canPlaceOnColumn(card('spades', 5), col)).toBe(true);
  });

  it('same color is invalid', () => {
    const col = [card('hearts', 6)];
    expect(canPlaceOnColumn(card('diamonds', 5), col)).toBe(false);
  });

  it('wrong rank is invalid', () => {
    const col = [card('hearts', 6)];
    expect(canPlaceOnColumn(card('clubs', 4), col)).toBe(false);
    expect(canPlaceOnColumn(card('clubs', 6), col)).toBe(false);
  });
});

// ── canPlaceOnFoundation ────────────────────────────────────

describe('canPlaceOnFoundation', () => {
  it('Ace on empty foundation of matching suit', () => {
    const foundations: Card[][] = [[], [], [], []];
    expect(canPlaceOnFoundation(card('hearts', 1), 0, foundations)).toBe(true);
  });

  it('rejects Ace on wrong suit foundation', () => {
    const foundations: Card[][] = [[], [], [], []];
    expect(canPlaceOnFoundation(card('clubs', 1), 0, foundations)).toBe(false);
  });

  it('accepts next rank on foundation', () => {
    const foundations: Card[][] = [[card('hearts', 1)], [], [], []];
    expect(canPlaceOnFoundation(card('hearts', 2), 0, foundations)).toBe(true);
  });

  it('rejects card with rank gap', () => {
    const foundations: Card[][] = [[card('hearts', 1)], [], [], []];
    expect(canPlaceOnFoundation(card('hearts', 3), 0, foundations)).toBe(false);
  });

  it('rejects non-Ace on empty foundation', () => {
    const foundations: Card[][] = [[], [], [], []];
    expect(canPlaceOnFoundation(card('hearts', 2), 0, foundations)).toBe(false);
  });
});

// ── canSafeAutoMove ─────────────────────────────────────────

describe('canSafeAutoMove', () => {
  it('Aces are always safe', () => {
    const foundations: Card[][] = [[], [], [], []];
    expect(canSafeAutoMove(card('hearts', 1), foundations)).toBe(true);
  });

  it('2s are always safe', () => {
    const foundations: Card[][] = [
      [card('hearts', 1)],
      [],
      [],
      [],
    ];
    expect(canSafeAutoMove(card('hearts', 2), foundations)).toBe(true);
  });

  it('safe when opposite-color cards of rank-1 are on foundations', () => {
    // Moving hearts-3 — need clubs-2 and spades-2 on foundations
    const foundations: Card[][] = [
      [card('hearts', 1), card('hearts', 2)],  // hearts
      [],                                       // diamonds
      [card('clubs', 1), card('clubs', 2)],     // clubs
      [card('spades', 1), card('spades', 2)],   // spades
    ];
    expect(canSafeAutoMove(card('hearts', 3), foundations)).toBe(true);
  });

  it('not safe when opposite-color foundation is not high enough', () => {
    const foundations: Card[][] = [
      [card('hearts', 1), card('hearts', 2)],
      [],
      [card('clubs', 1)],  // only 1, need 2
      [card('spades', 1), card('spades', 2)],
    ];
    expect(canSafeAutoMove(card('hearts', 3), foundations)).toBe(false);
  });
});

// ── isWon ───────────────────────────────────────────────────

describe('isWon', () => {
  it('returns true when all 52 cards on foundations', () => {
    const state = emptyState();
    // Fill all foundations to 13
    for (let f = 0; f < 4; f++) {
      const suit = (['hearts', 'diamonds', 'clubs', 'spades'] as const)[f];
      for (let r = 1; r <= 13; r++) {
        state.foundations[f].push(card(suit, r as Card['rank']));
      }
    }
    expect(isWon(state)).toBe(true);
  });

  it('returns false when foundations incomplete', () => {
    const state = emptyState();
    state.foundations[0].push(card('hearts', 1));
    expect(isWon(state)).toBe(false);
  });
});

// ── isTriviallyWon ──────────────────────────────────────────

describe('isTriviallyWon', () => {
  it('returns true when all columns have descending same-suit runs', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 5), card('hearts', 4), card('hearts', 3)];
    state.columns[1] = [card('clubs', 2), card('clubs', 1)];
    // rest empty
    expect(isTriviallyWon(state)).toBe(true);
  });

  it('returns false when free cells are occupied', () => {
    const state = emptyState();
    state.freeCells[0] = card('hearts', 1);
    expect(isTriviallyWon(state)).toBe(false);
  });

  it('returns false when column has different suits', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 3), card('clubs', 2)];
    expect(isTriviallyWon(state)).toBe(false);
  });

  it('returns false when column not descending', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 3), card('hearts', 5)];
    expect(isTriviallyWon(state)).toBe(false);
  });

  it('returns true for fully empty board', () => {
    const state = emptyState();
    expect(isTriviallyWon(state)).toBe(true);
  });
});

// ── hasAnyMoves ─────────────────────────────────────────────

describe('hasAnyMoves', () => {
  it('returns true for a fresh game', () => {
    // Fresh game always has moves (empty free cells at minimum)
    const state = emptyState();
    state.columns[0] = [card('hearts', 5)];
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns false when completely stuck', () => {
    // Contrived: all free cells full, all columns occupied, no legal moves
    const state = emptyState();
    state.freeCells = [
      card('hearts', 13),
      card('diamonds', 13),
      card('clubs', 13),
      card('spades', 13),
    ];
    // Each column has a single card; none can go on any other (same rank)
    for (let i = 0; i < 8; i++) {
      state.columns[i] = [card('hearts', 12)]; // same card in each col (hypothetical)
    }
    // 12 can't go on 12, can't go to free cells (full), can't go to foundation (empty, not ace)
    expect(hasAnyMoves(state)).toBe(false);
  });

  it('returns true when free cell card can go to foundation', () => {
    const state = emptyState();
    state.freeCells = [card('hearts', 1), null, null, null];
    expect(hasAnyMoves(state)).toBe(true);
  });

  it('returns true when free cell card can go to a column', () => {
    const state = emptyState();
    state.freeCells = [
      card('hearts', 5),
      card('diamonds', 13),
      card('clubs', 13),
      card('spades', 13),
    ];
    state.columns[0] = [card('clubs', 6)]; // hearts-5 can go on clubs-6
    for (let i = 1; i < 8; i++) {
      state.columns[i] = [card('hearts', 12)];
    }
    expect(hasAnyMoves(state)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import type { Card, FreeCellGameState } from '../src/logic/types';
import {
  moveColumnToFreeCell,
  moveFreeCellToColumn,
  moveFreeCellToFoundation,
  moveColumnToColumn,
  moveColumnToFoundation,
  autoMoveToFoundations,
  autoFinish,
  cloneState,
} from '../src/logic/freecell/moves';

// ── Helpers ─────────────────────────────────────────────────

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

// ── cloneState ──────────────────────────────────────────────

describe('cloneState', () => {
  it('produces a deep copy', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 5)];
    state.freeCells[0] = card('clubs', 3);
    const clone = cloneState(state);

    expect(clone).toEqual(state);
    expect(clone).not.toBe(state);
    expect(clone.columns[0]).not.toBe(state.columns[0]);
    expect(clone.freeCells[0]).not.toBe(state.freeCells[0]);
  });
});

// ── moveColumnToFreeCell ────────────────────────────────────

describe('moveColumnToFreeCell', () => {
  it('moves bottom card from column to first empty free cell', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 5), card('clubs', 4)];

    const result = moveColumnToFreeCell(state, 0);
    expect(result).not.toBeNull();
    expect(result!.columns[0]).toHaveLength(1);
    expect(result!.freeCells[0]?.rank).toBe(4);
    expect(result!.moves).toBe(1);
  });

  it('returns null when all free cells are full', () => {
    const state = emptyState();
    state.freeCells = [card('hearts', 1), card('clubs', 1), card('diamonds', 1), card('spades', 1)];
    state.columns[0] = [card('hearts', 5)];

    expect(moveColumnToFreeCell(state, 0)).toBeNull();
  });

  it('returns null for empty column', () => {
    const state = emptyState();
    expect(moveColumnToFreeCell(state, 0)).toBeNull();
  });

  it('returns null for invalid column index', () => {
    const state = emptyState();
    expect(moveColumnToFreeCell(state, -1)).toBeNull();
    expect(moveColumnToFreeCell(state, 8)).toBeNull();
  });
});

// ── moveFreeCellToColumn ────────────────────────────────────

describe('moveFreeCellToColumn', () => {
  it('moves card to valid column', () => {
    const state = emptyState();
    state.freeCells[0] = card('clubs', 5);
    state.columns[0] = [card('hearts', 6)]; // clubs 5 on hearts 6 ✓

    const result = moveFreeCellToColumn(state, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.columns[0]).toHaveLength(2);
    expect(result!.freeCells[0]).toBeNull();
    expect(result!.moves).toBe(1);
  });

  it('moves card to empty column', () => {
    const state = emptyState();
    state.freeCells[0] = card('hearts', 5);

    const result = moveFreeCellToColumn(state, 0, 3);
    expect(result).not.toBeNull();
    expect(result!.columns[3]).toHaveLength(1);
  });

  it('returns null when placement is invalid', () => {
    const state = emptyState();
    state.freeCells[0] = card('hearts', 5);
    state.columns[0] = [card('diamonds', 6)]; // same color

    expect(moveFreeCellToColumn(state, 0, 0)).toBeNull();
  });

  it('returns null for empty free cell', () => {
    const state = emptyState();
    expect(moveFreeCellToColumn(state, 0, 0)).toBeNull();
  });
});

// ── moveFreeCellToFoundation ────────────────────────────────

describe('moveFreeCellToFoundation', () => {
  it('moves Ace to empty foundation', () => {
    const state = emptyState();
    state.freeCells[0] = card('hearts', 1);

    const result = moveFreeCellToFoundation(state, 0);
    expect(result).not.toBeNull();
    expect(result!.foundations[0]).toHaveLength(1);
    expect(result!.freeCells[0]).toBeNull();
  });

  it('returns null when card cannot go to foundation', () => {
    const state = emptyState();
    state.freeCells[0] = card('hearts', 3); // no 2 on foundation

    expect(moveFreeCellToFoundation(state, 0)).toBeNull();
  });
});

// ── moveColumnToColumn ──────────────────────────────────────

describe('moveColumnToColumn', () => {
  it('moves single card to valid target', () => {
    const state = emptyState();
    state.columns[0] = [card('clubs', 5)];
    state.columns[1] = [card('hearts', 6)];

    const result = moveColumnToColumn(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.columns[0]).toHaveLength(0);
    expect(result!.columns[1]).toHaveLength(2);
    expect(result!.moves).toBe(1);
  });

  it('moves valid sequence (supermove)', () => {
    const state = emptyState();
    // Sequence: hearts 6, clubs 5 (alternating color, descending)
    state.columns[0] = [card('hearts', 6), card('clubs', 5)];
    state.columns[1] = [card('spades', 7)]; // accepts hearts 6

    const result = moveColumnToColumn(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.columns[0]).toHaveLength(0);
    expect(result!.columns[1]).toHaveLength(3);
  });

  it('rejects supermove exceeding capacity', () => {
    const state = emptyState();
    // Fill all free cells
    state.freeCells = [card('hearts', 1), card('clubs', 1), card('diamonds', 1), card('spades', 1)];
    // Fill all columns except 0 and 1
    for (let i = 2; i < 8; i++) {
      state.columns[i] = [card('hearts', (i + 2) as Card['rank'])];
    }
    // Sequence of 2 cards but capacity = 1
    state.columns[0] = [card('hearts', 6), card('clubs', 5)];
    state.columns[1] = [card('spades', 7)];

    const result = moveColumnToColumn(state, 0, 0, 1);
    expect(result).toBeNull();
  });

  it('returns null for invalid sequence', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 5), card('hearts', 4)]; // same color
    state.columns[1] = [];

    const result = moveColumnToColumn(state, 0, 0, 1);
    expect(result).toBeNull();
  });

  it('returns null when source equals target', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 5)];

    expect(moveColumnToColumn(state, 0, 0, 0)).toBeNull();
  });

  it('moves single card to empty column', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 5)];

    const result = moveColumnToColumn(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.columns[1]).toHaveLength(1);
  });
});

// ── moveColumnToFoundation ──────────────────────────────────

describe('moveColumnToFoundation', () => {
  it('moves Ace from column bottom to foundation', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 1)];

    const result = moveColumnToFoundation(state, 0);
    expect(result).not.toBeNull();
    expect(result!.foundations[0]).toHaveLength(1);
    expect(result!.columns[0]).toHaveLength(0);
  });

  it('returns null when bottom card cannot go to foundation', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 3)];

    expect(moveColumnToFoundation(state, 0)).toBeNull();
  });

  it('returns null for empty column', () => {
    const state = emptyState();
    expect(moveColumnToFoundation(state, 0)).toBeNull();
  });
});

// ── autoMoveToFoundations ───────────────────────────────────

describe('autoMoveToFoundations', () => {
  it('auto-moves Aces from column bottoms', () => {
    const state = emptyState();
    state.columns[0] = [card('hearts', 1)];
    state.columns[1] = [card('diamonds', 1)];

    const result = autoMoveToFoundations(state);
    expect(result.foundations[0]).toHaveLength(1);
    expect(result.foundations[1]).toHaveLength(1);
    expect(result.columns[0]).toHaveLength(0);
    expect(result.columns[1]).toHaveLength(0);
  });

  it('auto-moves Aces from free cells', () => {
    const state = emptyState();
    state.freeCells[0] = card('hearts', 1);

    const result = autoMoveToFoundations(state);
    expect(result.foundations[0]).toHaveLength(1);
    expect(result.freeCells[0]).toBeNull();
  });

  it('chains auto-moves (Ace then 2)', () => {
    const state = emptyState();
    // Column 0 has Ace on bottom; after Ace goes to foundation,
    // nothing else should chain unless safe
    state.columns[0] = [card('hearts', 2), card('hearts', 1)];

    const result = autoMoveToFoundations(state);
    // Ace moves, then 2 is safe (rank ≤ 2)
    expect(result.foundations[0]).toHaveLength(2);
    expect(result.columns[0]).toHaveLength(0);
  });

  it('does not move when not safe', () => {
    const state = emptyState();
    state.foundations[0] = [card('hearts', 1), card('hearts', 2)];
    // hearts-3 is safe only if clubs-2 and spades-2 on foundations
    // They're NOT — so should not auto-move
    state.columns[0] = [card('hearts', 3)];

    const result = autoMoveToFoundations(state);
    expect(result.columns[0]).toHaveLength(1); // still there
  });

  it('sets won status when all 52 on foundations', () => {
    const state = emptyState();
    // Put 12 cards on each foundation + last card on column
    for (let f = 0; f < 4; f++) {
      const suit = (['hearts', 'diamonds', 'clubs', 'spades'] as const)[f];
      for (let r = 1; r <= 12; r++) {
        state.foundations[f].push(card(suit, r as Card['rank']));
      }
    }
    // Place all 4 Kings as bottom cards
    state.columns[0] = [card('hearts', 13)];
    state.columns[1] = [card('diamonds', 13)];
    state.columns[2] = [card('clubs', 13)];
    state.columns[3] = [card('spades', 13)];

    const result = autoMoveToFoundations(state);
    expect(result.status).toBe('won');
  });
});

// ── autoFinish ──────────────────────────────────────────────

describe('autoFinish', () => {
  it('sweeps all remaining cards to foundations', () => {
    const state = emptyState();
    // Foundations have Ace through 10 for each suit
    for (let f = 0; f < 4; f++) {
      const suit = (['hearts', 'diamonds', 'clubs', 'spades'] as const)[f];
      for (let r = 1; r <= 10; r++) {
        state.foundations[f].push(card(suit, r as Card['rank']));
      }
    }
    // Remaining: J-Q-K on columns (descending same-suit)
    state.columns[0] = [card('hearts', 13), card('hearts', 12), card('hearts', 11)];
    state.columns[1] = [card('diamonds', 13), card('diamonds', 12), card('diamonds', 11)];
    state.columns[2] = [card('clubs', 13), card('clubs', 12), card('clubs', 11)];
    state.columns[3] = [card('spades', 13), card('spades', 12), card('spades', 11)];

    const result = autoFinish(state);
    expect(result.status).toBe('won');
    expect(result.foundations.every((f) => f.length === 13)).toBe(true);
    expect(result.columns.every((c) => c.length === 0)).toBe(true);
  });
});

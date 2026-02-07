import { describe, it, expect } from 'vitest';
import {
  drawFromStock,
  recycleWaste,
  moveWasteToFoundation,
  moveWasteToTableau,
  moveTableauToTableau,
  moveTableauToFoundation,
  autoCompleteStep,
} from '../src/logic/moves';
import type { Card, GameState } from '../src/logic/types';

function makeCard(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}` };
}

function emptyState(): GameState {
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

describe('drawFromStock', () => {
  it('moves top stock card to waste face-up', () => {
    const state = emptyState();
    state.stock = [makeCard('hearts', 5, false), makeCard('spades', 3, false)];
    const result = drawFromStock(state);
    expect(result.stock).toHaveLength(1);
    expect(result.waste).toHaveLength(1);
    expect(result.waste[0].id).toBe('spades-3');
    expect(result.waste[0].faceUp).toBe(true);
  });

  it('returns same state if stock is empty', () => {
    const state = emptyState();
    expect(drawFromStock(state)).toBe(state);
  });

  it('does not mutate original state', () => {
    const state = emptyState();
    state.stock = [makeCard('hearts', 5, false)];
    const result = drawFromStock(state);
    expect(state.stock).toHaveLength(1);
    expect(state.waste).toHaveLength(0);
    expect(result.stock).toHaveLength(0);
  });
});

describe('recycleWaste', () => {
  it('moves all waste cards back to stock face-down', () => {
    const state = emptyState();
    state.waste = [makeCard('hearts', 1), makeCard('spades', 2), makeCard('clubs', 3)];
    const result = recycleWaste(state);
    expect(result.waste).toHaveLength(0);
    expect(result.stock).toHaveLength(3);
    expect(result.stock.every((c) => !c.faceUp)).toBe(true);
  });

  it('returns same state if stock is not empty', () => {
    const state = emptyState();
    state.stock = [makeCard('hearts', 1, false)];
    state.waste = [makeCard('spades', 2)];
    expect(recycleWaste(state)).toBe(state);
  });
});

describe('moveWasteToFoundation', () => {
  it('moves Ace from waste to correct foundation', () => {
    const state = emptyState();
    state.waste = [makeCard('hearts', 1)];
    const result = moveWasteToFoundation(state, 0); // hearts = index 0
    expect(result).not.toBeNull();
    expect(result!.waste).toHaveLength(0);
    expect(result!.foundations[0]).toHaveLength(1);
    expect(result!.score).toBe(10);
    expect(result!.moves).toBe(1);
  });

  it('returns null for invalid foundation move', () => {
    const state = emptyState();
    state.waste = [makeCard('hearts', 5)];
    expect(moveWasteToFoundation(state, 0)).toBeNull();
  });
});

describe('moveWasteToTableau', () => {
  it('moves card from waste to valid tableau pile', () => {
    const state = emptyState();
    state.waste = [makeCard('hearts', 9)]; // red 9
    state.tableau[0] = [makeCard('spades', 10)]; // black 10
    const result = moveWasteToTableau(state, 0);
    expect(result).not.toBeNull();
    expect(result!.waste).toHaveLength(0);
    expect(result!.tableau[0]).toHaveLength(2);
    expect(result!.score).toBe(5);
  });

  it('returns null for invalid tableau move', () => {
    const state = emptyState();
    state.waste = [makeCard('hearts', 9)];
    state.tableau[0] = [makeCard('diamonds', 10)]; // same color
    expect(moveWasteToTableau(state, 0)).toBeNull();
  });
});

describe('moveTableauToTableau', () => {
  it('moves a single card between piles', () => {
    const state = emptyState();
    state.tableau[0] = [makeCard('hearts', 9)]; // red 9
    state.tableau[1] = [makeCard('clubs', 10)]; // black 10
    const result = moveTableauToTableau(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.tableau[0]).toHaveLength(0);
    expect(result!.tableau[1]).toHaveLength(2);
  });

  it('moves a stack of face-up cards', () => {
    const state = emptyState();
    state.tableau[0] = [
      makeCard('clubs', 10), // black 10
      makeCard('hearts', 9), // red 9
      makeCard('spades', 8), // black 8
    ];
    state.tableau[1] = [makeCard('diamonds', 11)]; // red J
    const result = moveTableauToTableau(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.tableau[0]).toHaveLength(0);
    expect(result!.tableau[1]).toHaveLength(4);
  });

  it('reveals the new top card after moving', () => {
    const state = emptyState();
    state.tableau[0] = [
      makeCard('diamonds', 5, false), // face-down
      makeCard('hearts', 9),          // face-up, will be moved
    ];
    state.tableau[1] = [makeCard('clubs', 10)]; // black 10
    const result = moveTableauToTableau(state, 0, 1, 1);
    expect(result).not.toBeNull();
    expect(result!.tableau[0]).toHaveLength(1);
    expect(result!.tableau[0][0].faceUp).toBe(true); // revealed
  });

  it('returns null for invalid move', () => {
    const state = emptyState();
    state.tableau[0] = [makeCard('hearts', 9)];
    state.tableau[1] = [makeCard('diamonds', 10)]; // same color
    expect(moveTableauToTableau(state, 0, 0, 1)).toBeNull();
  });
});

describe('moveTableauToFoundation', () => {
  it('moves top tableau card to foundation', () => {
    const state = emptyState();
    state.tableau[0] = [makeCard('hearts', 1)]; // Ace
    const result = moveTableauToFoundation(state, 0);
    expect(result).not.toBeNull();
    expect(result!.tableau[0]).toHaveLength(0);
    expect(result!.foundations[0]).toHaveLength(1); // hearts = index 0
    expect(result!.score).toBe(10);
  });

  it('detects win when all foundations complete', () => {
    const state = emptyState();
    // Fill hearts 1-12 already
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    state.foundations = suits.map((suit) =>
      Array.from({ length: 12 }, (_, i) =>
        makeCard(suit, (i + 1) as Card['rank']),
      ),
    );
    // Put the four Kings in tableau
    state.tableau[0] = [makeCard('hearts', 13)];
    state.tableau[1] = [makeCard('diamonds', 13)];
    state.tableau[2] = [makeCard('clubs', 13)];
    state.tableau[3] = [makeCard('spades', 13)];

    // Move all four Kings
    let result: GameState | null = state;
    for (let i = 0; i < 4; i++) {
      result = moveTableauToFoundation(result!, i);
      expect(result).not.toBeNull();
    }
    expect(result!.status).toBe('won');
  });
});

describe('autoCompleteStep', () => {
  it('moves lowest available card to foundation', () => {
    const state = emptyState();
    state.tableau[0] = [makeCard('hearts', 1)]; // Ace of hearts
    const result = autoCompleteStep(state);
    expect(result).not.toBeNull();
    expect(result!.foundations[0]).toHaveLength(1);
  });

  it('returns null when no auto-move is possible', () => {
    const state = emptyState();
    state.tableau[0] = [makeCard('hearts', 5)]; // 5 can't go to empty foundation
    expect(autoCompleteStep(state)).toBeNull();
  });
});

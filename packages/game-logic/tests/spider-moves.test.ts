import { describe, it, expect } from 'vitest';
import { moveCards, dealRow } from '../src/logic/spider/moves';
import { newSpiderGame } from '../src/logic/spider/deal';
import type { Card, SpiderGameState } from '../src/logic/types';

function card(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}-test` };
}

function makeState(overrides: Partial<SpiderGameState> = {}): SpiderGameState {
  return {
    columns: Array.from({ length: 10 }, () => []),
    stock: [],
    foundations: Array.from({ length: 8 }, () => []),
    completedRuns: 0,
    score: 500,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    difficulty: 1,
    selectedSource: null,
    ...overrides,
  };
}

describe('moveCards', () => {
  it('moves a valid in-suit sequence to another column', () => {
    const state = makeState();
    state.columns[0] = [card('spades', 5), card('spades', 4)];
    state.columns[1] = [card('spades', 6)];

    const result = moveCards(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.columns[0]).toHaveLength(0);
    expect(result!.columns[1]).toHaveLength(3);
    expect(result!.columns[1].map((c) => c.rank)).toEqual([6, 5, 4]);
  });

  it('increments moves and decrements score', () => {
    const state = makeState();
    state.columns[0] = [card('spades', 3)];
    state.columns[1] = [card('spades', 4)];

    const result = moveCards(state, 0, 0, 1);
    expect(result!.moves).toBe(1);
    expect(result!.score).toBe(499);
  });

  it('rejects move with mismatched suits in sequence', () => {
    const state = makeState();
    state.columns[0] = [card('spades', 5), card('hearts', 4)];
    state.columns[1] = [card('spades', 6)];

    const result = moveCards(state, 0, 0, 1);
    expect(result).toBeNull();
  });

  it('rejects move to wrong rank', () => {
    const state = makeState();
    state.columns[0] = [card('spades', 3)];
    state.columns[1] = [card('spades', 8)];

    const result = moveCards(state, 0, 0, 1);
    expect(result).toBeNull();
  });

  it('allows move to empty column', () => {
    const state = makeState();
    state.columns[0] = [card('spades', 7), card('spades', 6)];
    state.columns[1] = [];

    const result = moveCards(state, 0, 0, 1);
    expect(result).not.toBeNull();
    expect(result!.columns[1]).toHaveLength(2);
  });

  it('flips the next card on the source column after a move', () => {
    const state = makeState();
    state.columns[0] = [card('hearts', 10, false), card('spades', 3)];
    state.columns[1] = [card('spades', 4)];

    const result = moveCards(state, 0, 1, 1);
    expect(result).not.toBeNull();
    expect(result!.columns[0]).toHaveLength(1);
    expect(result!.columns[0][0].faceUp).toBe(true);
  });

  it('detects and removes a completed run', () => {
    const state = makeState();
    // Build a column that will complete a K→A run after moving the last card
    const run: Card[] = [];
    for (let r = 13; r >= 2; r--) {
      run.push(card('spades', r as Card['rank']));
    }
    state.columns[0] = run; // K→2 (12 cards)
    state.columns[1] = [card('spades', 1)]; // Ace

    // Move Ace onto the K→2 run to complete it
    // Actually, we need to move the A onto column 0 where K→2 is
    const result = moveCards(state, 1, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.completedRuns).toBe(1);
    expect(result!.columns[0]).toHaveLength(0);
    expect(result!.foundations[0]).toHaveLength(13);
  });

  it('rejects move from same column to same column', () => {
    const state = makeState();
    state.columns[0] = [card('spades', 5)];
    const result = moveCards(state, 0, 0, 0);
    expect(result).toBeNull();
  });

  it('detects win after 8th completed run', () => {
    const state = makeState({ completedRuns: 7 });
    // Set foundations 0–6 as already completed
    for (let i = 0; i < 7; i++) {
      state.foundations[i] = Array.from({ length: 13 }, (_, j) =>
        card('spades', (13 - j) as Card['rank']),
      );
    }
    // Column 0: K→2 of spades
    const run: Card[] = [];
    for (let r = 13; r >= 2; r--) {
      run.push(card('spades', r as Card['rank']));
    }
    state.columns[0] = run;
    state.columns[1] = [card('spades', 1)];

    const result = moveCards(state, 1, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('won');
    expect(result!.completedRuns).toBe(8);
  });
});

describe('dealRow', () => {
  it('deals one card to each of the 10 columns', () => {
    const game = newSpiderGame(1);
    const stockBefore = game.stock.length;
    const result = dealRow(game);
    expect(result).not.toBeNull();
    expect(result!.stock).toHaveLength(stockBefore - 10);
    // Each column should have one more card than before
    for (let i = 0; i < 10; i++) {
      const expected = i < 4 ? 7 : 6;
      expect(result!.columns[i]).toHaveLength(expected);
    }
  });

  it('dealt cards are face-up', () => {
    const game = newSpiderGame(1);
    const result = dealRow(game);
    expect(result).not.toBeNull();
    for (const col of result!.columns) {
      expect(col[col.length - 1].faceUp).toBe(true);
    }
  });

  it('increments moves and decrements score', () => {
    const game = newSpiderGame(1);
    const result = dealRow(game);
    expect(result!.moves).toBe(1);
    expect(result!.score).toBe(499);
  });

  it('returns null when a column is empty', () => {
    const game = newSpiderGame(1);
    game.columns[3] = [];
    const result = dealRow(game);
    expect(result).toBeNull();
  });

  it('returns null when stock has fewer than 10 cards', () => {
    const state = makeState({
      stock: [card('spades', 1)],
      columns: Array.from({ length: 10 }, () => [card('spades', 5)]),
    });
    expect(dealRow(state)).toBeNull();
  });
});

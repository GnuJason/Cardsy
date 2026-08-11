import { describe, it, expect } from 'vitest';
import {
  isInSuitRun,
  getRunStart,
  canPlaceOnColumn,
  hasCompletedRun,
  canDealRow,
  isWon,
  hasAnyMoves,
} from '../src/logic/spider/rules';
import { newSpiderGame } from '../src/logic/spider/deal';
import type { Card, SpiderGameState } from '../src/logic/types';

function card(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}-test` };
}

describe('isInSuitRun', () => {
  it('returns true for a valid in-suit descending run', () => {
    const col = [card('spades', 5), card('spades', 4), card('spades', 3)];
    expect(isInSuitRun(col, 0)).toBe(true);
  });

  it('returns false if suits differ', () => {
    const col = [card('spades', 5), card('hearts', 4), card('spades', 3)];
    expect(isInSuitRun(col, 0)).toBe(false);
  });

  it('returns false if ranks not descending', () => {
    const col = [card('spades', 5), card('spades', 6)];
    expect(isInSuitRun(col, 0)).toBe(false);
  });

  it('returns false if a card is face-down', () => {
    const col = [card('spades', 5), card('spades', 4, false)];
    expect(isInSuitRun(col, 0)).toBe(false);
  });

  it('returns true for a single face-up card', () => {
    const col = [card('hearts', 10)];
    expect(isInSuitRun(col, 0)).toBe(true);
  });
});

describe('getRunStart', () => {
  it('returns the start of the longest in-suit run from bottom', () => {
    const col = [
      card('hearts', 3, false), // index 0 — face-down
      card('spades', 7),        // index 1
      card('spades', 6),        // index 2
      card('spades', 5),        // index 3
    ];
    expect(getRunStart(col)).toBe(1);
  });

  it('returns last index for a single card', () => {
    const col = [card('spades', 5)];
    expect(getRunStart(col)).toBe(0);
  });

  it('returns 0 for an empty column', () => {
    expect(getRunStart([])).toBe(0);
  });

  it('breaks at suit mismatch', () => {
    const col = [card('spades', 9), card('hearts', 8), card('hearts', 7)];
    expect(getRunStart(col)).toBe(1);
  });
});

describe('canPlaceOnColumn', () => {
  it('allows any card on an empty column', () => {
    expect(canPlaceOnColumn(card('spades', 5), [])).toBe(true);
  });

  it('allows rank-1 on top (any suit)', () => {
    const col = [card('hearts', 8)];
    expect(canPlaceOnColumn(card('spades', 7), col)).toBe(true);
  });

  it('rejects wrong rank', () => {
    const col = [card('hearts', 8)];
    expect(canPlaceOnColumn(card('spades', 6), col)).toBe(false);
  });

  it('rejects if top card is face-down', () => {
    const col = [card('hearts', 8, false)];
    expect(canPlaceOnColumn(card('spades', 7), col)).toBe(false);
  });
});

describe('hasCompletedRun', () => {
  it('detects a K→A in-suit run', () => {
    const col: Card[] = [];
    for (let r = 13; r >= 1; r--) {
      col.push(card('spades', r as Card['rank']));
    }
    expect(hasCompletedRun(col)).toBe(true);
  });

  it('returns false for fewer than 13 cards', () => {
    const col = [card('spades', 13), card('spades', 12)];
    expect(hasCompletedRun(col)).toBe(false);
  });

  it('returns false if not starting with K', () => {
    const col: Card[] = [];
    for (let r = 12; r >= 1; r--) {
      col.push(card('spades', r as Card['rank']));
    }
    // Pad to 13
    col.unshift(card('spades', 13, false));
    // Top of last 13 is 12, not 13
    expect(hasCompletedRun(col)).toBe(false);
  });

  it('returns false if mixed suits', () => {
    const col: Card[] = [];
    for (let r = 13; r >= 1; r--) {
      col.push(card(r === 7 ? 'hearts' : 'spades', r as Card['rank']));
    }
    expect(hasCompletedRun(col)).toBe(false);
  });
});

describe('canDealRow', () => {
  it('returns true when stock >= 10 and no empty columns', () => {
    const game = newSpiderGame(1);
    expect(canDealRow(game)).toBe(true);
  });

  it('returns false when a column is empty', () => {
    const game = newSpiderGame(1);
    game.columns[0] = [];
    expect(canDealRow(game)).toBe(false);
  });

  it('returns false when stock has fewer than 10 cards', () => {
    const game = newSpiderGame(1);
    game.stock = game.stock.slice(0, 5);
    expect(canDealRow(game)).toBe(false);
  });
});

describe('isWon', () => {
  it('returns true when completedRuns >= 8', () => {
    const game = newSpiderGame(1);
    game.completedRuns = 8;
    expect(isWon(game)).toBe(true);
  });

  it('returns false when completedRuns < 8', () => {
    const game = newSpiderGame(1);
    game.completedRuns = 7;
    expect(isWon(game)).toBe(false);
  });
});

describe('hasAnyMoves', () => {
  it('returns true at the start of a new game', () => {
    const game = newSpiderGame(1);
    expect(hasAnyMoves(game)).toBe(true);
  });

  it('returns false for a stuck board with no stock', () => {
    const state: SpiderGameState = {
      columns: [
        [card('spades', 1)],
        [card('hearts', 1)],
        [card('spades', 13)],
        [card('hearts', 13)],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
      stock: [],
      foundations: Array.from({ length: 8 }, () => []),
      completedRuns: 0,
      score: 496,
      moves: 4,
      elapsedSeconds: 0,
      status: 'playing',
      difficulty: 2,
      selectedSource: null,
    };
    // Aces can't go on kings, and moving to empty columns at index 0 is pointless
    expect(hasAnyMoves(state)).toBe(false);
  });
});

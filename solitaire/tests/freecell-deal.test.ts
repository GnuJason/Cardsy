import { describe, it, expect } from 'vitest';
import { dealFreeCell, newFreeCellGame } from '../src/logic/freecell/deal';
import { createDeck, shuffle } from '../src/logic/deck';
import { COLUMN_COUNT, FREE_CELL_COUNT, FOUNDATION_COUNT, cardsInColumn } from '../src/logic/freecell/layout';

describe('FreeCell layout constants', () => {
  it('has 8 columns', () => {
    expect(COLUMN_COUNT).toBe(8);
  });

  it('has 4 free cells', () => {
    expect(FREE_CELL_COUNT).toBe(4);
  });

  it('has 4 foundations', () => {
    expect(FOUNDATION_COUNT).toBe(4);
  });

  it('columns 0-3 get 7 cards', () => {
    for (let i = 0; i < 4; i++) {
      expect(cardsInColumn(i)).toBe(7);
    }
  });

  it('columns 4-7 get 6 cards', () => {
    for (let i = 4; i < 8; i++) {
      expect(cardsInColumn(i)).toBe(6);
    }
  });
});

describe('dealFreeCell', () => {
  it('distributes all 52 cards across 8 columns', () => {
    const deck = shuffle(createDeck());
    const { columns } = dealFreeCell(deck);
    expect(columns).toHaveLength(8);
    const totalCards = columns.reduce((sum, col) => sum + col.length, 0);
    expect(totalCards).toBe(52);
  });

  it('gives columns 0-3 seven cards each', () => {
    const deck = shuffle(createDeck());
    const { columns } = dealFreeCell(deck);
    for (let i = 0; i < 4; i++) {
      expect(columns[i]).toHaveLength(7);
    }
  });

  it('gives columns 4-7 six cards each', () => {
    const deck = shuffle(createDeck());
    const { columns } = dealFreeCell(deck);
    for (let i = 4; i < 8; i++) {
      expect(columns[i]).toHaveLength(6);
    }
  });

  it('all cards are face-up', () => {
    const deck = shuffle(createDeck());
    const { columns } = dealFreeCell(deck);
    for (const col of columns) {
      for (const card of col) {
        expect(card.faceUp).toBe(true);
      }
    }
  });

  it('has no duplicate card IDs', () => {
    const deck = shuffle(createDeck());
    const { columns } = dealFreeCell(deck);
    const ids = columns.flat().map((c) => c.id);
    expect(new Set(ids).size).toBe(52);
  });
});

describe('newFreeCellGame', () => {
  it('creates a game with status playing', () => {
    const game = newFreeCellGame();
    expect(game.status).toBe('playing');
  });

  it('starts with 0 moves', () => {
    const game = newFreeCellGame();
    expect(game.moves).toBe(0);
  });

  it('starts with empty free cells', () => {
    const game = newFreeCellGame();
    expect(game.freeCells).toHaveLength(4);
    expect(game.freeCells.every((c) => c === null)).toBe(true);
  });

  it('starts with empty foundations', () => {
    const game = newFreeCellGame();
    expect(game.foundations).toHaveLength(4);
    expect(game.foundations.every((f) => f.length === 0)).toBe(true);
  });

  it('has no selected source', () => {
    const game = newFreeCellGame();
    expect(game.selectedSource).toBeNull();
  });

  it('has 52 cards across 8 columns', () => {
    const game = newFreeCellGame();
    const total = game.columns.reduce((s, c) => s + c.length, 0);
    expect(total).toBe(52);
    expect(game.columns).toHaveLength(8);
  });
});

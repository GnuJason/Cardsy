import { describe, it, expect } from 'vitest';
import { dealGolf, newGolfGame, GOLF_COLUMNS, GOLF_ROWS, GOLF_TABLEAU_SIZE } from '../src/logic/golf/deal';
import { createDeck, shuffle } from '../src/logic/deck';

describe('dealGolf', () => {
  const deck = shuffle(createDeck());
  const { tableau, stock, waste } = dealGolf(deck);

  it('creates 7 columns', () => {
    expect(tableau).toHaveLength(GOLF_COLUMNS);
  });

  it('each column has 5 cards', () => {
    for (const col of tableau) {
      expect(col).toHaveLength(GOLF_ROWS);
    }
  });

  it('all tableau cards are face-up', () => {
    for (const col of tableau) {
      for (const card of col) {
        expect(card.faceUp).toBe(true);
      }
    }
  });

  it('stock has 16 cards', () => {
    expect(stock).toHaveLength(16);
  });

  it('all stock cards are face-down', () => {
    for (const card of stock) {
      expect(card.faceUp).toBe(false);
    }
  });

  it('waste has 1 face-up card', () => {
    expect(waste).toHaveLength(1);
    expect(waste[0].faceUp).toBe(true);
  });

  it('uses all 52 cards exactly once', () => {
    const allCards = [
      ...tableau.flat(),
      ...stock,
      ...waste,
    ];
    expect(allCards).toHaveLength(52);
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(52);
  });

  it('total tableau cards equals GOLF_TABLEAU_SIZE (35)', () => {
    const total = tableau.reduce((sum, col) => sum + col.length, 0);
    expect(total).toBe(GOLF_TABLEAU_SIZE);
  });
});

describe('newGolfGame', () => {
  const game = newGolfGame();

  it('initializes with status playing', () => {
    expect(game.status).toBe('playing');
  });

  it('starts with 35 cardsRemaining', () => {
    expect(game.cardsRemaining).toBe(35);
  });

  it('starts with 0 moves', () => {
    expect(game.moves).toBe(0);
  });

  it('starts with 0 elapsed seconds', () => {
    expect(game.elapsedSeconds).toBe(0);
  });

  it('has 7 tableau columns', () => {
    expect(game.tableau).toHaveLength(7);
  });

  it('has 16 stock cards', () => {
    expect(game.stock).toHaveLength(16);
  });

  it('has 1 waste card', () => {
    expect(game.waste).toHaveLength(1);
  });

  it('produces different deals on successive calls', () => {
    const game2 = newGolfGame();
    // Extremely unlikely to get the same deal twice
    const ids1 = game.tableau.flat().map((c) => c.id).join(',');
    const ids2 = game2.tableau.flat().map((c) => c.id).join(',');
    expect(ids1).not.toBe(ids2);
  });
});

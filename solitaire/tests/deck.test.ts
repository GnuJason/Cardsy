import { describe, it, expect } from 'vitest';
import { createDeck, shuffle, dealKlondike, newGame } from '../src/logic/deck';

describe('createDeck', () => {
  it('creates 52 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('has no duplicate IDs', () => {
    const deck = createDeck();
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(52);
  });

  it('has 13 cards per suit', () => {
    const deck = createDeck();
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
    for (const suit of suits) {
      const count = deck.filter((c) => c.suit === suit).length;
      expect(count).toBe(13);
    }
  });

  it('all cards are face-down', () => {
    const deck = createDeck();
    expect(deck.every((c) => !c.faceUp)).toBe(true);
  });
});

describe('shuffle', () => {
  it('preserves all 52 cards', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(52);

    const originalIds = deck.map((c) => c.id).sort();
    const shuffledIds = shuffled.map((c) => c.id).sort();
    expect(shuffledIds).toEqual(originalIds);
  });

  it('does not mutate the original deck', () => {
    const deck = createDeck();
    const originalOrder = deck.map((c) => c.id);
    shuffle(deck);
    expect(deck.map((c) => c.id)).toEqual(originalOrder);
  });

  it('produces a different order (probabilistic)', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    // Extremely unlikely that a shuffle produces the exact same order
    const sameOrder = deck.every((c, i) => c.id === shuffled[i].id);
    expect(sameOrder).toBe(false);
  });
});

describe('dealKlondike', () => {
  it('creates 7 tableau piles of sizes 1-7', () => {
    const deck = shuffle(createDeck());
    const { tableau } = dealKlondike(deck);
    expect(tableau).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(tableau[i]).toHaveLength(i + 1);
    }
  });

  it('has the last card of each pile face-up, rest face-down', () => {
    const deck = shuffle(createDeck());
    const { tableau } = dealKlondike(deck);
    for (let i = 0; i < 7; i++) {
      const pile = tableau[i];
      for (let j = 0; j < pile.length; j++) {
        if (j === pile.length - 1) {
          expect(pile[j].faceUp).toBe(true);
        } else {
          expect(pile[j].faceUp).toBe(false);
        }
      }
    }
  });

  it('puts 24 cards in the stock', () => {
    const deck = shuffle(createDeck());
    const { stock } = dealKlondike(deck);
    expect(stock).toHaveLength(24);
    expect(stock.every((c) => !c.faceUp)).toBe(true);
  });

  it('uses all 52 cards between tableau and stock', () => {
    const deck = shuffle(createDeck());
    const { tableau, stock } = dealKlondike(deck);
    const total = tableau.reduce((s, p) => s + p.length, 0) + stock.length;
    expect(total).toBe(52);
  });
});

describe('newGame', () => {
  it('returns a valid initial game layout', () => {
    const { stock, waste, tableau, foundations } = newGame();
    expect(stock).toHaveLength(24);
    expect(waste).toHaveLength(0);
    expect(tableau).toHaveLength(7);
    expect(foundations).toHaveLength(4);
    expect(foundations.every((f) => f.length === 0)).toBe(true);
  });
});

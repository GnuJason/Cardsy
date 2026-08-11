import { describe, it, expect } from 'vitest';
import { createSpiderDeck, dealSpider, newSpiderGame } from '../src/logic/spider/deal';
import { COLUMN_COUNT, TOTAL_CARDS } from '../src/logic/spider/layout';

describe('createSpiderDeck', () => {
  it('creates 104 cards for 1-suit difficulty', () => {
    const deck = createSpiderDeck(1);
    expect(deck).toHaveLength(TOTAL_CARDS);
  });

  it('creates 104 cards for 2-suit difficulty', () => {
    const deck = createSpiderDeck(2);
    expect(deck).toHaveLength(TOTAL_CARDS);
  });

  it('creates 104 cards for 4-suit difficulty', () => {
    const deck = createSpiderDeck(4);
    expect(deck).toHaveLength(TOTAL_CARDS);
  });

  it('1-suit only uses spades', () => {
    const deck = createSpiderDeck(1);
    expect(deck.every((c) => c.suit === 'spades')).toBe(true);
  });

  it('2-suit uses spades and hearts', () => {
    const deck = createSpiderDeck(2);
    const suits = new Set(deck.map((c) => c.suit));
    expect(suits).toEqual(new Set(['spades', 'hearts']));
    expect(deck.filter((c) => c.suit === 'spades')).toHaveLength(52);
    expect(deck.filter((c) => c.suit === 'hearts')).toHaveLength(52);
  });

  it('4-suit uses all four suits with 26 each', () => {
    const deck = createSpiderDeck(4);
    const suits = new Set(deck.map((c) => c.suit));
    expect(suits).toEqual(new Set(['spades', 'hearts', 'diamonds', 'clubs']));
    for (const suit of suits) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(26);
    }
  });

  it('all cards start face-down', () => {
    const deck = createSpiderDeck(1);
    expect(deck.every((c) => !c.faceUp)).toBe(true);
  });

  it('has no duplicate IDs', () => {
    const deck = createSpiderDeck(4);
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(TOTAL_CARDS);
  });
});

describe('dealSpider', () => {
  it('deals 10 columns', () => {
    const deck = createSpiderDeck(1);
    const { columns } = dealSpider(deck);
    expect(columns).toHaveLength(COLUMN_COUNT);
  });

  it('columns 0-3 have 6 cards; columns 4-9 have 5 cards', () => {
    const deck = createSpiderDeck(1);
    const { columns } = dealSpider(deck);
    for (let i = 0; i < 4; i++) expect(columns[i]).toHaveLength(6);
    for (let i = 4; i < 10; i++) expect(columns[i]).toHaveLength(5);
  });

  it('only the top card of each column is face-up', () => {
    const deck = createSpiderDeck(2);
    const { columns } = dealSpider(deck);
    for (const col of columns) {
      const last = col[col.length - 1];
      expect(last.faceUp).toBe(true);
      for (let i = 0; i < col.length - 1; i++) {
        expect(col[i].faceUp).toBe(false);
      }
    }
  });

  it('remaining cards go to stock', () => {
    const deck = createSpiderDeck(1);
    const { columns, stock } = dealSpider(deck);
    const dealt = columns.reduce((sum, col) => sum + col.length, 0);
    expect(dealt + stock.length).toBe(TOTAL_CARDS);
    expect(stock).toHaveLength(50);
  });

  it('stock cards are all face-down', () => {
    const deck = createSpiderDeck(1);
    const { stock } = dealSpider(deck);
    expect(stock.every((c) => !c.faceUp)).toBe(true);
  });
});

describe('newSpiderGame', () => {
  it('creates a valid initial game state', () => {
    const game = newSpiderGame(1);
    expect(game.status).toBe('playing');
    expect(game.score).toBe(500);
    expect(game.moves).toBe(0);
    expect(game.completedRuns).toBe(0);
    expect(game.difficulty).toBe(1);
    expect(game.selectedSource).toBeNull();
    expect(game.foundations).toHaveLength(8);
    expect(game.foundations.every((f) => f.length === 0)).toBe(true);
  });

  it('deals are shuffled (not identical across games)', () => {
    const g1 = newSpiderGame(4);
    const g2 = newSpiderGame(4);
    // Overwhelmingly unlikely that both are identical
    const ids1 = g1.columns.flat().map((c) => c.id);
    const ids2 = g2.columns.flat().map((c) => c.id);
    expect(ids1).not.toEqual(ids2);
  });
});

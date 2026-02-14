import { describe, it, expect } from 'vitest';
import { dealPyramid, newPyramidGame } from '../src/logic/pyramid/deal';
import { PYRAMID_SIZE } from '../src/logic/pyramid/layout';
import { createDeck, shuffle } from '../src/logic/deck';

describe('dealPyramid', () => {
  const deck = shuffle(createDeck());
  const { pyramid, stock, waste } = dealPyramid(deck);

  it('creates 28 pyramid cards', () => {
    expect(pyramid).toHaveLength(PYRAMID_SIZE);
  });

  it('all pyramid cards are face-up', () => {
    for (const card of pyramid) {
      expect(card.faceUp).toBe(true);
    }
  });

  it('pyramid cards have correct pyramidIndex values', () => {
    for (let i = 0; i < PYRAMID_SIZE; i++) {
      expect(pyramid[i].pyramidIndex).toBe(i);
    }
  });

  it('all pyramid cards start with removed = false', () => {
    for (const card of pyramid) {
      expect(card.removed).toBe(false);
    }
  });

  it('stock has 24 cards', () => {
    expect(stock).toHaveLength(24);
  });

  it('all stock cards are face-down', () => {
    for (const card of stock) {
      expect(card.faceUp).toBe(false);
    }
  });

  it('waste starts empty', () => {
    expect(waste).toHaveLength(0);
  });

  it('uses all 52 cards exactly once', () => {
    const allCards = [...pyramid, ...stock, ...waste];
    expect(allCards).toHaveLength(52);
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(52);
  });
});

describe('newPyramidGame', () => {
  const game = newPyramidGame();

  it('initializes with status playing', () => {
    expect(game.status).toBe('playing');
  });

  it('starts with 28 cardsRemaining', () => {
    expect(game.cardsRemaining).toBe(28);
  });

  it('starts with 0 moves', () => {
    expect(game.moves).toBe(0);
  });

  it('starts with 0 elapsed seconds', () => {
    expect(game.elapsedSeconds).toBe(0);
  });

  it('starts with null selectedIndex', () => {
    expect(game.selectedIndex).toBeNull();
  });

  it('has 28 pyramid cards', () => {
    expect(game.pyramid).toHaveLength(28);
  });

  it('has 24 stock cards', () => {
    expect(game.stock).toHaveLength(24);
  });

  it('has 0 waste cards', () => {
    expect(game.waste).toHaveLength(0);
  });

  it('produces different deals on successive calls', () => {
    const game2 = newPyramidGame();
    const ids1 = game.pyramid.map((c) => c.id).join(',');
    const ids2 = game2.pyramid.map((c) => c.id).join(',');
    expect(ids1).not.toBe(ids2);
  });
});

import { describe, it, expect } from 'vitest';
import { dealTriPeaks, newTriPeaksGame } from '../src/logic/tripeaks/deal';
import { createDeck, shuffle } from '../src/logic/deck';
import { PYRAMID_SIZE, BOTTOM_ROW } from '../src/logic/tripeaks/layout';

describe('dealTriPeaks', () => {
  const deck = shuffle(createDeck());
  const { pyramid, stock, waste } = dealTriPeaks(deck);

  it('produces 28 pyramid cards', () => {
    expect(pyramid).toHaveLength(PYRAMID_SIZE);
  });

  it('produces 23 stock cards', () => {
    expect(stock).toHaveLength(23);
  });

  it('produces 1 waste card', () => {
    expect(waste).toHaveLength(1);
  });

  it('uses all 52 unique cards', () => {
    const allIds = [
      ...pyramid.map((c) => c.id),
      ...stock.map((c) => c.id),
      ...waste.map((c) => c.id),
    ];
    expect(new Set(allIds).size).toBe(52);
    expect(allIds).toHaveLength(52);
  });

  it('bottom row cards (18-27) are face-up', () => {
    const bottomRowSet = new Set(BOTTOM_ROW as readonly number[]);
    for (const card of pyramid) {
      if (bottomRowSet.has(card.pyramidIndex)) {
        expect(card.faceUp).toBe(true);
      }
    }
  });

  it('upper row cards (0-17) are face-down', () => {
    const bottomRowSet = new Set(BOTTOM_ROW as readonly number[]);
    for (const card of pyramid) {
      if (!bottomRowSet.has(card.pyramidIndex)) {
        expect(card.faceUp).toBe(false);
      }
    }
  });

  it('no pyramid cards are initially removed', () => {
    for (const card of pyramid) {
      expect(card.removed).toBe(false);
    }
  });

  it('waste card is face-up', () => {
    expect(waste[0].faceUp).toBe(true);
  });

  it('stock cards are face-down', () => {
    for (const card of stock) {
      expect(card.faceUp).toBe(false);
    }
  });

  it('assigns correct pyramidIndex to each card', () => {
    pyramid.forEach((card, i) => {
      expect(card.pyramidIndex).toBe(i);
    });
  });
});

describe('newTriPeaksGame', () => {
  const game = newTriPeaksGame();

  it('starts with score 0', () => {
    expect(game.score).toBe(0);
  });

  it('starts with 0 moves', () => {
    expect(game.moves).toBe(0);
  });

  it('starts with streak 0', () => {
    expect(game.streak).toBe(0);
  });

  it('starts with status playing', () => {
    expect(game.status).toBe('playing');
  });

  it('starts with no peaks cleared', () => {
    expect(game.peaksCleared).toEqual([false, false, false]);
  });

  it('has correct card counts', () => {
    expect(game.pyramid).toHaveLength(28);
    expect(game.stock).toHaveLength(23);
    expect(game.waste).toHaveLength(1);
  });
});

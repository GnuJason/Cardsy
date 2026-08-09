import type { Card, PyramidCard, PyramidGameState } from '../types';
import { createDeck, shuffle } from '../deck';
import { createShuffleSeed } from '../random';
import { PYRAMID_SIZE } from './layout';

/**
 * Deal a Pyramid game from a shuffled 52-card deck.
 * - First 28 cards → pyramid (all face-up)
 * - Remaining 24 cards → stock (face-down)
 * - Waste starts empty
 */
export function dealPyramid(deck: Card[]): {
  pyramid: PyramidCard[];
  stock: Card[];
  waste: Card[];
} {
  const pyramid: PyramidCard[] = [];

  for (let i = 0; i < PYRAMID_SIZE; i++) {
    const card = deck[i];
    pyramid.push({
      ...card,
      faceUp: true,
      pyramidIndex: i,
      removed: false,
    });
  }

  // 24 cards for stock (face-down)
  const stock = deck.slice(PYRAMID_SIZE).map((c) => ({ ...c, faceUp: false }));

  return { pyramid, stock, waste: [] };
}

/**
 * Create a fresh Pyramid game with a shuffled deck.
 */
export function newPyramidGame(): PyramidGameState {
  const shuffleSeed = createShuffleSeed();
  const deck = shuffle(createDeck(), shuffleSeed);
  const { pyramid, stock, waste } = dealPyramid(deck);

  return {
    pyramid,
    stock,
    waste,
    shuffleSeed,
    cardsRemaining: PYRAMID_SIZE,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    selectedIndex: null,
  };
}

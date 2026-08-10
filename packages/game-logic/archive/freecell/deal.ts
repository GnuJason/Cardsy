import type { Card, FreeCellGameState } from '../types';
import { createDeck, shuffle } from '../deck';
import { createShuffleSeed } from '../random';
import { COLUMN_COUNT, FREE_CELL_COUNT, FOUNDATION_COUNT } from './layout';

/**
 * Deal a FreeCell game from a shuffled 52-card deck.
 * Cards are dealt left-to-right across 8 columns.
 * Columns 0–3 get 7 cards; columns 4–7 get 6 cards.
 * All cards face-up.
 */
export function dealFreeCell(deck: Card[]): {
  columns: Card[][];
} {
  const columns: Card[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  for (let i = 0; i < 52; i++) {
    const colIndex = i % COLUMN_COUNT;
    columns[colIndex].push({ ...deck[i], faceUp: true });
  }
  return { columns };
}

/**
 * Create a fresh FreeCell game with a shuffled deck.
 */
export function newFreeCellGame(): FreeCellGameState {
  const shuffleSeed = createShuffleSeed();
  const deck = shuffle(createDeck(), shuffleSeed);
  const { columns } = dealFreeCell(deck);

  return {
    columns,
    freeCells: Array.from({ length: FREE_CELL_COUNT }, () => null),
    foundations: Array.from({ length: FOUNDATION_COUNT }, () => []),
    shuffleSeed,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
    selectedSource: null,
  };
}

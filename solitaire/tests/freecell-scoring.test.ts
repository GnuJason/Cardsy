import { describe, it, expect } from 'vitest';
import { movesCount, undoPenalty } from '../src/logic/freecell/scoring';
import type { FreeCellGameState } from '../src/logic/types';

function emptyState(moves = 0): FreeCellGameState {
  return {
    columns: Array.from({ length: 8 }, () => []),
    freeCells: [null, null, null, null],
    foundations: [[], [], [], []],
    moves,
    elapsedSeconds: 0,
    status: 'playing',
    selectedSource: null,
  };
}

describe('FreeCell scoring', () => {
  it('movesCount returns the move count', () => {
    expect(movesCount(emptyState(0))).toBe(0);
    expect(movesCount(emptyState(42))).toBe(42);
  });

  it('undoPenalty is always 0', () => {
    expect(undoPenalty()).toBe(0);
  });
});

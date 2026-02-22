import { describe, expect, it } from 'vitest';
import { canDrop, type DragEndpoint } from '../../src/pixi/interaction/DragValidator';
import type {
  Card,
  FreeCellGameState,
  GameState,
  SpiderGameState,
} from '../../src/logic/types';

function card(suit: Card['suit'], rank: Card['rank'], faceUp = true): Card {
  return { suit, rank, faceUp, id: `${suit}-${rank}` };
}

describe('canDrop', () => {
  it('validates Klondike waste to tableau drop', () => {
    const gameState: GameState = {
      stock: [],
      waste: [card('hearts', 7)],
      tableau: [
        [card('clubs', 8)],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
      foundations: [[], [], [], []],
      score: 0,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };

    const source: DragEndpoint = { pileType: 'waste', pileIndex: 0, cardIndex: 0 };
    const target: DragEndpoint = { pileType: 'tableau', pileIndex: 0, cardIndex: 0 };

    expect(canDrop('klondike', gameState, source, target)).toBe(true);
  });

  it('rejects Klondike tableau to wrong foundation index', () => {
    const gameState: GameState = {
      stock: [],
      waste: [],
      tableau: [
        [card('hearts', 1)],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
      foundations: [[], [], [], []],
      score: 0,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    };

    const source: DragEndpoint = { pileType: 'tableau', pileIndex: 0, cardIndex: 0 };
    const target: DragEndpoint = { pileType: 'foundation', pileIndex: 2, cardIndex: 0 };

    expect(canDrop('klondike', gameState, source, target)).toBe(false);
  });

  it('validates FreeCell column to freecell target slot', () => {
    const gameState: FreeCellGameState = {
      columns: [[card('spades', 9)], [], [], [], [], [], [], []],
      freeCells: [null, card('hearts', 4), null, null],
      foundations: [[], [], [], []],
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
      selectedSource: null,
    };

    const source: DragEndpoint = { pileType: 'column', pileIndex: 0, cardIndex: 0 };
    const target: DragEndpoint = { pileType: 'freecell', pileIndex: 0, cardIndex: 0 };

    expect(canDrop('freecell', gameState, source, target)).toBe(true);
  });

  it('rejects FreeCell column to occupied freecell slot', () => {
    const gameState: FreeCellGameState = {
      columns: [[card('spades', 9)], [], [], [], [], [], [], []],
      freeCells: [card('clubs', 2), null, null, null],
      foundations: [[], [], [], []],
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
      selectedSource: null,
    };

    const source: DragEndpoint = { pileType: 'column', pileIndex: 0, cardIndex: 0 };
    const target: DragEndpoint = { pileType: 'freecell', pileIndex: 0, cardIndex: 0 };

    expect(canDrop('freecell', gameState, source, target)).toBe(false);
  });

  it('validates Spider column to column drop', () => {
    const gameState: SpiderGameState = {
      columns: [
        [card('spades', 7), card('spades', 6)],
        [card('hearts', 8)],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
      stock: [],
      foundations: [[], [], [], [], [], [], [], []],
      completedRuns: 0,
      score: 500,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
      difficulty: 1,
      selectedSource: null,
    };

    const source: DragEndpoint = { pileType: 'column', pileIndex: 0, cardIndex: 0 };
    const target: DragEndpoint = { pileType: 'column', pileIndex: 1, cardIndex: 0 };

    expect(canDrop('spider', gameState, source, target)).toBe(true);
  });

  it('disables drag targets for tap-only modes', () => {
    const source: DragEndpoint = { pileType: 'pyramid', pileIndex: 0, cardIndex: 0 };
    const target: DragEndpoint = { pileType: 'waste', pileIndex: 0, cardIndex: 0 };

    expect(
      canDrop(
        'tripeaks',
        {
          pyramid: [],
          stock: [],
          waste: [],
          score: 0,
          moves: 0,
          streak: 0,
          elapsedSeconds: 0,
          status: 'playing',
          peaksCleared: [false, false, false],
        },
        source,
        target,
      ),
    ).toBe(false);
  });
});

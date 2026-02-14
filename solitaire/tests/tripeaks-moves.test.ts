import { describe, it, expect } from 'vitest';
import { drawFromStock, playCard } from '../src/logic/tripeaks/moves';
import { newTriPeaksGame } from '../src/logic/tripeaks/deal';
import type { TriPeaksGameState, TriPeaksCard, Card } from '../src/logic/types';

function makeCard(rank: number, index: number, removed = false, faceUp = true): TriPeaksCard {
  return {
    suit: 'hearts',
    rank: rank as Card['rank'],
    faceUp,
    id: `hearts-${rank}-${index}`,
    pyramidIndex: index,
    removed,
  };
}

/** Create a minimal testable state with controlled pyramid */
function makeState(overrides: Partial<TriPeaksGameState> = {}): TriPeaksGameState {
  // Default: all upper cards removed, only bottom row remains
  const pyramid: TriPeaksCard[] = Array.from({ length: 28 }, (_, i) => {
    if (i < 18) return makeCard((i % 13) + 1, i, true); // removed
    return makeCard((i % 13) + 1, i, false, true); // bottom row, exposed
  });

  return {
    pyramid,
    stock: [
      { suit: 'clubs', rank: 3, faceUp: false, id: 'clubs-3' },
      { suit: 'clubs', rank: 7, faceUp: false, id: 'clubs-7' },
    ],
    waste: [{ suit: 'spades', rank: 7, faceUp: true, id: 'spades-7' }],
    score: 0,
    moves: 0,
    streak: 0,
    elapsedSeconds: 0,
    status: 'playing',
    peaksCleared: [false, false, false],
    ...overrides,
  };
}

describe('drawFromStock', () => {
  it('moves top stock card to waste face-up', () => {
    const state = makeState();
    const result = drawFromStock(state);
    expect(result).not.toBeNull();
    expect(result!.stock).toHaveLength(1);
    expect(result!.waste).toHaveLength(2);
    expect(result!.waste[result!.waste.length - 1].faceUp).toBe(true);
    expect(result!.waste[result!.waste.length - 1].id).toBe('clubs-7');
  });

  it('resets streak to 0', () => {
    const state = makeState({ streak: 5 });
    const result = drawFromStock(state);
    expect(result!.streak).toBe(0);
  });

  it('increments moves', () => {
    const state = makeState();
    const result = drawFromStock(state);
    expect(result!.moves).toBe(1);
  });

  it('returns null when stock is empty', () => {
    const state = makeState({ stock: [] });
    expect(drawFromStock(state)).toBeNull();
  });

  it('does not mutate original state', () => {
    const state = makeState();
    const origStockLen = state.stock.length;
    drawFromStock(state);
    expect(state.stock).toHaveLength(origStockLen);
  });
});

describe('playCard', () => {
  it('plays an exposed card matching waste top ±1', () => {
    // Bottom row index 18 has rank (18%13)+1 = 6, waste top = 7 → match ±1
    const state = makeState();
    const result = playCard(state, 18);
    expect(result).not.toBeNull();
    expect(result!.pyramid[18].removed).toBe(true);
    expect(result!.waste[result!.waste.length - 1].rank).toBe(state.pyramid[18].rank);
  });

  it('increments streak on successful play', () => {
    const state = makeState({ streak: 2 });
    const result = playCard(state, 18);
    expect(result).not.toBeNull();
    expect(result!.streak).toBe(3);
  });

  it('applies streak-based scoring', () => {
    // streak=2 → scoreCardPlay(2) = 10 + 2*5 = 20
    // Use peaksCleared=[true,true,true] to avoid peak bonuses from pre-removed upper cards
    const state = makeState({ streak: 2, peaksCleared: [true, true, true] });
    const result = playCard(state, 18);
    expect(result!.score).toBe(20);
  });

  it('returns null for non-exposed card', () => {
    // Reset so upper cards are NOT removed → card 0 is blocked
    const pyramid = Array.from({ length: 28 }, (_, i) =>
      makeCard((i % 13) + 1, i, false, i >= 18),
    );
    const state = makeState({ pyramid });
    expect(playCard(state, 0)).toBeNull();
  });

  it('returns null when card does not match waste top', () => {
    // index 20 has rank (20%13)+1 = 8, waste top = 7 → match (±1)
    // index 22 has rank (22%13)+1 = 10, waste top = 7 → no match
    const state = makeState();
    expect(playCard(state, 22)).toBeNull();
  });

  it('returns null for out-of-range index', () => {
    const state = makeState();
    expect(playCard(state, -1)).toBeNull();
    expect(playCard(state, 28)).toBeNull();
  });

  it('returns null for already-removed card', () => {
    const state = makeState();
    // index 0 is already removed in our default makeState
    expect(playCard(state, 0)).toBeNull();
  });

  it('reveals newly exposed cards', () => {
    // Set up: card 9 blocks are 18,19. Start them as not removed.
    // Card 9 itself is face-down, not removed.
    const pyramid = Array.from({ length: 28 }, (_, i) =>
      makeCard((i % 13) + 1, i, false, i >= 18),
    );
    // Make card 9 face-down
    pyramid[9] = makeCard(10, 9, false, false);
    // Remove card 19 so only 18 blocks 9
    pyramid[19] = makeCard(7, 19, true, true);
    // Waste top = rank that matches card 18: (18%13)+1 = 6, so waste top should be 5 or 7
    const state = makeState({
      pyramid,
      waste: [{ suit: 'spades', rank: 7, faceUp: true, id: 'spades-7' }],
    });

    const result = playCard(state, 18);
    expect(result).not.toBeNull();
    // Card 9 should now be face-up since both blockers (18, 19) are removed
    expect(result!.pyramid[9].faceUp).toBe(true);
  });

  it('detects board clear (win)', () => {
    // Only one card left: index 27, all others removed
    const pyramid = Array.from({ length: 28 }, (_, i) =>
      makeCard(i === 27 ? 6 : (i % 13) + 1, i, i !== 27, true),
    );
    const state = makeState({
      pyramid,
      waste: [{ suit: 'spades', rank: 7, faceUp: true, id: 'spades-7' }],
    });

    const result = playCard(state, 27);
    expect(result).not.toBeNull();
    expect(result!.status).toBe('won');
    // Board clear bonus should be added
    expect(result!.score).toBeGreaterThan(0);
  });

  it('does not mutate original state', () => {
    const state = makeState();
    const origRemoved = state.pyramid[18].removed;
    playCard(state, 18);
    expect(state.pyramid[18].removed).toBe(origRemoved);
  });
});

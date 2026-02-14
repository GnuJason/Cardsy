import { describe, it, expect } from 'vitest';
import { drawFromStock, recycleWaste } from '../src/logic/moves';
import { newGame } from '../src/logic/deck';
import type { GameState } from '../src/logic/types';

function makeGameState(): GameState {
  const deal = newGame();
  return {
    ...deal,
    score: 0,
    moves: 0,
    elapsedSeconds: 0,
    status: 'playing',
  };
}

describe('drawFromStock — Draw‑3', () => {
  it('draws 3 cards from stock when count=3 and stock has >= 3', () => {
    const state = makeGameState();
    const stockBefore = state.stock.length;
    const wasteBefore = state.waste.length;

    const next = drawFromStock(state, 3);

    expect(next.stock.length).toBe(stockBefore - 3);
    expect(next.waste.length).toBe(wasteBefore + 3);
  });

  it('all 3 drawn cards are face-up', () => {
    const state = makeGameState();
    const next = drawFromStock(state, 3);
    const top3 = next.waste.slice(-3);
    expect(top3.every((c) => c.faceUp)).toBe(true);
  });

  it('draws fewer than 3 when stock has only 2 cards', () => {
    const state = makeGameState();
    // Drain stock to only 2 cards
    while (state.stock.length > 2) {
      state.waste.push({ ...state.stock.pop()!, faceUp: true });
    }

    const next = drawFromStock(state, 3);
    expect(next.stock.length).toBe(0);
    expect(next.waste.length).toBe(state.waste.length + 2);
  });

  it('draws 1 card when stock has only 1 card and count=3', () => {
    const state = makeGameState();
    while (state.stock.length > 1) {
      state.waste.push({ ...state.stock.pop()!, faceUp: true });
    }

    const next = drawFromStock(state, 3);
    expect(next.stock.length).toBe(0);
    expect(next.waste.length).toBe(state.waste.length + 1);
  });

  it('returns same state when stock is empty (count=3)', () => {
    const state = makeGameState();
    state.waste = [...state.stock.map((c) => ({ ...c, faceUp: true }))];
    state.stock = [];

    const next = drawFromStock(state, 3);
    expect(next).toBe(state); // reference equality — no change
  });

  it('draws exactly 1 card when count=1 (backward compatible)', () => {
    const state = makeGameState();
    const stockBefore = state.stock.length;
    const wasteBefore = state.waste.length;

    const next = drawFromStock(state, 1);
    expect(next.stock.length).toBe(stockBefore - 1);
    expect(next.waste.length).toBe(wasteBefore + 1);
  });

  it('defaults to draw-1 when count is not specified', () => {
    const state = makeGameState();
    const stockBefore = state.stock.length;

    const next = drawFromStock(state);
    expect(next.stock.length).toBe(stockBefore - 1);
  });

  it('does not mutate the original state', () => {
    const state = makeGameState();
    const stockBefore = state.stock.length;
    const wasteBefore = state.waste.length;

    drawFromStock(state, 3);

    expect(state.stock.length).toBe(stockBefore);
    expect(state.waste.length).toBe(wasteBefore);
  });

  it('draw-3 cards maintain correct order (last drawn is on top)', () => {
    const state = makeGameState();
    // Record the top 3 stock cards (they'll be popped in order)
    const top3 = state.stock.slice(-3).reverse(); // last = top of stock

    const next = drawFromStock(state, 3);
    const drawnCards = next.waste.slice(-3);

    // The first popped goes to waste first, last popped is on top
    expect(drawnCards[0].id).toBe(top3[0].id);
    expect(drawnCards[1].id).toBe(top3[1].id);
    expect(drawnCards[2].id).toBe(top3[2].id);
  });
});

describe('recycleWaste — unchanged for Draw‑3', () => {
  it('recycling waste is free (no score change)', () => {
    const state = makeGameState();
    // Draw all cards to waste
    let current = state;
    while (current.stock.length > 0) {
      current = drawFromStock(current, 3);
    }
    
    const recycled = recycleWaste(current);
    expect(recycled.score).toBe(current.score);
    expect(recycled.stock.length).toBe(current.waste.length);
    expect(recycled.waste.length).toBe(0);
  });

  it('recycled stock cards are all face-down', () => {
    const state = makeGameState();
    let current = state;
    while (current.stock.length > 0) {
      current = drawFromStock(current, 3);
    }

    const recycled = recycleWaste(current);
    expect(recycled.stock.every((c) => !c.faceUp)).toBe(true);
  });
});

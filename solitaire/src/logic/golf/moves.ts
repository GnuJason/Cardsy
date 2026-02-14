import type { GolfGameState } from '../types';
import { canPlayCard, isWon, hasAnyMoves } from './rules';

// ── Helpers ─────────────────────────────────────────────────

export function cloneState(state: GolfGameState): GolfGameState {
  return {
    tableau: state.tableau.map((col) => col.map((c) => ({ ...c }))),
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
    cardsRemaining: state.cardsRemaining,
    moves: state.moves,
    elapsedSeconds: state.elapsedSeconds,
    status: state.status,
  };
}

// ── Draw from stock ─────────────────────────────────────────

/**
 * Draw one card from stock to waste. No recycling.
 * Returns null if stock is empty.
 */
export function drawFromStock(state: GolfGameState): GolfGameState | null {
  if (state.stock.length === 0) return null;

  const next = cloneState(state);
  const card = next.stock.pop()!;
  card.faceUp = true;
  next.waste.push(card);
  next.moves += 1;
  return next;
}

// ── Play a tableau card ─────────────────────────────────────

/**
 * Play the bottom card of a column onto the waste pile.
 * Returns null if the move is illegal.
 */
export function playCard(
  state: GolfGameState,
  colIndex: number,
): GolfGameState | null {
  if (colIndex < 0 || colIndex >= state.tableau.length) return null;

  const column = state.tableau[colIndex];
  if (column.length === 0) return null;
  if (state.waste.length === 0) return null;

  const wasteTop = state.waste[state.waste.length - 1];
  const bottomCard = column[column.length - 1];

  if (!canPlayCard(bottomCard, wasteTop)) return null;

  const next = cloneState(state);

  // Remove the bottom card from tableau
  const card = next.tableau[colIndex].pop()!;
  card.faceUp = true;
  next.waste.push(card);
  next.cardsRemaining -= 1;
  next.moves += 1;

  // Check win
  if (isWon(next)) {
    next.status = 'won';
    return next;
  }

  // Check if no moves remain
  if (!hasAnyMoves(next)) {
    next.status = 'no-moves';
  }

  return next;
}

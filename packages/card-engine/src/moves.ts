import type { GameState } from './types';
import { SUIT_INDEX } from './types';
import { canPlaceOnTableau, canPlaceOnFoundation, isValidTableauRun, isWon } from './rules';
import { scoreMove } from './scoring';

// ── Helpers ─────────────────────────────────────────────────

/** Deep-clone minimal game state (cards are small objects) */
function cloneState(state: GameState): GameState {
  return {
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
    tableau: state.tableau.map((pile) => pile.map((c) => ({ ...c }))),
    foundations: state.foundations.map((pile) => pile.map((c) => ({ ...c }))),
    score: state.score,
    moves: state.moves,
    elapsedSeconds: state.elapsedSeconds,
    status: state.status,
  };
}

function revealTop(pile: GameState['tableau'][number]): void {
  if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
    pile[pile.length - 1] = { ...pile[pile.length - 1], faceUp: true };
  }
}

function checkWin(state: GameState): GameState {
  if (isWon(state)) {
    return { ...state, status: 'won' };
  }
  return state;
}

// ── Draw from stock ─────────────────────────────────────────

export function drawFromStock(state: GameState, count: 1 | 3 = 1): GameState {
  if (state.stock.length === 0) return state;

  const next = cloneState(state);
  const toDraw = Math.min(count, next.stock.length);
  for (let i = 0; i < toDraw; i++) {
    const card = next.stock.pop()!;
    next.waste.push({ ...card, faceUp: true });
  }
  return next;
}

// ── Recycle waste to stock (Draw 1: no penalty) ─────────────

export function recycleWaste(state: GameState): GameState {
  if (state.waste.length === 0 || state.stock.length > 0) return state;

  const next = cloneState(state);
  // Reverse waste back to stock, all face-down
  next.stock = next.waste.reverse().map((c) => ({ ...c, faceUp: false }));
  next.waste = [];
  return next;
}

// ── Move waste top → foundation ─────────────────────────────

export function moveWasteToFoundation(
  state: GameState,
  foundationIndex: number,
): GameState | null {
  if (state.waste.length === 0) return null;

  const card = state.waste[state.waste.length - 1];
  if (!canPlaceOnFoundation(card, state.foundations[foundationIndex])) return null;

  const next = cloneState(state);
  const moved = next.waste.pop()!;
  next.foundations[foundationIndex].push(moved);
  next.score += scoreMove('waste-to-foundation');
  next.moves += 1;
  return checkWin(next);
}

// ── Move waste top → tableau ────────────────────────────────

export function moveWasteToTableau(
  state: GameState,
  tableauIndex: number,
): GameState | null {
  if (state.waste.length === 0) return null;

  const card = state.waste[state.waste.length - 1];
  if (!canPlaceOnTableau(card, state.tableau[tableauIndex])) return null;

  const next = cloneState(state);
  const moved = next.waste.pop()!;
  next.tableau[tableauIndex].push(moved);
  next.score += scoreMove('waste-to-tableau');
  next.moves += 1;
  return next;
}

// ── Move tableau card(s) → tableau ──────────────────────────

export function moveTableauToTableau(
  state: GameState,
  fromPile: number,
  cardIndex: number,
  toPile: number,
): GameState | null {
  const sourceCards = state.tableau[fromPile].slice(cardIndex);
  if (!isValidTableauRun(sourceCards)) return null;
  if (!canPlaceOnTableau(sourceCards[0], state.tableau[toPile])) return null;

  const next = cloneState(state);
  const moved = next.tableau[fromPile].splice(cardIndex);
  next.tableau[toPile].push(...moved);

  // Reveal new top card on source pile
  revealTop(next.tableau[fromPile]);
  next.moves += 1;
  return next;
}

// ── Move tableau top → foundation ───────────────────────────

export function moveTableauToFoundation(
  state: GameState,
  tableauIndex: number,
): GameState | null {
  const pile = state.tableau[tableauIndex];
  if (pile.length === 0) return null;

  const card = pile[pile.length - 1];
  const foundationIndex = SUIT_INDEX[card.suit];
  if (!canPlaceOnFoundation(card, state.foundations[foundationIndex])) return null;

  const next = cloneState(state);
  const moved = next.tableau[tableauIndex].pop()!;
  next.foundations[foundationIndex].push(moved);
  next.score += scoreMove('tableau-to-foundation');
  next.moves += 1;

  // Reveal new top card
  revealTop(next.tableau[tableauIndex]);
  return checkWin(next);
}

// ── Move foundation → tableau (for undo flexibility) ────────

export function moveFoundationToTableau(
  state: GameState,
  foundationIndex: number,
  tableauIndex: number,
): GameState | null {
  const foundation = state.foundations[foundationIndex];
  if (foundation.length === 0) return null;

  const card = foundation[foundation.length - 1];
  if (!canPlaceOnTableau(card, state.tableau[tableauIndex])) return null;

  const next = cloneState(state);
  const moved = next.foundations[foundationIndex].pop()!;
  next.tableau[tableauIndex].push(moved);
  next.score -= 10; // reverse foundation score
  next.moves += 1;
  return next;
}

// ── Auto-complete: move all remaining cards to foundations ───

export function autoCompleteStep(state: GameState): GameState | null {
  // Find the lowest-rank face-up card across tableau that can go to foundation
  for (let pileIdx = 0; pileIdx < 7; pileIdx++) {
    const pile = state.tableau[pileIdx];
    if (pile.length === 0) continue;
    const card = pile[pile.length - 1];
    if (!card.faceUp) continue;
    const fIdx = SUIT_INDEX[card.suit];
    if (canPlaceOnFoundation(card, state.foundations[fIdx])) {
      return moveTableauToFoundation(state, pileIdx);
    }
  }
  return null;
}

import { useReducer, useCallback } from 'react';
import type { FreeCellGameState } from '../logic/types';
import { newFreeCellGame } from '../logic/freecell/deal';
import {
  moveColumnToColumn,
  moveColumnToFreeCell,
  moveColumnToFoundation,
  moveFreeCellToColumn,
  moveFreeCellToFoundation,
  autoMoveToFoundations,
  autoFinish,
} from '../logic/freecell/moves';
import {
  isValidSequence,
  isTriviallyWon,
  hasAnyMoves,
} from '../logic/freecell/rules';

// ── State with undo history ─────────────────────────────────

interface FullState {
  game: FreeCellGameState;
  undoStack: FreeCellGameState[];
}

type Action =
  | { type: 'NEW_GAME' }
  | { type: 'TAP_COLUMN'; colIndex: number; cardIndex: number }
  | { type: 'TAP_FREECELL'; cellIndex: number }
  | { type: 'TAP_FOUNDATION'; foundIndex: number }
  | { type: 'UNDO' }
  | { type: 'SET_ELAPSED'; seconds: number }
  | { type: 'SET_NO_MOVES' }
  | { type: 'RESTORE_GAME'; game: FreeCellGameState; undoStack: FreeCellGameState[] };

function createInitialState(): FullState {
  return {
    game: newFreeCellGame(),
    undoStack: [],
  };
}

function pushUndo(state: FullState): FreeCellGameState[] {
  const stack = [...state.undoStack, state.game];
  if (stack.length > 100) stack.shift();
  return stack;
}

/**
 * After a successful move, run auto-moves then check for trivial win.
 */
function postMove(game: FreeCellGameState): FreeCellGameState {
  let next = autoMoveToFoundations(game);
  if (next.status === 'won') return next;
  if (isTriviallyWon(next)) {
    return autoFinish(next);
  }
  return next;
}

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    // ── Tap a column card ───────────────────────────────────
    case 'TAP_COLUMN': {
      const { colIndex, cardIndex } = action;
      const { game } = state;
      const column = game.columns[colIndex];

      // Tap an empty column with something selected → try to place
      if (column.length === 0 && game.selectedSource) {
        return handlePlaceOnColumn(state, colIndex);
      }

      // Tap outside valid cards
      if (cardIndex < 0 || cardIndex >= column.length) return state;

      // ── No selection → select this card (if valid sequence) ──
      if (!game.selectedSource) {
        // Only allow selecting if this starts a valid sequence to bottom
        if (!isValidSequence(column, cardIndex)) return state;
        return {
          ...state,
          game: {
            ...game,
            selectedSource: { type: 'column', colIndex, cardIndex },
          },
        };
      }

      // ── Same column/card → deselect ──
      const sel = game.selectedSource;
      if (
        sel.type === 'column' &&
        sel.colIndex === colIndex &&
        sel.cardIndex === cardIndex
      ) {
        return { ...state, game: { ...game, selectedSource: null } };
      }

      // ── Something is selected → try to place on this column ──
      return handlePlaceOnColumn(state, colIndex);
    }

    // ── Tap a free cell slot ────────────────────────────────
    case 'TAP_FREECELL': {
      const { cellIndex } = action;
      const { game } = state;
      const cellCard = game.freeCells[cellIndex];

      // ── Nothing selected ──
      if (!game.selectedSource) {
        if (!cellCard) return state; // empty cell, nothing to select
        // Select this free cell card
        return {
          ...state,
          game: {
            ...game,
            selectedSource: { type: 'freecell', cellIndex },
          },
        };
      }

      // ── Same free cell → deselect ──
      const sel = game.selectedSource;
      if (sel.type === 'freecell' && sel.cellIndex === cellIndex) {
        return { ...state, game: { ...game, selectedSource: null } };
      }

      // ── A column card is selected → move to free cell ──
      if (sel.type === 'column') {
        const col = game.columns[sel.colIndex];
        // Only bottom card can go to free cell
        if (sel.cardIndex !== col.length - 1) {
          // Can't move sequence to free cell — deselect
          return { ...state, game: { ...game, selectedSource: null } };
        }
        const result = moveColumnToFreeCell(game, sel.colIndex);
        if (!result) return { ...state, game: { ...game, selectedSource: null } };
        const final = postMove(result);
        return { game: final, undoStack: pushUndo(state) };
      }

      // ── Another free cell is selected → swap or deselect ──
      if (sel.type === 'freecell') {
        // If target cell is empty, move current freecell card there
        // (Not standard — just select the tapped cell instead)
        if (cellCard) {
          // Select new cell card instead
          return {
            ...state,
            game: {
              ...game,
              selectedSource: { type: 'freecell', cellIndex },
            },
          };
        }
        // Empty target cell — can't do anything useful, deselect
        return { ...state, game: { ...game, selectedSource: null } };
      }

      return state;
    }

    // ── Tap a foundation pile ───────────────────────────────
    case 'TAP_FOUNDATION': {
      const { game } = state;

      if (!game.selectedSource) return state;

      const sel = game.selectedSource;

      if (sel.type === 'column') {
        const col = game.columns[sel.colIndex];
        // Only bottom card can go to foundation
        if (sel.cardIndex !== col.length - 1) {
          return { ...state, game: { ...game, selectedSource: null } };
        }
        const result = moveColumnToFoundation(game, sel.colIndex);
        if (!result) return { ...state, game: { ...game, selectedSource: null } };
        const final = postMove(result);
        return { game: final, undoStack: pushUndo(state) };
      }

      if (sel.type === 'freecell') {
        const result = moveFreeCellToFoundation(game, sel.cellIndex);
        if (!result) return { ...state, game: { ...game, selectedSource: null } };
        const final = postMove(result);
        return { game: final, undoStack: pushUndo(state) };
      }

      return state;
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      const undoneGame: FreeCellGameState = {
        ...prev,
        elapsedSeconds: state.game.elapsedSeconds,
      };
      return { game: undoneGame, undoStack: newStack };
    }

    case 'SET_ELAPSED':
      return {
        ...state,
        game: { ...state.game, elapsedSeconds: action.seconds },
      };

    case 'SET_NO_MOVES':
      return {
        ...state,
        game: { ...state.game, status: 'no-moves' },
      };

    case 'RESTORE_GAME':
      return {
        game: action.game,
        undoStack: action.undoStack,
      };

    default:
      return state;
  }
}

/**
 * Helper: attempt to place the currently selected source onto `colIndex`.
 */
function handlePlaceOnColumn(state: FullState, colIndex: number): FullState {
  const { game } = state;
  const sel = game.selectedSource!;

  if (sel.type === 'column') {
    const result = moveColumnToColumn(game, sel.colIndex, sel.cardIndex, colIndex);
    if (!result) {
      // Invalid move — select the tapped column's bottom card if valid
      const targetCol = game.columns[colIndex];
      if (targetCol.length > 0) {
        // Find the longest valid sequence from the bottom
        let bestStart = targetCol.length - 1;
        while (bestStart > 0 && isValidSequence(targetCol, bestStart - 1)) {
          bestStart--;
        }
        return {
          ...state,
          game: {
            ...game,
            selectedSource: { type: 'column', colIndex, cardIndex: bestStart },
          },
        };
      }
      return { ...state, game: { ...game, selectedSource: null } };
    }
    const final = postMove(result);
    return { game: final, undoStack: pushUndo(state) };
  }

  if (sel.type === 'freecell') {
    const result = moveFreeCellToColumn(game, sel.cellIndex, colIndex);
    if (!result) return { ...state, game: { ...game, selectedSource: null } };
    const final = postMove(result);
    return { game: final, undoStack: pushUndo(state) };
  }

  return { ...state, game: { ...game, selectedSource: null } };
}

// ── Hook ────────────────────────────────────────────────────

export function useFreeCellState() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const newGameAction = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const tapColumn = useCallback(
    (colIndex: number, cardIndex: number) =>
      dispatch({ type: 'TAP_COLUMN', colIndex, cardIndex }),
    [],
  );
  const tapFreeCell = useCallback(
    (cellIndex: number) => dispatch({ type: 'TAP_FREECELL', cellIndex }),
    [],
  );
  const tapFoundation = useCallback(
    (foundIndex: number) => dispatch({ type: 'TAP_FOUNDATION', foundIndex }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const setElapsed = useCallback(
    (seconds: number) => dispatch({ type: 'SET_ELAPSED', seconds }),
    [],
  );
  const setNoMoves = useCallback(() => dispatch({ type: 'SET_NO_MOVES' }), []);
  const restoreGame = useCallback(
    (game: FreeCellGameState, undoStack: FreeCellGameState[]) =>
      dispatch({ type: 'RESTORE_GAME', game, undoStack }),
    [],
  );

  return {
    game: state.game,
    undoStack: state.undoStack,
    canUndo: state.undoStack.length > 0,
    hasMoves: hasAnyMoves(state.game),
    actions: {
      newGame: newGameAction,
      tapColumn,
      tapFreeCell,
      tapFoundation,
      undo,
      setElapsed,
      setNoMoves,
      restoreGame,
    },
  };
}

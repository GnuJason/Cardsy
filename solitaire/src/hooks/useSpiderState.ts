import { useReducer, useCallback } from 'react';
import type { SpiderGameState, SpiderDifficulty } from '../logic/types';
import { newSpiderGame } from '../logic/spider/deal';
import { moveCards, dealRow } from '../logic/spider/moves';
import { isInSuitRun, getRunStart, hasAnyMoves } from '../logic/spider/rules';

// ── State with undo history ─────────────────────────────────

interface FullState {
  game: SpiderGameState;
  undoStack: SpiderGameState[];
  difficulty: SpiderDifficulty;
}

type Action =
  | { type: 'NEW_GAME'; difficulty: SpiderDifficulty }
  | { type: 'TAP_COLUMN'; colIndex: number; cardIndex: number }
  | { type: 'DEAL_ROW' }
  | { type: 'UNDO' }
  | { type: 'SET_ELAPSED'; seconds: number }
  | { type: 'SET_NO_MOVES' }
  | { type: 'RESTORE_GAME'; game: SpiderGameState; undoStack: SpiderGameState[] };

function createInitialState(difficulty: SpiderDifficulty): FullState {
  return {
    game: newSpiderGame(difficulty),
    undoStack: [],
    difficulty,
  };
}

function pushUndo(state: FullState): SpiderGameState[] {
  const stack = [...state.undoStack, state.game];
  if (stack.length > 100) stack.shift();
  return stack;
}

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'NEW_GAME': {
      return createInitialState(action.difficulty);
    }

    case 'TAP_COLUMN': {
      const { colIndex, cardIndex } = action;
      const { game } = state;
      const column = game.columns[colIndex];

      // Tap an empty column with something selected → try to place
      if (column.length === 0 && game.selectedSource) {
        return handlePlaceOnColumn(state, colIndex);
      }

      // Tap outside valid range
      if (cardIndex < 0 || cardIndex >= column.length) return state;

      // ── No selection → select this card (if valid in-suit sequence) ──
      if (!game.selectedSource) {
        if (!column[cardIndex].faceUp) return state;
        if (!isInSuitRun(column, cardIndex)) return state;
        return {
          ...state,
          game: {
            ...game,
            selectedSource: { colIndex, cardIndex },
          },
        };
      }

      // ── Same column/card → deselect ──
      const sel = game.selectedSource;
      if (sel.colIndex === colIndex && sel.cardIndex === cardIndex) {
        return { ...state, game: { ...game, selectedSource: null } };
      }

      // ── Something is selected → try to place on this column ──
      return handlePlaceOnColumn(state, colIndex);
    }

    case 'DEAL_ROW': {
      const result = dealRow(state.game);
      if (!result) return state;
      return { ...state, game: result, undoStack: pushUndo(state) };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      const undoneGame: SpiderGameState = {
        ...prev,
        elapsedSeconds: state.game.elapsedSeconds,
      };
      return { ...state, game: undoneGame, undoStack: newStack };
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
        ...state,
        game: action.game,
        undoStack: action.undoStack,
        difficulty: action.game.difficulty,
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
  const sel = game.selectedSource;
  if (!sel) return state;

  const result = moveCards(game, sel.colIndex, sel.cardIndex, colIndex);
  if (!result) {
    // Invalid move — select the tapped column's bottom run instead
    const targetCol = game.columns[colIndex];
    if (targetCol.length > 0) {
      const bestStart = getRunStart(targetCol);
      return {
        ...state,
        game: {
          ...game,
          selectedSource: { colIndex, cardIndex: bestStart },
        },
      };
    }
    return { ...state, game: { ...game, selectedSource: null } };
  }
  return { ...state, game: result, undoStack: pushUndo(state) };
}

// ── Hook ────────────────────────────────────────────────────

export function useSpiderState(initialDifficulty: SpiderDifficulty = 1) {
  const [state, dispatch] = useReducer(
    reducer,
    initialDifficulty,
    (diff) => createInitialState(diff),
  );

  const newGame = useCallback(
    (difficulty: SpiderDifficulty) => dispatch({ type: 'NEW_GAME', difficulty }),
    [],
  );
  const tapColumn = useCallback(
    (colIndex: number, cardIndex: number) =>
      dispatch({ type: 'TAP_COLUMN', colIndex, cardIndex }),
    [],
  );
  const doDealRow = useCallback(() => dispatch({ type: 'DEAL_ROW' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const setElapsed = useCallback(
    (seconds: number) => dispatch({ type: 'SET_ELAPSED', seconds }),
    [],
  );
  const setNoMoves = useCallback(() => dispatch({ type: 'SET_NO_MOVES' }), []);
  const restoreGame = useCallback(
    (game: SpiderGameState, undoStack: SpiderGameState[]) =>
      dispatch({ type: 'RESTORE_GAME', game, undoStack }),
    [],
  );

  return {
    game: state.game,
    undoStack: state.undoStack,
    difficulty: state.difficulty,
    canUndo: state.undoStack.length > 0,
    hasMoves: hasAnyMoves(state.game),
    actions: {
      newGame,
      tapColumn,
      dealRow: doDealRow,
      undo,
      setElapsed,
      setNoMoves,
      restoreGame,
    },
  };
}

import { useReducer, useCallback } from 'react';
import type { GolfGameState } from '../logic/types';
import { newGolfGame } from '../logic/golf/deal';
import { drawFromStock, playCard } from '../logic/golf/moves';
import { hasAnyMoves } from '../logic/golf/rules';

// ── State with undo history ─────────────────────────────────

interface FullState {
  game: GolfGameState;
  undoStack: GolfGameState[];
}

type Action =
  | { type: 'NEW_GAME' }
  | { type: 'DRAW' }
  | { type: 'TAP_CARD'; colIndex: number }
  | { type: 'UNDO' }
  | { type: 'SET_ELAPSED'; seconds: number }
  | { type: 'SET_NO_MOVES' }
  | { type: 'RESTORE_GAME'; game: GolfGameState; undoStack: GolfGameState[] };

function createInitialState(): FullState {
  return {
    game: newGolfGame(),
    undoStack: [],
  };
}

function pushUndo(state: FullState): GolfGameState[] {
  const stack = [...state.undoStack, state.game];
  if (stack.length > 100) stack.shift();
  return stack;
}

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    case 'DRAW': {
      const result = drawFromStock(state.game);
      if (!result) return state;

      const next: FullState = { game: result, undoStack: pushUndo(state) };

      if (!hasAnyMoves(next.game)) {
        return {
          ...next,
          game: { ...next.game, status: 'no-moves' },
        };
      }
      return next;
    }

    case 'TAP_CARD': {
      const result = playCard(state.game, action.colIndex);
      if (!result) return state;
      return { game: result, undoStack: pushUndo(state) };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      // Restore previous state but keep current elapsed time
      const undoneGame: GolfGameState = {
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

// ── Hook ────────────────────────────────────────────────────

export function useGolfState() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const newGameAction = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const draw = useCallback(() => dispatch({ type: 'DRAW' }), []);
  const tapCard = useCallback(
    (colIndex: number) => dispatch({ type: 'TAP_CARD', colIndex }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const setElapsed = useCallback(
    (seconds: number) => dispatch({ type: 'SET_ELAPSED', seconds }),
    [],
  );
  const setNoMoves = useCallback(
    () => dispatch({ type: 'SET_NO_MOVES' }),
    [],
  );
  const restoreGame = useCallback(
    (game: GolfGameState, undoStack: GolfGameState[]) =>
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
      draw,
      tapCard,
      undo,
      setElapsed,
      setNoMoves,
      restoreGame,
    },
  };
}

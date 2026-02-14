import { useReducer, useCallback } from 'react';
import type { TriPeaksGameState } from '../logic/types';
import { newTriPeaksGame } from '../logic/tripeaks/deal';
import { drawFromStock, playCard } from '../logic/tripeaks/moves';
import { hasAnyMoves } from '../logic/tripeaks/rules';
import { undoPenalty } from '../logic/tripeaks/scoring';

// ── State with undo history ─────────────────────────────────

interface FullState {
  game: TriPeaksGameState;
  undoStack: TriPeaksGameState[];
}

type Action =
  | { type: 'NEW_GAME' }
  | { type: 'DRAW' }
  | { type: 'TAP_CARD'; pyramidIndex: number }
  | { type: 'UNDO' }
  | { type: 'SET_ELAPSED'; seconds: number }
  | { type: 'SET_NO_MOVES' };

function createInitialState(): FullState {
  return {
    game: newTriPeaksGame(),
    undoStack: [],
  };
}

function pushUndo(state: FullState): TriPeaksGameState[] {
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

      const next = { game: result, undoStack: pushUndo(state) };

      // After drawing, check if we now have no moves
      if (!hasAnyMoves(next.game)) {
        return {
          ...next,
          game: { ...next.game, status: 'no-moves' },
        };
      }
      return next;
    }

    case 'TAP_CARD': {
      const result = playCard(state.game, action.pyramidIndex);
      if (!result) return state;
      return { game: result, undoStack: pushUndo(state) };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      const undoneGame: TriPeaksGameState = {
        ...prev,
        score: state.game.score + undoPenalty(),
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

    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────

export function useTriPeaksState() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const newGameAction = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const draw = useCallback(() => dispatch({ type: 'DRAW' }), []);
  const tapCard = useCallback(
    (pyramidIndex: number) => dispatch({ type: 'TAP_CARD', pyramidIndex }),
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

  return {
    game: state.game,
    canUndo: state.undoStack.length > 0,
    hasMoves: hasAnyMoves(state.game),
    actions: {
      newGame: newGameAction,
      draw,
      tapCard,
      undo,
      setElapsed,
      setNoMoves,
    },
  };
}

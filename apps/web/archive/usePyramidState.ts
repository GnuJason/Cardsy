import { useReducer, useCallback } from 'react';
import type { PyramidGameState } from '../logic/types';
import { newPyramidGame } from '../logic/pyramid/deal';
import {
  drawFromStock,
  removeKing,
  removeWasteKing,
  removePyramidPair,
  removePyramidWastePair,
} from '../logic/pyramid/moves';
import { isUncovered, isKing, hasAnyMoves } from '../logic/pyramid/rules';

// ── State with undo history ─────────────────────────────────

interface FullState {
  game: PyramidGameState;
  undoStack: PyramidGameState[];
}

type Action =
  | { type: 'NEW_GAME' }
  | { type: 'DRAW' }
  | { type: 'TAP_PYRAMID'; pyramidIndex: number }
  | { type: 'TAP_WASTE' }
  | { type: 'UNDO' }
  | { type: 'SET_ELAPSED'; seconds: number }
  | { type: 'SET_NO_MOVES' }
  | { type: 'RESTORE_GAME'; game: PyramidGameState; undoStack: PyramidGameState[] };

function createInitialState(): FullState {
  return {
    game: newPyramidGame(),
    undoStack: [],
  };
}

function pushUndo(state: FullState): PyramidGameState[] {
  const stack = [...state.undoStack, state.game];
  if (stack.length > 100) stack.shift();
  return stack;
}

/**
 * Selection sentinel: -1 means the waste top is selected.
 * null means nothing is selected.
 * 0-27 means a pyramid card at that index is selected.
 */
const WASTE_SELECTED = -1;

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    case 'DRAW': {
      const result = drawFromStock(state.game);
      if (!result) return state;
      return { game: result, undoStack: pushUndo(state) };
    }

    case 'TAP_PYRAMID': {
      const { pyramidIndex } = action;
      const { game } = state;
      const card = game.pyramid[pyramidIndex];

      // Ignore removed cards or non-uncovered cards
      if (card.removed || !isUncovered(pyramidIndex, game.pyramid)) {
        return state;
      }

      // King → auto-remove
      if (isKing(card)) {
        const result = removeKing(game, pyramidIndex);
        if (!result) return state;
        return { game: result, undoStack: pushUndo(state) };
      }

      // Nothing selected yet — select this card
      if (game.selectedIndex === null) {
        return {
          ...state,
          game: { ...game, selectedIndex: pyramidIndex },
        };
      }

      // Tapped same card — deselect
      if (game.selectedIndex === pyramidIndex) {
        return {
          ...state,
          game: { ...game, selectedIndex: null },
        };
      }

      // Waste is selected, try to pair waste + pyramid
      if (game.selectedIndex === WASTE_SELECTED) {
        const result = removePyramidWastePair(game, pyramidIndex);
        if (result) {
          return { game: result, undoStack: pushUndo(state) };
        }
        // Invalid pair — select the newly tapped pyramid card instead
        return {
          ...state,
          game: { ...game, selectedIndex: pyramidIndex },
        };
      }

      // Another pyramid card is selected — try to pair them
      const result = removePyramidPair(game, game.selectedIndex, pyramidIndex);
      if (result) {
        return { game: result, undoStack: pushUndo(state) };
      }

      // Invalid pair — select the newly tapped card instead
      return {
        ...state,
        game: { ...game, selectedIndex: pyramidIndex },
      };
    }

    case 'TAP_WASTE': {
      const { game } = state;
      if (game.waste.length === 0) return state;

      const wasteTop = game.waste[game.waste.length - 1];

      // King on waste → auto-remove
      if (isKing(wasteTop)) {
        const result = removeWasteKing(game);
        if (!result) return state;
        return { game: result, undoStack: pushUndo(state) };
      }

      // Nothing selected → select waste
      if (game.selectedIndex === null) {
        return {
          ...state,
          game: { ...game, selectedIndex: WASTE_SELECTED },
        };
      }

      // Waste already selected → deselect
      if (game.selectedIndex === WASTE_SELECTED) {
        return {
          ...state,
          game: { ...game, selectedIndex: null },
        };
      }

      // A pyramid card is selected — try to pair pyramid + waste
      const result = removePyramidWastePair(game, game.selectedIndex);
      if (result) {
        return { game: result, undoStack: pushUndo(state) };
      }

      // Can't pair → select waste instead
      return {
        ...state,
        game: { ...game, selectedIndex: WASTE_SELECTED },
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      // Restore previous state but keep current elapsed time
      const undoneGame: PyramidGameState = {
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

export function usePyramidState() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const newGameAction = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const draw = useCallback(() => dispatch({ type: 'DRAW' }), []);
  const tapPyramid = useCallback(
    (pyramidIndex: number) => dispatch({ type: 'TAP_PYRAMID', pyramidIndex }),
    [],
  );
  const tapWaste = useCallback(() => dispatch({ type: 'TAP_WASTE' }), []);
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
    (game: PyramidGameState, undoStack: PyramidGameState[]) =>
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
      tapPyramid,
      tapWaste,
      undo,
      setElapsed,
      setNoMoves,
      restoreGame,
    },
  };
}

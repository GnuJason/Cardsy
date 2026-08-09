import { useReducer, useCallback } from 'react';
import type { GameState } from '../logic/types';
import { SUIT_INDEX } from '../logic/types';
import { newGame } from '../logic/deck';
import {
  drawFromStock,
  recycleWaste,
  moveWasteToFoundation,
  moveWasteToTableau,
  moveTableauToTableau,
  moveTableauToFoundation,
  autoCompleteStep,
} from '../logic/moves';
import { findBestMove, hasAnyMoves, canAutoComplete } from '../logic/rules';
import { scoreMove } from '../logic/scoring';

// ── State with undo history ─────────────────────────────────

interface FullState {
  game: GameState;
  undoStack: GameState[];
  usedUndo: boolean;
  drawCount: 1 | 3;
}

type Action =
  | { type: 'NEW_GAME' }
  | { type: 'DRAW' }
  | { type: 'TAP_WASTE' }
  | { type: 'TAP_TABLEAU'; pileIndex: number; cardIndex: number }
  | { type: 'TAP_FOUNDATION'; pileIndex: number }
  | {
      type: 'MOVE_TO_TARGET';
      sourcePile: 'waste' | 'tableau';
      sourcePileIndex: number;
      sourceCardIndex: number;
      targetPile: 'tableau' | 'foundation';
      targetPileIndex: number;
    }
  | { type: 'UNDO' }
  | { type: 'AUTO_COMPLETE_STEP' }
  | { type: 'SET_ELAPSED'; seconds: number }
  | { type: 'SET_NO_MOVES' }
  | { type: 'SET_DRAW_COUNT'; drawCount: 1 | 3 }
  | { type: 'RESTORE_GAME'; game: GameState; undoStack: GameState[]; drawCount?: 1 | 3 };

function createInitialState(): FullState {
  const deal = newGame();
  return {
    game: {
      ...deal,
      score: 0,
      moves: 0,
      elapsedSeconds: 0,
      status: 'playing',
    },
    undoStack: [],
    usedUndo: false,
    drawCount: 1,
  };
}

function pushUndo(state: FullState): GameState[] {
  // Keep max 100 undo states to prevent unbounded memory
  const stack = [...state.undoStack, state.game];
  if (stack.length > 100) stack.shift();
  return stack;
}

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'NEW_GAME': {
      const fresh = createInitialState();
      return { ...fresh, drawCount: state.drawCount };
    }

    case 'DRAW': {
      if (state.game.stock.length === 0) {
        // Recycle waste (free for both Draw 1 & Draw 3)
        const recycled = recycleWaste(state.game);
        if (recycled === state.game) return state;
        return { ...state, game: recycled, undoStack: pushUndo(state) };
      }
      const drawn = drawFromStock(state.game, state.drawCount);
      return { ...state, game: drawn, undoStack: pushUndo(state) };
    }

    case 'TAP_WASTE': {
      if (state.game.waste.length === 0) return state;
      const card = state.game.waste[state.game.waste.length - 1];
      const target = findBestMove(card, state.game);
      if (!target) return state;

      let result: GameState | null = null;
      if (target.zone === 'foundation') {
        result = moveWasteToFoundation(state.game, target.pileIndex);
      } else {
        result = moveWasteToTableau(state.game, target.pileIndex);
      }
      if (!result) return state;
      return { ...state, game: result, undoStack: pushUndo(state) };
    }

    case 'TAP_TABLEAU': {
      const { pileIndex, cardIndex } = action;
      const pile = state.game.tableau[pileIndex];
      if (cardIndex >= pile.length) return state;
      const card = pile[cardIndex];
      if (!card.faceUp) return state;

      // If tapping the top card, try foundation first
      if (cardIndex === pile.length - 1) {
        const toFoundation = moveTableauToFoundation(state.game, pileIndex);
        if (toFoundation) {
          return { ...state, game: toFoundation, undoStack: pushUndo(state) };
        }
      }

      // Try moving this card (and any below it) to another tableau pile
      const target = findBestMove(card, state.game, pileIndex, cardIndex);
      if (!target) return state;

      if (target.zone === 'foundation' && cardIndex === pile.length - 1) {
        const result = moveTableauToFoundation(state.game, pileIndex);
        if (result) return { ...state, game: result, undoStack: pushUndo(state) };
      } else if (target.zone === 'tableau') {
        const result = moveTableauToTableau(
          state.game,
          pileIndex,
          cardIndex,
          target.pileIndex,
        );
        if (result) return { ...state, game: result, undoStack: pushUndo(state) };
      }

      return state;
    }

    case 'TAP_FOUNDATION': {
      // Tapping foundation doesn't do anything in standard play
      return state;
    }

    case 'MOVE_TO_TARGET': {
      const {
        sourcePile,
        sourcePileIndex,
        sourceCardIndex,
        targetPile,
        targetPileIndex,
      } = action;

      let result: GameState | null = null;

      if (sourcePile === 'waste') {
        if (sourcePileIndex !== 0) return state;
        if (state.game.waste.length === 0) return state;
        if (sourceCardIndex !== state.game.waste.length - 1) return state;

        if (targetPile === 'tableau') {
          result = moveWasteToTableau(state.game, targetPileIndex);
        } else {
          const wasteCard = state.game.waste[sourceCardIndex];
          if (!wasteCard) return state;
          if (SUIT_INDEX[wasteCard.suit] !== targetPileIndex) return state;
          result = moveWasteToFoundation(state.game, targetPileIndex);
        }
      }

      if (sourcePile === 'tableau') {
        const pile = state.game.tableau[sourcePileIndex];
        if (!pile) return state;
        if (sourceCardIndex < 0 || sourceCardIndex >= pile.length) return state;
        const card = pile[sourceCardIndex];
        if (!card.faceUp) return state;

        if (targetPile === 'tableau') {
          result = moveTableauToTableau(state.game, sourcePileIndex, sourceCardIndex, targetPileIndex);
        } else {
          if (sourceCardIndex !== pile.length - 1) return state;
          if (SUIT_INDEX[card.suit] !== targetPileIndex) return state;
          result = moveTableauToFoundation(state.game, sourcePileIndex);
        }
      }

      if (!result) return state;
      return { ...state, game: result, undoStack: pushUndo(state) };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const newStack = [...state.undoStack];
      const prev = newStack.pop()!;
      const undoneGame = {
        ...prev,
        score: state.game.score + scoreMove('undo'),
        elapsedSeconds: state.game.elapsedSeconds, // keep current time
      };
      return { game: undoneGame, undoStack: newStack, usedUndo: true, drawCount: state.drawCount };
    }

    case 'AUTO_COMPLETE_STEP': {
      const result = autoCompleteStep(state.game);
      if (!result) return state;
      return { ...state, game: result };
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

    case 'SET_DRAW_COUNT':
      return {
        ...state,
        drawCount: action.drawCount,
      };

    case 'RESTORE_GAME':
      return {
        game: action.game,
        undoStack: action.undoStack,
        usedUndo: false,
        drawCount: action.drawCount ?? 1,
      };

    default:
      return state;
  }
}

// ── Hook ────────────────────────────────────────────────────

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const newGameAction = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const draw = useCallback(() => dispatch({ type: 'DRAW' }), []);
  const tapWaste = useCallback(() => dispatch({ type: 'TAP_WASTE' }), []);
  const tapTableau = useCallback(
    (pileIndex: number, cardIndex: number) =>
      dispatch({ type: 'TAP_TABLEAU', pileIndex, cardIndex }),
    [],
  );
  const tapFoundation = useCallback(
    (pileIndex: number) => dispatch({ type: 'TAP_FOUNDATION', pileIndex }),
    [],
  );
  const moveToTarget = useCallback(
    (
      sourcePile: 'waste' | 'tableau',
      sourcePileIndex: number,
      sourceCardIndex: number,
      targetPile: 'tableau' | 'foundation',
      targetPileIndex: number,
    ) =>
      dispatch({
        type: 'MOVE_TO_TARGET',
        sourcePile,
        sourcePileIndex,
        sourceCardIndex,
        targetPile,
        targetPileIndex,
      }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const autoComplete = useCallback(
    () => dispatch({ type: 'AUTO_COMPLETE_STEP' }),
    [],
  );
  const setElapsed = useCallback(
    (seconds: number) => dispatch({ type: 'SET_ELAPSED', seconds }),
    [],
  );
  const setNoMoves = useCallback(
    () => dispatch({ type: 'SET_NO_MOVES' }),
    [],
  );
  const restoreGame = useCallback(
    (game: GameState, undoStack: GameState[], drawCount?: 1 | 3) =>
      dispatch({ type: 'RESTORE_GAME', game, undoStack, drawCount }),
    [],
  );
  const setDrawCount = useCallback(
    (drawCount: 1 | 3) => dispatch({ type: 'SET_DRAW_COUNT', drawCount }),
    [],
  );

  return {
    game: state.game,
    undoStack: state.undoStack,
    usedUndo: state.usedUndo,
    drawCount: state.drawCount,
    canUndo: state.undoStack.length > 0,
    canAutoComplete: canAutoComplete(state.game),
    hasMoves: hasAnyMoves(state.game),
    actions: {
      newGame: newGameAction,
      draw,
      tapWaste,
      tapTableau,
      tapFoundation,
      moveToTarget,
      undo,
      autoComplete,
      setElapsed,
      setNoMoves,
      restoreGame,
      setDrawCount,
    },
  };
}

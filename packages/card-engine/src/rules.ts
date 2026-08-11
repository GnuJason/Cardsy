import type { Card, GameState } from './types';
import { SUIT_INDEX, suitColor } from './types';

/**
 * Can the given card be placed on top of a tableau pile?
 * Rules: descending rank, alternating colors. Kings on empty piles.
 */
export function canPlaceOnTableau(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) {
    return card.rank === 13; // only Kings on empty piles
  }
  const top = pile[pile.length - 1];
  return (
    top.faceUp &&
    suitColor(card.suit) !== suitColor(top.suit) &&
    card.rank === top.rank - 1
  );
}

/**
 * Can the given card be placed on a foundation pile?
 * Rules: same suit, ascending from Ace. Aces on empty piles.
 */
export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return card.rank === 1; // only Aces start a foundation
  }
  const top = foundation[foundation.length - 1];
  return card.suit === top.suit && card.rank === top.rank + 1;
}

export function isValidTableauRun(cards: Card[]): boolean {
  if (cards.length === 0) return false;

  for (let index = 0; index < cards.length; index += 1) {
    const current = cards[index];
    if (!current.faceUp) return false;

    if (index === 0) continue;

    const previous = cards[index - 1];
    if (suitColor(previous.suit) === suitColor(current.suit)) return false;
    if (previous.rank !== current.rank + 1) return false;
  }

  return true;
}

/**
 * Check if the game is won (all 4 foundations have 13 cards).
 */
export function isWon(state: GameState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

/**
 * Find the best auto-move destination for a card.
 * Priority: foundation first (if it's a single card), then tableau.
 * Returns the target pile index, or null.
 */
export function findBestMove(
  card: Card,
  state: GameState,
  fromTableauPileIndex?: number,
  cardIndex?: number,
): { zone: 'foundation'; pileIndex: number } | { zone: 'tableau'; pileIndex: number } | null {
  if (fromTableauPileIndex !== undefined && cardIndex !== undefined) {
    const movingStack = state.tableau[fromTableauPileIndex]?.slice(cardIndex) ?? [];
    if (!isValidTableauRun(movingStack)) {
      return null;
    }
  }

  // Only single cards can go to foundation via tap
  const isSingleCard = cardIndex === undefined || 
    (fromTableauPileIndex !== undefined && cardIndex === state.tableau[fromTableauPileIndex].length - 1);

  if (isSingleCard) {
    // Try foundation first
    const foundationIdx = SUIT_INDEX[card.suit];
    if (canPlaceOnFoundation(card, state.foundations[foundationIdx])) {
      return { zone: 'foundation', pileIndex: foundationIdx };
    }
  }

  // Try tableau piles (prefer non-empty piles)
  for (let i = 0; i < 7; i++) {
    if (i === fromTableauPileIndex) continue;
    if (state.tableau[i].length > 0 && canPlaceOnTableau(card, state.tableau[i])) {
      return { zone: 'tableau', pileIndex: i };
    }
  }

  // Try empty tableau piles for Kings
  if (card.rank === 13) {
    for (let i = 0; i < 7; i++) {
      if (i === fromTableauPileIndex) continue;
      if (state.tableau[i].length === 0) {
        return { zone: 'tableau', pileIndex: i };
      }
    }
  }

  return null;
}

/**
 * Detect whether any legal moves exist.
 */
export function hasAnyMoves(state: GameState): boolean {
  // Check waste top card
  if (state.waste.length > 0) {
    const wasteCard = state.waste[state.waste.length - 1];
    if (findBestMove(wasteCard, state) !== null) return true;
  }

  // Check tableau piles
  for (let pileIdx = 0; pileIdx < 7; pileIdx++) {
    const pile = state.tableau[pileIdx];
    for (let cardIdx = 0; cardIdx < pile.length; cardIdx++) {
      const card = pile[cardIdx];
      if (!card.faceUp) continue;
      if (!isValidTableauRun(pile.slice(cardIdx))) continue;
      if (findBestMove(card, state, pileIdx, cardIdx) !== null) return true;
    }
  }

  // Can still draw from stock
  if (state.stock.length > 0) return true;

  // Can recycle waste (Draw 1: free recycling)
  if (state.waste.length > 0) return true;

  return false;
}

/**
 * Check if auto-complete is possible:
 * all remaining cards are face-up (no hidden cards in tableau, nothing in stock/waste).
 */
export function canAutoComplete(state: GameState): boolean {
  if (state.stock.length > 0 || state.waste.length > 0) return false;
  for (const pile of state.tableau) {
    for (const card of pile) {
      if (!card.faceUp) return false;
    }
  }
  // At least one card still outside foundations
  const foundationCount = state.foundations.reduce((s, f) => s + f.length, 0);
  return foundationCount < 52;
}

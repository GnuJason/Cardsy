import type { Card, GameState } from './types';
/**
 * Can the given card be placed on top of a tableau pile?
 * Rules: descending rank, alternating colors. Kings on empty piles.
 */
export declare function canPlaceOnTableau(card: Card, pile: Card[]): boolean;
/**
 * Can the given card be placed on a foundation pile?
 * Rules: same suit, ascending from Ace. Aces on empty piles.
 */
export declare function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean;
export declare function isValidTableauRun(cards: Card[]): boolean;
/**
 * Check if the game is won (all 4 foundations have 13 cards).
 */
export declare function isWon(state: GameState): boolean;
/**
 * Find the best auto-move destination for a card.
 * Priority: foundation first (if it's a single card), then tableau.
 * Returns the target pile index, or null.
 */
export declare function findBestMove(card: Card, state: GameState, fromTableauPileIndex?: number, cardIndex?: number): {
    zone: 'foundation';
    pileIndex: number;
} | {
    zone: 'tableau';
    pileIndex: number;
} | null;
/**
 * Detect whether any legal moves exist.
 */
export declare function hasAnyMoves(state: GameState): boolean;
/**
 * Check if auto-complete is possible:
 * all remaining cards are face-up (no hidden cards in tableau, nothing in stock/waste).
 */
export declare function canAutoComplete(state: GameState): boolean;

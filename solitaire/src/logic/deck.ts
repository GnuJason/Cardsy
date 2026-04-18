import type { Card } from './types';
import { SUITS, RANKS, cardId } from './types';
import { createSeededRandom, createShuffleSeed } from './random';

/**
 * Create a standard 52-card deck, all face-down.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false, id: cardId(suit, rank) });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle. Returns a new array.
 */
export function shuffle(deck: Card[], seed = createShuffleSeed()): Card[] {
  const cards = [...deck];
  const random = createSeededRandom(seed);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/**
 * Deal a Klondike tableau from a shuffled deck.
 * Returns { tableau, stock } where:
 *  - tableau: 7 piles, pile i has (i+1) cards, only the last face-up
 *  - stock: remaining 24 cards, all face-down
 */
export function dealKlondike(deck: Card[]): {
  tableau: Card[][];
  stock: Card[];
} {
  const cards = [...deck];
  const tableau: Card[][] = [];
  let idx = 0;

  for (let pile = 0; pile < 7; pile++) {
    const pileCards: Card[] = [];
    for (let row = 0; row <= pile; row++) {
      pileCards.push({
        ...cards[idx],
        faceUp: row === pile,
      });
      idx++;
    }
    tableau.push(pileCards);
  }

  // Remaining cards go to stock (face-down)
  const stock = cards.slice(idx).map((c) => ({ ...c, faceUp: false }));

  return { tableau, stock };
}

/**
 * Create a new game state with a fresh shuffled deal.
 */
export function newGame(): {
  stock: Card[];
  waste: Card[];
  tableau: Card[][];
  foundations: Card[][];
  shuffleSeed: number;
} {
  const shuffleSeed = createShuffleSeed();
  const deck = shuffle(createDeck(), shuffleSeed);
  const { tableau, stock } = dealKlondike(deck);

  return {
    stock,
    waste: [],
    tableau,
    foundations: [[], [], [], []], // hearts, diamonds, clubs, spades
    shuffleSeed,
  };
}

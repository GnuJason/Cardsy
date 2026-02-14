// ── Card Model ──────────────────────────────────────────────

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string; // e.g. "hearts-7"
}

// ── Suit / Rank helpers ─────────────────────────────────────

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const RANK_LABELS: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export function suitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function cardId(suit: Suit, rank: Rank): string {
  return `${suit}-${rank}`;
}

// Suit ordinal for foundation indexing
export const SUIT_INDEX: Record<Suit, number> = {
  hearts: 0,
  diamonds: 1,
  clubs: 2,
  spades: 3,
};

// ── Game State ──────────────────────────────────────────────

export type GameStatus = 'playing' | 'won' | 'no-moves';

export interface GameState {
  stock: Card[];
  waste: Card[];
  tableau: Card[][]; // 7 piles
  foundations: Card[][]; // 4 piles, indexed by SUIT_INDEX
  score: number;
  moves: number;
  elapsedSeconds: number;
  status: GameStatus;
}

// ── Move Descriptions ───────────────────────────────────────

export type MoveSource =
  | { zone: 'waste' }
  | { zone: 'tableau'; pileIndex: number; cardIndex: number }
  | { zone: 'foundation'; pileIndex: number };

export type MoveTarget =
  | { zone: 'tableau'; pileIndex: number }
  | { zone: 'foundation'; pileIndex: number };

export interface GameMove {
  source: MoveSource;
  target: MoveTarget;
}

// ── User Settings ───────────────────────────────────────────

export interface UserSettings {
  reducedMotion: boolean;
  cardSize: 'small' | 'medium' | 'large';
  cardBack: string; // filename in public/cards/backs/
}

// ── Game Modes ──────────────────────────────────────────────

export type GameMode = 'klondike' | 'tripeaks';

// ── Per-Mode Statistics ─────────────────────────────────────

export interface GameModeStats {
  bestScore: number | null;
  bestTime: number | null; // lowest elapsed seconds for a win
  currentWinStreak: number;
  bestWinStreak: number;
  totalWins: number;
  totalGamesPlayed: number;
}

export interface AllStats {
  klondike: GameModeStats;
  tripeaks: GameModeStats;
}

export const DEFAULT_MODE_STATS: GameModeStats = {
  bestScore: null,
  bestTime: null,
  currentWinStreak: 0,
  bestWinStreak: 0,
  totalWins: 0,
  totalGamesPlayed: 0,
};

// ── TriPeaks Types ──────────────────────────────────────────

export interface TriPeaksCard extends Card {
  pyramidIndex: number; // 0-27 position in the pyramid
  removed: boolean;
}

export type TriPeaksStatus = 'playing' | 'won' | 'no-moves';

export interface TriPeaksGameState {
  pyramid: TriPeaksCard[];
  stock: Card[];
  waste: Card[];
  score: number;
  moves: number;
  streak: number; // consecutive plays without stock draw
  elapsedSeconds: number;
  status: TriPeaksStatus;
  peaksCleared: [boolean, boolean, boolean];
}

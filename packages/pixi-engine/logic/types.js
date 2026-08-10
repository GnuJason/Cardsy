// ── Card Model ──────────────────────────────────────────────
// ── Suit / Rank helpers ─────────────────────────────────────
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
};
export const RANK_LABELS = {
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
export function suitColor(suit) {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}
export function cardId(suit, rank) {
    return `${suit}-${rank}`;
}
// Suit ordinal for foundation indexing
export const SUIT_INDEX = {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3,
};
export const DEFAULT_MODE_STATS = {
    bestScore: null,
    bestTime: null,
    currentWinStreak: 0,
    bestWinStreak: 0,
    totalWins: 0,
    totalGamesPlayed: 0,
};

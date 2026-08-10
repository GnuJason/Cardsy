export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
    id: string;
}
export declare const SUITS: Suit[];
export declare const RANKS: Rank[];
export declare const SUIT_SYMBOLS: Record<Suit, string>;
export declare const RANK_LABELS: Record<Rank, string>;
export declare function suitColor(suit: Suit): 'red' | 'black';
export declare function cardId(suit: Suit, rank: Rank): string;
export declare const SUIT_INDEX: Record<Suit, number>;
export type GameStatus = 'playing' | 'won' | 'no-moves';
export interface GameState {
    stock: Card[];
    waste: Card[];
    tableau: Card[][];
    foundations: Card[][];
    shuffleSeed?: number;
    score: number;
    moves: number;
    elapsedSeconds: number;
    status: GameStatus;
}
export type MoveSource = {
    zone: 'waste';
} | {
    zone: 'tableau';
    pileIndex: number;
    cardIndex: number;
} | {
    zone: 'foundation';
    pileIndex: number;
};
export type MoveTarget = {
    zone: 'tableau';
    pileIndex: number;
} | {
    zone: 'foundation';
    pileIndex: number;
};
export interface GameMove {
    source: MoveSource;
    target: MoveTarget;
}
export interface UserSettings {
    reducedMotion: boolean;
    cardScale: 'small' | 'medium' | 'large' | 'xlarge';
    highContrast: boolean;
    cardBack: string;
    soundEnabled: boolean;
    theme: string;
    drawCount: 1 | 3;
}
export type GameMode = 'klondike' | 'tripeaks' | 'golf' | 'pyramid' | 'freecell' | 'spider';
export interface GameModeStats {
    bestScore: number | null;
    bestTime: number | null;
    currentWinStreak: number;
    bestWinStreak: number;
    totalWins: number;
    totalGamesPlayed: number;
}
export interface AllStats {
    klondike: GameModeStats;
    tripeaks: GameModeStats;
    golf: GameModeStats;
    pyramid: GameModeStats;
    freecell: GameModeStats;
    spider: GameModeStats;
}
export declare const DEFAULT_MODE_STATS: GameModeStats;
export interface TriPeaksCard extends Card {
    pyramidIndex: number;
    removed: boolean;
}
export type TriPeaksStatus = 'playing' | 'won' | 'no-moves';
export interface TriPeaksGameState {
    pyramid: TriPeaksCard[];
    stock: Card[];
    waste: Card[];
    shuffleSeed?: number;
    score: number;
    moves: number;
    streak: number;
    elapsedSeconds: number;
    status: TriPeaksStatus;
    peaksCleared: [boolean, boolean, boolean];
}
export interface SavedKlondikeGame {
    state: GameState;
    undoStack: GameState[];
    savedAt: number;
    drawCount: 1 | 3;
}
export interface SavedTriPeaksGame {
    state: TriPeaksGameState;
    undoStack: TriPeaksGameState[];
    savedAt: number;
}
export type GolfStatus = 'playing' | 'won' | 'no-moves';
export interface GolfGameState {
    tableau: Card[][];
    stock: Card[];
    waste: Card[];
    shuffleSeed?: number;
    cardsRemaining: number;
    moves: number;
    elapsedSeconds: number;
    status: GolfStatus;
}
export interface SavedGolfGame {
    state: GolfGameState;
    undoStack: GolfGameState[];
    savedAt: number;
}
export interface PyramidCard extends Card {
    pyramidIndex: number;
    removed: boolean;
}
export type PyramidStatus = 'playing' | 'won' | 'no-moves';
export interface PyramidGameState {
    pyramid: PyramidCard[];
    stock: Card[];
    waste: Card[];
    shuffleSeed?: number;
    cardsRemaining: number;
    moves: number;
    elapsedSeconds: number;
    status: PyramidStatus;
    selectedIndex: number | null;
}
export interface SavedPyramidGame {
    state: PyramidGameState;
    undoStack: PyramidGameState[];
    savedAt: number;
}
export type FreeCellSource = {
    type: 'column';
    colIndex: number;
    cardIndex: number;
} | {
    type: 'freecell';
    cellIndex: number;
};
export type FreeCellStatus = 'playing' | 'won' | 'no-moves';
export interface FreeCellGameState {
    columns: Card[][];
    freeCells: (Card | null)[];
    foundations: Card[][];
    shuffleSeed?: number;
    moves: number;
    elapsedSeconds: number;
    status: FreeCellStatus;
    selectedSource: FreeCellSource | null;
}
export interface SavedFreeCellGame {
    state: FreeCellGameState;
    undoStack: FreeCellGameState[];
    savedAt: number;
}
export type SpiderDifficulty = 1 | 2 | 4;
export type SpiderStatus = 'playing' | 'won' | 'no-moves';
export interface SpiderSource {
    colIndex: number;
    cardIndex: number;
}
export interface SpiderGameState {
    columns: Card[][];
    stock: Card[];
    foundations: Card[][];
    shuffleSeed?: number;
    completedRuns: number;
    score: number;
    moves: number;
    elapsedSeconds: number;
    status: SpiderStatus;
    difficulty: SpiderDifficulty;
    selectedSource: SpiderSource | null;
}
export interface SavedSpiderGame {
    state: SpiderGameState;
    undoStack: SpiderGameState[];
    savedAt: number;
    difficulty: SpiderDifficulty;
}
export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    icon: string;
    mode: GameMode | 'global';
    tiers?: number[];
}
export interface UnlockedAchievement {
    id: string;
    unlockedAt: number;
    tier?: number;
}

/**
 * Score for playing a card from the pyramid.
 * Base: 10 points + 5 per consecutive card in the current streak.
 * Streak 0 → 10, streak 1 → 15, streak 2 → 20, etc.
 */
export declare function scoreCardPlay(streak: number): number;
/** Bonus for clearing one of the three peaks */
export declare function peakClearBonus(): number;
/** Bonus for clearing the entire board */
export declare function boardClearBonus(): number;
/** Undo penalty (smaller than Klondike since TriPeaks is harder) */
export declare function undoPenalty(): number;

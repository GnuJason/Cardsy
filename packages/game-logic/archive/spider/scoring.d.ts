/**
 * Returns the current Spider score.
 * This is stored directly on the game state, so this
 * helper just passes it through for consistency.
 */
export declare function spiderScore(score: number): number;
/**
 * Compare two Spider scores. Higher is better.
 */
export declare function isBetterScore(candidate: number, current: number | null): boolean;

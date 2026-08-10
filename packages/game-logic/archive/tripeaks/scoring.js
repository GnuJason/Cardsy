// ── TriPeaks Scoring ────────────────────────────────────────
/**
 * Score for playing a card from the pyramid.
 * Base: 10 points + 5 per consecutive card in the current streak.
 * Streak 0 → 10, streak 1 → 15, streak 2 → 20, etc.
 */
export function scoreCardPlay(streak) {
    return 10 + streak * 5;
}
/** Bonus for clearing one of the three peaks */
export function peakClearBonus() {
    return 15;
}
/** Bonus for clearing the entire board */
export function boardClearBonus() {
    return 30;
}
/** Undo penalty (smaller than Klondike since TriPeaks is harder) */
export function undoPenalty() {
    return -5;
}

// ── Scoring Constants ───────────────────────────────────────
const SCORES = {
    'waste-to-foundation': 10,
    'tableau-to-foundation': 10,
    'waste-to-tableau': 5,
    'undo': -15,
};
export function scoreMove(move) {
    return SCORES[move];
}
/**
 * Timer bonus: award extra points for fast completion.
 * Formula based on classic Windows Solitaire:
 *   bonus = max(0, 700000 / elapsedSeconds)
 * Capped so very fast games don't produce absurd scores.
 */
export function timerBonus(elapsedSeconds) {
    if (elapsedSeconds <= 0)
        return 0;
    return Math.floor(Math.max(0, 700000 / elapsedSeconds));
}

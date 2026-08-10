// ── Pyramid Scoring ─────────────────────────────────────────
//
// Pyramid uses subtractive scoring: the score IS the number of
// cards remaining in the pyramid. Lower is better. 0 = perfect.
// There is no additive scoring or timer bonus.
/**
 * Returns the number of cards remaining in the pyramid.
 * This is the player's score (lower is better).
 */
export function cardsRemaining(state) {
    return state.cardsRemaining;
}
/**
 * Undo penalty: not applicable for Pyramid since score = remaining count.
 * Undoing restores cards to the pyramid, naturally increasing the count.
 * This constant exists for symmetry with other modes.
 */
export function undoPenalty() {
    return 0;
}

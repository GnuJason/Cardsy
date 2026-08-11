// ── FreeCell Scoring ────────────────────────────────────────
//
// FreeCell uses move count as the score: lower is better.
// There is no additive scoring or timer bonus.
/**
 * Returns the move count (the player's score — lower is better).
 */
export function movesCount(state) {
    return state.moves;
}
/**
 * Undo penalty: not applicable for FreeCell.
 * This constant exists for symmetry with other modes.
 */
export function undoPenalty() {
    return 0;
}

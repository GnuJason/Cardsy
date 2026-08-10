// ── Spider Scoring ──────────────────────────────────────────
//
// Classic Spider scoring: starts at 500, -1 per move.
// Higher is better. Score can go negative.

/**
 * Returns the current Spider score.
 * This is stored directly on the game state, so this
 * helper just passes it through for consistency.
 */
export function spiderScore(score: number): number {
  return score;
}

/**
 * Compare two Spider scores. Higher is better.
 */
export function isBetterScore(candidate: number, current: number | null): boolean {
  if (current === null) return true;
  return candidate > current;
}

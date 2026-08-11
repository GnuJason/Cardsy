/**
 * For each pyramid index 0-27, which indices must be removed
 * before this card becomes exposed.
 * Bottom row (18-27) has no blockers — always exposed at start.
 */
export declare const BLOCKED_BY: readonly number[][];
/** Peak top indices — a peak is cleared when its top card is removed */
export declare const PEAK_TOPS: readonly [0, 1, 2];
/** Total pyramid cards */
export declare const PYRAMID_SIZE = 28;
/** Bottom row indices (start face-up) */
export declare const BOTTOM_ROW: readonly [18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
/**
 * Grid positions for rendering. Each card gets { row, col } where
 * col is in half-card units for overlap alignment.
 * Used by the TriPeaksBoard component for CSS positioning.
 */
export declare const PYRAMID_POSITIONS: readonly {
    row: number;
    col: number;
}[];

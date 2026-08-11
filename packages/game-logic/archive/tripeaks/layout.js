// ── TriPeaks Pyramid Layout ─────────────────────────────────
//
// 28-card pyramid arranged as 3 peaks:
//
// Row 0:       [0]              [1]              [2]
// Row 1:     [3] [4]          [5] [6]          [7] [8]
// Row 2:   [9][10][11]     [12][13][14]     [15][16][17]
// Row 3: [18][19][20][21][22][23][24][25][26][27]
//
// A card is "exposed" (playable) when both cards that sit
// on top of it have been removed.
/**
 * For each pyramid index 0-27, which indices must be removed
 * before this card becomes exposed.
 * Bottom row (18-27) has no blockers — always exposed at start.
 */
export const BLOCKED_BY = [
    /* 0  */ [3, 4],
    /* 1  */ [5, 6],
    /* 2  */ [7, 8],
    /* 3  */ [9, 10],
    /* 4  */ [10, 11],
    /* 5  */ [12, 13],
    /* 6  */ [13, 14],
    /* 7  */ [15, 16],
    /* 8  */ [16, 17],
    /* 9  */ [18, 19],
    /* 10 */ [19, 20],
    /* 11 */ [20, 21],
    /* 12 */ [21, 22],
    /* 13 */ [22, 23],
    /* 14 */ [23, 24],
    /* 15 */ [24, 25],
    /* 16 */ [25, 26],
    /* 17 */ [26, 27],
    /* 18 */ [],
    /* 19 */ [],
    /* 20 */ [],
    /* 21 */ [],
    /* 22 */ [],
    /* 23 */ [],
    /* 24 */ [],
    /* 25 */ [],
    /* 26 */ [],
    /* 27 */ [],
];
/** Peak top indices — a peak is cleared when its top card is removed */
export const PEAK_TOPS = [0, 1, 2];
/** Total pyramid cards */
export const PYRAMID_SIZE = 28;
/** Bottom row indices (start face-up) */
export const BOTTOM_ROW = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
/**
 * Grid positions for rendering. Each card gets { row, col } where
 * col is in half-card units for overlap alignment.
 * Used by the TriPeaksBoard component for CSS positioning.
 */
export const PYRAMID_POSITIONS = [
    // Row 0: peaks
    { row: 0, col: 2 },
    { row: 0, col: 8 },
    { row: 0, col: 14 },
    // Row 1
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 1, col: 7 },
    { row: 1, col: 9 },
    { row: 1, col: 13 },
    { row: 1, col: 15 },
    // Row 2
    { row: 2, col: 0 },
    { row: 2, col: 2 },
    { row: 2, col: 4 },
    { row: 2, col: 6 },
    { row: 2, col: 8 },
    { row: 2, col: 10 },
    { row: 2, col: 12 },
    { row: 2, col: 14 },
    { row: 2, col: 16 },
    // Row 3 (bottom, continuous)
    { row: 3, col: 0 },
    { row: 3, col: 2 },
    { row: 3, col: 4 },
    { row: 3, col: 6 },
    { row: 3, col: 8 },
    { row: 3, col: 10 },
    { row: 3, col: 12 },
    { row: 3, col: 14 },
    { row: 3, col: 16 },
    { row: 3, col: 18 },
];

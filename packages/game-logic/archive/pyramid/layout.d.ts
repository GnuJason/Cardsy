/** Total pyramid cards */
export declare const PYRAMID_SIZE = 28;
/** Number of rows in the pyramid */
export declare const PYRAMID_ROWS = 7;
/**
 * Compute which row a pyramid index belongs to.
 * Row r contains indices from r*(r+1)/2 to r*(r+1)/2 + r.
 */
export declare function pyramidRow(index: number): number;
/**
 * Compute the column within a row (0-based) for a pyramid index.
 */
export declare function pyramidCol(index: number): number;
/**
 * The start index of a given row.
 */
export declare function rowStartIndex(row: number): number;
/**
 * For each pyramid index 0-27, which child indices block it.
 * Bottom row (21-27) has no children — always exposed.
 *
 * Child left  = index + row + 1
 * Child right = index + row + 2
 * where row = pyramidRow(index)
 */
export declare const CHILDREN: readonly [number, number][];
/** Bottom row indices (always uncovered at start) */
export declare const BOTTOM_ROW: readonly [21, 22, 23, 24, 25, 26, 27];
/**
 * Grid positions for rendering. Each card gets { row, col } where
 * col is in half-card units for overlap alignment.
 * The widest row (row 6, 7 cards) spans columns 0-12 (7 cards × 2 cols each),
 * centered by offsetting narrower rows.
 */
export declare const PYRAMID_POSITIONS: readonly {
    row: number;
    col: number;
}[];

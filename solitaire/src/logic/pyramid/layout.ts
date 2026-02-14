// ── Pyramid Solitaire Layout ────────────────────────────────
//
// 28-card pyramid arranged as 7 rows:
//
// Row 0:                   [0]
// Row 1:                 [1] [2]
// Row 2:               [3] [4] [5]
// Row 3:             [6] [7] [8] [9]
// Row 4:          [10][11][12][13][14]
// Row 5:        [15][16][17][18][19][20]
// Row 6:      [21][22][23][24][25][26][27]
//
// Card at index i in row r has two children:
//   left  = i + r + 1    (actually: i + rowLength)
//   right = i + r + 2    (actually: i + rowLength + 1)
// where rowLength = r + 1.
//
// A card is "uncovered" (playable) when both children have been removed,
// or if the card is in the bottom row (row 6).

/** Total pyramid cards */
export const PYRAMID_SIZE = 28;

/** Number of rows in the pyramid */
export const PYRAMID_ROWS = 7;

/**
 * Compute which row a pyramid index belongs to.
 * Row r contains indices from r*(r+1)/2 to r*(r+1)/2 + r.
 */
export function pyramidRow(index: number): number {
  let row = 0;
  let start = 0;
  while (start + row < index) {
    start += row + 1;
    row++;
  }
  return row;
}

/**
 * Compute the column within a row (0-based) for a pyramid index.
 */
export function pyramidCol(index: number): number {
  const row = pyramidRow(index);
  const rowStart = (row * (row + 1)) / 2;
  return index - rowStart;
}

/**
 * The start index of a given row.
 */
export function rowStartIndex(row: number): number {
  return (row * (row + 1)) / 2;
}

/**
 * For each pyramid index 0-27, which child indices block it.
 * Bottom row (21-27) has no children — always exposed.
 * 
 * Child left  = index + row + 1
 * Child right = index + row + 2
 * where row = pyramidRow(index)
 */
export const CHILDREN: readonly [number, number][] = (() => {
  const result: [number, number][] = [];
  for (let i = 0; i < PYRAMID_SIZE; i++) {
    const r = pyramidRow(i);
    if (r < PYRAMID_ROWS - 1) {
      // Has children in the next row
      const leftChild = i + r + 1;
      const rightChild = i + r + 2;
      result.push([leftChild, rightChild]);
    } else {
      // Bottom row — no children (use -1, -1 sentinel)
      result.push([-1, -1]);
    }
  }
  return result;
})();

/** Bottom row indices (always uncovered at start) */
export const BOTTOM_ROW = [21, 22, 23, 24, 25, 26, 27] as const;

/**
 * Grid positions for rendering. Each card gets { row, col } where
 * col is in half-card units for overlap alignment.
 * The widest row (row 6, 7 cards) spans columns 0-12 (7 cards × 2 cols each),
 * centered by offsetting narrower rows.
 */
export const PYRAMID_POSITIONS: readonly { row: number; col: number }[] = (() => {
  const positions: { row: number; col: number }[] = [];
  for (let r = 0; r < PYRAMID_ROWS; r++) {
    const cardsInRow = r + 1;
    // Offset to center: widest row is 7 cards (14 half-units).
    // Row r has (r+1) cards → (r+1)*2 half-units.
    // Offset = (14 - (r+1)*2) / 2 = 7 - (r+1) = 6 - r
    const offset = 6 - r;
    for (let c = 0; c < cardsInRow; c++) {
      positions.push({ row: r, col: offset + c * 2 });
    }
  }
  return positions;
})();

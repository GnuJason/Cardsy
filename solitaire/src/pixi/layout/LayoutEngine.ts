import type { GameMode, LayoutResult, PileLayout, ViewportInfo } from '../types';
import type { CardSize } from './LayoutTypes';

function makePile(
  pileType: PileLayout['pileType'],
  pileIndex: number,
  x: number,
  y: number,
  fanDirection: PileLayout['fanDirection'],
  fanOffset: number,
  cardSize: CardSize,
): PileLayout {
  return {
    pileType,
    pileIndex,
    x,
    y,
    fanDirection,
    fanOffset,
    dropWidth: cardSize.width,
    dropHeight: cardSize.height,
  };
}

function computeFoundationStartX(
  viewportWidth: number,
  cardWidth: number,
  padding: number,
  colGap: number,
): number {
  const rightAlignedStart = viewportWidth - padding - (cardWidth * 4 + colGap * 3);
  const leftGroupEnd = padding + cardWidth * 2 + colGap;
  const preferredGap = Math.round(cardWidth * 1.1);
  const maxGap = Math.round(cardWidth * 1.6);
  const clampedGap = Math.min(maxGap, preferredGap);
  const compactStart = leftGroupEnd + clampedGap;
  if (compactStart + cardWidth * 4 + colGap * 3 <= viewportWidth - padding) {
    return compactStart;
  }
  return rightAlignedStart;
}

export function computeLayout(
  mode: GameMode,
  viewport: ViewportInfo,
  cardSize: CardSize,
  pileCounts?: Map<string, number>,
): LayoutResult {
  const padding = 16;
  const topY = 18;
  const rowGap = 20;
  const colGap = 12;
  const piles: PileLayout[] = [];

  if (mode === 'klondike') {
    piles.push(makePile('stock', 0, padding, topY, 'none', 0, cardSize));
    piles.push(makePile('waste', 0, padding + cardSize.width + colGap, topY, 'right', 24, cardSize));

    const foundationStartX = computeFoundationStartX(viewport.width, cardSize.width, padding, colGap);
    for (let i = 0; i < 4; i += 1) {
      piles.push(makePile('foundation', i, foundationStartX + i * (cardSize.width + colGap), topY, 'none', 0, cardSize));
    }

    const tableauY = topY + cardSize.height + rowGap;
    for (let i = 0; i < 7; i += 1) {
      piles.push(makePile('tableau', i, padding + i * (cardSize.width + colGap), tableauY, 'down', Math.round(cardSize.width * 0.28), cardSize));
    }
  } else if (mode === 'freecell') {
    for (let i = 0; i < 4; i += 1) {
      piles.push(makePile('freecell', i, padding + i * (cardSize.width + colGap), topY, 'none', 0, cardSize));
    }
    const foundationStartX = viewport.width - padding - (cardSize.width * 4 + colGap * 3);
    for (let i = 0; i < 4; i += 1) {
      piles.push(makePile('foundation', i, foundationStartX + i * (cardSize.width + colGap), topY, 'none', 0, cardSize));
    }
    const tableY = topY + cardSize.height + rowGap;
    for (let i = 0; i < 8; i += 1) {
      piles.push(makePile('column', i, padding + i * (cardSize.width + colGap), tableY, 'down', Math.round(cardSize.width * 0.25), cardSize));
    }
  } else if (mode === 'spider') {
    piles.push(makePile('stock', 0, padding, topY, 'none', 0, cardSize));
    for (let i = 0; i < 8; i += 1) {
      piles.push(makePile('foundation', i, viewport.width - padding - (i + 1) * (Math.round(cardSize.width * 0.5) + 4), topY, 'none', 0, {
        ...cardSize,
        width: Math.round(cardSize.width * 0.45),
        height: Math.round(cardSize.height * 0.45),
      }));
    }
    const tableY = topY + cardSize.height + rowGap;
    for (let i = 0; i < 10; i += 1) {
      piles.push(makePile('column', i, padding + i * (cardSize.width + 8), tableY, 'down', Math.round(cardSize.width * 0.22), cardSize));
    }
  } else if (mode === 'tripeaks') {
    const half = Math.round(cardSize.width / 2);
    const startX = Math.round((viewport.width - half * 10) / 2);
    const startY = topY;
    for (let i = 0; i < 28; i += 1) {
      const row = i < 3 ? 0 : i < 9 ? 1 : i < 18 ? 2 : 3;
      const rowStart = row === 0 ? 0 : row === 1 ? 3 : row === 2 ? 9 : 18;
      const colInRow = i - rowStart;
      const rowCols = row === 0 ? 3 : row === 1 ? 6 : row === 2 ? 9 : 10;
      const xOffset = Math.round((10 - rowCols) * half * 0.5);
      piles.push(makePile('pyramid', i, startX + xOffset + colInRow * half, startY + row * Math.round(cardSize.height * 0.43), 'none', 0, cardSize));
    }
    const bottomY = startY + Math.round(cardSize.height * 2.1);
    piles.push(makePile('stock', 0, startX + half, bottomY, 'none', 0, cardSize));
    piles.push(makePile('waste', 0, startX + half + cardSize.width + 24, bottomY, 'none', 0, cardSize));
  } else if (mode === 'pyramid') {
    const half = Math.round(cardSize.width / 2);
    const startX = Math.round((viewport.width - half * 7) / 2);
    const startY = topY;
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const index = (row * (row + 1)) / 2 + col;
        piles.push(makePile('pyramid', index, startX + (6 - row) * Math.round(half * 0.5) + col * half, startY + row * Math.round(cardSize.height * 0.34), 'none', 0, cardSize));
      }
    }
    const bottomY = startY + Math.round(cardSize.height * 2.7);
    piles.push(makePile('stock', 0, startX + half, bottomY, 'none', 0, cardSize));
    piles.push(makePile('waste', 0, startX + half + cardSize.width + 24, bottomY, 'none', 0, cardSize));
  } else {
    const tableY = topY;
    for (let i = 0; i < 7; i += 1) {
      piles.push(makePile('column', i, padding + i * (cardSize.width + colGap), tableY, 'down', Math.round(cardSize.width * 0.3), cardSize));
    }
    const bottomY = tableY + Math.round(cardSize.height * 2.45);
    piles.push(makePile('stock', 0, padding, bottomY, 'none', 0, cardSize));
    piles.push(makePile('waste', 0, padding + cardSize.width + colGap, bottomY, 'none', 0, cardSize));
  }

  for (const pile of piles) {
    if (pile.fanDirection === 'none') continue;
    const key = `${pile.pileType}-${pile.pileIndex}`;
    const count = pileCounts?.get(key) ?? 0;
    if (count <= 1) continue;

    const maxExtent = pile.fanDirection === 'down'
      ? viewport.height - pile.y - cardSize.height - 20
      : viewport.width - pile.x - cardSize.width - 20;
    const neededExtent = pile.fanOffset * (count - 1);
    if (neededExtent > maxExtent && maxExtent > 0) {
      pile.fanOffset = Math.max(4, Math.floor(maxExtent / (count - 1)));
    }
  }

  return {
    piles,
    canvasWidth: viewport.width,
    canvasHeight: viewport.height,
    cardSize,
  };
}

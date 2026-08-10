export function hitTestPile(point, layout, pileCounts) {
    for (const pile of layout.piles) {
        const pileKey = `${pile.pileType}-${pile.pileIndex}`;
        const cardCount = pileCounts?.get(pileKey) ?? 20;
        const maxY = pile.y + pile.dropHeight + (pile.fanDirection === 'down' ? pile.fanOffset * Math.max(0, cardCount - 1) : 0);
        const maxX = pile.x + pile.dropWidth + (pile.fanDirection === 'right' ? pile.fanOffset * Math.max(0, cardCount - 1) : 0);
        if (point.x >= pile.x && point.x <= maxX && point.y >= pile.y && point.y <= maxY) {
            const relY = point.y - pile.y;
            const relX = point.x - pile.x;
            const offset = pile.fanDirection === 'down' ? pile.fanOffset : pile.fanDirection === 'right' ? pile.fanOffset : 1;
            const rawIndex = Math.floor((pile.fanDirection === 'down' ? relY : relX) / Math.max(1, offset));
            return {
                pileType: pile.pileType,
                pileIndex: pile.pileIndex,
                cardIndex: Math.max(0, Math.min(rawIndex, Math.max(0, cardCount - 1))),
            };
        }
    }
    return null;
}

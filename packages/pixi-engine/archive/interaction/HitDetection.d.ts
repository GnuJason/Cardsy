import type { LayoutResult, PileLayout } from '../types';
export interface HitResult {
    pileType: PileLayout['pileType'];
    pileIndex: number;
    cardIndex: number;
}
export declare function hitTestPile(point: {
    x: number;
    y: number;
}, layout: LayoutResult, pileCounts?: Map<string, number>): HitResult | null;

import type { GameMode, LayoutResult, ViewportInfo } from '../types';
import type { CardSize } from './LayoutTypes';
export declare function computeLayout(mode: GameMode, viewport: ViewportInfo, cardSize: CardSize, pileCounts?: Map<string, number>): LayoutResult;

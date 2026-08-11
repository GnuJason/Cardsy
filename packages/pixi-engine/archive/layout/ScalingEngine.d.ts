import type { CardSize, GameMode, ViewportInfo } from '../types';
export declare function computeCardSize(viewport: ViewportInfo, dpi: number, mode: GameMode, cardScale?: string): CardSize;
export declare function getViewportInfo(container: HTMLDivElement): ViewportInfo;

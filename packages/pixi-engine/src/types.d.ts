import type { GameState } from '@grandmagame/card-engine';
export interface PixiThemeColors {
    feltColor: number;
    cardBackground: number;
    cardBorder: number;
    redCardColor: number;
    blackCardColor: number;
    placeholderStroke: number;
    placeholderAlpha: number;
}
export type PixiGameEvent = {
    type: 'DRAW';
} | {
    type: 'TAP_WASTE';
} | {
    type: 'TAP_TABLEAU';
    pileIndex: number;
    cardIndex: number;
} | {
    type: 'TAP_FOUNDATION';
    pileIndex: number;
};
export interface PixiGameCanvasProps {
    mode: 'klondike';
    gameState: GameState;
    cardBackImage: string | null;
    reducedMotion: boolean;
    themeColors: PixiThemeColors;
    highContrast: boolean;
    cardScale: string;
    drawCount?: 1 | 3;
    backVariant?: 'damask' | 'leather' | 'fabric' | 'floral';
    cardBackUrl?: string | null;
    cardBackMode?: 'single' | 'random';
    customBackList?: string[];
    onGameEvent: (event: PixiGameEvent) => void;
}

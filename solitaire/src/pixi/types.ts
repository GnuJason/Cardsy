import type {
  Card,
  FreeCellGameState,
  GameMode,
  GameState,
  GolfGameState,
  PyramidGameState,
  SpiderGameState,
  Suit,
  TriPeaksGameState,
} from '../logic/types';

export type { GameMode } from '../logic/types';

export type AnyGameState =
  | GameState
  | FreeCellGameState
  | SpiderGameState
  | TriPeaksGameState
  | PyramidGameState
  | GolfGameState;

export interface CardViewModel extends Card {
  pileType: PileType;
  pileIndex: number;
  cardIndex: number;
}

export type PileType =
  | 'stock'
  | 'waste'
  | 'tableau'
  | 'foundation'
  | 'freecell'
  | 'column'
  | 'pyramid';

export interface PileViewModel {
  pileType: PileType;
  pileIndex: number;
  cards: Card[];
  suitSymbol?: Suit;
}

export interface CardSize {
  width: number;
  height: number;
  fontSize: number;
  pipSize: number;
  cornerRadius: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  dpi: number;
}

export interface PileLayout {
  pileType: PileType;
  pileIndex: number;
  x: number;
  y: number;
  fanDirection: 'down' | 'right' | 'none';
  fanOffset: number;
  dropWidth: number;
  dropHeight: number;
}

export interface LayoutResult {
  piles: PileLayout[];
  canvasWidth: number;
  canvasHeight: number;
  cardSize: CardSize;
}

export interface PixiScalingConfig {
  minCardWidth: number;
  maxCardWidth: number;
}

export interface PixiLayoutConfig {
  padding: number;
  topRowGap: number;
  columnGap: number;
  rowGap: number;
}

export interface PixiThemeColors {
  feltColor: number;
  cardBackground: number;
  cardBorder: number;
  redCardColor: number;
  blackCardColor: number;
  placeholderStroke: number;
  placeholderAlpha: number;
}

export interface PixiDebugOptions {
  enabled: boolean;
  fps: boolean;
  pointer: boolean;
  hitBoxes: boolean;
  textureLogs: boolean;
  cacheInspector: boolean;
  consoleOnly: boolean;
}

export type PixiGameEvent =
  | { type: 'DRAW' }
  | { type: 'TAP_WASTE' }
  | { type: 'TAP_TABLEAU'; pileIndex: number; cardIndex: number }
  | { type: 'TAP_FOUNDATION'; pileIndex: number }
  | { type: 'TAP_COLUMN'; colIndex: number; cardIndex: number }
  | { type: 'TAP_FREECELL'; cellIndex: number }
  | { type: 'TAP_STOCK' }
  | { type: 'TAP_PYRAMID'; pyramidIndex: number }
  | { type: 'TAP_CARD'; colIndex: number }
  | {
      type: 'DRAG_VALIDATED_MOVE';
      sourcePile: PileType;
      sourcePileIndex: number;
      sourceCardIndex: number;
      targetPile: PileType;
      targetPileIndex: number;
      targetCardIndex: number;
    };

export interface PixiGameCanvasProps {
  mode: GameMode;
  gameState: AnyGameState;
  cardBackImage: string | null;
  reducedMotion: boolean;
  themeColors: PixiThemeColors;
  highContrast: boolean;
  cardScale: string;
  debugOptions?: PixiDebugOptions;
  drawCount?: 1 | 3;
  onGameEvent: (event: PixiGameEvent) => void;
}

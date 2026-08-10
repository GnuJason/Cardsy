import type { AnyGameState, GameMode, PileType } from '../types';
export interface DragEndpoint {
    pileType: PileType;
    pileIndex: number;
    cardIndex: number;
}
export declare function canDrop(mode: GameMode, gameState: AnyGameState, source: DragEndpoint, target: DragEndpoint): boolean;

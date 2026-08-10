import type { GameMode } from '../../logic/types';
import type { PileType, PixiGameEvent } from '../types';
export declare function mapTapToEvent(mode: GameMode, pileType: PileType, pileIndex: number, cardIndex: number): PixiGameEvent | null;

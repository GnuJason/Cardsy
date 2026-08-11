import React from 'react';
import type { GameMode } from '../logic/types';
import type { LayoutResult, PixiGameEvent } from './types';
interface KeyboardOverlayProps {
    layout: LayoutResult;
    mode: GameMode;
    onGameEvent: (event: PixiGameEvent) => void;
}
export declare const KeyboardOverlay: React.FC<KeyboardOverlayProps>;
export {};

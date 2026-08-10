import React from 'react';
import type { PixiDebugOptions, PixiGameCanvasProps } from './types';
export declare function resolveDebugOptions(debugOptions?: PixiDebugOptions, search?: string, isDev?: any): PixiDebugOptions;
export declare function getDragActivationThreshold(pointerType: string): number;
export declare function resolveGameplayBackImage(cardId: string, cardBackImage: string | null): string | null;
export declare const PixiGameCanvas: React.FC<PixiGameCanvasProps>;

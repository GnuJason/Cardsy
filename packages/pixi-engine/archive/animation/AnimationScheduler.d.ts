import type { Sprite } from 'pixi.js';
import type { AnimationPlan } from './types';
export interface AnimationSchedulerDebugSnapshot {
    isAnimating: boolean;
    currentGroupIndex: number;
    currentGroupSize: number;
    totalSteps: number;
    groupElapsedMs: number;
}
export declare class AnimationScheduler {
    private plan;
    private spriteMap;
    private currentGroupIndex;
    private groupElapsed;
    private _isAnimating;
    constructor();
    get isAnimating(): boolean;
    getDebugSnapshot(): AnimationSchedulerDebugSnapshot;
    schedule(plan: AnimationPlan, spriteMap: Map<string, Sprite>): void;
    cancel(): void;
    update(deltaMs: number): void;
}

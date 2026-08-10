import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
export interface SpritePoolFrameStats {
    created: number;
    reused: number;
    destroyed: number;
    active: number;
}
export declare class SpritePool {
    private pool;
    private used;
    private frameStats;
    constructor();
    acquire(key: string, texture: Texture): Sprite;
    beginFrame(): void;
    endFrame(): void;
    get active(): ReadonlyMap<string, Sprite>;
    getStats(): SpritePoolFrameStats;
    destroyAll(): void;
}

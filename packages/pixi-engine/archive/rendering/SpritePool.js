import { Sprite } from 'pixi.js';
export class SpritePool {
    pool;
    used;
    frameStats;
    constructor() {
        this.pool = new Map();
        this.used = new Set();
        this.frameStats = { created: 0, reused: 0, destroyed: 0, active: 0 };
    }
    acquire(key, texture) {
        this.used.add(key);
        const existing = this.pool.get(key);
        if (existing) {
            existing.texture = texture;
            this.frameStats.reused += 1;
            return existing;
        }
        const sprite = new Sprite(texture);
        this.pool.set(key, sprite);
        this.frameStats.created += 1;
        return sprite;
    }
    beginFrame() {
        this.used.clear();
        this.frameStats.created = 0;
        this.frameStats.reused = 0;
        this.frameStats.destroyed = 0;
    }
    endFrame() {
        for (const [key, sprite] of this.pool) {
            if (!this.used.has(key)) {
                sprite.destroy();
                this.pool.delete(key);
                this.frameStats.destroyed += 1;
            }
        }
        this.frameStats.active = this.pool.size;
    }
    get active() {
        return this.pool;
    }
    getStats() {
        return { ...this.frameStats, active: this.pool.size };
    }
    destroyAll() {
        for (const sprite of this.pool.values()) {
            sprite.destroy();
        }
        this.pool.clear();
        this.used.clear();
        this.frameStats.active = 0;
    }
}

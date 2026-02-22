import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

export interface SpritePoolFrameStats {
  created: number;
  reused: number;
  destroyed: number;
  active: number;
}

export class SpritePool {
  private pool: Map<string, Sprite>;
  private used: Set<string>;
  private frameStats: SpritePoolFrameStats;

  constructor() {
    this.pool = new Map();
    this.used = new Set();
    this.frameStats = { created: 0, reused: 0, destroyed: 0, active: 0 };
  }

  acquire(key: string, texture: Texture): Sprite {
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

  beginFrame(): void {
    this.used.clear();
    this.frameStats.created = 0;
    this.frameStats.reused = 0;
    this.frameStats.destroyed = 0;
  }

  endFrame(): void {
    for (const [key, sprite] of this.pool) {
      if (!this.used.has(key)) {
        sprite.destroy();
        this.pool.delete(key);
        this.frameStats.destroyed += 1;
      }
    }
    this.frameStats.active = this.pool.size;
  }

  get active(): ReadonlyMap<string, Sprite> {
    return this.pool;
  }

  getStats(): SpritePoolFrameStats {
    return { ...this.frameStats, active: this.pool.size };
  }

  destroyAll(): void {
    for (const sprite of this.pool.values()) {
      sprite.destroy();
    }
    this.pool.clear();
    this.used.clear();
    this.frameStats.active = 0;
  }
}

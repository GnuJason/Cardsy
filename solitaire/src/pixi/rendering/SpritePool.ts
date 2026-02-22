import { Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';

export class SpritePool {
  private pool: Map<string, Sprite>;
  private used: Set<string>;

  constructor() {
    this.pool = new Map();
    this.used = new Set();
  }

  acquire(key: string, texture: Texture): Sprite {
    this.used.add(key);
    const existing = this.pool.get(key);
    if (existing) {
      existing.texture = texture;
      return existing;
    }

    const sprite = new Sprite(texture);
    this.pool.set(key, sprite);
    return sprite;
  }

  beginFrame(): void {
    this.used.clear();
  }

  endFrame(): void {
    for (const [key, sprite] of this.pool) {
      if (!this.used.has(key)) {
        sprite.destroy();
        this.pool.delete(key);
      }
    }
  }

  get active(): ReadonlyMap<string, Sprite> {
    return this.pool;
  }

  destroyAll(): void {
    for (const sprite of this.pool.values()) {
      sprite.destroy();
    }
    this.pool.clear();
    this.used.clear();
  }
}

import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import { SpritePool } from '../../src/pixi/rendering/SpritePool';

describe('SpritePool', () => {
  it('acquire returns new sprite for unknown key', () => {
    const pool = new SpritePool();
    const sprite = pool.acquire('a', Texture.WHITE);
    expect(sprite).toBeDefined();
  });

  it('acquire returns same sprite for known key', () => {
    const pool = new SpritePool();
    const a = pool.acquire('a', Texture.WHITE);
    const b = pool.acquire('a', Texture.WHITE);
    expect(a).toBe(b);
  });

  it('endFrame destroys sprites not acquired this frame', () => {
    const pool = new SpritePool();
    pool.acquire('a', Texture.WHITE);
    pool.beginFrame();
    pool.endFrame();
    expect(pool.active.size).toBe(0);
  });

  it('beginFrame resets usage tracking', () => {
    const pool = new SpritePool();
    pool.acquire('a', Texture.WHITE);
    pool.beginFrame();
    pool.acquire('a', Texture.WHITE);
    pool.endFrame();
    expect(pool.active.size).toBe(1);
  });

  it('destroyAll empties pool', () => {
    const pool = new SpritePool();
    pool.acquire('a', Texture.WHITE);
    pool.acquire('b', Texture.WHITE);
    pool.destroyAll();
    expect(pool.active.size).toBe(0);
  });

  it('reports frame stats for create/reuse/destroy', () => {
    const pool = new SpritePool();
    pool.beginFrame();
    pool.acquire('a', Texture.WHITE);
    pool.acquire('a', Texture.WHITE);
    pool.endFrame();
    expect(pool.getStats()).toMatchObject({
      created: 1,
      reused: 1,
      destroyed: 0,
      active: 1,
    });

    pool.beginFrame();
    pool.endFrame();
    expect(pool.getStats()).toMatchObject({
      destroyed: 1,
      active: 0,
    });
  });
});

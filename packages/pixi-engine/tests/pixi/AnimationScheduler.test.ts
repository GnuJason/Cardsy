import { describe, expect, it, vi } from 'vitest';
import { Sprite, Texture } from 'pixi.js';
import { AnimationScheduler } from '../../src/pixi/animation/AnimationScheduler';
import type { AnimationPlan } from '../../src/pixi/animation/types';

function makeSpriteMap(): Map<string, Sprite> {
  return new Map([
    ['a', new Sprite(Texture.WHITE)],
    ['b', new Sprite(Texture.WHITE)],
  ]);
}

describe('AnimationScheduler', () => {
  it('empty plan does not animate', () => {
    const scheduler = new AnimationScheduler();
    scheduler.schedule({ steps: [], groups: [] }, new Map());
    expect(scheduler.isAnimating).toBe(false);
  });

  it('moves sprite to target after enough updates', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    const plan: AnimationPlan = {
      steps: [{ spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 100, y: 50, alpha: 1 }, durationMs: 100, easing: 'linear' }],
      groups: [[0]],
    };
    scheduler.schedule(plan, sprites);
    scheduler.update(100);
    expect(sprites.get('a')?.x).toBe(100);
    expect(sprites.get('a')?.y).toBe(50);
    expect(scheduler.isAnimating).toBe(false);
  });

  it('runs groups sequentially', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    const plan: AnimationPlan = {
      steps: [
        { spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 10, y: 0, alpha: 1 }, durationMs: 50, easing: 'linear' },
        { spriteKey: 'a', from: { x: 10, y: 0, alpha: 1 }, to: { x: 20, y: 0, alpha: 1 }, durationMs: 50, easing: 'linear' },
      ],
      groups: [[0], [1]],
    };
    scheduler.schedule(plan, sprites);
    scheduler.update(50);
    expect(sprites.get('a')?.x).toBe(10);
    expect(scheduler.isAnimating).toBe(true);
    scheduler.update(50);
    expect(sprites.get('a')?.x).toBe(20);
    expect(scheduler.isAnimating).toBe(false);
  });

  it('cancel teleports all remaining steps to target', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    const plan: AnimationPlan = {
      steps: [{ spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 80, y: 10, alpha: 1 }, durationMs: 500, easing: 'easeOut' }],
      groups: [[0]],
    };
    scheduler.schedule(plan, sprites);
    scheduler.update(50);
    scheduler.cancel();
    expect(sprites.get('a')?.x).toBe(80);
    expect(sprites.get('a')?.y).toBe(10);
    expect(scheduler.isAnimating).toBe(false);
  });

  it('schedule while animating replaces previous plan', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    scheduler.schedule(
      { steps: [{ spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 10, y: 0, alpha: 1 }, durationMs: 1000, easing: 'linear' }], groups: [[0]] },
      sprites,
    );
    scheduler.schedule(
      { steps: [{ spriteKey: 'a', from: { x: 10, y: 0, alpha: 1 }, to: { x: 30, y: 0, alpha: 1 }, durationMs: 100, easing: 'linear' }], groups: [[0]] },
      sprites,
    );
    scheduler.update(100);
    expect(sprites.get('a')?.x).toBe(30);
  });

  it('fires onComplete after final group', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    const onComplete = vi.fn();
    scheduler.schedule(
      {
        steps: [{ spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 5, y: 0, alpha: 1 }, durationMs: 10, easing: 'linear' }],
        groups: [[0]],
        onComplete,
      },
      sprites,
    );
    scheduler.update(10);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('zero-duration steps resolve immediately', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    scheduler.schedule(
      {
        steps: [{ spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 40, y: 0, alpha: 1 }, durationMs: 0, easing: 'linear' }],
        groups: [[0]],
      },
      sprites,
    );
    scheduler.update(1);
    expect(sprites.get('a')?.x).toBe(40);
    expect(scheduler.isAnimating).toBe(false);
  });

  it('reports debug snapshot while animating', () => {
    const scheduler = new AnimationScheduler();
    const sprites = makeSpriteMap();
    scheduler.schedule(
      {
        steps: [{ spriteKey: 'a', from: { x: 0, y: 0, alpha: 1 }, to: { x: 40, y: 0, alpha: 1 }, durationMs: 100, easing: 'linear' }],
        groups: [[0]],
      },
      sprites,
    );

    scheduler.update(20);
    expect(scheduler.getDebugSnapshot()).toMatchObject({
      isAnimating: true,
      currentGroupIndex: 0,
      currentGroupSize: 1,
      totalSteps: 1,
    });
  });
});

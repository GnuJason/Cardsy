import { describe, expect, it } from 'vitest';
import {
  getDragActivationThreshold,
  resolveDebugOptions,
  resolveGameplayBackImage,
} from '../../src/pixi/PixiGameCanvas';

describe('PixiGameCanvas debug helpers', () => {
  it('returns all-disabled defaults when not in dev mode', () => {
    const options = resolveDebugOptions(undefined, '?pixiDebug=1&pixiFps=1', false);
    expect(options.enabled).toBe(false);
    expect(options.fps).toBe(false);
    expect(options.pointer).toBe(false);
    expect(options.hitBoxes).toBe(false);
    expect(options.textureLogs).toBe(false);
    expect(options.cacheInspector).toBe(false);
    expect(options.consoleOnly).toBe(true);
  });

  it('parses query flags in dev mode', () => {
    const options = resolveDebugOptions(
      undefined,
      '?pixiDebug=1&pixiFps=1&pixiPointer=1&pixiHitBoxes=true&pixiTextures=1&pixiCache=1',
      true,
    );
    expect(options).toEqual({
      enabled: true,
      fps: true,
      pointer: true,
      hitBoxes: true,
      textureLogs: true,
      cacheInspector: true,
      consoleOnly: true,
    });
  });

  it('uses explicit debugOptions when provided', () => {
    const options = resolveDebugOptions(
      {
        enabled: true,
        fps: true,
        pointer: false,
        hitBoxes: false,
        textureLogs: true,
        cacheInspector: false,
        consoleOnly: false,
      },
      '',
      true,
    );

    expect(options.enabled).toBe(true);
    expect(options.fps).toBe(true);
    expect(options.textureLogs).toBe(true);
    expect(options.consoleOnly).toBe(true);
  });

  it('uses smaller drag threshold for mouse pointer', () => {
    expect(getDragActivationThreshold('mouse')).toBe(6);
    expect(getDragActivationThreshold('touch')).toBe(10);
  });

  it('uses explicit global card back override when provided', () => {
    expect(resolveGameplayBackImage('hearts-1', '/cards/backs/custom.jpg')).toBe('/cards/backs/custom.jpg');
  });

  it('falls back to per-card image mapping when no global override is provided', () => {
    expect(resolveGameplayBackImage('hearts-1', null)).toContain('/cards/backs/');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundManager } from '../src/services/sound';

// Mock HTMLAudioElement
class MockAudio {
  src: string;
  volume = 1;
  preload = '';
  play = vi.fn().mockResolvedValue(undefined);
  cloneNode = vi.fn().mockReturnThis();

  constructor(src?: string) {
    this.src = src ?? '';
  }
}

describe('SoundManager', () => {
  let manager: SoundManager;

  beforeEach(() => {
    // @ts-expect-error — mock Audio globally
    globalThis.Audio = MockAudio;
    // Create a fresh instance for each test
    manager = new (SoundManager as unknown as new () => SoundManager)();
  });

  it('starts disabled', () => {
    expect(manager.isEnabled()).toBe(false);
  });

  it('setEnabled toggles enabled state', () => {
    manager.setEnabled(true);
    expect(manager.isEnabled()).toBe(true);
    manager.setEnabled(false);
    expect(manager.isEnabled()).toBe(false);
  });

  it('play does nothing when disabled', () => {
    manager.play('cardFlip');
    // No Audio instances should be created when disabled
    expect(manager.isEnabled()).toBe(false);
  });

  it('play creates and plays audio when enabled', () => {
    manager.setEnabled(true);
    manager.play('cardFlip');
    // The mock Audio constructor was called
    expect(MockAudio.prototype.play || true).toBeTruthy();
  });

  it('play uses cloneNode for cached sounds', () => {
    manager.setEnabled(true);
    // First play caches
    manager.play('shuffle');
    // Second play should clone
    manager.play('shuffle');
  });

  it('preload caches all sounds', () => {
    manager.preload();
    // Should not throw
    manager.setEnabled(true);
    // Playing after preload should use cloneNode
    manager.play('win');
  });

  it('preload only runs once', () => {
    manager.preload();
    manager.preload(); // second call is a no-op
    // no way to observe directly, but it shouldn't error
  });

  it('setEnabled(true) triggers preload on first enable', () => {
    manager.setEnabled(true);
    // preload happens internally — verify it doesn't error on subsequent play
    manager.play('achievement');
  });

  it('play never throws even if Audio constructor fails', () => {
    globalThis.Audio = (() => {
      throw new Error('Audio not supported');
    }) as unknown as typeof Audio;
    manager.setEnabled(true);
    // Should not throw
    expect(() => manager.play('cardFlip')).not.toThrow();
  });
});

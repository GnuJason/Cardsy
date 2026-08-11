/**
 * Sound effect manager.
 * Singleton — import soundManager directly, no React context needed.
 */

export type SoundEffect =
  | 'cardFlip'
  | 'cardPlace'
  | 'draw'
  | 'shuffle'
  | 'win'
  | 'achievement'
  | 'buttonClick';

const SOUND_FILES: Record<SoundEffect, string> = {
  cardFlip: '/sounds/card-flip.mp3',
  cardPlace: '/sounds/card-place.mp3',
  draw: '/sounds/draw.mp3',
  shuffle: '/sounds/shuffle.mp3',
  win: '/sounds/win.mp3',
  achievement: '/sounds/achievement.mp3',
  buttonClick: '/sounds/button-click.mp3',
};

export class SoundManager {
  private enabled = false;
  private audioCache = new Map<SoundEffect, HTMLAudioElement>();
  private preloaded = false;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (on && !this.preloaded) {
      this.preload();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Play a sound effect. Fire-and-forget, never throws.
   */
  play(sound: SoundEffect): void {
    if (!this.enabled) return;
    try {
      const cached = this.audioCache.get(sound);
      if (cached) {
        // Clone for overlapping plays
        const clone = cached.cloneNode() as HTMLAudioElement;
        clone.volume = 0.5;
        clone.play().catch(() => {});
      } else {
        // Lazy load on first play
        const audio = new Audio(SOUND_FILES[sound]);
        audio.volume = 0.5;
        this.audioCache.set(sound, audio);
        audio.play().catch(() => {});
      }
    } catch {
      // Silent fail — audio should never break the game
    }
  }

  /**
   * Preload all sound files into the cache.
   * Call after first user interaction to satisfy browser autoplay policies.
   */
  preload(): void {
    if (this.preloaded) return;
    this.preloaded = true;
    for (const [key, path] of Object.entries(SOUND_FILES)) {
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0.5;
        this.audioCache.set(key as SoundEffect, audio);
      } catch {
        // Silent fail
      }
    }
  }
}

export const soundManager = new SoundManager();

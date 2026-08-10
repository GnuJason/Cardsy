/**
 * Sound effect manager.
 * Singleton — import soundManager directly, no React context needed.
 */
export type SoundEffect = 'cardFlip' | 'cardPlace' | 'draw' | 'shuffle' | 'win' | 'achievement' | 'buttonClick';
export declare class SoundManager {
    private enabled;
    private audioCache;
    private preloaded;
    setEnabled(on: boolean): void;
    isEnabled(): boolean;
    /**
     * Play a sound effect. Fire-and-forget, never throws.
     */
    play(sound: SoundEffect): void;
    /**
     * Preload all sound files into the cache.
     * Call after first user interaction to satisfy browser autoplay policies.
     */
    preload(): void;
}
export declare const soundManager: SoundManager;

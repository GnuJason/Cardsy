/**
 * Sound effect manager.
 * Singleton — import soundManager directly, no React context needed.
 */
const SOUND_FILES = {
    cardFlip: '/sounds/card-flip.mp3',
    cardPlace: '/sounds/card-place.mp3',
    draw: '/sounds/draw.mp3',
    shuffle: '/sounds/shuffle.mp3',
    win: '/sounds/win.mp3',
    achievement: '/sounds/achievement.mp3',
    buttonClick: '/sounds/button-click.mp3',
};
export class SoundManager {
    enabled = false;
    audioCache = new Map();
    preloaded = false;
    setEnabled(on) {
        this.enabled = on;
        if (on && !this.preloaded) {
            this.preload();
        }
    }
    isEnabled() {
        return this.enabled;
    }
    /**
     * Play a sound effect. Fire-and-forget, never throws.
     */
    play(sound) {
        if (!this.enabled)
            return;
        try {
            const cached = this.audioCache.get(sound);
            if (cached) {
                // Clone for overlapping plays
                const clone = cached.cloneNode();
                clone.volume = 0.5;
                clone.play().catch(() => { });
            }
            else {
                // Lazy load on first play
                const audio = new Audio(SOUND_FILES[sound]);
                audio.volume = 0.5;
                this.audioCache.set(sound, audio);
                audio.play().catch(() => { });
            }
        }
        catch {
            // Silent fail — audio should never break the game
        }
    }
    /**
     * Preload all sound files into the cache.
     * Call after first user interaction to satisfy browser autoplay policies.
     */
    preload() {
        if (this.preloaded)
            return;
        this.preloaded = true;
        for (const [key, path] of Object.entries(SOUND_FILES)) {
            try {
                const audio = new Audio(path);
                audio.preload = 'auto';
                audio.volume = 0.5;
                this.audioCache.set(key, audio);
            }
            catch {
                // Silent fail
            }
        }
    }
}
export const soundManager = new SoundManager();

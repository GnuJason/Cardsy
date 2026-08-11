import { type Application, Sprite, Texture } from 'pixi.js';
import type { CardSize } from '../types';
/**
 * Load an image URL into a Pixi Texture.
 * For blob: URLs we bypass Pixi's Assets cache entirely (it can't resolve them).
 * For normal URLs we use Assets.load which returns a Texture in Pixi 8.
 */
export declare function loadTextureFromUrl(url: string): Promise<Texture>;
export type TextureCache = Map<string, Texture>;
interface CardRenderColors {
    cardBackground: number;
    cardBorder: number;
    redCardColor: number;
    blackCardColor: number;
}
/** Return the device-pixel resolution to use for PIXI text rasterisation. */
export declare function getTextureResolution(): number;
/**
 * Compose a custom photo as a full-bleed card back with rounded corners.
 * The photo is scaled to 'cover' the entire card area (no padding, no
 * letterboxing).  A rounded-rect mask clips to the card shape.
 */
export declare function makeCustomBackTexture(app: Application, cardSize: CardSize, photoTexture: Texture, resolution?: number): Texture;
export declare function generateBackTexture(app: Application, cardSize: CardSize, backImage?: string | null, resolution?: number): Promise<Texture>;
export declare function generateCardTextures(app: Application, cardSize: CardSize, colors?: CardRenderColors, resolution?: number): TextureCache;
export declare function makeCardSprite(cardId: string, cache: TextureCache, backTexture: Texture, faceUp: boolean): Sprite;
export declare function invalidateTextures(cache: TextureCache): void;
export {};

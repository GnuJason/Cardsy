import { type Application, Assets, Container, Graphics, ImageSource, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { CARD_BACK_DEFAULT } from '../../config/cardArt';
import {
  BLACK_CARD_COLOR,
  CARD_BACKGROUND,
  CARD_BORDER,
  RED_CARD_COLOR,
} from '../constants';
import type { CardSize } from '../types';
import { RANK_LABELS, SUITS, SUIT_SYMBOLS, suitColor, type Rank, type Suit } from '../../logic/types';

/** Create a Texture from a loaded HTMLImageElement, bypassing Pixi's Cache. */
function textureFromImage(img: HTMLImageElement): Texture {
  const source = new ImageSource({ resource: img });
  return new Texture({ source });
}

/**
 * Load an image URL into a Pixi Texture.
 * For blob: URLs we bypass Pixi's Assets cache entirely (it can't resolve them).
 * For normal URLs we use Assets.load which returns a Texture in Pixi 8.
 */
export async function loadTextureFromUrl(url: string): Promise<Texture> {
  if (url.startsWith('blob:')) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('blob image load failed'));
      img.src = url;
    });
    return textureFromImage(img);
  }
  // Assets.load returns a Texture for image URLs in Pixi 8
  return await Assets.load(url);
}

export type TextureCache = Map<string, Texture>;

interface CardRenderColors {
  cardBackground: number;
  cardBorder: number;
  redCardColor: number;
  blackCardColor: number;
}

function cardKey(suit: Suit, rank: Rank): string {
  return `${suit}-${rank}`;
}

/** Return the device-pixel resolution to use for PIXI text rasterisation. */
export function getTextureResolution(): number {
  return typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
}

/** Bicycle-style serif font stack for card faces. */
const CARD_FONT_FAMILY = 'Georgia, "Times New Roman", "Noto Serif", serif';

function makeFrontCardTexture(
  app: Application,
  cardSize: CardSize,
  suit: Suit,
  rank: Rank,
  colors?: CardRenderColors,
  resolution = 1,
): Texture {
  const container = new Container();
  const color = suitColor(suit) === 'red'
    ? colors?.redCardColor ?? RED_CARD_COLOR
    : colors?.blackCardColor ?? BLACK_CARD_COLOR;

  // Pure white card with thin dark border
  const shape = new Graphics()
    .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
    .fill({ color: colors?.cardBackground ?? CARD_BACKGROUND })
    .stroke({ color: colors?.cardBorder ?? CARD_BORDER, width: 1.5 });

  // 8% horizontal, 7% vertical safe-area margins
  const marginX = Math.round(cardSize.width * 0.08);
  const marginY = Math.round(cardSize.height * 0.07);

  const rankStyle = new TextStyle({
    fontFamily: CARD_FONT_FAMILY,
    fill: color,
    fontSize: cardSize.fontSize,
    fontWeight: '700',
  });

  const pipStyle = new TextStyle({
    fontFamily: CARD_FONT_FAMILY,
    fill: color,
    fontSize: cardSize.pipSize,
    fontWeight: '700',
  });

  const cornerSuitStyle = new TextStyle({
    fontFamily: CARD_FONT_FAMILY,
    fill: color,
    fontSize: Math.round(cardSize.fontSize * 0.85),
    fontWeight: '700',
  });

  // ── Top-left corner: rank then suit stacked vertically ──
  const rankText = new Text({ text: RANK_LABELS[rank], style: rankStyle, resolution });
  rankText.x = marginX;
  rankText.y = marginY;

  const suitText = new Text({ text: SUIT_SYMBOLS[suit], style: cornerSuitStyle, resolution });
  suitText.x = marginX;
  suitText.y = marginY + Math.round(cardSize.fontSize * 1.0);

  // ── Center pip: single large suit symbol (no rank text for face cards) ──
  const center = new Text({
    text: SUIT_SYMBOLS[suit],
    style: pipStyle,
    resolution,
  });
  center.anchor.set(0.5, 0.5);
  center.x = cardSize.width / 2;
  center.y = cardSize.height / 2;

  // ── Bottom-right corner: rank + suit rotated 180° ──
  // Mirror the top-left corner layout exactly, then rotate 180° around the
  // card's bottom-right safe-area origin.  We position the rank and suit at
  // the same insets from the bottom-right as the top-left uses from the
  // top-left, then rotate each glyph.
  const mirrorRank = new Text({ text: RANK_LABELS[rank], style: rankStyle, resolution });
  mirrorRank.anchor.set(0, 0);
  mirrorRank.rotation = Math.PI;
  mirrorRank.x = cardSize.width - marginX;
  mirrorRank.y = cardSize.height - marginY;

  const mirrorSuit = new Text({ text: SUIT_SYMBOLS[suit], style: cornerSuitStyle, resolution });
  mirrorSuit.anchor.set(0, 0);
  mirrorSuit.rotation = Math.PI;
  mirrorSuit.x = cardSize.width - marginX;
  mirrorSuit.y = cardSize.height - marginY - Math.round(cardSize.fontSize * 1.0);

  container.addChild(shape, rankText, suitText, center, mirrorRank, mirrorSuit);
  return app.renderer.generateTexture({ target: container, resolution });
}

function makeBackTexture(app: Application, cardSize: CardSize, borderColor?: number, resolution = 1): Texture {
  const container = new Container();
  const inset = cardSize.width * 0.05;
  const innerRadius = Math.max(4, cardSize.cornerRadius - cardSize.width * 0.02);
  const back = new Graphics()
    .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
    .fill({ color: 0x123d77 })
    .stroke({ color: borderColor ?? 0xeaf2ff, width: Math.max(1, cardSize.width * 0.016) });

  const inner = new Graphics()
    .roundRect(inset, inset, cardSize.width - inset * 2, cardSize.height - inset * 2, innerRadius)
    .fill({ color: 0x1d5eb5 });

  const emblem = new Text({
    text: '♠ ♥ ♦ ♣',
    style: new TextStyle({
      fill: 0xffffff,
      fontSize: Math.round(cardSize.pipSize * 0.65),
      fontWeight: '700',
    }),
    resolution,
  });

  emblem.anchor.set(0.5);
  emblem.x = cardSize.width / 2;
  emblem.y = cardSize.height / 2;
  container.addChild(back, inner, emblem);
  return app.renderer.generateTexture({ target: container, resolution });
}

/**
 * Compose a custom photo as a full-bleed card back with rounded corners.
 * The photo is scaled to 'cover' the entire card area (no padding, no
 * letterboxing).  A rounded-rect mask clips to the card shape.
 */
export function makeCustomBackTexture(
  app: Application,
  cardSize: CardSize,
  photoTexture: Texture,
  resolution = 1,
): Texture {
  const container = new Container();

  // Photo sprite scaled to cover (full-bleed, edge-to-edge)
  const photo = new Sprite(photoTexture);
  const texW = photoTexture.width || cardSize.width;
  const texH = photoTexture.height || cardSize.height;
  const scale = Math.max(cardSize.width / texW, cardSize.height / texH);
  photo.width = texW * scale;
  photo.height = texH * scale;
  // Center the photo so overflow is clipped equally on both sides
  photo.x = (cardSize.width - photo.width) / 2;
  photo.y = (cardSize.height - photo.height) / 2;
  container.addChild(photo);

  // Apply a single rounded mask to the texture sprite itself.
  const mask = new Graphics()
    .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
    .fill({ color: 0xffffff });
  container.addChild(mask);
  photo.mask = mask;

  return app.renderer.generateTexture({ target: container, resolution });
}

export async function generateBackTexture(app: Application, cardSize: CardSize, backImage?: string | null, resolution = 1): Promise<Texture> {
  const requestedUrl = backImage ?? CARD_BACK_DEFAULT;

  try {
    const photoTex = await loadTextureFromUrl(requestedUrl);
    return makeCustomBackTexture(app, cardSize, photoTex, resolution);
  } catch {
    if (requestedUrl !== CARD_BACK_DEFAULT) {
      try {
        const fallbackTexture = await loadTextureFromUrl(CARD_BACK_DEFAULT);
        return makeCustomBackTexture(app, cardSize, fallbackTexture, resolution);
      } catch {
        return makeBackTexture(app, cardSize, undefined, resolution);
      }
    }

    return makeBackTexture(app, cardSize, undefined, resolution);
  }
}

export function generateCardTextures(app: Application, cardSize: CardSize, colors?: CardRenderColors, resolution = 1): TextureCache {
  const cache: TextureCache = new Map();
  for (const suit of SUITS) {
    for (let rank = 1 as Rank; rank <= 13; rank = (rank + 1) as Rank) {
      cache.set(cardKey(suit, rank), makeFrontCardTexture(app, cardSize, suit, rank, colors, resolution));
    }
  }
  return cache;
}

export function makeCardSprite(cardId: string, cache: TextureCache, backTexture: Texture, faceUp: boolean): Sprite {
  const texture = faceUp ? cache.get(cardId) ?? backTexture : backTexture;
  return new Sprite(texture);
}

export function invalidateTextures(cache: TextureCache): void {
  for (const texture of cache.values()) {
    texture.destroy(true);
  }
  cache.clear();
}

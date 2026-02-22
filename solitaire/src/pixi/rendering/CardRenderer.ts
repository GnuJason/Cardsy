import { type Application, Assets, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import {
  BLACK_CARD_COLOR,
  CARD_BACKGROUND,
  CARD_BORDER,
  RED_CARD_COLOR,
} from '../constants';
import type { CardSize } from '../types';
import { RANK_LABELS, SUITS, SUIT_SYMBOLS, suitColor, type Rank, type Suit } from '../../logic/types';

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

function makeFrontCardTexture(
  app: Application,
  cardSize: CardSize,
  suit: Suit,
  rank: Rank,
  colors?: CardRenderColors,
): Texture {
  const container = new Container();
  const color = suitColor(suit) === 'red'
    ? colors?.redCardColor ?? RED_CARD_COLOR
    : colors?.blackCardColor ?? BLACK_CARD_COLOR;

  const shape = new Graphics()
    .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
    .fill({ color: colors?.cardBackground ?? CARD_BACKGROUND })
    .stroke({ color: colors?.cardBorder ?? CARD_BORDER, width: 2 });

  const rankStyle = new TextStyle({
    fill: color,
    fontSize: cardSize.fontSize,
    fontWeight: '700',
  });

  const pipStyle = new TextStyle({
    fill: color,
    fontSize: cardSize.pipSize,
    fontWeight: '700',
  });

  const rankText = new Text({ text: RANK_LABELS[rank], style: rankStyle });
  rankText.x = Math.round(cardSize.width * 0.08);
  rankText.y = Math.round(cardSize.height * 0.06);

  const suitText = new Text({ text: SUIT_SYMBOLS[suit], style: pipStyle });
  suitText.x = Math.round(cardSize.width * 0.1);
  suitText.y = Math.round(cardSize.height * 0.2);

  const center = new Text({ text: rank >= 11 ? `${RANK_LABELS[rank]} ${SUIT_SYMBOLS[suit]}` : SUIT_SYMBOLS[suit], style: pipStyle });
  center.anchor.set(0.5);
  center.x = Math.round(cardSize.width * 0.5);
  center.y = Math.round(cardSize.height * 0.53);

  const mirrorRank = new Text({ text: RANK_LABELS[rank], style: rankStyle });
  mirrorRank.anchor.set(1, 1);
  mirrorRank.x = Math.round(cardSize.width * 0.93);
  mirrorRank.y = Math.round(cardSize.height * 0.93);

  container.addChild(shape, rankText, suitText, center, mirrorRank);
  return app.renderer.generateTexture(container);
}

function makeBackTexture(app: Application, cardSize: CardSize, borderColor?: number): Texture {
  const container = new Container();
  const back = new Graphics()
    .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
    .fill({ color: 0x123d77 })
    .stroke({ color: borderColor ?? 0xeaf2ff, width: 2 });

  const inner = new Graphics()
    .roundRect(8, 8, cardSize.width - 16, cardSize.height - 16, Math.max(5, cardSize.cornerRadius - 4))
    .fill({ color: 0x1d5eb5 });

  const emblem = new Text({
    text: '♠ ♥ ♦ ♣',
    style: new TextStyle({
      fill: 0xffffff,
      fontSize: Math.round(cardSize.pipSize * 0.65),
      fontWeight: '700',
    }),
  });

  emblem.anchor.set(0.5);
  emblem.x = cardSize.width / 2;
  emblem.y = cardSize.height / 2;
  container.addChild(back, inner, emblem);
  return app.renderer.generateTexture(container);
}

export async function generateBackTexture(app: Application, cardSize: CardSize, backImage?: string | null): Promise<Texture> {
  if (backImage) {
    try {
      const loaded = await Assets.load(backImage);
      return Texture.from(loaded);
    } catch {
      return makeBackTexture(app, cardSize);
    }
  }
  return makeBackTexture(app, cardSize);
}

export function generateCardTextures(app: Application, cardSize: CardSize, colors?: CardRenderColors): TextureCache {
  const cache: TextureCache = new Map();
  for (const suit of SUITS) {
    for (let rank = 1 as Rank; rank <= 13; rank = (rank + 1) as Rank) {
      cache.set(cardKey(suit, rank), makeFrontCardTexture(app, cardSize, suit, rank, colors));
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

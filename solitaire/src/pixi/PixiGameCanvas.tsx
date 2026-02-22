import React, { useEffect, useMemo, useRef } from 'react';
import { Container, FederatedPointerEvent, Graphics } from 'pixi.js';
import { createPixiApp, destroyPixiApp, type PixiAppContext } from './PixiApp';
import { computeCardSize, getViewportInfo } from './layout/ScalingEngine';
import { computeLayout } from './layout/LayoutEngine';
import { generateBackTexture, generateCardTextures, invalidateTextures, makeCardSprite, type TextureCache } from './rendering/CardRenderer';
import { hitTestPile } from './interaction/HitDetection';
import { mapTapToEvent } from './interaction/EventMapping';
import { canDrop, type DragEndpoint } from './interaction/DragValidator';
import type {
  AnyGameState,
  CardViewModel,
  GameMode,
  PileType,
  PixiGameCanvasProps,
  PixiGameEvent,
} from './types';
import type {
  FreeCellGameState,
  GameState,
  GolfGameState,
  PyramidGameState,
  SpiderGameState,
  TriPeaksGameState,
} from '../logic/types';

interface PileGroup {
  pileType: PileType;
  pileIndex: number;
  cards: CardViewModel[];
}

function toViewCards(pileType: PileType, pileIndex: number, cards: CardViewModel['id'][] | any[]): CardViewModel[] {
  return cards.map((card, cardIndex) => ({
    ...card,
    pileType,
    pileIndex,
    cardIndex,
  }));
}

function buildPiles(mode: GameMode, gameState: AnyGameState): PileGroup[] {
  if (mode === 'klondike') {
    const state = gameState as GameState;
    return [
      { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
      { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
      ...state.foundations.map((pile, index) => ({
        pileType: 'foundation' as const,
        pileIndex: index,
        cards: toViewCards('foundation', index, pile),
      })),
      ...state.tableau.map((pile, index) => ({
        pileType: 'tableau' as const,
        pileIndex: index,
        cards: toViewCards('tableau', index, pile),
      })),
    ];
  }

  if (mode === 'freecell') {
    const state = gameState as FreeCellGameState;
    return [
      ...state.freeCells.map((card, index) => ({
        pileType: 'freecell' as const,
        pileIndex: index,
        cards: card ? toViewCards('freecell', index, [card]) : [],
      })),
      ...state.foundations.map((pile, index) => ({
        pileType: 'foundation' as const,
        pileIndex: index,
        cards: toViewCards('foundation', index, pile),
      })),
      ...state.columns.map((pile, index) => ({
        pileType: 'column' as const,
        pileIndex: index,
        cards: toViewCards('column', index, pile),
      })),
    ];
  }

  if (mode === 'spider') {
    const state = gameState as SpiderGameState;
    return [
      { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
      ...state.foundations.map((pile, index) => ({
        pileType: 'foundation' as const,
        pileIndex: index,
        cards: toViewCards('foundation', index, pile),
      })),
      ...state.columns.map((pile, index) => ({
        pileType: 'column' as const,
        pileIndex: index,
        cards: toViewCards('column', index, pile),
      })),
    ];
  }

  if (mode === 'tripeaks') {
    const state = gameState as TriPeaksGameState;
    return [
      ...state.pyramid.map((card, index) => ({
        pileType: 'pyramid' as const,
        pileIndex: index,
        cards: card.removed ? [] : toViewCards('pyramid', index, [card]),
      })),
      { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
      { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
    ];
  }

  if (mode === 'pyramid') {
    const state = gameState as PyramidGameState;
    return [
      ...state.pyramid.map((card, index) => ({
        pileType: 'pyramid' as const,
        pileIndex: index,
        cards: card.removed ? [] : toViewCards('pyramid', index, [card]),
      })),
      { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
      { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
    ];
  }

  const state = gameState as GolfGameState;
  return [
    ...state.tableau.map((pile, index) => ({
      pileType: 'column' as const,
      pileIndex: index,
      cards: toViewCards('column', index, pile),
    })),
    { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
    { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
  ];
}

interface DragSelection {
  sourcePile: PileType;
  sourcePileIndex: number;
  sourceCardIndex: number;
  startX: number;
  startY: number;
}

function emitValidatedDragMove(
  drag: DragSelection,
  targetPile: PileType,
  targetPileIndex: number,
  targetCardIndex: number,
): Extract<PixiGameEvent, { type: 'DRAG_VALIDATED_MOVE' }> {
  return {
    type: 'DRAG_VALIDATED_MOVE',
    sourcePile: drag.sourcePile,
    sourcePileIndex: drag.sourcePileIndex,
    sourceCardIndex: drag.sourceCardIndex,
    targetPile,
    targetPileIndex,
    targetCardIndex,
  };
}

export const PixiGameCanvas: React.FC<PixiGameCanvasProps> = ({
  mode,
  gameState,
  cardBackImage,
  reducedMotion,
  onGameEvent,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appCtxRef = useRef<PixiAppContext | null>(null);
  const textureCacheRef = useRef<TextureCache | null>(null);
  const backTextureRef = useRef<Awaited<ReturnType<typeof generateBackTexture>> | null>(null);
  const dragRef = useRef<DragSelection | null>(null);
  const pendingRenderRef = useRef(false);

  const piles = useMemo(() => buildPiles(mode, gameState), [mode, gameState]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    void (async () => {
      const ctx = await createPixiApp(host);
      if (cancelled) {
        destroyPixiApp(ctx);
        return;
      }
      appCtxRef.current = ctx;

      const viewport = getViewportInfo(host);
      const cardSize = computeCardSize(viewport, viewport.dpi, mode);
      textureCacheRef.current = generateCardTextures(ctx.app, cardSize);
      backTextureRef.current = await generateBackTexture(ctx.app, cardSize, cardBackImage);

      const resizeObserver = new ResizeObserver(() => {
        if (!appCtxRef.current || !hostRef.current) return;
        renderScene();
      });
      resizeObserver.observe(host);

      renderScene();

      return () => {
        resizeObserver.disconnect();
      };
    })();

    return () => {
      cancelled = true;
      if (textureCacheRef.current) {
        invalidateTextures(textureCacheRef.current);
      }
      if (backTextureRef.current) {
        backTextureRef.current.destroy(true);
      }
      textureCacheRef.current = null;
      backTextureRef.current = null;

      if (appCtxRef.current) {
        destroyPixiApp(appCtxRef.current);
      }
      appCtxRef.current = null;
    };
  }, [cardBackImage, mode]);

  useEffect(() => {
    if (dragRef.current) {
      pendingRenderRef.current = true;
      return;
    }
    renderScene();
  }, [piles, reducedMotion]);

  const renderScene = (): void => {
    const host = hostRef.current;
    const ctx = appCtxRef.current;
    const textures = textureCacheRef.current;
    const backTexture = backTextureRef.current;

    if (!host || !ctx || !textures || !backTexture) return;

    const viewport = getViewportInfo(host);
    const cardSize = computeCardSize(viewport, viewport.dpi, mode);
    const layout = computeLayout(mode, viewport, cardSize);

    ctx.root.removeChildren();

    for (const pileLayout of layout.piles) {
      const pileData = piles.find((pile) => pile.pileType === pileLayout.pileType && pile.pileIndex === pileLayout.pileIndex);
      const pileContainer = new Container();
      pileContainer.x = pileLayout.x;
      pileContainer.y = pileLayout.y;
      pileContainer.sortableChildren = true;

      const placeholder = new Graphics()
        .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
        .stroke({ color: 0xffffff, width: 2, alpha: 0.3 });
      pileContainer.addChild(placeholder);

      const cards = pileData?.cards ?? [];
      for (const [index, card] of cards.entries()) {
        const sprite = makeCardSprite(card.id, textures, backTexture, card.faceUp);
        sprite.width = cardSize.width;
        sprite.height = cardSize.height;

        if (pileLayout.fanDirection === 'down') {
          sprite.y = pileLayout.fanOffset * index;
        } else if (pileLayout.fanDirection === 'right') {
          sprite.x = pileLayout.fanOffset * index;
        }

        const event = mapTapToEvent(mode, pileLayout.pileType, pileLayout.pileIndex, index);
        if (event) {
          sprite.eventMode = 'static';
          sprite.cursor = 'pointer';

          sprite.on('pointertap', () => {
            onGameEvent(event);
          });

          sprite.on('pointerdown', (pointer: FederatedPointerEvent) => {
            if (!card.faceUp) return;
            dragRef.current = {
              sourcePile: pileLayout.pileType,
              sourcePileIndex: pileLayout.pileIndex,
              sourceCardIndex: index,
              startX: pointer.global.x,
              startY: pointer.global.y,
            };
            sprite.alpha = 0.92;
            sprite.zIndex = 5000;
          });

          sprite.on('globalpointermove', (pointer: FederatedPointerEvent) => {
            if (!dragRef.current) return;
            const dx = pointer.global.x - dragRef.current.startX;
            const dy = pointer.global.y - dragRef.current.startY;
            if (Math.abs(dx) + Math.abs(dy) < 6) return;
            sprite.x += dx;
            sprite.y += dy;
            dragRef.current.startX = pointer.global.x;
            dragRef.current.startY = pointer.global.y;
          });

          const handlePointerUp = (pointer: FederatedPointerEvent) => {
            if (!dragRef.current) return;
            const hit = hitTestPile(pointer.global, layout);
            sprite.alpha = 1;
            if (hit) {
              const source: DragEndpoint = {
                pileType: dragRef.current.sourcePile,
                pileIndex: dragRef.current.sourcePileIndex,
                cardIndex: dragRef.current.sourceCardIndex,
              };
              const target: DragEndpoint = {
                pileType: hit.pileType,
                pileIndex: hit.pileIndex,
                cardIndex: hit.cardIndex,
              };
              if (canDrop(mode, gameState, source, target)) {
                onGameEvent(
                  emitValidatedDragMove(
                  dragRef.current,
                  hit.pileType,
                  hit.pileIndex,
                  hit.cardIndex,
                  ),
                );
              }
            }
            dragRef.current = null;
            if (pendingRenderRef.current) {
              pendingRenderRef.current = false;
            }
            renderScene();
          };

          sprite.on('pointerup', handlePointerUp);
          sprite.on('pointerupoutside', handlePointerUp);
        }

        sprite.zIndex = index + 1;
        pileContainer.addChild(sprite);
      }

      ctx.root.addChild(pileContainer);
    }

    if (reducedMotion) {
      ctx.app.ticker.minFPS = 1;
    } else {
      ctx.app.ticker.minFPS = 30;
    }
  };

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Solitaire game board"
      style={{
        flex: 1,
        minHeight: 420,
        width: '100%',
        touchAction: 'none',
      }}
    />
  );
};

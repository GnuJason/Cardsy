import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FederatedPointerEvent, Graphics, Sprite } from 'pixi.js';
import {
  createPixiApp,
  destroyPixiApp,
  setAppBackground,
  type PixiAppContext,
} from './PixiApp';
import { computeCardSize, getViewportInfo } from './layout/ScalingEngine';
import { computeLayout } from './layout/LayoutEngine';
import {
  generateBackTexture,
  generateCardTextures,
  invalidateTextures,
  type TextureCache,
} from './rendering/CardRenderer';
import { hitTestPile } from './interaction/HitDetection';
import { mapTapToEvent } from './interaction/EventMapping';
import { canDrop, type DragEndpoint } from './interaction/DragValidator';
import type {
  AnyGameState,
  CardViewModel,
  GameMode,
  LayoutResult,
  PileType,
  PixiDebugOptions,
  PixiGameCanvasProps,
  PixiGameEvent,
  PixiThemeColors,
} from './types';
import type {
  FreeCellGameState,
  GameState,
  GolfGameState,
  PyramidGameState,
  SpiderGameState,
  TriPeaksGameState,
} from '../logic/types';
import { highContrastOverride } from './HighContrastOverride';
import { KeyboardOverlay } from './KeyboardOverlay';
import { SpritePool } from './rendering/SpritePool';
import { AnimationScheduler } from './animation/AnimationScheduler';
import type { AnimationPlan, AnimationStep } from './animation/types';

interface PileGroup {
  pileType: PileType;
  pileIndex: number;
  cards: CardViewModel[];
}

function toViewCards(
  pileType: PileType,
  pileIndex: number,
  cards: CardViewModel['id'][] | any[],
  cardIndexOffset = 0,
): CardViewModel[] {
  return cards.map((card, cardIndex) => ({
    ...card,
    pileType,
    pileIndex,
    cardIndex: cardIndex + cardIndexOffset,
  }));
}

function buildPiles(mode: GameMode, gameState: AnyGameState, drawCount: 1 | 3): PileGroup[] {
  if (mode === 'klondike') {
    const state = gameState as GameState;
    const wasteStart = Math.max(0, state.waste.length - drawCount);
    const visibleWaste = state.waste.slice(wasteStart);
    return [
      { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
      { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, visibleWaste, wasteStart) },
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

interface DragCandidate {
  selection: DragSelection;
  sprite: Sprite;
  pointerType: string;
  startedAt: number;
}

interface SpriteMeta {
  event: PixiGameEvent | null;
  faceUp: boolean;
  pileType: PileType;
  pileIndex: number;
  cardIndex: number;
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

function toRenderColors(themeColors: PixiThemeColors): {
  cardBackground: number;
  cardBorder: number;
  redCardColor: number;
  blackCardColor: number;
} {
  return {
    cardBackground: themeColors.cardBackground,
    cardBorder: themeColors.cardBorder,
    redCardColor: themeColors.redCardColor,
    blackCardColor: themeColors.blackCardColor,
  };
}

const DEFAULT_DEBUG_OPTIONS: PixiDebugOptions = {
  enabled: false,
  fps: false,
  pointer: false,
  hitBoxes: false,
  textureLogs: false,
  cacheInspector: false,
  consoleOnly: true,
};

function parseDebugFlag(searchParams: URLSearchParams, key: string): boolean {
  const raw = searchParams.get(key);
  return raw === '1' || raw === 'true';
}

export function resolveDebugOptions(
  debugOptions?: PixiDebugOptions,
  search = '',
  isDev = import.meta.env.DEV,
): PixiDebugOptions {
  if (!isDev) {
    return DEFAULT_DEBUG_OPTIONS;
  }

  if (debugOptions) {
    return {
      ...DEFAULT_DEBUG_OPTIONS,
      ...debugOptions,
      consoleOnly: true,
    };
  }

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const enabled = parseDebugFlag(params, 'pixiDebug');
  if (!enabled) {
    return DEFAULT_DEBUG_OPTIONS;
  }

  return {
    enabled: true,
    fps: parseDebugFlag(params, 'pixiFps'),
    pointer: parseDebugFlag(params, 'pixiPointer'),
    hitBoxes: parseDebugFlag(params, 'pixiHitBoxes'),
    textureLogs: parseDebugFlag(params, 'pixiTextures'),
    cacheInspector: parseDebugFlag(params, 'pixiCache'),
    consoleOnly: true,
  };
}

export function getDragActivationThreshold(pointerType: string): number {
  return pointerType === 'mouse' ? 6 : 10;
}

function supportsDragMode(mode: GameMode): boolean {
  return mode === 'klondike' || mode === 'freecell' || mode === 'spider';
}

export const PixiGameCanvas: React.FC<PixiGameCanvasProps> = ({
  mode,
  gameState,
  cardBackImage,
  reducedMotion,
  themeColors,
  highContrast,
  cardScale,
  debugOptions,
  drawCount = 1,
  onGameEvent,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appCtxRef = useRef<PixiAppContext | null>(null);
  const textureCacheRef = useRef<TextureCache | null>(null);
  const backTextureRef = useRef<Awaited<ReturnType<typeof generateBackTexture>> | null>(null);
  const dragRef = useRef<DragSelection | null>(null);
  const dragCandidateRef = useRef<DragCandidate | null>(null);
  const pendingRenderRef = useRef(false);
  const currentLayoutRef = useRef<LayoutResult | null>(null);
  const pileCountsRef = useRef<Map<string, number>>(new Map());
  const cardScaleRef = useRef(cardScale);
  const spritePoolRef = useRef(new SpritePool());
  const schedulerRef = useRef(new AnimationScheduler());
  const spriteMetaRef = useRef(new Map<string, SpriteMeta>());
  const placeholdersRef = useRef<Graphics[]>([]);
  const handlersBoundRef = useRef(new Set<string>());
  const tickerFnRef = useRef<((ticker: { deltaMS: number }) => void) | null>(null);
  const modeRef = useRef(mode);
  const gameStateRef = useRef(gameState);
  const onGameEventRef = useRef(onGameEvent);
  const debugRef = useRef<PixiDebugOptions>(DEFAULT_DEBUG_OPTIONS);
  const pointerLogAtRef = useRef(0);
  const fpsWindowRef = useRef({ elapsedMs: 0, frames: 0 });
  const lastCardSizeRef = useRef<string>('');
  const lastLayoutKeyRef = useRef<string>('');

  const [layoutState, setLayoutState] = useState<LayoutResult | null>(null);

  modeRef.current = mode;
  gameStateRef.current = gameState;
  onGameEventRef.current = onGameEvent;

  debugRef.current = resolveDebugOptions(
    debugOptions,
    typeof window !== 'undefined' ? window.location.search : '',
  );

  const debugLog = (...args: unknown[]): void => {
    if (!debugRef.current.enabled) return;
    console.warn('[PIXI DEBUG]', ...args);
  };

  const clearPlaceholders = (): void => {
    for (const placeholder of placeholdersRef.current) {
      if (placeholder.parent) {
        placeholder.parent.removeChild(placeholder);
      }
      placeholder.destroy();
    }
    placeholdersRef.current = [];
  };

  const effectiveThemeColors = useMemo(
    () => (highContrast ? highContrastOverride(themeColors) : themeColors),
    [highContrast, themeColors],
  );

  const piles = useMemo(
    () => buildPiles(mode, gameState, drawCount),
    [mode, gameState, drawCount],
  );

  const pileCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const pile of piles) {
      map.set(`${pile.pileType}-${pile.pileIndex}`, pile.cards.length);
    }
    return map;
  }, [piles]);

  pileCountsRef.current = pileCounts;
  cardScaleRef.current = cardScale;

  const renderScene = (): void => {
    const host = hostRef.current;
    const ctx = appCtxRef.current;
    const textures = textureCacheRef.current;
    const backTexture = backTextureRef.current;

    if (!host || !ctx || !textures || !backTexture) return;

    const viewport = getViewportInfo(host);
    const cardSize = computeCardSize(viewport, viewport.dpi, mode, cardScaleRef.current);
    const cardSizeKey = `${cardSize.width}x${cardSize.height}@${viewport.dpi}`;
    if (debugRef.current.enabled && debugRef.current.textureLogs && cardSizeKey !== lastCardSizeRef.current) {
      debugLog('card-size', { mode, cardSize, viewport });
      lastCardSizeRef.current = cardSizeKey;
    }

    const layout = computeLayout(mode, viewport, cardSize, pileCountsRef.current);
    currentLayoutRef.current = layout;
    setLayoutState(layout);

    if (debugRef.current.enabled && debugRef.current.hitBoxes) {
      const layoutKey = layout.piles
        .map((pile) => `${pile.pileType}-${pile.pileIndex}:${pile.x},${pile.y},${pile.dropWidth},${pile.dropHeight}`)
        .join('|');
      if (layoutKey !== lastLayoutKeyRef.current) {
        debugLog(
          'pile-hitboxes',
          layout.piles.map((pile) => ({
            pileType: pile.pileType,
            pileIndex: pile.pileIndex,
            x: pile.x,
            y: pile.y,
            width: pile.dropWidth,
            height: pile.dropHeight,
          })),
        );
        lastLayoutKeyRef.current = layoutKey;
      }
    }

    const animationSteps: AnimationStep[] = [];
    const pileMap = new Map<string, PileGroup>();
    for (const pile of piles) {
      pileMap.set(`${pile.pileType}-${pile.pileIndex}`, pile);
    }

    clearPlaceholders();
    spritePoolRef.current.beginFrame();

    for (const pileLayout of layout.piles) {
      const placeholder = new Graphics()
        .roundRect(0, 0, cardSize.width, cardSize.height, cardSize.cornerRadius)
        .stroke({
          color: effectiveThemeColors.placeholderStroke,
          width: 2,
          alpha: effectiveThemeColors.placeholderAlpha,
        });
      placeholder.x = pileLayout.x;
      placeholder.y = pileLayout.y;
      placeholder.zIndex = 0;
      ctx.root.addChild(placeholder);
      placeholdersRef.current.push(placeholder);

      const pileData = pileMap.get(`${pileLayout.pileType}-${pileLayout.pileIndex}`);
      const cards = pileData?.cards ?? [];

      for (const [index, card] of cards.entries()) {
        const spriteKey = card.id;
        const texture = card.faceUp ? textures.get(card.id) ?? backTexture : backTexture;
        const sprite = spritePoolRef.current.acquire(spriteKey, texture);

        const fromX = sprite.x;
        const fromY = sprite.y;
        const fromAlpha = sprite.alpha || 1;

        let targetX = pileLayout.x;
        let targetY = pileLayout.y;
        if (pileLayout.fanDirection === 'down') {
          targetY += pileLayout.fanOffset * index;
        } else if (pileLayout.fanDirection === 'right') {
          targetX += pileLayout.fanOffset * index;
        }

        sprite.width = cardSize.width;
        sprite.height = cardSize.height;
        sprite.zIndex = index + 1;

        const event = mapTapToEvent(mode, pileLayout.pileType, pileLayout.pileIndex, card.cardIndex);
        spriteMetaRef.current.set(spriteKey, {
          event,
          faceUp: card.faceUp,
          pileType: pileLayout.pileType,
          pileIndex: pileLayout.pileIndex,
          cardIndex: card.cardIndex,
        });

        if (!handlersBoundRef.current.has(spriteKey)) {
          handlersBoundRef.current.add(spriteKey);

          sprite.eventMode = 'static';
          sprite.cursor = 'pointer';

          sprite.on('pointertap', () => {
            const meta = spriteMetaRef.current.get(spriteKey);
            if (meta?.event) {
              onGameEventRef.current(meta.event);
            }
          });

          sprite.on('pointerdown', (pointer: FederatedPointerEvent) => {
            const meta = spriteMetaRef.current.get(spriteKey);
            if (!meta || !meta.faceUp) return;
            if (!supportsDragMode(modeRef.current)) return;
            if (pointer.pointerType === 'mouse' && pointer.button !== 0) return;
            if (debugRef.current.enabled && debugRef.current.pointer) {
              debugLog('pointerdown', {
                pointerType: pointer.pointerType,
                x: pointer.global.x,
                y: pointer.global.y,
                card: spriteKey,
              });
            }
            dragCandidateRef.current = {
              selection: {
                sourcePile: meta.pileType,
                sourcePileIndex: meta.pileIndex,
                sourceCardIndex: meta.cardIndex,
                startX: pointer.global.x,
                startY: pointer.global.y,
              },
              sprite,
              pointerType: pointer.pointerType,
              startedAt: performance.now(),
            };
          });

          sprite.on('globalpointermove', (pointer: FederatedPointerEvent) => {
            if (debugRef.current.enabled && debugRef.current.pointer) {
              const now = performance.now();
              if (now - pointerLogAtRef.current > 120) {
                pointerLogAtRef.current = now;
                debugLog('pointermove', {
                  pointerType: pointer.pointerType,
                  x: pointer.global.x,
                  y: pointer.global.y,
                });
              }
            }

            const candidate = dragCandidateRef.current;
            if (candidate && candidate.sprite === sprite && !dragRef.current) {
              const dx = pointer.global.x - candidate.selection.startX;
              const dy = pointer.global.y - candidate.selection.startY;
              const threshold = getDragActivationThreshold(candidate.pointerType);
              if (Math.hypot(dx, dy) >= threshold) {
                dragRef.current = { ...candidate.selection };
                if (debugRef.current.enabled && debugRef.current.pointer) {
                  debugLog('drag-activate', {
                    pointerType: candidate.pointerType,
                    threshold,
                    latencyMs: Math.round(performance.now() - candidate.startedAt),
                  });
                }
                dragCandidateRef.current = null;
                sprite.alpha = 0.92;
                sprite.zIndex = 5000;
              }
            }

            if (!dragRef.current) return;
            const dragDx = pointer.global.x - dragRef.current.startX;
            const dragDy = pointer.global.y - dragRef.current.startY;
            if (Math.abs(dragDx) + Math.abs(dragDy) < 1) return;
            sprite.x += dragDx;
            sprite.y += dragDy;
            dragRef.current.startX = pointer.global.x;
            dragRef.current.startY = pointer.global.y;
          });

          const handlePointerUp = (pointer: FederatedPointerEvent) => {
            const activeDrag = dragRef.current;
            dragCandidateRef.current = null;
            if (!activeDrag) return;

            const activeLayout = currentLayoutRef.current;
            sprite.alpha = 1;

            if (activeLayout) {
              const hit = hitTestPile(pointer.global, activeLayout, pileCountsRef.current);
              if (hit) {
                const source: DragEndpoint = {
                  pileType: activeDrag.sourcePile,
                  pileIndex: activeDrag.sourcePileIndex,
                  cardIndex: activeDrag.sourceCardIndex,
                };
                const target: DragEndpoint = {
                  pileType: hit.pileType,
                  pileIndex: hit.pileIndex,
                  cardIndex: hit.cardIndex,
                };
                if (canDrop(modeRef.current, gameStateRef.current, source, target)) {
                  onGameEventRef.current(
                    emitValidatedDragMove(
                      activeDrag,
                      hit.pileType,
                      hit.pileIndex,
                      hit.cardIndex,
                    ),
                  );
                } else if (debugRef.current.enabled && debugRef.current.hitBoxes) {
                  debugLog('drag-rejected', { source, target, mode: modeRef.current });
                }
              } else if (debugRef.current.enabled && debugRef.current.hitBoxes) {
                debugLog('hit-miss', {
                  x: pointer.global.x,
                  y: pointer.global.y,
                });
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

        if (reducedMotion || fromX === 0 && fromY === 0 && sprite.parent === null) {
          sprite.x = targetX;
          sprite.y = targetY;
          sprite.alpha = 1;
        } else if (fromX !== targetX || fromY !== targetY) {
          animationSteps.push({
            spriteKey,
            from: { x: fromX, y: fromY, alpha: fromAlpha },
            to: { x: targetX, y: targetY, alpha: 1 },
            durationMs: reducedMotion ? 0 : 140,
            easing: 'easeOut',
          });
        }

        ctx.root.addChild(sprite);
      }
    }

    spritePoolRef.current.endFrame();

    if (debugRef.current.enabled && debugRef.current.cacheInspector) {
      debugLog('cache', {
        frontTextures: textureCacheRef.current?.size ?? 0,
        backTextureReady: Boolean(backTextureRef.current),
        spritePool: spritePoolRef.current.getStats(),
      });
    }

    if (animationSteps.length > 0) {
      const plan: AnimationPlan = {
        steps: animationSteps,
        groups: [animationSteps.map((_, index) => index)],
        onComplete: () => {
          if (pendingRenderRef.current) {
            pendingRenderRef.current = false;
            renderScene();
          }
        },
      };
      schedulerRef.current.schedule(plan, new Map(spritePoolRef.current.active));
      if (debugRef.current.enabled && debugRef.current.textureLogs) {
        debugLog('animation-plan', {
          steps: animationSteps.length,
          reducedMotion,
        });
      }
    }

    if (reducedMotion) {
      ctx.app.ticker.minFPS = 1;
    } else {
      ctx.app.ticker.minFPS = 30;
    }
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let active = true;
    const resizeObserver = new ResizeObserver(() => {
      if (!appCtxRef.current || !hostRef.current) return;
      if (debugRef.current.enabled && debugRef.current.textureLogs) {
        debugLog('resize-observed', {
          width: hostRef.current.clientWidth,
          height: hostRef.current.clientHeight,
        });
      }
      if (schedulerRef.current.isAnimating) {
        pendingRenderRef.current = true;
        return;
      }
      renderScene();
    });

    void (async () => {
      const ctx = await createPixiApp(host, effectiveThemeColors.feltColor);
      if (!active) {
        destroyPixiApp(ctx);
        return;
      }

      appCtxRef.current = ctx;

      const tick = (ticker: { deltaMS: number }) => {
        schedulerRef.current.update(ticker.deltaMS);

        if (!debugRef.current.enabled) return;

        if (debugRef.current.fps) {
          fpsWindowRef.current.elapsedMs += ticker.deltaMS;
          fpsWindowRef.current.frames += 1;
          if (fpsWindowRef.current.elapsedMs >= 1000) {
            const fps = Math.round((fpsWindowRef.current.frames * 1000) / fpsWindowRef.current.elapsedMs);
            debugLog('fps', { fps });
            fpsWindowRef.current.elapsedMs = 0;
            fpsWindowRef.current.frames = 0;
          }
        }

        if (debugRef.current.cacheInspector) {
          debugLog('scheduler', schedulerRef.current.getDebugSnapshot());
        }
      };
      tickerFnRef.current = tick;
      ctx.app.ticker.add(tick);

      const viewport = getViewportInfo(host);
      const cardSize = computeCardSize(viewport, viewport.dpi, mode, cardScaleRef.current);
      if (debugRef.current.enabled && debugRef.current.textureLogs) {
        debugLog('texture-regeneration', {
          reason: 'mount',
          cardBackImage,
          cardSize,
        });
      }
      textureCacheRef.current = generateCardTextures(ctx.app, cardSize, toRenderColors(effectiveThemeColors));

      const generatedBackTexture = await generateBackTexture(ctx.app, cardSize, cardBackImage);
      if (!active) {
        generatedBackTexture.destroy(true);
        return;
      }
      backTextureRef.current = generatedBackTexture;

      resizeObserver.observe(host);
      renderScene();
    })();

    return () => {
      active = false;
      resizeObserver.disconnect();
      fpsWindowRef.current = { elapsedMs: 0, frames: 0 };
      pointerLogAtRef.current = 0;
      dragRef.current = null;
      dragCandidateRef.current = null;
      schedulerRef.current.cancel();

      if (textureCacheRef.current) {
        invalidateTextures(textureCacheRef.current);
      }
      if (backTextureRef.current) {
        backTextureRef.current.destroy(true);
      }
      clearPlaceholders();
      textureCacheRef.current = null;
      backTextureRef.current = null;
      spriteMetaRef.current.clear();
      handlersBoundRef.current.clear();
      spritePoolRef.current.destroyAll();

      if (appCtxRef.current && tickerFnRef.current) {
        appCtxRef.current.app.ticker.remove(tickerFnRef.current);
      }
      tickerFnRef.current = null;

      if (appCtxRef.current) {
        destroyPixiApp(appCtxRef.current);
      }
      appCtxRef.current = null;
    };
  }, [cardBackImage, mode]);

  useEffect(() => {
    const host = hostRef.current;
    const ctx = appCtxRef.current;
    if (!host || !ctx) return;

    setAppBackground(ctx, effectiveThemeColors.feltColor);

    const viewport = getViewportInfo(host);
    const cardSize = computeCardSize(viewport, viewport.dpi, mode, cardScaleRef.current);
    if (debugRef.current.enabled && debugRef.current.textureLogs) {
      debugLog('texture-regeneration', {
        reason: 'theme-change',
        cardSize,
      });
    }

    if (textureCacheRef.current) {
      invalidateTextures(textureCacheRef.current);
    }
    textureCacheRef.current = generateCardTextures(ctx.app, cardSize, toRenderColors(effectiveThemeColors));

    if (schedulerRef.current.isAnimating) {
      pendingRenderRef.current = true;
      return;
    }
    renderScene();
  }, [effectiveThemeColors, mode]);

  useEffect(() => {
    if (dragRef.current || schedulerRef.current.isAnimating) {
      pendingRenderRef.current = true;
      return;
    }
    renderScene();
  }, [piles, reducedMotion, mode, cardScale]);

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 420,
        width: '100%',
        touchAction: 'none',
      }}
    >
      <div
        ref={hostRef}
        role="img"
        aria-hidden="true"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      {layoutState && (
        <KeyboardOverlay
          layout={layoutState}
          mode={mode}
          onGameEvent={onGameEvent}
        />
      )}
    </div>
  );
};

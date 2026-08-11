import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Graphics } from 'pixi.js';
import { createPixiApp, destroyPixiApp, setAppBackground, } from './PixiApp';
import { computeCardSize, getViewportInfo } from './layout/ScalingEngine';
import { computeLayout } from './layout/LayoutEngine';
import { generateBackTexture, generateCardTextures, getTextureResolution, invalidateTextures, loadTextureFromUrl, makeCustomBackTexture, } from './rendering/CardRenderer';
import { hitTestPile } from './interaction/HitDetection';
import { mapTapToEvent } from './interaction/EventMapping';
import { canDrop } from './interaction/DragValidator';
import { CARD_BACK_DEFAULT, getCardBackImage } from '../config/cardArt';
import { highContrastOverride } from './HighContrastOverride';
import { KeyboardOverlay } from './KeyboardOverlay';
import { SpritePool } from './rendering/SpritePool';
import { AnimationScheduler } from './animation/AnimationScheduler';
function toViewCards(pileType, pileIndex, cards, cardIndexOffset = 0) {
    return cards.map((card, cardIndex) => ({
        ...card,
        pileType,
        pileIndex,
        cardIndex: cardIndex + cardIndexOffset,
    }));
}
function buildPiles(mode, gameState, drawCount) {
    if (mode === 'klondike') {
        const state = gameState;
        const wasteStart = Math.max(0, state.waste.length - drawCount);
        const visibleWaste = state.waste.slice(wasteStart);
        return [
            { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
            { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, visibleWaste, wasteStart) },
            ...state.foundations.map((pile, index) => ({
                pileType: 'foundation',
                pileIndex: index,
                cards: toViewCards('foundation', index, pile),
            })),
            ...state.tableau.map((pile, index) => ({
                pileType: 'tableau',
                pileIndex: index,
                cards: toViewCards('tableau', index, pile),
            })),
        ];
    }
    if (mode === 'freecell') {
        const state = gameState;
        return [
            ...state.freeCells.map((card, index) => ({
                pileType: 'freecell',
                pileIndex: index,
                cards: card ? toViewCards('freecell', index, [card]) : [],
            })),
            ...state.foundations.map((pile, index) => ({
                pileType: 'foundation',
                pileIndex: index,
                cards: toViewCards('foundation', index, pile),
            })),
            ...state.columns.map((pile, index) => ({
                pileType: 'column',
                pileIndex: index,
                cards: toViewCards('column', index, pile),
            })),
        ];
    }
    if (mode === 'spider') {
        const state = gameState;
        return [
            { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
            ...state.foundations.map((pile, index) => ({
                pileType: 'foundation',
                pileIndex: index,
                cards: toViewCards('foundation', index, pile),
            })),
            ...state.columns.map((pile, index) => ({
                pileType: 'column',
                pileIndex: index,
                cards: toViewCards('column', index, pile),
            })),
        ];
    }
    if (mode === 'tripeaks') {
        const state = gameState;
        return [
            ...state.pyramid.map((card, index) => ({
                pileType: 'pyramid',
                pileIndex: index,
                cards: card.removed ? [] : toViewCards('pyramid', index, [card]),
            })),
            { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
            { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
        ];
    }
    if (mode === 'pyramid') {
        const state = gameState;
        return [
            ...state.pyramid.map((card, index) => ({
                pileType: 'pyramid',
                pileIndex: index,
                cards: card.removed ? [] : toViewCards('pyramid', index, [card]),
            })),
            { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
            { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
        ];
    }
    const state = gameState;
    return [
        ...state.tableau.map((pile, index) => ({
            pileType: 'column',
            pileIndex: index,
            cards: toViewCards('column', index, pile),
        })),
        { pileType: 'stock', pileIndex: 0, cards: toViewCards('stock', 0, state.stock) },
        { pileType: 'waste', pileIndex: 0, cards: toViewCards('waste', 0, state.waste) },
    ];
}
function emitValidatedDragMove(drag, targetPile, targetPileIndex, targetCardIndex) {
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
function toRenderColors(themeColors) {
    return {
        cardBackground: themeColors.cardBackground,
        cardBorder: themeColors.cardBorder,
        redCardColor: themeColors.redCardColor,
        blackCardColor: themeColors.blackCardColor,
    };
}
const DEFAULT_DEBUG_OPTIONS = {
    enabled: false,
    fps: false,
    pointer: false,
    hitBoxes: false,
    textureLogs: false,
    cacheInspector: false,
    consoleOnly: true,
};
function parseDebugFlag(searchParams, key) {
    const raw = searchParams.get(key);
    return raw === '1' || raw === 'true';
}
export function resolveDebugOptions(debugOptions, search = '', isDev = import.meta.env.DEV) {
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
export function getDragActivationThreshold(pointerType) {
    return pointerType === 'mouse' ? 6 : 10;
}
export function resolveGameplayBackImage(cardId, cardBackImage) {
    const resolved = cardBackImage ?? getCardBackImage(cardId);
    if (!resolved && import.meta.env.DEV) {
        console.warn(`[CardBack] No back image for ${cardId} — will use procedural fallback`);
    }
    return resolved;
}
function supportsDragMode(mode) {
    return mode === 'klondike' || mode === 'freecell' || mode === 'spider';
}
export const PixiGameCanvas = ({ mode, gameState, cardBackImage, reducedMotion, themeColors, highContrast, cardScale, debugOptions, drawCount = 1, onGameEvent, }) => {
    const hostRef = useRef(null);
    const appCtxRef = useRef(null);
    const textureCacheRef = useRef(null);
    const backTextureRef = useRef(null);
    const backTextureByUrlRef = useRef(new Map());
    const maskedBackTextureUrlsRef = useRef(new Set());
    const dragRef = useRef(null);
    const dragSpriteRef = useRef(null);
    const dragCandidateRef = useRef(null);
    const pendingRenderRef = useRef(false);
    const currentLayoutRef = useRef(null);
    const pileCountsRef = useRef(new Map());
    const cardScaleRef = useRef(cardScale);
    const spritePoolRef = useRef(new SpritePool());
    const schedulerRef = useRef(new AnimationScheduler());
    const spriteMetaRef = useRef(new Map());
    const placeholdersRef = useRef([]);
    const handlersBoundRef = useRef(new Set());
    const tickerFnRef = useRef(null);
    const modeRef = useRef(mode);
    const gameStateRef = useRef(gameState);
    const onGameEventRef = useRef(onGameEvent);
    const debugRef = useRef(DEFAULT_DEBUG_OPTIONS);
    const pointerLogAtRef = useRef(0);
    const fpsWindowRef = useRef({ elapsedMs: 0, frames: 0 });
    const lastCardSizeRef = useRef('');
    const lastLayoutKeyRef = useRef('');
    const textureCardSizeKeyRef = useRef('');
    const backTextureKeyRef = useRef('');
    const backTextureLoadIdRef = useRef(0);
    const [layoutState, setLayoutState] = useState(null);
    modeRef.current = mode;
    gameStateRef.current = gameState;
    onGameEventRef.current = onGameEvent;
    debugRef.current = resolveDebugOptions(debugOptions, typeof window !== 'undefined' ? window.location.search : '');
    const debugLog = (...args) => {
        if (!debugRef.current.enabled)
            return;
        console.warn('[PIXI DEBUG]', ...args);
    };
    const clearPlaceholders = () => {
        for (const placeholder of placeholdersRef.current) {
            if (placeholder.parent) {
                placeholder.parent.removeChild(placeholder);
            }
            placeholder.destroy();
        }
        placeholdersRef.current = [];
    };
    const resolveFaceDownTexture = (cardId, fallbackBackTexture, cardSize) => {
        // Uniform mode: when a single card back is set (custom blob or built-in),
        // generateBackTexture already produced the properly masked texture stored
        // in backTextureRef (passed here as fallbackBackTexture).  All face-down
        // cards share it — no per-card lookup needed.
        if (cardBackImage)
            return fallbackBackTexture;
        // Family photos mode: each card has its own back image.
        const backImage = getCardBackImage(cardId);
        if (!backImage)
            return fallbackBackTexture;
        const cached = backTextureByUrlRef.current.get(backImage);
        if (cached) {
            if (!maskedBackTextureUrlsRef.current.has(backImage)) {
                const ctx = appCtxRef.current;
                if (ctx) {
                    try {
                        const masked = makeCustomBackTexture(ctx.app, cardSize, cached, getTextureResolution());
                        backTextureByUrlRef.current.set(backImage, masked);
                        maskedBackTextureUrlsRef.current.add(backImage);
                        return masked;
                    }
                    catch {
                        return cached;
                    }
                }
            }
            return cached;
        }
        // Texture not preloaded yet — return the procedural fallback.
        // The async preloader in the mount effect will fill the cache and
        // trigger a re-render.
        if (import.meta.env.DEV) {
            console.warn(`[Pixi] Back texture not preloaded for ${backImage}, using fallback.`);
        }
        return fallbackBackTexture;
    };
    /** Re-render all per-card back textures through the rounded-rect mask. */
    const maskBackTextures = (cardSize) => {
        const ctx = appCtxRef.current;
        if (!ctx)
            return;
        const res = getTextureResolution();
        const newMap = new Map();
        const nextMasked = new Set();
        for (const [url, rawTex] of backTextureByUrlRef.current) {
            try {
                newMap.set(url, makeCustomBackTexture(ctx.app, cardSize, rawTex, res));
                nextMasked.add(url);
            }
            catch {
                newMap.set(url, rawTex); // keep raw on failure
            }
        }
        backTextureByUrlRef.current = newMap;
        maskedBackTextureUrlsRef.current = nextMasked;
    };
    const refreshUniformBackTexture = (cardSize, sourceUrl) => {
        const ctx = appCtxRef.current;
        if (!ctx)
            return;
        const resolution = getTextureResolution();
        const nextKey = `${sourceUrl}|${cardSize.width}x${cardSize.height}@${resolution}`;
        if (backTextureKeyRef.current === nextKey)
            return;
        backTextureKeyRef.current = nextKey;
        const loadId = ++backTextureLoadIdRef.current;
        void generateBackTexture(ctx.app, cardSize, sourceUrl, resolution).then((texture) => {
            if (loadId !== backTextureLoadIdRef.current) {
                texture.destroy(true);
                return;
            }
            const previous = backTextureRef.current;
            backTextureRef.current = texture;
            if (previous && previous !== texture) {
                previous.destroy(true);
            }
            renderScene();
        });
    };
    const effectiveThemeColors = useMemo(() => (highContrast ? highContrastOverride(themeColors) : themeColors), [highContrast, themeColors]);
    const piles = useMemo(() => buildPiles(mode, gameState, drawCount), [mode, gameState, drawCount]);
    const pileCounts = useMemo(() => {
        const map = new Map();
        for (const pile of piles) {
            map.set(`${pile.pileType}-${pile.pileIndex}`, pile.cards.length);
        }
        return map;
    }, [piles]);
    pileCountsRef.current = pileCounts;
    cardScaleRef.current = cardScale;
    const renderScene = () => {
        // Never re-layout while a drag is active — it repositions all sprites
        // including the one the user is holding, causing a visual scramble.
        if (dragRef.current) {
            pendingRenderRef.current = true;
            return;
        }
        const host = hostRef.current;
        const ctx = appCtxRef.current;
        const textures = textureCacheRef.current;
        const backTexture = backTextureRef.current;
        if (!host || !ctx || !textures || !backTexture)
            return;
        const viewport = getViewportInfo(host);
        const cardSize = computeCardSize(viewport, viewport.dpi, mode, cardScaleRef.current);
        const cardSizeKey = `${cardSize.width}x${cardSize.height}@${viewport.dpi}`;
        // Regenerate card-face textures when cardSize changes (resize, scale change)
        if (cardSizeKey !== textureCardSizeKeyRef.current) {
            const res = getTextureResolution();
            if (textureCacheRef.current)
                invalidateTextures(textureCacheRef.current);
            textureCacheRef.current = generateCardTextures(ctx.app, cardSize, toRenderColors(effectiveThemeColors), res);
            maskBackTextures(cardSize);
            textureCardSizeKeyRef.current = cardSizeKey;
            if (debugRef.current.enabled && debugRef.current.textureLogs) {
                debugLog('texture-regeneration', { reason: 'cardSize-change', cardSizeKey, resolution: res });
            }
        }
        refreshUniformBackTexture(cardSize, cardBackImage ?? CARD_BACK_DEFAULT);
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
                debugLog('pile-hitboxes', layout.piles.map((pile) => ({
                    pileType: pile.pileType,
                    pileIndex: pile.pileIndex,
                    x: pile.x,
                    y: pile.y,
                    width: pile.dropWidth,
                    height: pile.dropHeight,
                })));
                lastLayoutKeyRef.current = layoutKey;
            }
        }
        const animationSteps = [];
        const pileMap = new Map();
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
                const faceDownTexture = resolveFaceDownTexture(card.id, backTexture, cardSize);
                let texture = card.faceUp ? textures.get(card.id) ?? faceDownTexture : faceDownTexture;
                if (!texture) {
                    if (import.meta.env.DEV) {
                        console.warn('[Pixi] Null back texture detected, using fallback.');
                    }
                    texture = backTexture;
                }
                const sprite = spritePoolRef.current.acquire(spriteKey, texture);
                const fromX = sprite.x;
                const fromY = sprite.y;
                const fromAlpha = sprite.alpha || 1;
                let targetX = pileLayout.x;
                let targetY = pileLayout.y;
                if (pileLayout.fanDirection === 'down') {
                    targetY += pileLayout.fanOffset * index;
                }
                else if (pileLayout.fanDirection === 'right') {
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
                    sprite.on('pointerdown', (pointer) => {
                        const meta = spriteMetaRef.current.get(spriteKey);
                        if (!meta || !meta.faceUp)
                            return;
                        if (!supportsDragMode(modeRef.current))
                            return;
                        if (pointer.pointerType === 'mouse' && pointer.button !== 0)
                            return;
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
                    sprite.on('globalpointermove', (pointer) => {
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
                                dragSpriteRef.current = sprite;
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
                        // Only the sprite that owns the drag should move
                        if (!dragRef.current || dragSpriteRef.current !== sprite)
                            return;
                        const dragDx = pointer.global.x - dragRef.current.startX;
                        const dragDy = pointer.global.y - dragRef.current.startY;
                        if (Math.abs(dragDx) + Math.abs(dragDy) < 1)
                            return;
                        sprite.x += dragDx;
                        sprite.y += dragDy;
                        dragRef.current.startX = pointer.global.x;
                        dragRef.current.startY = pointer.global.y;
                    });
                    const handlePointerUp = (pointer) => {
                        const activeDrag = dragRef.current;
                        dragCandidateRef.current = null;
                        // Only the drag-owning sprite should handle pointerup
                        if (!activeDrag || dragSpriteRef.current !== sprite)
                            return;
                        const activeLayout = currentLayoutRef.current;
                        sprite.alpha = 1;
                        sprite.zIndex = 1;
                        if (activeLayout) {
                            const hit = hitTestPile(pointer.global, activeLayout, pileCountsRef.current);
                            if (hit) {
                                const source = {
                                    pileType: activeDrag.sourcePile,
                                    pileIndex: activeDrag.sourcePileIndex,
                                    cardIndex: activeDrag.sourceCardIndex,
                                };
                                const target = {
                                    pileType: hit.pileType,
                                    pileIndex: hit.pileIndex,
                                    cardIndex: hit.cardIndex,
                                };
                                if (canDrop(modeRef.current, gameStateRef.current, source, target)) {
                                    onGameEventRef.current(emitValidatedDragMove(activeDrag, hit.pileType, hit.pileIndex, hit.cardIndex));
                                }
                                else if (debugRef.current.enabled && debugRef.current.hitBoxes) {
                                    debugLog('drag-rejected', { source, target, mode: modeRef.current });
                                }
                            }
                            else if (debugRef.current.enabled && debugRef.current.hitBoxes) {
                                debugLog('hit-miss', {
                                    x: pointer.global.x,
                                    y: pointer.global.y,
                                });
                            }
                        }
                        dragRef.current = null;
                        dragSpriteRef.current = null;
                        pendingRenderRef.current = false;
                        renderScene();
                    };
                    sprite.on('pointerup', handlePointerUp);
                    sprite.on('pointerupoutside', handlePointerUp);
                }
                if (reducedMotion || fromX === 0 && fromY === 0 && sprite.parent === null) {
                    sprite.x = targetX;
                    sprite.y = targetY;
                    sprite.alpha = 1;
                }
                else if (fromX !== targetX || fromY !== targetY) {
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
            const plan = {
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
        }
        else {
            ctx.app.ticker.minFPS = 30;
        }
    };
    useEffect(() => {
        const host = hostRef.current;
        if (!host)
            return;
        let active = true;
        const resizeObserver = new ResizeObserver(() => {
            if (!appCtxRef.current || !hostRef.current)
                return;
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
            const tick = (ticker) => {
                schedulerRef.current.update(ticker.deltaMS);
                if (!debugRef.current.enabled)
                    return;
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
            const res = getTextureResolution();
            if (debugRef.current.enabled && debugRef.current.textureLogs) {
                debugLog('texture-regeneration', {
                    reason: 'mount',
                    cardBackImage,
                    cardSize,
                    resolution: res,
                });
            }
            textureCacheRef.current = generateCardTextures(ctx.app, cardSize, toRenderColors(effectiveThemeColors), res);
            textureCardSizeKeyRef.current = `${cardSize.width}x${cardSize.height}@${viewport.dpi}`;
            backTextureRef.current = await generateBackTexture(ctx.app, cardSize, CARD_BACK_DEFAULT, res);
            backTextureKeyRef.current = `${CARD_BACK_DEFAULT}|${cardSize.width}x${cardSize.height}@${res}`;
            resizeObserver.observe(host);
            renderScene();
            if (!cardBackImage) {
                const backUrls = new Set();
                for (const pile of piles) {
                    for (const card of pile.cards) {
                        const backImage = resolveGameplayBackImage(card.id, cardBackImage);
                        if (backImage) {
                            backUrls.add(backImage);
                        }
                    }
                }
                // First pass: load raw photo textures (bypasses Assets cache for blob URLs)
                await Promise.all([...backUrls].map(async (url) => {
                    try {
                        const tex = await loadTextureFromUrl(url);
                        backTextureByUrlRef.current.set(url, tex);
                        maskedBackTextureUrlsRef.current.delete(url);
                    }
                    catch {
                        if (debugRef.current.enabled && debugRef.current.textureLogs) {
                            debugLog('custom-back-load-failed', { url });
                        }
                    }
                }));
                // Second pass: mask raw textures into rounded-rect card shapes
                const viewport = getViewportInfo(host);
                const cs = computeCardSize(viewport, viewport.dpi, mode, cardScaleRef.current);
                maskBackTextures(cs);
                renderScene();
            }
            else if (cardBackImage !== CARD_BACK_DEFAULT) {
                refreshUniformBackTexture(cardSize, cardBackImage);
            }
        })();
        return () => {
            active = false;
            resizeObserver.disconnect();
            fpsWindowRef.current = { elapsedMs: 0, frames: 0 };
            pointerLogAtRef.current = 0;
            dragRef.current = null;
            dragSpriteRef.current = null;
            dragCandidateRef.current = null;
            schedulerRef.current.cancel();
            if (textureCacheRef.current) {
                invalidateTextures(textureCacheRef.current);
            }
            if (backTextureRef.current) {
                backTextureRef.current.destroy(true);
            }
            backTextureByUrlRef.current.clear();
            maskedBackTextureUrlsRef.current.clear();
            clearPlaceholders();
            textureCacheRef.current = null;
            textureCardSizeKeyRef.current = '';
            backTextureKeyRef.current = '';
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
        if (!host || !ctx)
            return;
        setAppBackground(ctx, effectiveThemeColors.feltColor);
        const viewport = getViewportInfo(host);
        const cardSize = computeCardSize(viewport, viewport.dpi, mode, cardScaleRef.current);
        const res = getTextureResolution();
        if (debugRef.current.enabled && debugRef.current.textureLogs) {
            debugLog('texture-regeneration', {
                reason: 'theme-change',
                cardSize,
                resolution: res,
            });
        }
        if (textureCacheRef.current) {
            invalidateTextures(textureCacheRef.current);
        }
        textureCacheRef.current = generateCardTextures(ctx.app, cardSize, toRenderColors(effectiveThemeColors), res);
        textureCardSizeKeyRef.current = `${cardSize.width}x${cardSize.height}@${viewport.dpi}`;
        if (schedulerRef.current.isAnimating) {
            pendingRenderRef.current = true;
            return;
        }
        renderScene();
    }, [effectiveThemeColors, mode]);
    useEffect(() => {
        // renderScene itself checks dragRef and defers, so just call it.
        if (schedulerRef.current.isAnimating) {
            pendingRenderRef.current = true;
            return;
        }
        renderScene();
    }, [piles, reducedMotion, mode, cardScale]);
    return (_jsxs("div", { style: {
            position: 'relative',
            flex: 1,
            minHeight: 420,
            width: '100%',
            touchAction: 'none',
        }, children: [_jsx("div", { ref: hostRef, role: "img", "aria-hidden": "true", style: {
                    width: '100%',
                    height: '100%',
                } }), layoutState && (_jsx(KeyboardOverlay, { layout: layoutState, mode: mode, onGameEvent: onGameEvent }))] }));
};

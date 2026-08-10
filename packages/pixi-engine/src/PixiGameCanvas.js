import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { RANK_LABELS, SUIT_SYMBOLS, canPlaceOnFoundation, suitColor, } from '@grandmagame/card-engine';
const FACE_RANKS = new Set([11, 12, 13]);
const FOUNDATION_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
function CardFace({ card }) {
    const tone = suitColor(card.suit) === 'red' ? 'kl-red' : 'kl-black';
    const rank = RANK_LABELS[card.rank];
    const suit = SUIT_SYMBOLS[card.suit];
    return (_jsxs("span", { className: `kl-face ${tone}`, children: [_jsxs("span", { className: "kl-corner", children: [rank, _jsx("em", { children: suit })] }), _jsxs("span", { className: "kl-corner kl-corner--b", children: [rank, _jsx("em", { children: suit })] }), FACE_RANKS.has(card.rank) ? (_jsx("span", { className: "kl-medallion", children: _jsx("span", { children: rank }) })) : (_jsx("span", { className: card.rank === 1 ? 'kl-pip kl-pip--ace' : 'kl-pip', children: suit }))] }));
}
function CardBack({ variant, url }) {
    return (_jsx("span", { className: `kl-face kl-back--${variant}${url ? ' kl-back--photo' : ''}`, style: url ? { animation: 'none', backgroundImage: `url("${url}")` } : { animation: 'none' }, children: _jsx("span", { className: "kl-back-inner" }) }));
}
export function PixiGameCanvas({ gameState, reducedMotion, drawCount = 1, backVariant = 'damask', cardBackUrl = null, cardBackMode = 'single', customBackList = [], onGameEvent, }) {
    const randomBacks = useRef(new Map());
    const previousMode = useRef(cardBackMode);
    if (previousMode.current !== cardBackMode) {
        randomBacks.current.clear();
        previousMode.current = cardBackMode;
    }
    const cardBackFor = (cardId) => {
        if (cardBackMode !== 'random' || customBackList.length === 0)
            return cardBackUrl;
        const assigned = randomBacks.current.get(cardId);
        if (assigned)
            return assigned;
        const usedUrls = new Set(randomBacks.current.values());
        const availableUrls = customBackList.filter((url) => !usedUrls.has(url));
        const choices = availableUrls.length > 0 ? availableUrls : customBackList;
        const randomUrl = choices[Math.floor(Math.random() * choices.length)];
        randomBacks.current.set(cardId, randomUrl);
        return randomUrl;
    };
    const faceDownCardIds = new Set();
    if (gameState.stock.length > 0)
        faceDownCardIds.add('stock');
    gameState.tableau.forEach((pile) => {
        pile.forEach((card) => {
            if (!card.faceUp)
                faceDownCardIds.add(card.id);
        });
    });
    randomBacks.current.forEach((_, cardId) => {
        if (!faceDownCardIds.has(cardId))
            randomBacks.current.delete(cardId);
    });
    const wasteTop = gameState.waste.at(-1);
    const dealClass = reducedMotion ? '' : ' kl-deal';
    let dealIndex = 0;
    const wasteStart = Math.max(0, gameState.waste.length - drawCount);
    const wasteFan = gameState.waste.slice(wasteStart);
    return (_jsxs("main", { "aria-label": "Klondike game board", className: "kl-board", children: [_jsxs("div", { className: "kl-row-top", children: [gameState.stock.length > 0 ? (_jsx("button", { type: "button", "aria-label": "Draw from stock", className: "kl-card kl-card--back", onClick: () => onGameEvent({ type: 'DRAW' }), children: _jsx(CardBack, { variant: backVariant, url: cardBackFor('stock') }) })) : (_jsx("button", { type: "button", "aria-label": "Recycle waste into stock", className: "kl-slot", onClick: () => onGameEvent({ type: 'DRAW' }), children: _jsx("span", { className: "kl-recycle", children: "\u27F3" }) })), _jsxs("div", { className: "kl-waste", children: [wasteFan.length === 0 && _jsx("span", { className: "kl-slot", "aria-hidden": "true" }), wasteFan.map((card, i) => (_jsx("button", { type: "button", "aria-label": `Waste card ${RANK_LABELS[card.rank]} of ${card.suit}`, className: "kl-card", style: { left: i * 18, zIndex: i + 1 }, onClick: () => onGameEvent({ type: 'TAP_WASTE' }), children: _jsx(CardFace, { card: card }) }, card.id)))] }), _jsx("div", { "aria-hidden": "true" }), gameState.foundations.map((pile, pileIndex) => {
                        const top = pile.at(-1);
                        const hint = !!wasteTop && canPlaceOnFoundation(wasteTop, pile);
                        return top ? (_jsx("button", { type: "button", "aria-label": `Foundation ${pileIndex + 1}`, className: "kl-card", onClick: () => onGameEvent({ type: 'TAP_FOUNDATION', pileIndex }), children: _jsx(CardFace, { card: top }) }, pileIndex)) : (_jsx("button", { type: "button", "aria-label": `Empty foundation ${pileIndex + 1}`, className: `kl-slot kl-slot--foundation${hint ? ' kl-glow' : ''}`, onClick: () => onGameEvent({ type: 'TAP_FOUNDATION', pileIndex }), children: _jsx("span", { "aria-hidden": "true", children: SUIT_SYMBOLS[FOUNDATION_SUITS[pileIndex]] }) }, pileIndex));
                    })] }), _jsx("div", { className: "kl-tableau", children: gameState.tableau.map((pile, pileIndex) => (_jsxs("div", { className: "kl-tableau-col", children: [pile.length === 0 && (_jsx("button", { type: "button", "aria-label": `Empty tableau column ${pileIndex + 1}`, className: "kl-slot", onClick: () => onGameEvent({ type: 'TAP_TABLEAU', pileIndex, cardIndex: 0 }) })), pile.map((card, cardIndex) => (_jsx("button", { type: "button", "aria-label": card.faceUp ? `${RANK_LABELS[card.rank]} of ${card.suit}` : 'Face-down card', className: `kl-card kl-tcard${dealClass}`, style: {
                                ['--fan-i']: cardIndex,
                                ['--deal-i']: dealIndex++,
                                zIndex: cardIndex + 1,
                            }, onClick: () => onGameEvent({ type: 'TAP_TABLEAU', pileIndex, cardIndex }), children: card.faceUp ? _jsx(CardFace, { card: card }) : _jsx(CardBack, { variant: backVariant, url: cardBackFor(card.id) }) }, card.id)))] }, pileIndex))) }, gameState.shuffleSeed ?? 0)] }));
}

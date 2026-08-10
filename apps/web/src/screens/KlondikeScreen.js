import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { isWon } from '@grandmagame/card-engine';
import { PixiGameCanvas } from '../pixi/PixiGameCanvas';
import { useGameState } from '../hooks/useGameState';
const themeColors = {
    feltColor: 0x1a6b3c,
    cardBackground: 0xffffff,
    cardBorder: 0x0d2233,
    redCardColor: 0xc21807,
    blackCardColor: 0x101010,
    placeholderStroke: 0xffffff,
    placeholderAlpha: 0.3,
};
const CONFETTI_COLORS = ['#e8cd8d', '#f6e5b8', '#a8263a', '#2a4066', '#96566a', '#fffdf6'];
function WinConfetti() {
    const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
        px: `${(i * 137.5) % 100}%`,
        pw: i % 4 === 0 ? '14px' : '9px',
        ph: i % 4 === 0 ? '20px' : '9px',
        pr: i % 3 === 0 ? '50%' : '2px',
        pc: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        pd: `${2.6 + (i % 5) * 0.55}s`,
        pdelay: `${(i % 10) * 0.24}s`,
        pdrift: `${((i % 7) - 3) * 34}px`,
        prot: `${180 + (i % 4) * 160}deg`,
    })), []);
    return (_jsx(_Fragment, { children: pieces.map((p, i) => (_jsx("span", { className: "kl-piece", style: {
                ['--px']: p.px,
                ['--pw']: p.pw,
                ['--ph']: p.ph,
                ['--pr']: p.pr,
                ['--pc']: p.pc,
                ['--pd']: p.pd,
                ['--pdelay']: p.pdelay,
                ['--pdrift']: p.pdrift,
                ['--prot']: p.prot,
            } }, i))) }));
}
function formatTime(total) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}
export function KlondikeScreen({ backVariant, cardBackUrl, cardBackMode, customBackList, onSettings }) {
    const { game, canUndo, drawCount, actions } = useGameState();
    const won = game.status === 'won' || isWon(game);
    useEffect(() => {
        if (won)
            return;
        const timer = window.setInterval(() => actions.setElapsed(game.elapsedSeconds + 1), 1000);
        return () => window.clearInterval(timer);
    }, [actions, game.elapsedSeconds, won]);
    const onGameEvent = (event) => {
        switch (event.type) {
            case 'DRAW':
                actions.draw();
                break;
            case 'TAP_WASTE':
                actions.tapWaste();
                break;
            case 'TAP_TABLEAU':
                actions.tapTableau(event.pileIndex, event.cardIndex);
                break;
            case 'TAP_FOUNDATION':
                actions.tapFoundation(event.pileIndex);
                break;
        }
    };
    return (_jsxs("div", { className: "kl-root", children: [_jsxs("header", { className: "kl-hud", children: [_jsx("span", { className: "kl-title", children: "Grandma\u2019s Solitaire" }), _jsxs("div", { className: "kl-stats", role: "status", "aria-label": "Game statistics", children: [_jsxs("div", { className: "kl-stat", children: [_jsx("span", { className: "kl-stat-value", children: game.score }, `s${game.score}`), _jsx("span", { className: "kl-stat-label", children: "Score" })] }), _jsxs("div", { className: "kl-stat", children: [_jsx("span", { className: "kl-stat-value", children: game.moves }, `m${game.moves}`), _jsx("span", { className: "kl-stat-label", children: "Moves" })] }), _jsxs("div", { className: "kl-stat", children: [_jsx("span", { className: "kl-stat-value", children: formatTime(game.elapsedSeconds) }), _jsx("span", { className: "kl-stat-label", children: "Time" })] })] }), _jsx("div", { className: "kl-spacer" }), _jsxs("button", { type: "button", className: "kl-btn", onClick: onSettings, "aria-label": "Card back settings", children: [_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.03 2.03-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.09h-2.87v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.03-2.03.06-.06A1.7 1.7 0 0 0 7.3 15a1.7 1.7 0 0 0-1.56-1.03h-.09v-2.87h.09A1.7 1.7 0 0 0 7.3 10.07a1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.93 6.1l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.09h2.87v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.03 2.03-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.09v2.87h-.09A1.7 1.7 0 0 0 19.4 15Z" })] }), "Card backs"] }), _jsxs("button", { type: "button", className: "kl-btn", onClick: actions.undo, disabled: !canUndo, children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M9 14 4 9l5-5" }), _jsx("path", { d: "M4 9h10a6 6 0 0 1 0 12h-3" })] }), "Undo"] }), _jsxs("button", { type: "button", className: "kl-btn kl-btn--gold", onClick: actions.newGame, children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [_jsx("path", { d: "M21 12a9 9 0 1 1-2.64-6.36" }), _jsx("path", { d: "M21 3v6h-6" })] }), "New game"] })] }), _jsx(PixiGameCanvas, { mode: "klondike", gameState: game, cardBackImage: null, reducedMotion: false, themeColors: themeColors, highContrast: false, cardScale: "medium", drawCount: drawCount, backVariant: backVariant, cardBackUrl: cardBackUrl, cardBackMode: cardBackMode, customBackList: customBackList, onGameEvent: onGameEvent }), won && (_jsxs("div", { className: "kl-win", role: "dialog", "aria-label": "You won", children: [_jsx(WinConfetti, {}), _jsxs("div", { className: "kl-win-panel", children: [_jsx("div", { className: "kl-win-title", children: "You did it!" }), _jsx("div", { className: "kl-win-sub", children: "Every card found its home. Beautifully played." }), _jsxs("div", { className: "kl-win-stats", children: [_jsxs("div", { className: "kl-stat", children: [_jsx("span", { className: "kl-stat-value", children: game.score }), _jsx("span", { className: "kl-stat-label", children: "Score" })] }), _jsxs("div", { className: "kl-stat", children: [_jsx("span", { className: "kl-stat-value", children: game.moves }), _jsx("span", { className: "kl-stat-label", children: "Moves" })] }), _jsxs("div", { className: "kl-stat", children: [_jsx("span", { className: "kl-stat-value", children: formatTime(game.elapsedSeconds) }), _jsx("span", { className: "kl-stat-label", children: "Time" })] })] }), _jsx("button", { type: "button", className: "kl-btn kl-btn--gold", onClick: actions.newGame, children: "Play again" })] })] }))] }));
}

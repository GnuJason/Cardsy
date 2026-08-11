import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { formatTime } from '../../hooks/useTimer';
import styles from './HUD.module.css';
/** Trigger a CSS animation bump on a ref element */
function useBump(value) {
    const ref = useRef(null);
    const prev = useRef(value);
    useEffect(() => {
        if (value !== prev.current && ref.current) {
            const el = ref.current;
            el.classList.remove(styles.statBump);
            // Force reflow so the animation restarts
            void el.offsetWidth;
            el.classList.add(styles.statBump);
        }
        prev.current = value;
    }, [value]);
    return ref;
}
export const HUD = ({ score, moves, elapsed, canUndo, canAutoComplete, onUndo, onNewGame, onAutoComplete, onSettings, onStats, onChangeMode, onAchievements, }) => {
    const scoreRef = useBump(score);
    const movesRef = useBump(moves);
    return (_jsxs("div", { className: styles.hud, children: [_jsxs("div", { className: styles.stats, children: [_jsxs("div", { className: styles.stat, children: [_jsx("span", { ref: scoreRef, className: styles.statValue, children: score }), _jsx("span", { className: styles.statLabel, children: "Score" })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { ref: movesRef, className: styles.statValue, children: moves }), _jsx("span", { className: styles.statLabel, children: "Moves" })] }), _jsxs("div", { className: styles.stat, children: [_jsx("span", { className: styles.statValue, children: formatTime(elapsed) }), _jsx("span", { className: styles.statLabel, children: "Time" })] })] }), _jsxs("div", { className: styles.controls, children: [canAutoComplete && (_jsx("button", { className: styles.autoCompleteBtn, onClick: onAutoComplete, "aria-label": "Auto-complete", children: "\u2728 Auto" })), _jsx("button", { className: styles.controlBtn, onClick: onUndo, disabled: !canUndo, "aria-label": "Undo", children: "\u21A9 Undo" }), _jsx("button", { className: styles.controlBtn, onClick: onNewGame, "aria-label": "New game", children: "\uD83C\uDCCF New" }), onStats && (_jsx("button", { className: styles.controlBtn, onClick: onStats, "aria-label": "Statistics", children: "\uD83D\uDCCA" })), onAchievements && (_jsx("button", { className: styles.controlBtn, onClick: onAchievements, "aria-label": "Achievements", children: "\uD83C\uDFC6" })), _jsx("button", { className: styles.controlBtn, onClick: onSettings, "aria-label": "Settings", children: "\u2699" }), onChangeMode && (_jsx("button", { className: styles.controlBtn, onClick: onChangeMode, "aria-label": "Change game mode", children: "\uD83D\uDD00" }))] })] }));
};

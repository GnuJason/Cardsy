import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatTime } from '../../hooks/useTimer';
import { timerBonus } from '../../logic/scoring';
import { Modal } from '../Modal/Modal';
import styles from './WinModal.module.css';
export const WinModal = ({ onNewGame, modeStats, elapsed, moves, bestScore, statLines, isNewBest: isNewBestOverride, score, showTimerBonus = false, }) => {
    // Compute timer bonus if applicable
    const bonus = showTimerBonus ? timerBonus(elapsed) : 0;
    const finalScore = score !== undefined ? score + bonus : undefined;
    // Determine if this is a new best
    const isNewBest = isNewBestOverride !== undefined
        ? isNewBestOverride
        : finalScore !== undefined && (bestScore === null || finalScore > bestScore);
    // Build stat lines if not provided
    const lines = statLines ?? [
        ...(showTimerBonus && score !== undefined
            ? [
                { label: 'Score', value: score },
                { label: 'Time bonus', value: `+${bonus}` },
                { label: 'Final score', value: finalScore },
            ]
            : []),
        { label: 'Moves', value: moves },
        { label: 'Time', value: formatTime(elapsed) },
    ];
    const isNewBestTime = modeStats && modeStats.bestTime !== null && elapsed <= modeStats.bestTime;
    return (_jsxs(Modal, { onClose: onNewGame, ariaLabel: "You won", children: [_jsx("h2", { className: styles.title, children: "\uD83C\uDF89 You Won!" }), _jsx("div", { className: styles.stats, children: lines.map((line) => (_jsxs("div", { className: line.highlight ? styles.statHighlight : styles.stat, children: [_jsx("span", { className: styles.statLabel, children: line.label }), _jsx("strong", { className: styles.statValue, children: line.value })] }, line.label))) }), (isNewBest || isNewBestTime) && (_jsxs("div", { className: styles.achievements, children: [isNewBest && _jsx("div", { className: styles.badge, children: "\uD83C\uDFC6 New best score!" }), isNewBestTime && _jsx("div", { className: styles.badge, children: "\u23F1\uFE0F New best time!" })] })), modeStats && (_jsxs("p", { className: styles.streakInfo, children: ["Win streak: ", _jsx("strong", { children: modeStats.currentWinStreak }), modeStats.currentWinStreak > 1 && ' 🔥'] })), _jsx("div", { className: styles.buttons, children: _jsx("button", { className: styles.primaryBtn, onClick: onNewGame, children: "Play Again" }) })] }));
};

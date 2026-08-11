import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { formatTime } from '../../hooks/useTimer';
import { Modal } from '../Modal/Modal';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import styles from './StatsModal.module.css';
const MODE_LABELS = {
    klondike: 'Klondike',
    tripeaks: 'TriPeaks',
    golf: 'Golf',
    pyramid: 'Pyramid',
    freecell: 'FreeCell',
    spider: 'Spider',
};
function StatRow({ label, value }) {
    return (_jsxs("div", { className: styles.statRow, children: [_jsx("span", { className: styles.statLabel, children: label }), _jsx("span", { className: styles.statValue, children: value })] }));
}
function renderModeStats(m, mode) {
    const winRate = m.totalGamesPlayed > 0
        ? `${Math.round((m.totalWins / m.totalGamesPlayed) * 100)}%`
        : '—';
    const scoreLabel = mode === 'golf' || mode === 'pyramid'
        ? 'Best (Cards Left)'
        : mode === 'freecell'
            ? 'Best (Moves)'
            : mode === 'spider'
                ? 'Best Score'
                : 'Best Score';
    return (_jsxs(_Fragment, { children: [_jsx(StatRow, { label: scoreLabel, value: m.bestScore !== null ? String(m.bestScore) : '—' }), _jsx(StatRow, { label: "Best Time", value: m.bestTime !== null ? formatTime(m.bestTime) : '—' }), _jsx(StatRow, { label: "Win Streak", value: `${m.currentWinStreak} (best: ${m.bestWinStreak})` }), _jsx(StatRow, { label: "Total Wins", value: String(m.totalWins) }), _jsx(StatRow, { label: "Games Played", value: String(m.totalGamesPlayed) }), _jsx(StatRow, { label: "Win Rate", value: winRate })] }));
}
export const StatsModal = ({ stats, currentMode, onResetStats, onClose, }) => {
    const [viewMode, setViewMode] = useState(currentMode);
    const [confirmReset, setConfirmReset] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsxs(Modal, { onClose: onClose, ariaLabel: "Statistics", children: [_jsx("h2", { className: styles.title, children: "Statistics" }), _jsx("div", { className: styles.tabs, children: ['klondike', 'tripeaks', 'golf', 'pyramid', 'freecell', 'spider'].map((mode) => (_jsx("button", { className: viewMode === mode ? styles.tabActive : styles.tab, onClick: () => setViewMode(mode), children: MODE_LABELS[mode] }, mode))) }), _jsx("div", { className: styles.statsBody, children: renderModeStats(stats[viewMode], viewMode) }), _jsxs("div", { className: styles.actions, children: [_jsxs("button", { className: styles.resetBtn, onClick: () => setConfirmReset(true), children: ["Reset ", MODE_LABELS[viewMode], " Stats"] }), _jsx("button", { className: styles.closeBtn, onClick: onClose, children: "Done" })] })] }), confirmReset && (_jsx(ConfirmModal, { title: "Reset Statistics?", message: `This will permanently erase all ${MODE_LABELS[viewMode]} statistics. This cannot be undone.`, confirmLabel: "Reset", cancelLabel: "Keep", onConfirm: () => {
                    onResetStats(viewMode);
                    setConfirmReset(false);
                }, onCancel: () => setConfirmReset(false) }))] }));
};

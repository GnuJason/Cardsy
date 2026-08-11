import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ACHIEVEMENTS, getTierProgress } from '../../logic/achievements';
import { Modal } from '../Modal/Modal';
import styles from './AchievementsModal.module.css';
export const AchievementsModal = ({ unlocked, onClose, }) => {
    const unlockedMap = new Map();
    for (const u of unlocked) {
        unlockedMap.set(u.id, u);
    }
    return (_jsxs(Modal, { onClose: onClose, ariaLabel: "Achievements", className: styles.achievementsPanel, children: [_jsx("h2", { className: styles.title, children: "\uD83C\uDFC6 Achievements" }), _jsx("div", { className: styles.grid, children: ACHIEVEMENTS.map((def) => {
                    const u = unlockedMap.get(def.id);
                    const isUnlocked = !!u;
                    const tierInfo = def.tiers ? getTierProgress(def, u) : null;
                    return (_jsxs("div", { className: isUnlocked ? styles.cardUnlocked : styles.card, children: [_jsx("span", { className: isUnlocked ? styles.cardIcon : styles.cardLocked, children: def.icon }), _jsxs("div", { className: styles.cardBody, children: [_jsx("div", { className: styles.cardName, children: def.name }), _jsx("div", { className: styles.cardDesc, children: def.description }), tierInfo && (_jsxs("div", { className: styles.cardTier, children: [tierInfo.currentTier > 0
                                                ? `Reached: ${tierInfo.currentTier}`
                                                : 'Not started', tierInfo.nextTier
                                                ? ` · Next: ${tierInfo.nextTier}`
                                                : tierInfo.currentTier >= tierInfo.maxTier
                                                    ? ' · Max!'
                                                    : ''] }))] }), isUnlocked && (_jsx("span", { className: styles.cardBadge, children: u.tier ? `${u.tier}` : '✓' }))] }, def.id));
                }) }), _jsx("button", { className: styles.closeBtn, onClick: onClose, children: "Done" })] }));
};

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useMemo } from 'react';
import { CARD_BACK_DEFAULT, getCardBackImage } from '../../config/cardArt';
import { SUITS, RANKS } from '../../logic/types';
import styles from './WinCelebration.module.css';
/** All 52 card IDs for animation */
function allCardIds() {
    const ids = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            ids.push(`${suit}-${rank}`);
        }
    }
    return ids;
}
function pseudoRandom(index) {
    const seed = Math.imul(index + 1, 0x9e3779b1) >>> 0;
    let mixed = Math.imul(seed ^ (seed >>> 16), 0x85ebca6b);
    mixed = Math.imul(mixed ^ (mixed >>> 13), 0xc2b2ae35);
    return ((mixed ^ (mixed >>> 16)) >>> 0) / 4294967296;
}
function getDeterministicCardBack() {
    const ids = allCardIds();
    for (const id of ids) {
        const img = getCardBackImage(id);
        if (img)
            return img;
    }
    return CARD_BACK_DEFAULT;
}
/**
 * Generate scatter positions — random screen positions around the viewport.
 */
function generateScatterPositions(count) {
    const positions = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (pseudoRandom(i) - 0.5) * 0.5;
        const radius = Math.min(vw, vh) * (0.3 + pseudoRandom(i + count) * 0.35);
        positions.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            rotation: (pseudoRandom(i + count * 2) - 0.5) * 720,
        });
    }
    return positions;
}
export const WinCelebration = ({ onComplete, reducedMotion = false, }) => {
    const [phase, setPhase] = useState('scatter');
    const [photoVisible, setPhotoVisible] = useState(false);
    const timerRef = useRef([]);
    const completedRef = useRef(false);
    const cardIds = useMemo(() => allCardIds(), []);
    const scatterPositions = useMemo(() => generateScatterPositions(52), []);
    const finalPhoto = useMemo(() => getDeterministicCardBack(), []);
    // Get per-card back images
    const cardImages = useMemo(() => {
        return cardIds.map((id) => {
            const img = getCardBackImage(id);
            return img || CARD_BACK_DEFAULT;
        });
    }, [cardIds]);
    const finish = () => {
        if (completedRef.current)
            return;
        completedRef.current = true;
        timerRef.current.forEach(clearTimeout);
        onComplete();
    };
    // Reduced motion: skip straight to completion
    useEffect(() => {
        if (reducedMotion) {
            finish();
            return;
        }
        // Phase 1 (0s): scatter — cards start at center, fly outward
        // Already in 'scatter' phase from initial state
        // Phase 2 (2s): converge — cards fly back to center
        const t1 = setTimeout(() => setPhase('converge'), 2000);
        // Phase 3 (4s): show final photo
        const t2 = setTimeout(() => {
            setPhase('photo');
            setPhotoVisible(true);
        }, 3800);
        // Phase 4 (5.5s): complete
        const t3 = setTimeout(finish, 5500);
        timerRef.current = [t1, t2, t3];
        return () => {
            timerRef.current.forEach(clearTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    if (reducedMotion)
        return null;
    const getCardStyle = (index) => {
        // Stagger cards in 4 bursts for a wave effect
        const staggerDelay = `${(index % 4) * 60}ms`;
        if (phase === 'scatter') {
            const pos = scatterPositions[index];
            return {
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg)`,
                opacity: 1,
                transitionDelay: staggerDelay,
            };
        }
        if (phase === 'converge') {
            // Converge to center with slight spread for stacking effect
            const offset = (index - 26) * 0.3;
            const rot = (index - 26) * 0.5;
            return {
                transform: `translate(${offset}px, ${offset}px) rotate(${rot}deg)`,
                opacity: 1,
                transitionDelay: staggerDelay,
            };
        }
        if (phase === 'photo') {
            const cols = 8;
            const rows = Math.ceil(cardIds.length / cols);
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = (col - (cols - 1) / 2) * 36;
            const y = (row - (rows - 1) / 2) * 52;
            return {
                transform: `translate(${x}px, ${y}px) rotate(0deg)`,
                opacity: 1,
            };
        }
        return {};
    };
    const phaseClass = phase === 'scatter' ? styles.scatter :
        phase === 'converge' || phase === 'photo' ? styles.converge : '';
    return (_jsxs("div", { className: styles.overlay, onClick: finish, children: [cardIds.map((id, i) => (_jsx("div", { className: `${styles.card} ${phaseClass}`, style: {
                    ...getCardStyle(i),
                    zIndex: i,
                }, children: _jsx("img", { src: cardImages[i], alt: "", loading: "eager", width: "80", height: "112" }) }, id))), _jsx("div", { className: `${styles.finalPhoto} ${photoVisible ? styles.finalPhotoVisible : ''}`, children: _jsx("img", { src: finalPhoto, alt: "Family photo", loading: "eager", width: "300", height: "420" }) }), _jsx("div", { className: styles.skipHint, children: "Tap anywhere to skip" })] }));
};

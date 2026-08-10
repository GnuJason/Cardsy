import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useCallback } from 'react';
import { PYRAMID_POSITIONS } from '../../logic/pyramid/layout';
import { isUncovered } from '../../logic/pyramid/rules';
import { Card, EmptyPile } from '../Card/Card';
import styles from './PyramidBoard.module.css';
export const PyramidBoard = ({ game, cardBackImage, onTapPyramid, onTapWaste, onDraw, }) => {
    const wasteTop = game.waste.length > 0 ? game.waste[game.waste.length - 1] : null;
    // Pre-compute uncovered status for all cards once per render
    const uncoveredFlags = useMemo(() => game.pyramid.map((card, idx) => !card.removed && isUncovered(idx, game.pyramid)), [game.pyramid]);
    // Stable callback — Card uses cardIndex + onTapCard pattern
    const handleTapCard = useCallback((idx) => {
        if (uncoveredFlags[idx])
            onTapPyramid(idx);
    }, [onTapPyramid, uncoveredFlags]);
    // Is waste top selected?
    const wasteSelected = game.selectedIndex === -1;
    return (_jsxs("div", { className: styles.board, children: [_jsxs("div", { className: styles.remainingBadge, children: [_jsx("span", { className: styles.remainingCount, children: game.cardsRemaining }), ' ', "cards remaining"] }), _jsx("div", { className: styles.pyramid, children: game.pyramid.map((card, idx) => {
                    if (card.removed) {
                        return (_jsx("div", { className: styles.pyramidSlot, style: {
                                gridRow: PYRAMID_POSITIONS[idx].row + 1,
                                gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
                            } }, idx));
                    }
                    const uncovered = uncoveredFlags[idx];
                    const isSelected = game.selectedIndex === idx;
                    return (_jsx("div", { className: `${styles.pyramidSlot} ${uncovered ? styles.uncovered : ''} ${isSelected ? styles.selected : ''}`, style: {
                            gridRow: PYRAMID_POSITIONS[idx].row + 1,
                            gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
                        }, children: _jsx(Card, { card: card, cardIndex: idx, onTapCard: uncovered ? handleTapCard : undefined, cardBackImage: cardBackImage }) }, idx));
                }) }), _jsxs("div", { className: styles.bottomRow, children: [_jsxs("div", { className: styles.stockPile, onClick: onDraw, children: [game.stock.length > 0 ? (_jsx(Card, { card: { ...game.stock[game.stock.length - 1], faceUp: false }, cardBackImage: cardBackImage })) : (_jsx(EmptyPile, {})), game.stock.length > 0 && (_jsx("span", { className: styles.stockCount, children: game.stock.length }))] }), _jsx("div", { className: `${styles.wastePile} ${wasteSelected ? styles.selected : ''}`, onClick: onTapWaste, children: wasteTop ? _jsx(Card, { card: wasteTop }) : _jsx(EmptyPile, {}) })] })] }));
};

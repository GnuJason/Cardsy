import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useCallback } from 'react';
import { PYRAMID_POSITIONS } from '../../logic/tripeaks/layout';
import { isExposed } from '../../logic/tripeaks/rules';
import { Card, EmptyPile } from '../Card/Card';
import styles from './TriPeaksBoard.module.css';
export const TriPeaksBoard = ({ game, cardBackImage, onTapCard, onDraw, }) => {
    const wasteTop = game.waste.length > 0 ? game.waste[game.waste.length - 1] : null;
    // Pre-compute exposed status for all cards once per render
    const exposedFlags = useMemo(() => game.pyramid.map((card, idx) => !card.removed && isExposed(idx, game.pyramid)), [game.pyramid]);
    // Stable callback — Card uses cardIndex + onTapCard pattern
    const handleTapCard = useCallback((idx) => {
        if (exposedFlags[idx])
            onTapCard(idx);
    }, [onTapCard, exposedFlags]);
    return (_jsxs("div", { className: styles.board, children: [_jsx("div", { className: styles.pyramid, children: game.pyramid.map((card, idx) => {
                    if (card.removed) {
                        return (_jsx("div", { className: styles.pyramidSlot, style: {
                                gridRow: PYRAMID_POSITIONS[idx].row + 1,
                                gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
                            } }, idx));
                    }
                    const exposed = exposedFlags[idx];
                    return (_jsx("div", { className: `${styles.pyramidSlot} ${exposed ? styles.exposed : ''}`, style: {
                            gridRow: PYRAMID_POSITIONS[idx].row + 1,
                            gridColumn: `${PYRAMID_POSITIONS[idx].col + 1} / span 2`,
                        }, children: _jsx(Card, { card: card, cardIndex: idx, onTapCard: exposed ? handleTapCard : undefined, cardBackImage: cardBackImage }) }, idx));
                }) }), _jsxs("div", { className: styles.bottomRow, children: [_jsxs("div", { className: styles.stockPile, onClick: onDraw, children: [game.stock.length > 0 ? (_jsx(Card, { card: { ...game.stock[game.stock.length - 1], faceUp: false }, cardBackImage: cardBackImage })) : (_jsx(EmptyPile, {})), game.stock.length > 0 && (_jsx("span", { className: styles.stockCount, children: game.stock.length }))] }), _jsx("div", { className: styles.wastePile, children: wasteTop ? (_jsx(Card, { card: wasteTop })) : (_jsx(EmptyPile, {})) })] })] }));
};

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { canDealRow } from '../../logic/spider/rules';
import { Card } from '../Card/Card';
import styles from './SpiderBoard.module.css';
export const SpiderBoard = ({ game, cardBackImage, onTapColumn, onTapStock, }) => {
    const { columns, stock, completedRuns, selectedSource } = game;
    const handleColumnTap = useCallback((colIndex, cardIndex) => {
        onTapColumn(colIndex, cardIndex);
    }, [onTapColumn]);
    const canDeal = canDealRow(game);
    // ── Foundation display (8 slots) ──────────────────────────
    const renderFoundations = () => {
        const slots = [];
        for (let i = 0; i < 8; i++) {
            const filled = i < completedRuns;
            slots.push(_jsx("div", { className: `${styles.foundSlot} ${filled ? styles.foundFilled : ''}`, children: _jsx("span", { className: styles.foundLabel, children: filled ? '✓' : `${i + 1}` }) }, `found-${i}`));
        }
        return slots;
    };
    // ── Stock pile ────────────────────────────────────────────
    const renderStock = () => {
        if (stock.length === 0) {
            return (_jsx("div", { className: styles.stockEmpty, children: _jsx("span", { children: "Empty" }) }));
        }
        return (_jsxs("div", { className: `${styles.stockPile} ${!canDeal ? styles.stockDisabled : ''}`, onClick: canDeal ? onTapStock : undefined, children: [_jsx(Card, { card: { ...stock[stock.length - 1], faceUp: false }, cardBackImage: cardBackImage }), _jsx("span", { className: styles.stockCount, children: stock.length })] }));
    };
    // ── Tableau columns ───────────────────────────────────────
    const renderColumns = () => columns.map((col, colIdx) => {
        if (col.length === 0) {
            return (_jsx("div", { className: styles.columnEmpty, onClick: () => handleColumnTap(colIdx, 0) }, `col-${colIdx}`));
        }
        // Determine selected card range in this column
        let selStart = -1;
        if (selectedSource && selectedSource.colIndex === colIdx) {
            selStart = selectedSource.cardIndex;
        }
        const faceDownCount = col.filter((c) => !c.faceUp).length;
        const colLen = col.length;
        return (_jsx("div", { className: styles.column, style: {
                height: `calc(var(--card-height) + ${faceDownCount} * var(--fan-offset-up) + ${colLen - 1 - faceDownCount} * var(--fan-offset-down))`,
            }, children: col.map((card, cardIdx) => {
                const isInSelection = selStart >= 0 && cardIdx >= selStart;
                // face-down cards get a smaller offset
                let topOffset;
                if (cardIdx === 0) {
                    topOffset = '0px';
                }
                else {
                    // Sum offsets for all previous cards
                    let sumParts = [];
                    for (let i = 0; i < cardIdx; i++) {
                        sumParts.push(col[i].faceUp
                            ? 'var(--fan-offset-down)'
                            : 'var(--fan-offset-up)');
                    }
                    topOffset = `calc(${sumParts.join(' + ')})`;
                }
                return (_jsx("div", { className: `${styles.columnCard} ${isInSelection ? styles.selectedCard : ''}`, style: { top: topOffset }, onClick: (e) => {
                        e.stopPropagation();
                        handleColumnTap(colIdx, cardIdx);
                    }, children: _jsx(Card, { card: card, cardBackImage: cardBackImage }) }, card.id));
            }) }, `col-${colIdx}`));
    });
    return (_jsxs("div", { className: styles.board, children: [_jsxs("div", { className: styles.topRow, children: [_jsx("div", { className: styles.foundationInfo, children: renderFoundations() }), renderStock()] }), _jsx("div", { className: styles.tableau, children: renderColumns() })] }));
};

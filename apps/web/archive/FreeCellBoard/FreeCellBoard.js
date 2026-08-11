import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { SUIT_SYMBOLS, SUITS } from '../../logic/types';
import { Card } from '../Card/Card';
import styles from './FreeCellBoard.module.css';
export const FreeCellBoard = ({ game, cardBackImage, onTapColumn, onTapFreeCell, onTapFoundation, }) => {
    const { columns, freeCells, foundations, selectedSource } = game;
    // ── Free Cell slots ───────────────────────────────────────
    const renderFreeCells = () => freeCells.map((card, idx) => {
        const isSelected = selectedSource?.type === 'freecell' && selectedSource.cellIndex === idx;
        return (_jsx("div", { className: `${styles.cellSlot} ${isSelected ? styles.selected : ''}`, onClick: () => onTapFreeCell(idx), children: card ? _jsx(Card, { card: card, cardBackImage: cardBackImage }) : null }, `fc-${idx}`));
    });
    // ── Foundation slots ──────────────────────────────────────
    const renderFoundations = () => foundations.map((pile, idx) => {
        const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
        return (_jsx("div", { className: `${styles.foundSlot} ${!topCard ? '' : ''}`, onClick: () => onTapFoundation(idx), children: topCard ? (_jsx(Card, { card: topCard, cardBackImage: cardBackImage })) : (_jsx("span", { className: styles.foundIcon, children: SUIT_SYMBOLS[SUITS[idx]] })) }, `fd-${idx}`));
    });
    // ── Tableau columns ───────────────────────────────────────
    const handleColumnTap = useCallback((colIndex, cardIndex) => {
        onTapColumn(colIndex, cardIndex);
    }, [onTapColumn]);
    const renderColumns = () => columns.map((col, colIdx) => {
        if (col.length === 0) {
            return (_jsx("div", { className: styles.columnEmpty, onClick: () => handleColumnTap(colIdx, 0) }, `col-${colIdx}`));
        }
        // Determine selected card range in this column
        let selStart = -1;
        if (selectedSource?.type === 'column' &&
            selectedSource.colIndex === colIdx) {
            selStart = selectedSource.cardIndex;
        }
        const colLen = col.length;
        return (_jsx("div", { className: styles.column, style: { height: `calc(var(--card-height) + ${colLen - 1} * var(--fan-offset-down))` }, children: col.map((card, cardIdx) => {
                const isInSelection = selStart >= 0 && cardIdx >= selStart;
                return (_jsx("div", { className: `${styles.columnCard} ${isInSelection ? styles.selectedCard : ''}`, style: { top: `calc(${cardIdx} * var(--fan-offset-down))` }, onClick: (e) => {
                        e.stopPropagation();
                        handleColumnTap(colIdx, cardIdx);
                    }, children: _jsx(Card, { card: card, cardBackImage: cardBackImage }) }, card.id));
            }) }, `col-${colIdx}`));
    });
    return (_jsxs("div", { className: styles.board, children: [_jsxs("div", { className: styles.movesBadge, children: [_jsx("span", { className: styles.movesCount, children: game.moves }), " moves"] }), _jsxs("div", { className: styles.topRow, children: [_jsx("div", { className: styles.cellGroup, children: renderFreeCells() }), _jsx("div", { className: styles.spacer }), _jsx("div", { className: styles.cellGroup, children: renderFoundations() })] }), _jsx("div", { className: styles.tableau, children: renderColumns() })] }));
};

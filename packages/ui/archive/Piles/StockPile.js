import { jsx as _jsx } from "react/jsx-runtime";
import { Card } from '../Card/Card';
import styles from './Piles.module.css';
export const StockPile = ({ stock, onDraw, cardBackImage }) => {
    if (stock.length === 0) {
        return (_jsx("div", { className: styles.refreshIcon, onClick: onDraw, role: "button", "aria-label": "Recycle waste pile", tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && onDraw(), children: "\u21BB" }));
    }
    return (_jsx("div", { className: styles.stockPile, children: _jsx(Card, { card: { ...stock[stock.length - 1], faceUp: false }, onClick: onDraw, cardBackImage: cardBackImage }) }));
};

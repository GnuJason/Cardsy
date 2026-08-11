import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal } from '../Modal/Modal';
import styles from '../WinModal/WinModal.module.css';
export const NoMovesModal = ({ onUndo, onNewGame, canUndo, }) => {
    return (_jsxs(Modal, { onClose: canUndo ? onUndo : onNewGame, ariaLabel: "No moves available", children: [_jsx("h2", { className: styles.title, children: "No Moves Available" }), _jsx("p", { className: styles.message, children: "There are no more moves you can make. Would you like to undo or start a new game?" }), _jsxs("div", { className: styles.buttons, children: [canUndo && (_jsx("button", { className: styles.secondaryBtn, onClick: onUndo, children: "\u21A9 Undo" })), _jsx("button", { className: styles.primaryBtn, onClick: onNewGame, children: "New Game" })] })] }));
};

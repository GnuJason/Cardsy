import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal } from '../Modal/Modal';
import styles from './ConfirmModal.module.css';
export const ConfirmModal = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, }) => {
    return (_jsxs(Modal, { onClose: onCancel, ariaLabel: title, children: [_jsx("h2", { className: styles.title, children: title }), _jsx("p", { className: styles.message, children: message }), _jsxs("div", { className: styles.buttons, children: [_jsx("button", { className: styles.cancelBtn, onClick: onCancel, children: cancelLabel }), _jsx("button", { className: styles.confirmBtn, onClick: onConfirm, children: confirmLabel })] })] }));
};

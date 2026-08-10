import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import styles from './NoticeToast.module.css';
export const NoticeToast = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3600);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    return (_jsxs("div", { className: styles.toast, role: "status", "aria-live": "polite", children: [_jsx("span", { className: styles.label, children: "Card Backs" }), _jsx("span", { className: styles.message, children: message })] }));
};

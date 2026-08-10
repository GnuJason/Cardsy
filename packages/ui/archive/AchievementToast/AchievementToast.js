import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import styles from './AchievementToast.module.css';
export const AchievementToast = ({ toast, onDismiss, }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    return (_jsxs("div", { className: styles.toast, children: [_jsx("span", { className: styles.icon, children: toast.icon }), _jsxs("div", { className: styles.text, children: [_jsx("span", { className: styles.label, children: "Achievement Unlocked!" }), _jsxs("span", { className: styles.name, children: [toast.name, toast.tier ? ` (${toast.tier})` : ''] })] })] }));
};

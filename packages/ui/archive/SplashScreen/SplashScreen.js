import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './SplashScreen.module.css';
export const SplashScreen = ({ onStart }) => {
    return (_jsx("div", { className: styles.overlay, children: _jsxs("div", { className: styles.content, children: [_jsx("div", { className: styles.cake, children: "\uD83C\uDF82" }), _jsx("h1", { className: styles.title, children: "Happy Birthday, Mom!" }), _jsxs("p", { className: styles.message, children: ["I made this game just for you.", _jsx("br", {}), "Love, Jason."] }), _jsx("button", { className: styles.startBtn, onClick: onStart, children: "Start Playing \u2660" }), _jsx("div", { className: styles.hearts, children: "\u2665 \u2666 \u2663 \u2660" })] }) }));
};

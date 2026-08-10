import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { setSpiderDifficulty } from '../../services/storage';
import styles from './ModeSelector.module.css';
export const ModeSelector = ({ onSelect, savedKlondike, savedTriPeaks, savedGolf, savedPyramid, savedFreeCell, savedSpider, onContinue: _onContinue, }) => {
    const [showSpiderDifficulty, setShowSpiderDifficulty] = useState(false);
    const pickSpiderDifficulty = (d) => {
        setSpiderDifficulty(d);
        onSelect('spider');
    };
    return (_jsx("div", { className: styles.overlay, children: _jsxs("div", { className: styles.content, children: [_jsx("h1", { className: styles.title, children: "Choose Your Game" }), _jsxs("div", { className: styles.modes, children: [_jsxs("button", { className: styles.modeBtn, onClick: () => onSelect('klondike'), children: [_jsx("span", { className: styles.modeIcon, children: "\uD83C\uDCCF" }), _jsx("span", { className: styles.modeName, children: "Klondike" }), _jsx("span", { className: styles.modeDesc, children: savedKlondike
                                        ? `Continue — Score ${savedKlondike.state.score}`
                                        : 'Classic Solitaire' })] }), _jsxs("button", { className: styles.modeBtn, onClick: () => onSelect('tripeaks'), children: [_jsx("span", { className: styles.modeIcon, children: "\u26F0\uFE0F" }), _jsx("span", { className: styles.modeName, children: "TriPeaks" }), _jsx("span", { className: styles.modeDesc, children: savedTriPeaks
                                        ? `Continue — ${savedTriPeaks.state.peaksCleared.filter(Boolean).length}/3 peaks cleared`
                                        : 'Clear the Peaks' })] }), _jsxs("button", { className: styles.modeBtn, onClick: () => onSelect('golf'), children: [_jsx("span", { className: styles.modeIcon, children: "\u26F3" }), _jsx("span", { className: styles.modeName, children: "Golf" }), _jsx("span", { className: styles.modeDesc, children: savedGolf
                                        ? `Continue — ${savedGolf.state.cardsRemaining} cards left`
                                        : 'Clear the Course' })] }), _jsxs("button", { className: styles.modeBtn, onClick: () => onSelect('pyramid'), children: [_jsx("span", { className: styles.modeIcon, children: "\uD83C\uDFDB\uFE0F" }), _jsx("span", { className: styles.modeName, children: "Pyramid" }), _jsx("span", { className: styles.modeDesc, children: savedPyramid
                                        ? `Continue — ${savedPyramid.state.cardsRemaining} cards left`
                                        : 'Match & Clear' })] }), _jsxs("button", { className: styles.modeBtn, onClick: () => onSelect('freecell'), children: [_jsx("span", { className: styles.modeIcon, children: "\uD83C\uDFD7\uFE0F" }), _jsx("span", { className: styles.modeName, children: "FreeCell" }), _jsx("span", { className: styles.modeDesc, children: savedFreeCell
                                        ? `Continue — ${savedFreeCell.state.moves} moves`
                                        : 'Strategic Stacking' })] }), showSpiderDifficulty ? (_jsxs("div", { className: styles.modeBtn, children: [_jsx("span", { className: styles.modeIcon, children: "\uD83D\uDD77\uFE0F" }), _jsx("span", { className: styles.modeName, children: "Spider" }), _jsxs("div", { className: styles.difficultyPicker, children: [_jsx("button", { className: styles.difficultyBtn, onClick: () => pickSpiderDifficulty(1), children: "1 Suit \u2014 Easy" }), _jsx("button", { className: styles.difficultyBtn, onClick: () => pickSpiderDifficulty(2), children: "2 Suits \u2014 Medium" }), _jsx("button", { className: styles.difficultyBtn, onClick: () => pickSpiderDifficulty(4), children: "4 Suits \u2014 Hard" })] })] })) : (_jsxs("button", { className: styles.modeBtn, onClick: () => setShowSpiderDifficulty(true), children: [_jsx("span", { className: styles.modeIcon, children: "\uD83D\uDD77\uFE0F" }), _jsx("span", { className: styles.modeName, children: "Spider" }), _jsx("span", { className: styles.modeDesc, children: savedSpider
                                        ? `Continue — ${savedSpider.state.completedRuns}/8 runs`
                                        : 'Build 8 suited runs' })] }))] })] }) }));
};

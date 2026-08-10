import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { mapTapToEvent } from './interaction/EventMapping';
export const KeyboardOverlay = ({ layout, mode, onGameEvent, }) => {
    return (_jsxs("div", { style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
        }, role: "application", "aria-label": "Solitaire game board \u2014 use Tab to navigate piles", children: [layout.piles.map((pile) => {
                const event = mapTapToEvent(mode, pile.pileType, pile.pileIndex, 0);
                if (!event)
                    return null;
                return (_jsx("button", { role: "button", tabIndex: 0, "aria-label": `${pile.pileType} pile ${pile.pileIndex + 1}`, style: {
                        position: 'absolute',
                        left: pile.x,
                        top: pile.y,
                        width: pile.dropWidth,
                        height: pile.dropHeight,
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        pointerEvents: 'none',
                        outline: 'none',
                    }, onFocus: (focusEvent) => {
                        focusEvent.currentTarget.style.outline = '3px solid #ffd700';
                    }, onBlur: (focusEvent) => {
                        focusEvent.currentTarget.style.outline = 'none';
                    }, onKeyDown: (keyboardEvent) => {
                        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                            keyboardEvent.preventDefault();
                            onGameEvent(event);
                        }
                    }, onClick: () => onGameEvent(event) }, `${pile.pileType}-${pile.pileIndex}`));
            }), _jsx("div", { role: "status", "aria-live": "polite", "aria-atomic": "true", style: {
                    position: 'absolute',
                    left: -9999,
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                } })] }));
};

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CARD_BACKS } from '../config/cardBacks';
import { updateCardBackSettings, useCardBackSettings } from '../state/settings';
function DefaultPreview({ back }) {
    return _jsx("span", { className: `settings-default-preview kl-back--${back.id}`, children: _jsx("span", { className: "kl-back-inner" }) });
}
export function SettingsScreen({ onBack }) {
    const settings = useCardBackSettings();
    const chooseCustom = (back) => {
        updateCardBackSettings({ useCustomBacks: true, selectedCustomBack: back.id });
    };
    const chooseDefault = (back) => {
        updateCardBackSettings({ useCustomBacks: false, selectedDefaultBack: back.id });
    };
    const visibleBacks = settings.useCustomBacks ? CARD_BACKS.custom : CARD_BACKS.default;
    return (_jsxs("main", { className: "settings-screen", children: [_jsxs("header", { className: "settings-header", children: [_jsxs("button", { type: "button", className: "kl-btn", onClick: onBack, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("path", { d: "m15 18-6-6 6-6" }) }), "Back to game"] }), _jsxs("div", { children: [_jsx("h1", { children: "Card Back Gallery" }), _jsx("p", { children: "Choose a familiar face for every hidden card." })] })] }), _jsxs("section", { className: "settings-panel", "aria-labelledby": "custom-backs-title", children: [_jsxs("div", { className: "settings-toggle-row", children: [_jsxs("div", { children: [_jsx("h2", { id: "custom-backs-title", children: "Use family photos" }), _jsx("p", { children: "Turn on a personal photo back, or return to the heirloom patterns." })] }), _jsx("button", { type: "button", className: `settings-toggle${settings.useCustomBacks ? ' settings-toggle--on' : ''}`, role: "switch", "aria-checked": settings.useCustomBacks, onClick: () => updateCardBackSettings({ useCustomBacks: !settings.useCustomBacks }), children: _jsx("span", {}) })] }), settings.useCustomBacks && (_jsxs("div", { className: "settings-mode", role: "radiogroup", "aria-labelledby": "card-back-mode-title", children: [_jsx("span", { id: "card-back-mode-title", className: "settings-mode-label", children: "Card back mode" }), _jsx("button", { type: "button", role: "radio", "aria-checked": settings.cardBackMode === 'single', className: `settings-mode-option${settings.cardBackMode === 'single' ? ' settings-mode-option--selected' : ''}`, onClick: () => updateCardBackSettings({ cardBackMode: 'single' }), children: "Use one selected photo" }), _jsx("button", { type: "button", role: "radio", "aria-checked": settings.cardBackMode === 'random', className: `settings-mode-option${settings.cardBackMode === 'random' ? ' settings-mode-option--selected' : ''}`, onClick: () => updateCardBackSettings({ cardBackMode: 'random' }), children: "Use random photo for each card" })] })), settings.useCustomBacks && settings.cardBackMode === 'random' ? (_jsx("p", { className: "settings-random-note", children: "Each card will use a random photo from your collection." })) : (_jsx("div", { className: "settings-gallery", "aria-label": settings.useCustomBacks ? 'Family photo card backs' : 'Premium card backs', children: visibleBacks.map((back) => {
                            const selected = settings.useCustomBacks
                                ? settings.selectedCustomBack === back.id
                                : settings.selectedDefaultBack === back.id;
                            return (_jsxs("button", { type: "button", className: `settings-back${selected ? ' settings-back--selected' : ''}`, "aria-pressed": selected, onClick: () => settings.useCustomBacks ? chooseCustom(back) : chooseDefault(back), children: [back.type === 'custom' ? (_jsx("img", { src: back.url, alt: "", className: "settings-photo-preview" })) : (_jsx(DefaultPreview, { back: back })), _jsx("span", { children: back.label })] }, back.id));
                        }) }))] })] }));
}

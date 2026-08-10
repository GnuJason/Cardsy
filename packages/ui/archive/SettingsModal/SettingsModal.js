import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef, useCallback } from 'react';
import { THEMES } from '../../config/themes';
import { Modal } from '../Modal/Modal';
import { getAllCustomBacks, saveCustomBack, deleteCustomBack, createBackBlobUrl, } from '../../services/customBacks';
import { getFamilyDeckCount } from '../../services/familyDeck';
import { FamilyDeckBuilder } from '../FamilyDeckBuilder/FamilyDeckBuilder';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import styles from './SettingsModal.module.css';
export const SettingsModal = ({ settings, onUpdate, onClose, onFamilyDeckChange, }) => {
    useEffect(() => {
        if (settings.highContrast)
            return;
        const contrastQuery = window.matchMedia('(prefers-contrast: more)');
        if (contrastQuery.matches) {
            onUpdate({ ...settings, highContrast: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // ── Custom card backs ───────────────────────────────────
    const [customBacks, setCustomBacks] = useState([]);
    const [blobUrls, setBlobUrls] = useState({});
    const fileInputRef = useRef(null);
    const [showDeckBuilder, setShowDeckBuilder] = useState(false);
    const [familyDeckCount, setFamilyDeckCount] = useState(0);
    useEffect(() => {
        let cancelled = false;
        getAllCustomBacks().then((backs) => {
            if (cancelled)
                return;
            setCustomBacks(backs);
            const urls = {};
            for (const b of backs) {
                urls[b.id] = createBackBlobUrl(b);
            }
            setBlobUrls(urls);
        });
        getFamilyDeckCount().then((count) => {
            if (!cancelled)
                setFamilyDeckCount(count);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    // Revoke blob URLs on unmount
    useEffect(() => {
        return () => {
            Object.values(blobUrls).forEach((url) => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Validate type
        if (!file.type.startsWith('image/'))
            return;
        // Limit to 5 MB
        if (file.size > 5 * 1024 * 1024)
            return;
        const id = crypto.randomUUID();
        const back = {
            id,
            blob: file,
            name: file.name,
            createdAt: Date.now(),
        };
        await saveCustomBack(back);
        const url = createBackBlobUrl(back);
        setCustomBacks((prev) => [...prev, back]);
        setBlobUrls((prev) => ({ ...prev, [id]: url }));
        onUpdate({ ...settings, cardBack: `custom:${id}` });
        // Reset input so the same file can be re-selected
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    }, [settings, onUpdate]);
    const handleDeleteCustomBack = useCallback(async (id) => {
        await deleteCustomBack(id);
        setCustomBacks((prev) => prev.filter((b) => b.id !== id));
        setBlobUrls((prev) => {
            const next = { ...prev };
            if (next[id]) {
                URL.revokeObjectURL(next[id]);
                delete next[id];
            }
            return next;
        });
        // If this was the active back, reset to default
        if (settings.cardBack === `custom:${id}`) {
            onUpdate({ ...settings, cardBack: 'default.png' });
        }
    }, [settings, onUpdate]);
    // ── PWA install prompt ──────────────────────────────────
    const { installState, promptInstall } = useInstallPrompt();
    // ── Clear app cache ─────────────────────────────────────
    const handleClearCache = useCallback(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const onMessage = (e) => {
                if (e.data?.type === 'CACHES_CLEARED') {
                    navigator.serviceWorker.removeEventListener('message', onMessage);
                    window.location.reload();
                }
            };
            navigator.serviceWorker.addEventListener('message', onMessage);
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
        }
        else {
            // No SW controller — clear caches directly and unregister any SW
            const clearAndReload = async () => {
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map((r) => r.unregister()));
                }
                window.location.reload();
            };
            clearAndReload();
        }
    }, []);
    const cardSizes = [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'xlarge', label: 'Extra Large' },
    ];
    return (_jsxs(_Fragment, { children: [_jsxs(Modal, { onClose: onClose, ariaLabel: "Settings", children: [_jsx("h2", { className: styles.title, children: "Settings" }), _jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.label, children: "Card Size" }), _jsx("div", { className: styles.options, children: cardSizes.map((size) => (_jsx("button", { className: settings.cardScale === size.value
                                        ? styles.optionBtnActive
                                        : styles.optionBtn, onClick: () => onUpdate({ ...settings, cardScale: size.value }), children: size.label }, size.value))) })] }), _jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.label, children: "Draw Mode (Klondike)" }), _jsxs("div", { className: styles.options, children: [_jsx("button", { className: settings.drawCount === 1
                                            ? styles.optionBtnActive
                                            : styles.optionBtn, onClick: () => onUpdate({ ...settings, drawCount: 1 }), children: "Draw 1" }), _jsx("button", { className: settings.drawCount === 3
                                            ? styles.optionBtnActive
                                            : styles.optionBtn, onClick: () => onUpdate({ ...settings, drawCount: 3 }), children: "Draw 3" })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.label, children: "Theme" }), _jsx("div", { className: styles.themeGrid, children: THEMES.map((theme) => (_jsxs("button", { className: settings.theme === theme.id
                                        ? styles.themeSwatchActive
                                        : styles.themeSwatch, onClick: () => onUpdate({ ...settings, theme: theme.id }), "aria-label": theme.name, title: theme.name, children: [_jsx("span", { className: styles.swatchColor, style: { backgroundColor: theme.swatch } }), _jsx("span", { className: styles.swatchName, children: theme.name })] }, theme.id))) })] }), _jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.label, children: "Card Back" }), _jsxs("div", { className: styles.backPreviewGrid, children: [_jsx("button", { className: settings.cardBack === 'default.png'
                                            ? styles.backPreviewActive
                                            : styles.backPreviewDefault, onClick: () => onUpdate({ ...settings, cardBack: 'default.png' }), "aria-label": "Family photos (default)", title: "Family photos", children: "Family Photos" }), customBacks.map((back) => (_jsxs("button", { className: settings.cardBack === `custom:${back.id}`
                                            ? styles.backPreviewActive
                                            : styles.backPreview, onClick: () => onUpdate({ ...settings, cardBack: `custom:${back.id}` }), "aria-label": `Custom back: ${back.name}`, title: back.name, children: [blobUrls[back.id] && (_jsx("img", { src: blobUrls[back.id], alt: back.name, className: styles.backPreviewImg })), _jsx("button", { className: styles.backDeleteBtn, onClick: (e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCustomBack(back.id);
                                                }, "aria-label": `Delete ${back.name}`, title: "Delete", children: "\u00D7" })] }, back.id)))] }), _jsxs("label", { className: styles.uploadBtn, children: ["+ Upload Image", _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleUpload, style: { display: 'none' } })] }), settings.cardBack === 'default.png' && (_jsxs("button", { className: styles.editDeckBtn, onClick: () => setShowDeckBuilder(true), "aria-label": "Edit Family Deck", children: ["\uD83D\uDDBC Edit Family Deck", familyDeckCount > 0 && (_jsxs("span", { className: styles.deckCount, children: [familyDeckCount, "/52"] }))] }))] }), _jsx("div", { className: styles.section, children: _jsxs("div", { className: styles.toggle, children: [_jsx("span", { className: styles.toggleLabel, children: "Sound effects" }), _jsx("button", { className: settings.soundEnabled
                                        ? styles.toggleSwitchOn
                                        : styles.toggleSwitch, onClick: () => onUpdate({
                                        ...settings,
                                        soundEnabled: !settings.soundEnabled,
                                    }), "aria-label": "Toggle sound effects", children: _jsx("div", { className: settings.soundEnabled
                                            ? styles.toggleKnobOn
                                            : styles.toggleKnob }) })] }) }), _jsx("div", { className: styles.section, children: _jsxs("div", { className: styles.toggle, children: [_jsx("span", { className: styles.toggleLabel, children: "Reduce animations" }), _jsx("button", { className: settings.reducedMotion
                                        ? styles.toggleSwitchOn
                                        : styles.toggleSwitch, onClick: () => onUpdate({
                                        ...settings,
                                        reducedMotion: !settings.reducedMotion,
                                    }), "aria-label": "Toggle reduced motion", children: _jsx("div", { className: settings.reducedMotion
                                            ? styles.toggleKnobOn
                                            : styles.toggleKnob }) })] }) }), _jsx("div", { className: styles.section, children: _jsxs("div", { className: styles.toggle, children: [_jsx("span", { className: styles.toggleLabel, children: "High contrast mode" }), _jsx("button", { className: settings.highContrast
                                        ? styles.toggleSwitchOn
                                        : styles.toggleSwitch, onClick: () => onUpdate({
                                        ...settings,
                                        highContrast: !settings.highContrast,
                                    }), "aria-label": "Toggle high contrast", children: _jsx("div", { className: settings.highContrast
                                            ? styles.toggleKnobOn
                                            : styles.toggleKnob }) })] }) }), installState === 'available' && (_jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.label, children: "Download GrandmaGames" }), _jsx("button", { className: styles.installBtn, onClick: promptInstall, "aria-label": "Install GrandmaGames", children: "\uD83D\uDCF2 Install GrandmaGames" })] })), installState === 'ios-safari' && (_jsxs("div", { className: styles.section, children: [_jsx("div", { className: styles.label, children: "Download GrandmaGames" }), _jsxs("div", { className: styles.iosInstallHint, children: ["To install, tap", ' ', _jsx("span", { "aria-label": "Share", role: "img", children: "\u2B06" }), ' ', "then ", _jsx("strong", { children: "Add to Home Screen" }), "."] })] })), installState === 'installed' && (_jsx("div", { className: styles.section, children: _jsx("div", { className: styles.iosInstallHint, children: "\u2705 App installed" }) })), _jsx("div", { className: styles.section, children: _jsx("button", { className: styles.clearCacheBtn, onClick: handleClearCache, "aria-label": "Clear app cache", children: "\uD83D\uDDD1 Clear App Cache" }) }), _jsx("button", { className: styles.closeBtn, onClick: onClose, children: "Done" })] }), showDeckBuilder && (_jsx(FamilyDeckBuilder, { onClose: () => {
                    setShowDeckBuilder(false);
                    // Refresh count after editing
                    getFamilyDeckCount().then(setFamilyDeckCount);
                    // Notify parent to reload the overlay
                    onFamilyDeckChange?.();
                } }))] }));
};

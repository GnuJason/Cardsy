import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef, useCallback } from 'react';
import { Modal } from '../Modal/Modal';
import { loadFamilyDeck, saveFamilyDeckCard, deleteFamilyDeckCard, clearFamilyDeck, createFamilyDeckBlobUrl, } from '../../services/familyDeck';
import { SUITS, RANKS, SUIT_SYMBOLS, RANK_LABELS } from '../../logic/types';
import styles from './FamilyDeckBuilder.module.css';
function cardSlotId(suit, rank) {
    return `${suit}-${rank}`;
}
export const FamilyDeckBuilder = ({ onClose }) => {
    const [deck, setDeck] = useState(new Map());
    const [blobUrls, setBlobUrls] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const activeSlotRef = useRef(null);
    // Load deck from IndexedDB on mount
    useEffect(() => {
        let cancelled = false;
        loadFamilyDeck().then((cards) => {
            if (cancelled)
                return;
            const map = new Map();
            const urls = new Map();
            for (const c of cards) {
                map.set(c.id, c);
                urls.set(c.id, createFamilyDeckBlobUrl(c));
            }
            setDeck(map);
            setBlobUrls(urls);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);
    // Revoke blob URLs on unmount
    useEffect(() => {
        return () => {
            blobUrls.forEach((url) => URL.revokeObjectURL(url));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleSlotClick = useCallback((slotId) => {
        activeSlotRef.current = slotId;
        fileInputRef.current?.click();
    }, []);
    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        const slotId = activeSlotRef.current;
        if (!file || !slotId)
            return;
        // Validate type
        if (!file.type.startsWith('image/'))
            return;
        // Limit to 5 MB
        if (file.size > 5 * 1024 * 1024)
            return;
        const card = {
            id: slotId,
            blob: file,
            name: file.name,
            updatedAt: Date.now(),
        };
        await saveFamilyDeckCard(card);
        const url = createFamilyDeckBlobUrl(card);
        setDeck((prev) => {
            const next = new Map(prev);
            next.set(slotId, card);
            return next;
        });
        setBlobUrls((prev) => {
            const next = new Map(prev);
            // Revoke old URL if any
            const oldUrl = prev.get(slotId);
            if (oldUrl)
                URL.revokeObjectURL(oldUrl);
            next.set(slotId, url);
            return next;
        });
        // Reset input so the same file can be re-selected
        if (fileInputRef.current)
            fileInputRef.current.value = '';
        activeSlotRef.current = null;
    }, []);
    const handleRemove = useCallback(async (slotId) => {
        await deleteFamilyDeckCard(slotId);
        setDeck((prev) => {
            const next = new Map(prev);
            next.delete(slotId);
            return next;
        });
        setBlobUrls((prev) => {
            const next = new Map(prev);
            const url = prev.get(slotId);
            if (url)
                URL.revokeObjectURL(url);
            next.delete(slotId);
            return next;
        });
    }, []);
    const handleClearAll = useCallback(async () => {
        await clearFamilyDeck();
        blobUrls.forEach((url) => URL.revokeObjectURL(url));
        setDeck(new Map());
        setBlobUrls(new Map());
    }, [blobUrls]);
    const filledCount = deck.size;
    return (_jsxs(Modal, { onClose: onClose, ariaLabel: "Family Deck Builder", children: [_jsx("h2", { className: styles.title, children: "Family Deck Builder" }), _jsxs("p", { className: styles.subtitle, children: [filledCount, "/52 cards customized"] }), loading ? (_jsx("div", { className: styles.loading, children: "Loading deck..." })) : (_jsxs(_Fragment, { children: [SUITS.map((suit) => (_jsxs("div", { className: styles.suitSection, children: [_jsxs("div", { className: styles.suitHeader, children: [_jsx("span", { className: suit === 'hearts' || suit === 'diamonds' ? styles.suitSymbolRed : styles.suitSymbolBlack, children: SUIT_SYMBOLS[suit] }), ' ', suit.charAt(0).toUpperCase() + suit.slice(1)] }), _jsx("div", { className: styles.cardGrid, children: RANKS.map((rank) => {
                                    const slotId = cardSlotId(suit, rank);
                                    const url = blobUrls.get(slotId);
                                    const hasImage = deck.has(slotId);
                                    return (_jsxs("div", { className: styles.slot, children: [_jsx("button", { className: hasImage ? styles.slotBtnFilled : styles.slotBtn, onClick: () => handleSlotClick(slotId), "aria-label": `${RANK_LABELS[rank]} of ${suit}${hasImage ? ' — tap to replace' : ' — tap to upload'}`, title: `${RANK_LABELS[rank]} of ${suit}`, children: url ? (_jsx("img", { src: url, alt: `${RANK_LABELS[rank]} of ${suit}`, className: styles.slotImg, draggable: false })) : (_jsx("span", { className: styles.slotPlaceholder, children: "+" })) }), _jsx("span", { className: styles.slotLabel, children: RANK_LABELS[rank] }), hasImage && (_jsx("button", { className: styles.removeBtn, onClick: () => handleRemove(slotId), "aria-label": `Remove ${RANK_LABELS[rank]} of ${suit}`, title: "Remove", children: "\u00D7" }))] }, slotId));
                                }) })] }, suit))), filledCount > 0 && (_jsx("button", { className: styles.clearAllBtn, onClick: handleClearAll, children: "Clear All Photos" }))] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileChange, style: { display: 'none' } }), _jsx("button", { className: styles.doneBtn, onClick: onClose, children: "Done" })] }));
};

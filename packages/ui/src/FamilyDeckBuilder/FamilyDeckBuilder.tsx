import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Modal } from '../Modal/Modal';
import {
  loadFamilyDeck,
  saveFamilyDeckCard,
  deleteFamilyDeckCard,
  clearFamilyDeck,
  createFamilyDeckBlobUrl,
  type FamilyDeckCard,
} from '../../services/familyDeck';
import { SUITS, RANKS, SUIT_SYMBOLS, RANK_LABELS } from '../../logic/types';
import type { Suit, Rank } from '../../logic/types';
import styles from './FamilyDeckBuilder.module.css';

interface FamilyDeckBuilderProps {
  onClose: () => void;
}

function cardSlotId(suit: Suit, rank: Rank): string {
  return `${suit}-${rank}`;
}

export const FamilyDeckBuilder: React.FC<FamilyDeckBuilderProps> = ({ onClose }) => {
  const [deck, setDeck] = useState<Map<string, FamilyDeckCard>>(new Map());
  const [blobUrls, setBlobUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<string | null>(null);

  // Load deck from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    loadFamilyDeck().then((cards) => {
      if (cancelled) return;
      const map = new Map<string, FamilyDeckCard>();
      const urls = new Map<string, string>();
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

  const handleSlotClick = useCallback((slotId: string) => {
    activeSlotRef.current = slotId;
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slotId = activeSlotRef.current;
    if (!file || !slotId) return;

    // Validate type
    if (!file.type.startsWith('image/')) return;
    // Limit to 5 MB
    if (file.size > 5 * 1024 * 1024) return;

    const card: FamilyDeckCard = {
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
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      next.set(slotId, url);
      return next;
    });

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
    activeSlotRef.current = null;
  }, []);

  const handleRemove = useCallback(async (slotId: string) => {
    await deleteFamilyDeckCard(slotId);
    setDeck((prev) => {
      const next = new Map(prev);
      next.delete(slotId);
      return next;
    });
    setBlobUrls((prev) => {
      const next = new Map(prev);
      const url = prev.get(slotId);
      if (url) URL.revokeObjectURL(url);
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

  return (
    <Modal onClose={onClose} ariaLabel="Family Deck Builder">
      <h2 className={styles.title}>Family Deck Builder</h2>
      <p className={styles.subtitle}>
        {filledCount}/52 cards customized
      </p>

      {loading ? (
        <div className={styles.loading}>Loading deck...</div>
      ) : (
        <>
          {SUITS.map((suit) => (
            <div key={suit} className={styles.suitSection}>
              <div className={styles.suitHeader}>
                <span className={suit === 'hearts' || suit === 'diamonds' ? styles.suitSymbolRed : styles.suitSymbolBlack}>
                  {SUIT_SYMBOLS[suit]}
                </span>
                {' '}
                {suit.charAt(0).toUpperCase() + suit.slice(1)}
              </div>
              <div className={styles.cardGrid}>
                {RANKS.map((rank) => {
                  const slotId = cardSlotId(suit, rank);
                  const url = blobUrls.get(slotId);
                  const hasImage = deck.has(slotId);

                  return (
                    <div key={slotId} className={styles.slot}>
                      <button
                        className={hasImage ? styles.slotBtnFilled : styles.slotBtn}
                        onClick={() => handleSlotClick(slotId)}
                        aria-label={`${RANK_LABELS[rank]} of ${suit}${hasImage ? ' — tap to replace' : ' — tap to upload'}`}
                        title={`${RANK_LABELS[rank]} of ${suit}`}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={`${RANK_LABELS[rank]} of ${suit}`}
                            className={styles.slotImg}
                            draggable={false}
                          />
                        ) : (
                          <span className={styles.slotPlaceholder}>+</span>
                        )}
                      </button>
                      <span className={styles.slotLabel}>{RANK_LABELS[rank]}</span>
                      {hasImage && (
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemove(slotId)}
                          aria-label={`Remove ${RANK_LABELS[rank]} of ${suit}`}
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filledCount > 0 && (
            <button
              className={styles.clearAllBtn}
              onClick={handleClearAll}
            >
              Clear All Photos
            </button>
          )}
        </>
      )}

      {/* Hidden file input shared by all slots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button className={styles.doneBtn} onClick={onClose}>
        Done
      </button>
    </Modal>
  );
};

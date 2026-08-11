/**
 * IndexedDB storage for the per-card "family deck" — up to 52 custom card-back images.
 * Each card slot (e.g. "hearts-1") can hold one user-uploaded photo.
 * All data stays on-device — no network calls are made.
 */

const DB_NAME = 'grandmagame-family-deck';
const DB_VERSION = 1;
const STORE_NAME = 'cards';

export interface FamilyDeckCard {
  /** Card slot id, e.g. "hearts-1" */
  id: string;
  blob: Blob;
  name: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Load the entire family deck from IndexedDB. */
export async function loadFamilyDeck(): Promise<FamilyDeckCard[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

/** Get a single card's family deck entry. */
export async function getFamilyDeckCard(id: string): Promise<FamilyDeckCard | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ?? undefined);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return undefined;
  }
}

/** Save (upsert) a single card's family deck image. */
export async function saveFamilyDeckCard(card: FamilyDeckCard): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(card);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    // Silently fail — app works without custom deck
  }
}

/** Remove a single card's family deck image. */
export async function deleteFamilyDeckCard(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    // Silently fail
  }
}

/** Clear the entire family deck. */
export async function clearFamilyDeck(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    // Silently fail
  }
}

/** Check how many cards have been assigned in the family deck. */
export async function getFamilyDeckCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return 0;
  }
}

/** Create a blob URL from a FamilyDeckCard. Caller must revoke via URL.revokeObjectURL(). */
export function createFamilyDeckBlobUrl(card: FamilyDeckCard): string {
  return URL.createObjectURL(card.blob);
}

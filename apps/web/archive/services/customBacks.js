/**
 * IndexedDB storage for user-uploaded custom card backs.
 * All data stays on-device — no network calls are made.
 */
const DB_NAME = 'grandmagame-card-backs';
const DB_VERSION = 1;
const STORE_NAME = 'backs';
function openDB() {
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
export async function getAllCustomBacks() {
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
    }
    catch {
        return [];
    }
}
export async function getCustomBack(id) {
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
    }
    catch {
        return undefined;
    }
}
export async function saveCustomBack(back) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(back);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }
    catch {
        // Silently fail — app works without custom backs
    }
}
export async function deleteCustomBack(id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }
    catch {
        // Silently fail
    }
}
export async function deleteAllCustomBacks() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.clear();
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    }
    catch {
        // Silently fail
    }
}
/**
 * Create a blob URL from a CustomCardBack.
 * Caller is responsible for revoking via URL.revokeObjectURL().
 */
export function createBackBlobUrl(back) {
    return URL.createObjectURL(back.blob);
}

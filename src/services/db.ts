/**
 * IndexedDB persistence layer for Bihar SLET 2026 Test Sessions
 * Supports saving, pausing, resuming, and restoring ongoing test attempts.
 */

export interface ActiveTestSession {
  sessionId: string; // e.g. 'subunit_1.1' or 'grand_mock'
  type: 'subunit' | 'grand-mock';
  subUnitNum?: string;
  mode: 'practice' | 'exam';
  currentIdx: number;
  selectedAnswers: Record<number, number>; // qIndex -> optionIndex
  markedForReview: Record<number, boolean>; // qIndex -> boolean
  visitedQuestions: Record<number, boolean>; // qIndex -> boolean
  timeLeft: number; // remaining seconds
  isPaused: boolean;
  totalQuestions: number;
  updatedAt: number;
}

const DB_NAME = 'BiharSLET_IndexedDB_v1';
const DB_VERSION = 1;
const STORE_ACTIVE_SESSIONS = 'active_sessions';
const STORE_ATTEMPTS = 'test_attempts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ACTIVE_SESSIONS)) {
        db.createObjectStore(STORE_ACTIVE_SESSIONS, { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) {
        const attemptStore = db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'id', autoIncrement: true });
        attemptStore.createIndex('sessionId', 'sessionId', { unique: false });
        attemptStore.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or update an active test session in IndexedDB
 */
export async function saveActiveSession(session: ActiveTestSession): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_ACTIVE_SESSIONS);
      const req = store.put({ ...session, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save active session:', err);
  }
}

/**
 * Retrieve an active test session by sessionId
 */
export async function getActiveSession(sessionId: string): Promise<ActiveTestSession | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_ACTIVE_SESSIONS);
      const req = store.get(sessionId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to get active session:', err);
    return null;
  }
}

/**
 * Delete an active session after test submission or explicit reset
 */
export async function clearActiveSession(sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ACTIVE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_ACTIVE_SESSIONS);
      const req = store.delete(sessionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to clear active session:', err);
  }
}

/**
 * Save completed test result to IndexedDB archive
 */
export async function archiveTestAttempt(record: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ATTEMPTS, 'readwrite');
      const store = tx.objectStore(STORE_ATTEMPTS);
      const req = store.add({ ...record, savedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to archive attempt:', err);
  }
}

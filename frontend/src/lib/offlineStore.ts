/**
 * Offline complaint storage using IndexedDB (via idb library).
 * Complaints submitted while offline are stored here and synced later.
 */

import { openDB } from "idb";

const DB_NAME = "roadwatch-offline";
const STORE_NAME = "pending-complaints";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

export async function saveOfflineComplaint(complaint: Record<string, any>): Promise<void> {
  const db = await getDB();
  await db.add(STORE_NAME, { ...complaint, savedAt: new Date().toISOString() });
}

export async function getPendingComplaints(): Promise<any[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearPendingComplaints(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

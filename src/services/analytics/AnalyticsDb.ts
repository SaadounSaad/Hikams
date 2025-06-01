// /home/ubuntu/src/services/analytics/AnalyticsDb.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the structure of the analytics event as stored in IndexedDB
export interface StoredAnalyticsEvent {
  id: string; // Local UUID for queue management
  type: string;
  timestamp: string; // ISO 8601 string
  userId?: string;
  sessionId: string;
  payload: Record<string, any>;
  // Add a sync attempt counter or timestamp if retry logic is needed
  syncAttempts?: number;
}

// Define the database schema using the DBSchema interface
interface AnalyticsDB extends DBSchema {
  analytics_event_queue: {
    key: string; // The 'id' field will be the key
    value: StoredAnalyticsEvent;
    indexes: { 'timestamp': string }; // Index on timestamp
  };
}

const DB_NAME = 'HikamsAnalyticsDB';
const DB_VERSION = 1;
const QUEUE_STORE_NAME = 'analytics_event_queue';

let dbPromise: Promise<IDBPDatabase<AnalyticsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<AnalyticsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AnalyticsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
          const store = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          console.log(`IndexedDB store '${QUEUE_STORE_NAME}' created.`);
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueEvent(event: StoredAnalyticsEvent): Promise<void> {
  try {
    const db = await getDb();
    await db.put(QUEUE_STORE_NAME, event);
    console.log(`Event ${event.id} enqueued.`);
  } catch (error) {
    console.error('Failed to enqueue event:', error);
    // Handle potential storage errors (e.g., quota exceeded)
  }
}

export async function dequeueEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  try {
    const db = await getDb();
    const tx = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    await Promise.all(eventIds.map(id => tx.store.delete(id)));
    await tx.done;
    console.log(`Dequeued ${eventIds.length} events.`);
  } catch (error) {
    console.error('Failed to dequeue events:', error);
  }
}

export async function getQueuedEvents(limit: number): Promise<StoredAnalyticsEvent[]> {
  try {
    const db = await getDb();
    // Get events, potentially ordered by timestamp or attempt count for retry logic
    return await db.getAllFromIndex(QUEUE_STORE_NAME, 'timestamp', undefined, limit);
    // Or simply getAll if order doesn't matter for basic batching:
    // return await db.getAll(QUEUE_STORE_NAME, undefined, limit);
  } catch (error) {
    console.error('Failed to get queued events:', error);
    return [];
  }
}

// Optional: Function to clear old events
export async function clearOldEvents(maxAgeDays: number): Promise<void> {
  try {
    const db = await getDb();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - maxAgeDays);
    const thresholdISO = threshold.toISOString();

    let cursor = await db.transaction(QUEUE_STORE_NAME, 'readwrite')
                         .store.index('timestamp').openCursor(IDBKeyRange.upperBound(thresholdISO));

    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    console.log(`Cleared events older than ${maxAgeDays} days.`);
  } catch (error) {
    console.error('Failed to clear old events:', error);
  }
}


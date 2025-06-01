// /home/ubuntu/src/services/analytics/AnalyticsService.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { enqueueEvent, dequeueEvents, getQueuedEvents, StoredAnalyticsEvent } from "./AnalyticsDb";

// Define the structure of the event payload for Supabase
// Excludes the local 'id' and potentially transforms data
interface SupabaseAnalyticsEvent {
  user_id?: string;
  session_id: string;
  event_type: string;
  client_timestamp: string; // ISO 8601
  payload: Record<string, any>;
}

export class AnalyticsService {
  private supabase: SupabaseClient;
  private userId?: string;
  private sessionId: string;
  private queueStoreName = "analytics_event_queue"; // Matches AnalyticsDb.ts
  private syncIntervalId?: ReturnType<typeof setInterval>;
  private isSyncing = false;
  private syncBatchSize = 50;
  private syncIntervalMs = 60000; // Sync every 60 seconds
  private syncDebounceTimer?: ReturnType<typeof setTimeout>;
  private syncDebounceMs = 5000; // Wait 5s after last event before syncing
  private isOnline = navigator.onLine;
  private syncEnabled = true; // Add logic to control this via settings/user choice

  constructor(supabaseClient: SupabaseClient, initialUserId?: string) {
    this.supabase = supabaseClient;
    this.userId = initialUserId;
    // Generate a new session ID on instantiation
    // More robust logic might involve storing/retrieving from sessionStorage
    this.sessionId = uuidv4();
    console.log(`AnalyticsService initialized. Session ID: ${this.sessionId}`);

    // Listen to online/offline events
    window.addEventListener("online", this.handleOnlineStatusChange);
    window.addEventListener("offline", this.handleOnlineStatusChange);

    // Initial sync attempt if online
    this.triggerSync();
  }

  private handleOnlineStatusChange = () => {
    const nowOnline = navigator.onLine;
    if (nowOnline !== this.isOnline) {
      console.log(`Network status changed: ${this.isOnline ? "Offline" : "Online"}`);
      this.isOnline = nowOnline;
      if (this.isOnline) {
        // Immediately attempt sync when coming back online
        this.triggerSync(true); // Force immediate sync attempt
      }
    }
  };

  setUserId(userId?: string): void {
    if (this.userId !== userId) {
        console.log(`Analytics user ID set to: ${userId ?? "anonymous"}`);
        this.userId = userId;
        // Potentially track a 'user_login' or 'user_logout' event here
    }
  }

  setSyncEnabled(enabled: boolean): void {
    if (this.syncEnabled !== enabled) {
        this.syncEnabled = enabled;
        console.log(`Analytics sync ${enabled ? "enabled" : "disabled"}`);
        if (enabled && this.isOnline) {
            this.triggerSync(true);
        } else if (!enabled && this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
        }
    }
  }

  async trackEvent(type: string, payload: Record<string, any> = {}): Promise<void> {
    const event: StoredAnalyticsEvent = {
      id: uuidv4(), // Generate local UUID
      type: type,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      payload: payload,
    };

    console.log(`Tracking event: ${type}`, event);
    await enqueueEvent(event);

    // Trigger sync, but debounced
    this.triggerSync();
  }

  // Triggers a sync attempt, debounced unless forced
  triggerSync(forceImmediate: boolean = false): void {
    if (!this.syncEnabled) {
        console.log("Sync skipped: Analytics sync is disabled.");
        return;
    }
    if (!this.isOnline) {
        console.log("Sync skipped: App is offline.");
        return;
    }

    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    if (forceImmediate) {
        console.log("Forcing immediate sync attempt.");
        this.syncQueue();
    } else {
        console.log(`Debouncing sync trigger (${this.syncDebounceMs}ms)...`);
        this.syncDebounceTimer = setTimeout(() => {
            console.log("Debounced sync starting.");
            this.syncQueue();
        }, this.syncDebounceMs);
    }
  }

  private async syncQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log("Sync already in progress. Skipping.");
      return;
    }
    if (!this.syncEnabled || !this.isOnline) {
        console.log("Sync conditions not met (disabled or offline). Aborting syncQueue.");
        return;
    }

    this.isSyncing = true;
    console.log("Starting sync cycle...");

    try {
      const batch = await getQueuedEvents(this.syncBatchSize);
      if (batch.length === 0) {
        console.log("Sync queue is empty.");
        this.isSyncing = false;
        return;
      }

      console.log(`Attempting to sync ${batch.length} events...`);

      // Prepare data for Supabase (remove local id, map fields)
      const dataToSend: SupabaseAnalyticsEvent[] = batch.map(({ id, type, timestamp, userId, sessionId, payload }) => ({
        user_id: userId,
        session_id: sessionId,
        event_type: type,
        client_timestamp: timestamp,
        payload: payload,
      }));

      // Send to Supabase
      const { error } = await this.supabase
        .from("user_analytics_events")
        .insert(dataToSend);

      if (error) {
        console.error("Analytics sync error:", error);
        // Basic error handling: Log and retry later. Could implement more complex retry logic.
        // For now, we don't dequeue, so they will be retried next time.
      } else {
        // Success: Dequeue the sent events
        console.log(`Successfully synced ${batch.length} events.`);
        const sentEventIds = batch.map(e => e.id);
        await dequeueEvents(sentEventIds);

        // If we successfully synced a full batch, check immediately for more.
        if (batch.length === this.syncBatchSize) {
          console.log("Batch was full, checking for more events immediately.");
          // Use requestAnimationFrame or setTimeout to avoid blocking event loop and potential stack overflow
          setTimeout(() => this.triggerSync(true), 0);
        }
      }
    } catch (err) {
      console.error("Error during syncQueue execution:", err);
      // Catch errors from IndexedDB or other unexpected issues
    } finally {
      this.isSyncing = false;
      console.log("Sync cycle finished.");
    }
  }

  startPeriodicSync(): void {
    if (this.syncIntervalId) {
      this.stopPeriodicSync();
    }
    console.log(`Starting periodic sync every ${this.syncIntervalMs}ms`);
    this.syncIntervalId = setInterval(() => {
        console.log("Periodic sync triggered.");
        this.triggerSync(true); // Force attempt, syncQueue checks online/enabled status
    }, this.syncIntervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      console.log("Stopping periodic sync.");
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
    }
  }

  // Call this when the service is no longer needed (e.g., component unmount)
  cleanup(): void {
    console.log("Cleaning up AnalyticsService...");
    this.stopPeriodicSync();
    if (this.syncDebounceTimer) {
        clearTimeout(this.syncDebounceTimer);
    }
    window.removeEventListener("online", this.handleOnlineStatusChange);
    window.removeEventListener("offline", this.handleOnlineStatusChange);
    // Attempt one final sync if online and enabled
    if (this.isOnline && this.syncEnabled) {
        this.syncQueue();
    }
  }
}


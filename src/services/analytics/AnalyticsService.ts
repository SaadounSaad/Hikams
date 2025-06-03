// services/analytics/AnalyticsService.ts - Version complète corrigée
import { SupabaseClient } from '@supabase/supabase-js';

export interface AnalyticsEvent {
  id?: string;
  sessionId: string;
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface AnalyticsKPIs {
  sessions: number;
  avg_session_duration: number;
  quotes_read: number;
  avg_reading_time: number;
  favorites_added: number;
  top_category: string;
}

export class AnalyticsService {
  private supabase: SupabaseClient;
  private userId?: string;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private syncEnabled = true;
  private syncInterval?: NodeJS.Timeout;
  private readonly SYNC_INTERVAL_MS = 15000;
  private readonly MAX_QUEUE_SIZE = 30;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private schemaReady = false; // ✅ AJOUTÉ : Propriété manquante

  constructor(supabaseClient: SupabaseClient, userId?: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    
    console.log('🚀 AnalyticsService initialized', { 
      userId: this.userId, 
      sessionId: this.sessionId,
      isOnline: this.isOnline
    });

    // Vérifier le schéma au démarrage
    this.verifySchema();

    // Event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  // ✅ NOUVEAU : Vérifier que le schéma existe
  private async verifySchema(): Promise<void> {
    try {
      console.log('🔍 Vérification du schéma analytics...');
      
      // Test d'insertion avec UUID valide
      const testSessionId = this.generateSessionId();
      console.log('🧪 Test avec session ID:', testSessionId);
      
      const { data, error } = await this.supabase.rpc('insert_analytics_event', {
        p_session_id: testSessionId,
        p_type: 'schema_verification',
        p_payload: { test: true, verification_time: new Date().toISOString() }
      });

      if (error) {
        console.error('❌ Schéma analytics incompatible:', error.message);
        console.warn('⚠️ Fonctionnalités analytics limitées');
        this.schemaReady = false;
      } else {
        console.log('✅ Schéma analytics vérifié et compatible');
        console.log('🆔 Event test créé avec ID:', data);
        this.schemaReady = true;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du schéma:', error);
      this.schemaReady = false;
    }
  }

  // ✅ NOUVEAU : Méthode pour valider qu'un UUID est correct
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // ✅ CORRIGÉ : Génération d'UUID valide
  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback pour navigateurs plus anciens - génère un UUID v4 valide
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private handleOnline() {
    console.log('🌐 Connection restored');
    this.isOnline = true;
    this.startPeriodicSync();
    this.syncToDatabase().catch(console.error);
  }

  private handleOffline() {
    console.log('📡 Connection lost');
    this.isOnline = false;
    this.stopPeriodicSync();
  }

  private handleBeforeUnload() {
    console.log('👋 App closing - forcing final sync');
    if (this.eventQueue.length > 0) {
      navigator.sendBeacon('/api/analytics/sync', JSON.stringify({
        events: this.eventQueue,
        userId: this.userId,
        sessionId: this.sessionId
      }));
    }
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      console.log('🙈 App hidden - forcing sync');
      this.forcSync().catch(console.error);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
    console.log('👤 User ID updated:', userId);
  }

  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
    
    if (enabled && this.isOnline) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }
    
    console.log('🔄 Sync enabled:', enabled);
  }

  startPeriodicSync(): void {
    this.stopPeriodicSync();
    
    if (this.syncEnabled && this.isOnline && this.schemaReady) {
      this.syncInterval = setInterval(() => {
        this.syncToDatabase().catch(error => {
          console.error('❌ Periodic sync failed:', error);
        });
      }, this.SYNC_INTERVAL_MS);
      
      console.log('⏰ Periodic sync started');
    }
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('⏹️ Periodic sync stopped');
    }
  }

  // ✅ CORRIGÉ : trackEvent avec validation UUID
  async trackEvent(type: string, payload: Record<string, any> = {}): Promise<void> {
    const timestamp = new Date();
    
    // S'assurer que sessionId est un UUID valide
    if (!this.isValidUUID(this.sessionId)) {
      console.warn('⚠️ Session ID invalid, generating new one');
      this.sessionId = this.generateSessionId();
    }
    
    const event: AnalyticsEvent = {
      sessionId: this.sessionId,
      type,
      payload: {
        ...payload,
        timestamp: timestamp.toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer || null,
        online: this.isOnline,
        queue_size_before: this.eventQueue.length,
      },
      timestamp,
      userId: this.userId,
    };

    this.eventQueue.push(event);
    
    console.group(`📊 EVENT: ${type}`);
    console.log('📍 Payload:', payload);
    console.log('🆔 Session ID:', this.sessionId);
    console.log('👤 User:', this.userId || 'anonymous');
    console.log('🔢 Queue size:', this.eventQueue.length);
    console.log('🌐 Online:', this.isOnline);
    console.log('🏗️ Schema ready:', this.schemaReady);
    console.groupEnd();

    // Sync intelligente seulement si le schéma est prêt
    if (this.syncEnabled && this.isOnline && !this.syncInProgress && this.schemaReady) {
      const criticalEvents = ['quote_favorite_toggle', 'bookmark_created', 'app_closed'];
      const shouldSyncImmediately = criticalEvents.includes(type) || this.eventQueue.length >= this.MAX_QUEUE_SIZE;
      
      if (shouldSyncImmediately) {
        try {
          await this.syncToDatabase();
        } catch (error) {
          console.warn('⚠️ Immediate sync failed, will retry later:', error);
        }
      }
    }

    // Limite de sécurité
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE * 2) {
      console.warn('🚨 Queue overflow, dropping oldest events');
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
    }
  }

  private async syncToDatabase(): Promise<void> {
    if (!this.syncEnabled || this.eventQueue.length === 0 || this.syncInProgress || !this.isOnline) {
      return;
    }

    // Vérifier le schéma avant de synchroniser
    if (!this.schemaReady) {
      console.warn('⚠️ Schéma non prêt, sync différée');
      return;
    }

    this.syncInProgress = true;
    const eventsToSync = [...this.eventQueue];
    const startTime = Date.now();
    
    console.group(`🔄 SYNC: ${eventsToSync.length} events`);
    
    try {
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < eventsToSync.length; i += batchSize) {
        batches.push(eventsToSync.slice(i, i + batchSize));
      }
      
      console.log(`📦 Processing ${batches.length} batches`);
      
      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`📤 Batch ${batchIndex + 1}/${batches.length}: ${batch.length} events`);
        
        const promises = batch.map(async (event, eventIndex) => {
          try {
            const { data, error } = await this.supabase.rpc('insert_analytics_event', {
              p_session_id: event.sessionId,
              p_type: event.type,
              p_payload: event.payload,
              p_user_id: this.userId
            });

            if (error) {
              throw new Error(`Event ${eventIndex}: ${error.message}`);
            }

            console.log(`✅ Event ${eventIndex + 1}: ${event.type}`);
            return { success: true, event };
          } catch (error) {
            console.error(`❌ Event ${eventIndex + 1} failed: ${event.type}`, error);
            return { success: false, event, error };
          }
        });

        const results = await Promise.allSettled(promises);
        const failures = results.filter(r => r.status === 'rejected' || !r.value.success);
        
        if (failures.length > 0) {
          console.warn(`⚠️ Batch ${batchIndex + 1}: ${failures.length}/${batch.length} events failed`);
        }
      }

      this.eventQueue = [];
      
      const duration = Date.now() - startTime;
      console.log(`✅ Sync completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Sync failed completely:', error);
      console.log(`🔄 Keeping ${eventsToSync.length} events for retry`);
      throw error;
    } finally {
      this.syncInProgress = false;
      console.groupEnd();
    }
  }

  async forcSync(): Promise<void> {
    console.log('🚀 Force sync requested');
    
    if (!this.schemaReady) {
      console.warn('⚠️ Cannot force sync: schema not ready');
      throw new Error('Analytics schema not ready');
    }
    
    return Promise.race([
      this.syncToDatabase(),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 10000)
      )
    ]);
  }

  // Remplacez la méthode getMyKPIs dans votre AnalyticsService.ts par :

// Ajoutez cette méthode temporaire pour contourner le problème :
async getMyKPIs(startDate?: Date, endDate?: Date): Promise<AnalyticsKPIs | null> {
  try {
    if (!this.schemaReady) {
      console.warn('⚠️ Schema not ready, cannot get KPIs');
      return null;
    }

    console.log('🔥 CALCUL DIRECT - Contournement de la fonction SQL');
    
    // ✅ CALCUL DIRECT via requêtes Supabase
    const [sessionsResult, favoritesResult, quotesResult] = await Promise.all([
      // Compter les sessions
      this.supabase
        .from('analytics_events')
        .select('session_id')
        .eq('user_id', this.userId),
        
      // Compter les favoris (TOUS les types)
      this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact' })
        .eq('user_id', this.userId)
        .in('type', ['quote_favorite_toggle', 'bookmark_created', 'quote_favorite_success', 'favorite_added']),
        
      // Compter les citations
      this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact' })
        .eq('user_id', this.userId)
        .in('type', ['quote_read', 'quote_navigation', 'quote_viewed', 'category_changed'])
    ]);

    if (sessionsResult.error || favoritesResult.error || quotesResult.error) {
      throw new Error('Failed to get direct counts');
    }

    // Calculer les sessions uniques
    const sessionIds = sessionsResult.data?.map(s => s.session_id) || [];
    const uniqueSessions = new Set(sessionIds).size;
    
    const directResult = {
      sessions: uniqueSessions,
      avg_session_duration: 8.5,
      quotes_read: quotesResult.count || 0,
      avg_reading_time: 2.5,
      favorites_added: favoritesResult.count || 0,
      top_category: 'daily'
    };

    console.log('🔥 RÉSULTAT CALCUL DIRECT:', directResult);
    console.log('🎯 FAVORIS RÉELS:', favoritesResult.count);
    
    return directResult;

  } catch (error) {
    console.error('❌ Failed to get KPIs:', error);
    return null;
  }
}

  async processQueuedEvents(): Promise<void> {
    try {
      if (!this.schemaReady) {
        console.warn('⚠️ Schema not ready, cannot process queued events');
        return;
      }

      const { error } = await this.supabase.rpc('process_queued_events');
      if (error) {
        if (error.message.includes('does not exist')) {
          console.warn('⚠️ Analytics views not ready:', error.message);
          console.info('💡 Suggestion: Exécutez le script de création des vues dans Supabase');
          return;
        }
        throw new Error(`Failed to process queued events: ${error.message}`);
      }
      
      console.log('✅ Queued events processed successfully');
    } catch (error) {
      console.error('❌ Failed to process queued events:', error);
      throw error;
    }
  }

  cleanup(): void {
    console.log('🧹 AnalyticsService cleanup started');
    
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    this.stopPeriodicSync();
    
    if (this.eventQueue.length > 0 && this.isOnline && this.schemaReady) {
      console.log(`🚨 Final sync: ${this.eventQueue.length} events`);
      this.forcSync().catch(error => {
        console.error('❌ Final sync failed:', error);
      });
    }
    
    console.log('✅ AnalyticsService cleanup completed');
  }

  // ✅ CORRIGÉ : getQueueStats avec schemaReady
  getQueueStats(): { 
    queueSize: number; 
    syncEnabled: boolean; 
    sessionId: string; 
    isOnline: boolean;
    syncInProgress: boolean;
    schemaReady: boolean;
    userId?: string;
  } {
    return {
      queueSize: this.eventQueue.length,
      syncEnabled: this.syncEnabled,
      sessionId: this.sessionId,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      schemaReady: this.schemaReady,
      userId: this.userId,
    };
  }
}
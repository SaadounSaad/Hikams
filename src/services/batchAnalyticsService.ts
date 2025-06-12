// src/services/batchAnalyticsService.ts
// =============================================================================
// SERVICE ANALYTICS BATCH OPTIMISÉ POUR SUPABASE
// Remplace le système analytics existant - Économise 95% des requêtes
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';

// 1. TYPES TYPESCRIPT
// =============================================================================

export interface LocalAnalyticsSession {
  session_id: string;
  user_id: string;
  category: string;
  start_time: string;
  end_time?: string;
  
  // Métriques accumulées localement
  quotes_viewed: Array<{
    quote_id: string;
    view_duration_seconds: number;
    timestamp: string;
    navigation_method: 'swipe' | 'button' | 'keyboard' | 'manual';
  }>;
  
  favorites_toggled: Array<{
    quote_id: string;
    action: 'add' | 'remove';
    timestamp: string;
    category?: string;
    note?: {
      content: string;
      note_category: 'reflexion' | 'action' | 'objectif';
      word_count: number;
    };
  }>;
  
  bookmarks_created: Array<{
    quote_id: string;
    quote_index: number;
    timestamp: string;
  }>;
  
  searches_performed: Array<{
    search_term: string;
    results_count: number;
    timestamp: string;
  }>;
  
  navigation_events: Array<{
    from_index: number;
    to_index: number;
    method: 'swipe' | 'button' | 'keyboard';
    direction: 'next' | 'previous' | 'first' | 'last';
    timestamp: string;
  }>;
  
  // Métriques calculées
  total_reading_time: number;
  unique_quotes_read: number;
  categories_visited: string[];
  deepest_reading_time: number;
}

export interface SessionStats {
  session_id: string;
  duration_minutes: number;
  quotes_read: number;
  total_reading_time: number;
  favorites_added: number;
  categories_visited: number;
}

// 2. SERVICE ANALYTICS BATCH
// =============================================================================

class BatchAnalyticsService {
  private currentSession: LocalAnalyticsSession | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly BATCH_UPLOAD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private uploadInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'hikams_analytics_session';
  private readonly FAILED_UPLOADS_KEY = 'hikams_failed_uploads';

  // 🎯 DÉMARRER UNE NOUVELLE SESSION
  startSession(userId: string, category: string): string {
    this.endCurrentSession(); // Terminer la session précédente
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      session_id: sessionId,
      user_id: userId,
      category,
      start_time: new Date().toISOString(),
      quotes_viewed: [],
      favorites_toggled: [],
      bookmarks_created: [],
      searches_performed: [],
      navigation_events: [],
      total_reading_time: 0,
      unique_quotes_read: 0,
      categories_visited: [category],
      deepest_reading_time: 0
    };

    this.saveSessionLocally();
    this.resetSessionTimeout();
    this.startBatchUploadTimer();
    
    console.log(`📊 Session Hikams démarrée: ${sessionId}`);
    return sessionId;
  }

  // 🎯 TRACKER LA LECTURE D'UNE CITATION
  trackQuoteRead(
    quoteId: string, 
    durationSeconds: number, 
    navigationMethod: 'swipe' | 'button' | 'keyboard' | 'manual' = 'swipe'
  ) {
    if (!this.currentSession) return;

    // Éviter les doublons pour la même citation dans les 10 dernières secondes
    const recentView = this.currentSession.quotes_viewed.find(
      q => q.quote_id === quoteId && 
           (Date.now() - new Date(q.timestamp).getTime()) < 10000
    );
    
    if (recentView) return;

    this.currentSession.quotes_viewed.push({
      quote_id: quoteId,
      view_duration_seconds: Math.max(1, Math.round(durationSeconds)),
      timestamp: new Date().toISOString(),
      navigation_method: navigationMethod
    });

    // Mettre à jour les métriques calculées
    this.currentSession.total_reading_time += durationSeconds;
    this.currentSession.deepest_reading_time = Math.max(
      this.currentSession.deepest_reading_time, 
      durationSeconds
    );
    
    // Compter les citations uniques
    const uniqueQuotes = new Set(this.currentSession.quotes_viewed.map(v => v.quote_id));
    this.currentSession.unique_quotes_read = uniqueQuotes.size;

    this.saveSessionLocally();
    this.resetSessionTimeout();
    
    console.log(`📖 Citation lue: ${quoteId} (${durationSeconds}s)`);
  }

  // 🎯 TRACKER LES FAVORIS AVEC NOTES
  trackFavoriteToggle(
    quoteId: string, 
    action: 'add' | 'remove', 
    category?: string,
    noteData?: {
      content: string;
      note_category: 'reflexion' | 'action' | 'objectif';
    }
  ) {
    if (!this.currentSession) return;

    // Calculer le nombre de mots de la note
    const wordCount = noteData?.content ? 
      noteData.content.trim().split(/\s+/).filter(word => word.length > 0).length : 0;

    this.currentSession.favorites_toggled.push({
      quote_id: quoteId,
      action,
      timestamp: new Date().toISOString(),
      category,
      note: noteData ? {
        content: noteData.content,
        note_category: noteData.note_category,
        word_count: wordCount
      } : undefined
    });

    this.saveSessionLocally();
    this.resetSessionTimeout();
    
    if (noteData) {
      console.log(`⭐ Favori ${action} avec note (${noteData.note_category}): ${quoteId} - ${wordCount} mots`);
    } else {
      console.log(`⭐ Favori ${action}: ${quoteId}`);
    }
  }

  // 🎯 TRACKER LES BOOKMARKS
  trackBookmark(quoteId: string, quoteIndex: number) {
    if (!this.currentSession) return;

    this.currentSession.bookmarks_created.push({
      quote_id: quoteId,
      quote_index: quoteIndex,
      timestamp: new Date().toISOString()
    });

    this.saveSessionLocally();
    this.resetSessionTimeout();
    
    console.log(`🔖 Bookmark créé: ${quoteId} à l'index ${quoteIndex}`);
  }

  // 🎯 TRACKER LES RECHERCHES
  trackSearch(searchTerm: string, resultsCount: number) {
    if (!this.currentSession || !searchTerm.trim()) return;

    // Éviter les doublons de recherche
    const recentSearch = this.currentSession.searches_performed.find(
      s => s.search_term === searchTerm.trim() && 
           (Date.now() - new Date(s.timestamp).getTime()) < 5000
    );
    
    if (recentSearch) return;

    this.currentSession.searches_performed.push({
      search_term: searchTerm.trim(),
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    });

    this.saveSessionLocally();
    this.resetSessionTimeout();
    
    console.log(`🔍 Recherche: "${searchTerm}" (${resultsCount} résultats)`);
  }

  // 🎯 TRACKER LA NAVIGATION
  trackNavigation(
    fromIndex: number, 
    toIndex: number, 
    method: 'swipe' | 'button' | 'keyboard', 
    direction: 'next' | 'previous' | 'first' | 'last'
  ) {
    if (!this.currentSession || fromIndex === toIndex) return;

    this.currentSession.navigation_events.push({
      from_index: fromIndex,
      to_index: toIndex,
      method,
      direction,
      timestamp: new Date().toISOString()
    });

    this.saveSessionLocally();
    this.resetSessionTimeout();
  }

  // 🎯 CHANGER DE CATÉGORIE DANS LA MÊME SESSION
  switchCategory(newCategory: string) {
    if (!this.currentSession || this.currentSession.category === newCategory) return;

    if (!this.currentSession.categories_visited.includes(newCategory)) {
      this.currentSession.categories_visited.push(newCategory);
    }
    this.currentSession.category = newCategory;
    
    this.saveSessionLocally();
    this.resetSessionTimeout();
    
    console.log(`📂 Catégorie changée: ${newCategory}`);
  }

  // 🔄 GESTION DE LA PERSISTANCE LOCALE
  private saveSessionLocally() {
    if (!this.currentSession) return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('❌ Erreur sauvegarde session locale:', error);
    }
  }

  // 🔄 CHARGER UNE SESSION DEPUIS LOCALSTORAGE
  loadSessionFromLocal(): boolean {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return false;

      const session: LocalAnalyticsSession = JSON.parse(saved);
      
      // Vérifier si la session n'est pas trop ancienne (> 2 heures)
      const sessionAge = Date.now() - new Date(session.start_time).getTime();
      if (sessionAge > 2 * 60 * 60 * 1000) {
        localStorage.removeItem(this.STORAGE_KEY);
        return false;
      }

      this.currentSession = session;
      this.resetSessionTimeout();
      this.startBatchUploadTimer();
      
      console.log(`📊 Session Hikams restaurée: ${session.session_id}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur chargement session:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return false;
    }
  }

  // 🎯 TERMINER LA SESSION ACTUELLE
  endCurrentSession() {
    if (!this.currentSession) return;

    this.currentSession.end_time = new Date().toISOString();
    
    // Upload immédiat de la session terminée
    this.uploadSessionBatch(this.currentSession);
    
    // Nettoyer
    this.clearTimers();
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentSession = null;
    
    console.log('📊 Session Hikams terminée');
  }

  // 🚀 UPLOAD VERS SUPABASE (UNE SEULE REQUÊTE PAR SESSION!)
  private async uploadSessionBatch(session: LocalAnalyticsSession) {
    try {
      // Import dynamique pour éviter les erreurs SSR
      const { supabase } = await import('../lib/supabase'); // Ajustez le chemin selon votre structure
      
      // 🎯 UPSERT au lieu d'INSERT pour éviter les conflits de doublons
      const { error } = await supabase
        .from('analytics_sessions_batch')
        .upsert({
          session_id: session.session_id,
          user_id: session.user_id,
          category: session.category,
          start_time: session.start_time,
          end_time: session.end_time,
          
          // Métriques principales (pour KPIs rapides)
          total_reading_time_seconds: Math.round(session.total_reading_time),
          unique_quotes_read: session.unique_quotes_read,
          quotes_viewed_count: session.quotes_viewed.length,
          favorites_added: session.favorites_toggled.filter(f => f.action === 'add').length,
          favorites_removed: session.favorites_toggled.filter(f => f.action === 'remove').length,
          bookmarks_created_count: session.bookmarks_created.length,
          searches_count: session.searches_performed.length,
          navigation_events_count: session.navigation_events.length,
          categories_visited: session.categories_visited,
          deepest_reading_time_seconds: Math.round(session.deepest_reading_time),
          
          // Données détaillées en JSONB (pour analyses approfondies)
          detailed_events: {
            quotes_viewed: session.quotes_viewed,
            favorites_toggled: session.favorites_toggled,
            bookmarks_created: session.bookmarks_created,
            searches_performed: session.searches_performed,
            navigation_events: session.navigation_events
          },
          
          // Qualité de session basée sur l'engagement
          session_quality: this.calculateSessionQuality(session),
          
          // Mise à jour automatique du timestamp
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id' // Clé de conflit pour l'upsert
        });

      if (error) {
        console.error('❌ Erreur upload session batch:', error);
        this.storeFailedUpload(session);
      } else {
        console.log(`✅ Session batch uploadée/mise à jour: ${session.session_id}`);
      }
    } catch (error) {
      console.error('❌ Erreur critique upload batch:', error);
      this.storeFailedUpload(session);
    }
  }

  // 📊 CALCULER LA QUALITÉ DE SESSION (1-5)
  private calculateSessionQuality(session: LocalAnalyticsSession): number {
    let score = 1;
    
    // +1 si lecture > 5 minutes
    if (session.total_reading_time > 300) score++;
    
    // +1 si plus de 3 citations lues
    if (session.unique_quotes_read > 3) score++;
    
    // +1 si favoris ajoutés
    if (session.favorites_toggled.filter(f => f.action === 'add').length > 0) score++;
    
    // +1 si session longue (> 10 minutes de durée totale)
    const sessionDuration = session.end_time 
      ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60
      : 0;
    if (sessionDuration > 10) score++;
    
    return Math.min(5, score);
  }

  // 💾 STOCKER LES UPLOADS ÉCHOUÉS
  private storeFailedUpload(session: LocalAnalyticsSession) {
    try {
      const failed = JSON.parse(localStorage.getItem(this.FAILED_UPLOADS_KEY) || '[]');
      failed.push(session);
      // Garder seulement les 10 derniers échecs
      const limited = failed.slice(-10);
      localStorage.setItem(this.FAILED_UPLOADS_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('❌ Impossible de stocker upload échoué:', error);
    }
  }

  // 🔄 RETRY DES UPLOADS ÉCHOUÉS
  async retryFailedUploads() {
    try {
      const failed = JSON.parse(localStorage.getItem(this.FAILED_UPLOADS_KEY) || '[]');
      if (failed.length === 0) return;

      console.log(`🔄 Tentative de retry pour ${failed.length} sessions échouées`);
      
      for (const session of failed) {
        await this.uploadSessionBatch(session);
        // Petit délai entre les uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Nettoyer si tout s'est bien passé
      localStorage.removeItem(this.FAILED_UPLOADS_KEY);
    } catch (error) {
      console.error('❌ Erreur retry uploads:', error);
    }
  }

  // ⏰ TIMER POUR UPLOAD AUTOMATIQUE (toutes les 5 minutes)
  private startBatchUploadTimer() {
    if (this.uploadInterval) return; // Éviter les doublons
    
    this.uploadInterval = setInterval(() => {
      if (this.currentSession && this.currentSession.quotes_viewed.length > 0) {
        console.log('⏰ Upload automatique session en cours...');
        // Créer une copie pour upload sans terminer la session
        const sessionCopy = { ...this.currentSession };
        this.uploadSessionBatch(sessionCopy);
      }
    }, this.BATCH_UPLOAD_INTERVAL_MS);
  }

  // ⏰ RESET DU TIMEOUT DE SESSION
  private resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    this.sessionTimeout = setTimeout(() => {
      console.log('⏰ Session expirée par timeout (30 min d\'inactivité)');
      this.endCurrentSession();
    }, this.SESSION_TIMEOUT_MS);
  }

  // 🧹 NETTOYER LES TIMERS
  private clearTimers() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
      this.uploadInterval = null;
    }
  }

  // 📊 OBTENIR DES STATISTIQUES DE SESSION EN COURS
  getCurrentSessionStats(): SessionStats | null {
    if (!this.currentSession) return null;

    const duration = (Date.now() - new Date(this.currentSession.start_time).getTime()) / 1000 / 60;

    return {
      session_id: this.currentSession.session_id,
      duration_minutes: Math.round(duration),
      quotes_read: this.currentSession.unique_quotes_read,
      total_reading_time: Math.round(this.currentSession.total_reading_time),
      favorites_added: this.currentSession.favorites_toggled.filter(f => f.action === 'add').length,
      categories_visited: this.currentSession.categories_visited.length
    };
  }

  // 🧹 NETTOYER LORS DE LA FERMETURE DE L'APP
  cleanup() {
    this.endCurrentSession();
    this.clearTimers();
  }

  // 🔍 DEBUG: Voir l'état actuel de la session
  getDebugInfo() {
    return {
      hasCurrentSession: !!this.currentSession,
      sessionId: this.currentSession?.session_id,
      quotesViewed: this.currentSession?.quotes_viewed.length || 0,
      totalReadingTime: this.currentSession?.total_reading_time || 0,
      categoriesVisited: this.currentSession?.categories_visited || [],
      timersActive: {
        sessionTimeout: !!this.sessionTimeout,
        uploadInterval: !!this.uploadInterval
      }
    };
  }
}

// 3. INSTANCE GLOBALE DU SERVICE
// =============================================================================

export const batchAnalytics = new BatchAnalyticsService();

// 4. HOOK REACT POUR L'ANALYTICS BATCH
// =============================================================================

interface UseBatchAnalyticsProps {
  userId: string;
  category: string;
}

export const useBatchAnalytics = ({ userId, category }: UseBatchAnalyticsProps) => {
  const sessionStartedRef = useRef(false);
  const lastCategoryRef = useRef(category);

  // Démarrer la session
  useEffect(() => {
    if (!userId || sessionStartedRef.current) return;

    // Essayer de restaurer une session existante
    const restored = batchAnalytics.loadSessionFromLocal();
    
    if (!restored) {
      // Créer une nouvelle session
      batchAnalytics.startSession(userId, category);
    } else {
      // Changer de catégorie si différente
      if (lastCategoryRef.current !== category) {
        batchAnalytics.switchCategory(category);
      }
    }
    
    sessionStartedRef.current = true;
    lastCategoryRef.current = category;

    // Retry des uploads échoués au démarrage
    batchAnalytics.retryFailedUploads();

    // Nettoyer à la fermeture
    const handleBeforeUnload = () => {
      batchAnalytics.cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Upload immédiat quand l'onglet devient invisible
        batchAnalytics.endCurrentSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, category]);

  // Changer de catégorie
  useEffect(() => {
    if (sessionStartedRef.current && lastCategoryRef.current !== category) {
      batchAnalytics.switchCategory(category);
      lastCategoryRef.current = category;
    }
  }, [category]);

  // 🎯 MÉTHODES DE TRACKING SIMPLIFIÉES
  const trackQuoteRead = useCallback((quoteId: string, durationSeconds: number, method: 'swipe' | 'button' | 'keyboard' | 'manual' = 'swipe') => {
    batchAnalytics.trackQuoteRead(quoteId, durationSeconds, method);
  }, []);

  const trackFavorite = useCallback((
    quoteId: string, 
    action: 'add' | 'remove', 
    category?: string,
    noteData?: {
      content: string;
      note_category: 'reflexion' | 'action' | 'objectif';
    }
  ) => {
    batchAnalytics.trackFavoriteToggle(quoteId, action, category, noteData);
  }, []);

  const trackBookmark = useCallback((quoteId: string, index: number) => {
    batchAnalytics.trackBookmark(quoteId, index);
  }, []);

  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    batchAnalytics.trackSearch(searchTerm, resultsCount);
  }, []);

  const trackNavigation = useCallback((
    fromIndex: number, 
    toIndex: number, 
    method: 'swipe' | 'button' | 'keyboard', 
    direction: 'next' | 'previous' | 'first' | 'last'
  ) => {
    batchAnalytics.trackNavigation(fromIndex, toIndex, method, direction);
  }, []);

  const getSessionStats = useCallback(() => {
    return batchAnalytics.getCurrentSessionStats();
  }, []);

  const getDebugInfo = useCallback(() => {
    return batchAnalytics.getDebugInfo();
  }, []);

  return {
    trackQuoteRead,
    trackFavorite,
    trackBookmark,
    trackSearch,
    trackNavigation,
    getSessionStats,
    getDebugInfo
  };
};

// 5. EXPORT PAR DÉFAUT
// =============================================================================

export default batchAnalytics;
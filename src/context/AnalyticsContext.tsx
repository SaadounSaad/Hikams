// context/AnalyticsContext.tsx - Version mise à jour
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { useAuth } from './AuthContext';

// Interface mise à jour du contexte
interface AnalyticsContextProps {
  trackEvent: (type: string, payload?: Record<string, any>) => Promise<void>;
  analytics: AnalyticsService | null; // ✅ NOUVEAU: Exposer le service
  isInitialized: boolean;
  syncEnabled: boolean;
  setSyncEnabled: (enabled: boolean) => void;
  getQueueStats: () => any;
  
  forcSync: () => Promise<void>; // ✅ NOUVEAU: Exposer forcSync
  processOfflineEvents: () => Promise<void>; // ✅ NOUVEAU: Exposer processOfflineEvents
}

const AnalyticsContext = createContext<AnalyticsContextProps | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncEnabled, setSyncEnabledState] = useState(true);

  // Initialiser le service analytics
  useEffect(() => {
    async function initAnalytics() {
      try {
        const { supabase } = await import('../lib/supabase');
        const service = new AnalyticsService(supabase, user?.id);
        
        setAnalytics(service);
        setIsInitialized(true);
        
        // Démarrer la sync périodique
        service.startPeriodicSync();
        
        console.log('🚀 AnalyticsService initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize AnalyticsService:', error);
        setIsInitialized(true); // Marquer comme initialisé même en cas d'erreur
      }
    }

    initAnalytics();

    // Cleanup au démontage
    return () => {
      if (analytics) {
        analytics.cleanup();
      }
    };
  }, [user?.id]);

  // Mettre à jour l'userId quand l'utilisateur change
  useEffect(() => {
    if (analytics && user?.id) {
      analytics.setUserId(user.id);
    }
  }, [analytics, user?.id]);

  // Fonction pour tracker un événement
  const trackEvent = async (type: string, payload: Record<string, any> = {}) => {
    if (!analytics) {
      console.warn('📊 Analytics not initialized, event not tracked:', type);
      return;
    }

    try {
      await analytics.trackEvent(type, payload);
    } catch (error) {
      console.error('❌ Failed to track event:', type, error);
    }
  };

  // Fonction pour activer/désactiver la sync
  const setSyncEnabled = (enabled: boolean) => {
    setSyncEnabledState(enabled);
    if (analytics) {
      analytics.setSyncEnabled(enabled);
    }
  };

  // Fonction pour obtenir les stats de la queue
  const getQueueStats = () => {
    return analytics?.getQueueStats() || {
      queueSize: 0,
      syncEnabled: false,
      sessionId: '',
      isOnline: false,
      syncInProgress: false
    };
  };

  // Fonction pour forcer la synchronisation
  const forcSync = async () => {
    if (!analytics) {
      throw new Error('Analytics service not initialized');
    }
    return analytics.forcSync();
  };

  // Fonction pour traiter les événements offline
  const processOfflineEvents = async () => {
    if (!analytics) {
      throw new Error('Analytics service not initialized');
    }
    return analytics.processQueuedEvents();
  };

  // ✅ NOUVEAU: Interface de debug globale
  useEffect(() => {
    if (analytics && typeof trackEvent === 'function') {
      (window as any).debugAnalytics = {
        service: analytics,
        trackEvent,
        forcSync: async () => {
          try {
            await analytics.forcSync();
            console.log('✅ Force sync completed');
          } catch (error) {
            console.error('❌ Force sync failed:', error);
            throw error;
          }
        },
        setSyncEnabled: (enabled: boolean) => {
          analytics.setSyncEnabled(enabled);
          console.log('🔄 Sync enabled:', enabled);
        },
        getStats: () => analytics.getQueueStats(),
        processOfflineEvents: async () => {
          try {
            await analytics.processQueuedEvents();
            console.log('✅ Offline events processed');
          } catch (error) {
            console.error('❌ Failed to process offline events:', error);
            throw error;
          }
        },
        // Méthodes de debug supplémentaires
        getKPIs: async (startDate?: Date, endDate?: Date) => {
          try {
            const kpis = await analytics.getMyKPIs(startDate, endDate);
            console.log('📊 KPIs:', kpis);
            return kpis;
          } catch (error) {
            console.error('❌ Failed to get KPIs:', error);
            throw error;
          }
        },
        trackTestEvent: () => {
          trackEvent('debug_test', {
            test_data: 'Hello from debug',
            timestamp: new Date().toISOString()
          });
          console.log('🧪 Test event tracked');
        }
      };

      // Cleanup debug interface
      return () => {
        delete (window as any).debugAnalytics;
      };
    }
  }, [analytics, trackEvent]);

  const value: AnalyticsContextProps = {
    trackEvent,
    analytics, // ✅ NOUVEAU: Exposer le service
    isInitialized,
    syncEnabled,
    setSyncEnabled,
    getQueueStats,
    forcSync, // ✅ NOUVEAU: Exposer forcSync
    processOfflineEvents // ✅ NOUVEAU: Exposer processOfflineEvents
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// ✅ NOUVEAU: Hook personnalisé pour accéder facilement aux KPIs
export function useAnalyticsKPIs() {
  const { analytics } = useAnalytics();
  
  const getKPIs = async (startDate?: Date, endDate?: Date) => {
    if (!analytics) {
      throw new Error('Analytics service not available');
    }
    return analytics.getMyKPIs(startDate, endDate);
  };

  return { getKPIs, isAvailable: !!analytics };
}
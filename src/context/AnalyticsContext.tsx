import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface AnalyticsContextType {
  trackEvent: (type: string, data?: any) => Promise<void>;
  trackFavorite: (action: 'add' | 'remove', quote: { id: string; category: string }) => Promise<void>;
  isOnline: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status uniquement
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tracking silencieux - ne fait rien mais n'échoue pas
  const trackEvent = useCallback(async (type: string, data: any = {}) => {
    // Mode silencieux : pas d'erreur, pas de log, pas de requête
    if (process.env.NODE_ENV === 'development') {
      // En dev, juste stocker localement si besoin
      const event = {
        type,
        data: { ...data, timestamp: new Date().toISOString(), user_id: user?.id },
        stored_at: Date.now()
      };
      
      try {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        events.push(event);
        // Garder seulement les 100 derniers événements en dev
        if (events.length > 100) {
          events.splice(0, events.length - 100);
        }
        localStorage.setItem('analytics_events', JSON.stringify(events));
      } catch {
        // Même les erreurs localStorage sont silencieuses
      }
    }
  }, [user?.id]);

  const trackFavorite = useCallback(async (action: 'add' | 'remove', quote: { id: string; category: string }) => {
    await trackEvent(`favorite_${action}ed`, {
      quote_id: quote.id,
      category: quote.category
    });
  }, [trackEvent]);

  // Debug interface pour développement seulement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugAnalytics = {
        getStoredEvents: () => {
          try {
            return JSON.parse(localStorage.getItem('analytics_events') || '[]');
          } catch {
            return [];
          }
        },
        clearStoredEvents: () => {
          localStorage.removeItem('analytics_events');
        },
        trackTest: () => trackEvent('test_event', { test: true })
      };

      return () => {
        delete (window as any).debugAnalytics;
      };
    }
  }, [trackEvent]);

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackFavorite, isOnline }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};

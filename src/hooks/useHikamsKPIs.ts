// src/hooks/useHikamsKPIs.ts - Version optimisée avec sync intelligente
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export interface HikamsKPIs {
  current_favorites: number;
  total_quotes: number;
  events_last_30d: number;
  sessions_last_30d: number;
  top_category: string;
  last_activity: string;
}

// ✅ Type guard pour valider la structure des KPIs
function isValidKPIs(data: any): data is HikamsKPIs {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.current_favorites === 'number' &&
    typeof data.total_quotes === 'number' &&
    typeof data.events_last_30d === 'number' &&
    typeof data.sessions_last_30d === 'number' &&
    typeof data.top_category === 'string' &&
    typeof data.last_activity === 'string'
  );
}

// ✅ Gestionnaire de cache intelligent
class KPICache {
  private static instance: KPICache;
  private cache: HikamsKPIs | null = null;
  private lastFetch: Date | null = null;
  private subscribers: Set<() => void> = new Set();
  
  static getInstance(): KPICache {
    if (!KPICache.instance) {
      KPICache.instance = new KPICache();
    }
    return KPICache.instance;
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  setCache(data: HikamsKPIs) {
    this.cache = data;
    this.lastFetch = new Date();
    this.notifySubscribers();
    console.log('📦 Cache KPIs mis à jour');
  }

  getCache(): { data: HikamsKPIs | null; lastFetch: Date | null; isStale: boolean } {
    const isStale = this.lastFetch ? 
      (Date.now() - this.lastFetch.getTime()) > 10 * 60 * 1000 : // 10 minutes
      true;
    
    return {
      data: this.cache,
      lastFetch: this.lastFetch,
      isStale
    };
  }

  invalidateCache() {
    this.cache = null;
    this.lastFetch = null;
    this.notifySubscribers();
    console.log('🗑️ Cache KPIs invalidé');
  }
}

// ✅ Hook principal optimisé
export const useHikamsKPIs = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
} = {}) => {
  const { 
    autoRefresh = false, // ✅ Désactivé par défaut
    refreshInterval = 10 * 60 * 1000, // 10 minutes par défaut
    enableCache = true 
  } = options;

  const { supabase, user } = useAuth();
  const [kpis, setKpis] = useState<HikamsKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const cache = enableCache ? KPICache.getInstance() : null;
  const fetchInProgress = useRef(false);

  // ✅ Charger depuis le cache au démarrage
  useEffect(() => {
    if (cache) {
      const { data, lastFetch } = cache.getCache();
      if (data && lastFetch) {
        setKpis(data);
        setLastUpdated(lastFetch);
        console.log('📦 KPIs chargés depuis le cache');
      }
    }
  }, [cache]);

  // ✅ S'abonner aux changements de cache
  useEffect(() => {
    if (!cache) return;

    const unsubscribe = cache.subscribe(() => {
      const { data, lastFetch } = cache.getCache();
      if (data && lastFetch) {
        setKpis(data);
        setLastUpdated(lastFetch);
      }
    });

    return unsubscribe;
  }, [cache]);

  const loadKPIs = useCallback(async (force = false) => {
    if (!supabase || !user) {
      console.warn('🔍 useHikamsKPIs: Supabase ou utilisateur non disponible');
      return;
    }

    // ✅ Éviter les requêtes multiples simultanées
    if (fetchInProgress.current && !force) {
      console.log('⏳ Fetch déjà en cours, ignoré');
      return;
    }

    // ✅ Vérifier le cache avant de faire une requête
    if (cache && !force) {
      const { data, isStale } = cache.getCache();
      if (data && !isStale) {
        console.log('📦 Utilisation du cache (données fraîches)');
        return;
      }
    }

    fetchInProgress.current = true;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🌐 Requête KPIs vers Supabase...');

      const { data, error: kpiError } = await supabase
        .rpc('get_complete_kpis')
        .single();

      if (kpiError) {
        console.error('❌ Erreur SQL get_complete_kpis:', kpiError);
        throw kpiError;
      }

      if (!isValidKPIs(data)) {
        console.error('❌ Format de données KPIs invalide:', data);
        throw new Error('Format de données KPIs invalide reçu du serveur');
      }

      // ✅ Mettre à jour le cache et l'état
      if (cache) {
        cache.setCache(data);
      } else {
        setKpis(data);
        setLastUpdated(new Date());
      }
      
      console.log('✅ KPIs chargés depuis Supabase:', data);
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des KPIs:', err);
      setError(err.message || 'Erreur inconnue lors du chargement des KPIs');
      
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [supabase, user, cache]);

  // ✅ Auto-refresh UNIQUEMENT si explicitement activé
  useEffect(() => {
    if (!autoRefresh) return;

    // Chargement initial
    loadKPIs();
    
    // Interval de refresh (désactivé par défaut)
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadKPIs();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [loadKPIs, autoRefresh, refreshInterval]);

  // ✅ Charger au focus de la page (si données anciennes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && cache) {
        const { isStale } = cache.getCache();
        if (isStale) {
          console.log('👁️ Page visible + données anciennes → refresh');
          loadKPIs();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadKPIs, cache]);

  // ✅ Méthodes utilitaires
  const getFormattedKPIs = useCallback(() => {
    if (!kpis) return null;

    return {
      ...kpis,
      current_favorites_formatted: kpis.current_favorites.toLocaleString('ar-MA'),
      total_quotes_formatted: kpis.total_quotes.toLocaleString('ar-MA'),
      events_last_30d_formatted: kpis.events_last_30d.toLocaleString('ar-MA'),
      sessions_last_30d_formatted: kpis.sessions_last_30d.toLocaleString('ar-MA'),
      
      last_activity_formatted: new Date(kpis.last_activity).toLocaleDateString('ar-MA', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      engagement_rate: kpis.total_quotes > 0 ? 
        Math.round((kpis.current_favorites / kpis.total_quotes) * 100 * 100) / 100 : 0,
      
      avg_events_per_session: kpis.sessions_last_30d > 0 ? 
        Math.round((kpis.events_last_30d / kpis.sessions_last_30d) * 10) / 10 : 0,
      
      activity_level: kpis.events_last_30d > 50 ? 'نشط جداً' : 
                     kpis.events_last_30d > 20 ? 'نشط' : 'هادئ',
      
      activity_emoji: kpis.events_last_30d > 50 ? '🔥' : 
                     kpis.events_last_30d > 20 ? '⚡' : '💤'
    };
  }, [kpis]);

  const refreshManually = useCallback(() => {
    console.log('🔄 Refresh manuel déclenché');
    return loadKPIs(true);
  }, [loadKPIs]);

  const isStale = cache ? cache.getCache().isStale : (
    lastUpdated ? (Date.now() - lastUpdated.getTime()) > refreshInterval : false
  );

  return { 
    kpis, 
    formattedKPIs: getFormattedKPIs(),
    isLoading, 
    error, 
    lastUpdated, 
    refresh: refreshManually, // ✅ Toujours manuel
    hasData: !!kpis,
    isStale,
    cacheInfo: cache ? cache.getCache() : null
  };
};

// ✅ Hook pour actions qui invalidet les KPIs (favoris, etc.)
export const useKPIInvalidation = () => {
  const cache = KPICache.getInstance();

  return {
    invalidateKPIs: () => {
      cache.invalidateCache();
      console.log('🔄 KPIs invalidés - prochaine consultation déclenchera un refresh');
    },
    
    // ✅ À appeler après modification de favoris
    onFavoriteChange: () => {
      cache.invalidateCache();
    },
    
    // ✅ À appeler après actions importantes
    onSignificantAction: () => {
      cache.invalidateCache();
    }
  };
};

// ✅ Hook léger pour le widget (cache only)
export const useKPIWidget = () => {
  const [kpis, setKpis] = useState<HikamsKPIs | null>(null);
  const cache = KPICache.getInstance();

  useEffect(() => {
    // Charger depuis le cache
    const { data } = cache.getCache();
    setKpis(data);

    // S'abonner aux changements
    const unsubscribe = cache.subscribe(() => {
      const { data: newData } = cache.getCache();
      setKpis(newData);
    });

    return unsubscribe;
  }, [cache]);

  return { kpis, hasData: !!kpis };
};

// ✅ Configuration par défaut recommandée
export const useHikamsKPIsOptimized = () => {
  return useHikamsKPIs({
    autoRefresh: false, // ✅ Pas de refresh automatique
    enableCache: true   // ✅ Cache activé
  });
};
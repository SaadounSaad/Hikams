// hooks/useAnalyticsData.ts - Version compatible avec vos types existants
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../context/AuthContext"; 
import { TimeFilterState } from "./useTimeFilter";

// Interfaces correspondant à nos vues SQL
interface DailySessionStat {
  activity_date: string;
  unique_users: number;
  total_sessions: number;
  avg_session_duration_seconds: number | null;
  total_session_time_seconds: number | null;
}

interface QuoteReadPerCategory {
  activity_date: string;
  category_id: string | null;
  read_count: number;
  total_read_time_seconds: number | null;
  user_id: string;
}

interface TopFavoriteQuote {
  quote_id: string | null;
  favorite_count: number;
  category: string | null;
  quote_text_preview: string | null;
}

// Utilisons un type générique pour les KPIs pour éviter les erreurs de type
// Nous découvrirons la structure réelle au runtime
export type UserKPIs = Record<string, any>;

// Structure de données combinée
export interface AnalyticsData {
  kpis: UserKPIs | null;
  sessionStats: DailySessionStat[];
  categoryReads: QuoteReadPerCategory[];
  topFavorites: TopFavoriteQuote[];
  lastUpdated: string;
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isStale: boolean;
}

// Helper pour formater les dates
const formatDateForSupabase = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString(); 
};

// Helper pour détecter les changements significatifs
const hasSignificantChange = (oldData: AnalyticsData | null, newData: AnalyticsData | null): boolean => {
  if (!oldData || !newData) return true;
  
  // Comparaison simple basée sur la structure des données
  const oldKpisKeys = oldData.kpis ? Object.keys(oldData.kpis).length : 0;
  const newKpisKeys = newData.kpis ? Object.keys(newData.kpis).length : 0;
  
  return (
    oldKpisKeys !== newKpisKeys ||
    oldData.sessionStats.length !== newData.sessionStats.length ||
    oldData.categoryReads.length !== newData.categoryReads.length ||
    oldData.topFavorites.length !== newData.topFavorites.length
  );
};

export const useAnalyticsData = (timeFilter: TimeFilterState): UseAnalyticsDataResult => {
  const { supabase, user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isStale, setIsStale] = useState<boolean>(false);
  
  // Références pour éviter les re-renders inutiles
  const lastFetchRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const refetch = useCallback(() => {
    console.log("🔄 Manual refetch triggered");
    setRefreshTrigger(prev => prev + 1);
    setIsStale(false);
  }, []);

  // Fonction de fetch principal avec gestion d'erreur améliorée
  const fetchData = useCallback(async () => {
    if (!supabase || !user) {
      console.log("⚠️ Supabase or user not available");
      setData(null);
      return;
    }

    // Éviter les requêtes en double
    const currentQuery = `${timeFilter.startDate}-${timeFilter.endDate}-${timeFilter.preset}-${user.id}`;
    if (currentQuery === lastFetchRef.current && isLoading) {
      console.log("🔄 Skipping duplicate request");
      return;
    }
    lastFetchRef.current = currentQuery;

    setIsLoading(true);
    setError(null);
    console.log("🔄 Fetching analytics data for period:", timeFilter.startDate, "to", timeFilter.endDate);

    try {
      const startDateStr = formatDateForSupabase(timeFilter.startDate);
      const endDateStr = formatDateForSupabase(timeFilter.endDate);

      // --- Fetch KPIs via votre fonction existante ---
      console.log("📊 Fetching KPIs...");
      let userKpis: UserKPIs | null = null;
      
      try {
        // Essayer d'abord avec get_my_kpis_for_user si elle existe
        const { data: kpisData, error: kpisError } = await supabase
          .rpc("get_my_kpis_for_user", {
            p_user_id: user.id
          });
        
        if (kpisError) {
          console.warn("⚠️ get_my_kpis_for_user failed, trying alternative:", kpisError.message);
          
          // Fallback: essayer get_my_kpis sans paramètre (si c'est votre convention)
          const { data: fallbackKpis, error: fallbackError } = await supabase
            .rpc("get_my_kpis");
          
          if (fallbackError) {
            throw new Error(`Both KPI methods failed: ${kpisError.message} / ${fallbackError.message}`);
          }
          
          userKpis = fallbackKpis && fallbackKpis.length > 0 ? fallbackKpis[0] : null;
        } else {
          userKpis = kpisData && kpisData.length > 0 ? kpisData[0] : null;
        }
      } catch (error) {
        console.error("❌ KPIs fetch failed:", error);
        // Ne pas throw ici, continuer avec userKpis = null
      }

      console.log("✅ KPIs loaded:", userKpis ? Object.keys(userKpis) : 'none');

      // --- Fetch Session Stats ---
      console.log("📈 Fetching session stats...");
      let sessionData: DailySessionStat[] = [];
      
      try {
        let sessionQuery = supabase
          .from("daily_session_stats")
          .select("*")
          .order("activity_date", { ascending: false })
          .limit(30);

        if (startDateStr) {
          sessionQuery = sessionQuery.gte("activity_date", startDateStr.split("T")[0]);
        }
        if (endDateStr) {
          sessionQuery = sessionQuery.lte("activity_date", endDateStr.split("T")[0]);
        }

        const { data: sessionResult, error: sessionError } = await sessionQuery;
        if (sessionError) {
          console.warn("⚠️ Session stats error (non-fatal):", sessionError);
        } else {
          sessionData = sessionResult || [];
        }
      } catch (error) {
        console.warn("⚠️ Session stats fetch failed (non-fatal):", error);
      }

      // --- Fetch Category Reads ---
      console.log("📚 Fetching category reads...");
      let categoryData: QuoteReadPerCategory[] = [];
      
      try {
        let categoryQuery = supabase
          .from("quote_reads_per_category_user")
          .select("*")
          .order("activity_date", { ascending: false })
          .limit(50);

        if (user?.id) {
          categoryQuery = categoryQuery.eq("user_id", user.id);
        }

        if (startDateStr) {
          categoryQuery = categoryQuery.gte("activity_date", startDateStr.split("T")[0]);
        }
        if (endDateStr) {
          categoryQuery = categoryQuery.lte("activity_date", endDateStr.split("T")[0]);
        }

        const { data: categoryResult, error: categoryError } = await categoryQuery;
        if (categoryError) {
          console.warn("⚠️ Category reads error (non-fatal):", categoryError);
        } else {
          categoryData = categoryResult || [];
        }
      } catch (error) {
        console.warn("⚠️ Category reads fetch failed (non-fatal):", error);
      }

      // --- Fetch Top Favorites ---
      console.log("⭐ Fetching top favorites...");
      let favoriteData: TopFavoriteQuote[] = [];
      
      try {
        const { data: favoriteResult, error: favoriteError } = await supabase
          .from("top_favorite_quotes")
          .select("quote_id, favorite_count, category, quote_text_preview")
          .order("favorite_count", { ascending: false })
          .limit(10);

        if (favoriteError) {
          console.warn("⚠️ Top favorites error (non-fatal):", favoriteError);
        } else {
          favoriteData = favoriteResult || [];
        }
      } catch (error) {
        console.warn("⚠️ Top favorites fetch failed (non-fatal):", error);
      }

      // --- Combine all data ---
      const newData: AnalyticsData = {
        kpis: userKpis,
        sessionStats: sessionData,
        categoryReads: categoryData,
        topFavorites: favoriteData,
        lastUpdated: new Date().toISOString()
      };

      // Vérifier si les données ont changé
      const hasChanged = hasSignificantChange(data, newData);
      if (hasChanged) {
        console.log("🎉 Analytics data updated with changes!");
        setData(newData);
      } else {
        console.log("📊 Analytics data refreshed (no significant changes)");
        // Mettre à jour le timestamp même sans changements
        setData(prev => prev ? { ...prev, lastUpdated: newData.lastUpdated } : newData);
      }

    } catch (err: any) {
      console.error("💥 Failed to fetch analytics data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Ne pas effacer les données existantes en cas d'erreur
      if (!data) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter.startDate, timeFilter.endDate, timeFilter.preset, supabase, user, data]);

  // Effect principal avec auto-refresh
  useEffect(() => {
    fetchData();

    // Configurer l'auto-refresh toutes les 30 secondes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      console.log("🔄 Auto-refreshing analytics data...");
      setIsStale(true);
      fetchData();
    }, 30000); // 30 secondes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshTrigger]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isStale 
  };
};

// Hook spécialisé pour les actions analytics
export const useAnalyticsActions = () => {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);

  const processQueuedEvents = async () => {
    if (!supabase) throw new Error("Supabase not available");

    try {
      setLoading(true);
      console.log("🔄 Processing queued events...");
      
      const { error } = await supabase.rpc('process_queued_events');
      
      if (error) throw error;
      
      console.log("✅ Queued events processed successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to process queued events:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const insertAnalyticsEvent = async (sessionId: string, type: string, payload: Record<string, any>) => {
    if (!supabase) throw new Error("Supabase not available");

    try {
      console.log("📊 Inserting analytics event:", type);
      
      const { data, error } = await supabase.rpc('insert_analytics_event', {
        p_session_id: sessionId,
        p_type: type,
        p_payload: payload
      });

      if (error) throw error;
      
      console.log("✅ Analytics event inserted:", data);
      return data;
    } catch (error) {
      console.error("❌ Failed to insert analytics event:", error);
      throw error;
    }
  };

  return {
    processQueuedEvents,
    insertAnalyticsEvent,
    loading
  };
};
// hooks/useAnalyticsData.ts - Version mise à jour compatible
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext"; 
import { TimeFilterState } from "./useTimeFilter";

// Interfaces correspondant à nos vues SQL
interface DailySessionStat {
  activity_date: string; // YYYY-MM-DD
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

// Interface pour les KPIs utilisateur (correspondant à notre fonction get_my_kpis)
export interface UserKPIs {
  user_id: string;
  sessions_last_30d: number | null;
  avg_session_duration_last_30d_secs: number | null;
  reads_last_30d: number | null;
  total_read_time_last_30d_secs: number | null;
  favorites_added_last_30d: number | null;
  most_read_category_last_30d: string | null;
}

// Structure de données combinée
export interface AnalyticsData {
  kpis: UserKPIs | null;
  sessionStats: DailySessionStat[];
  categoryReads: QuoteReadPerCategory[];
  topFavorites: TopFavoriteQuote[];
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Helper pour formater les dates pour Supabase
const formatDateForSupabase = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString(); 
};

export const useAnalyticsData = (timeFilter: TimeFilterState): UseAnalyticsDataResult => {
  const { supabase, user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
// Dans useAnalyticsData.ts

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!supabase || !user) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Fetching analytics data for period:", timeFilter.startDate, "to", timeFilter.endDate);

      try {
        const startDateStr = formatDateForSupabase(timeFilter.startDate);
        const endDateStr = formatDateForSupabase(timeFilter.endDate);

        // --- Fetch KPIs using our function ---
        console.log("📊 Fetching KPIs...");
        // Dans useAnalyticsData.ts
        const { data: kpisData, error: kpisError } = await supabase
          .rpc("get_my_kpis_for_user", {
            p_user_id: user.id // Passer l'user_id explicitement
          });                     

        
        if (kpisError) {
          console.error("❌ KPIs error:", kpisError);
          throw new Error(`KPIs fetch error: ${kpisError.message}`);
        }

        const userKpis: UserKPIs | null = kpisData && kpisData.length > 0 ? {
          user_id: kpisData[0].user_id,
          sessions_last_30d: kpisData[0].sessions_last_30d,
          avg_session_duration_last_30d_secs: kpisData[0].avg_session_duration_last_30d_secs,
          reads_last_30d: kpisData[0].reads_last_30d,
          total_read_time_last_30d_secs: kpisData[0].total_read_time_last_30d_secs,
          favorites_added_last_30d: kpisData[0].favorites_added_last_30d,
          most_read_category_last_30d: kpisData[0].most_read_category_last_30d
        } : null;

        console.log("✅ KPIs loaded:", userKpis);

        // --- Fetch Session Stats ---
        console.log("📈 Fetching session stats...");
        let sessionQuery = supabase
          .from("daily_session_stats")
          .select("*")
          .order("activity_date", { ascending: false })
          .limit(30); // Limiter pour éviter trop de données

        if (startDateStr) {
          sessionQuery = sessionQuery.gte("activity_date", startDateStr.split("T")[0]);
        }
        if (endDateStr) {
          sessionQuery = sessionQuery.lte("activity_date", endDateStr.split("T")[0]);
        }

        const { data: sessionData, error: sessionError } = await sessionQuery;
        if (sessionError) {
          console.error("❌ Session stats error:", sessionError);
          throw new Error(`Session stats fetch error: ${sessionError.message}`);
        }

        console.log("✅ Session stats loaded:", sessionData?.length || 0, "records");

        // --- Fetch Category Reads (user-specific) ---
        console.log("📚 Fetching category reads...");
        let categoryQuery = supabase
          .from("quote_reads_per_category_user")
          .select("*")
          .order("activity_date", { ascending: false })
          .limit(50);

        // Filtrer par utilisateur si possible (sinon prendre toutes les données)
        if (user?.id) {
          categoryQuery = categoryQuery.eq("user_id", user.id);
        }

        if (startDateStr) {
          categoryQuery = categoryQuery.gte("activity_date", startDateStr.split("T")[0]);
        }
        if (endDateStr) {
          categoryQuery = categoryQuery.lte("activity_date", endDateStr.split("T")[0]);
        }

        const { data: categoryData, error: categoryError } = await categoryQuery;
        if (categoryError) {
          console.error("❌ Category reads error:", categoryError);
          throw new Error(`Category reads fetch error: ${categoryError.message}`);
        }

        console.log("✅ Category reads loaded:", categoryData?.length || 0, "records");

        // --- Fetch Top Favorites ---
        console.log("⭐ Fetching top favorites...");
        const { data: favoriteData, error: favoriteError } = await supabase
          .from("top_favorite_quotes")
          .select("quote_id, favorite_count, category, quote_text_preview")
          .order("favorite_count", { ascending: false })
          .limit(10);

        if (favoriteError) {
          console.error("❌ Top favorites error:", favoriteError);
          throw new Error(`Top favorites fetch error: ${favoriteError.message}`);
        }

        console.log("✅ Top favorites loaded:", favoriteData?.length || 0, "records");

        // --- Combine all data ---
        const combinedData: AnalyticsData = {
          kpis: userKpis,
          sessionStats: sessionData || [],
          categoryReads: categoryData || [],
          topFavorites: favoriteData || [],
        };

        setData(combinedData);
        console.log("🎉 Analytics data successfully loaded!");

      } catch (err: any) {
        console.error("💥 Failed to fetch analytics data:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

  }, [timeFilter.startDate, timeFilter.endDate, timeFilter.preset, supabase, user, refreshTrigger]);

  return { data, isLoading, error, refetch };
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
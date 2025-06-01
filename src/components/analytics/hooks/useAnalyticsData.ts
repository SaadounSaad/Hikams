// /home/ubuntu/src/components/analytics/hooks/useAnalyticsData.ts
import { useState, useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
// Assuming useAuth provides the Supabase client
import { useAuth } from "../../../contexts/AuthContext"; 
import { TimeFilterState } from "./useTimeFilter";

// Define interfaces for the expected data shapes from Supabase views/functions
// These should align with the SQL views created in supabase_schema.sql

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
}

interface TopFavoriteQuote {
  quote_id: string | null;
  favorite_count: number;
}

// Data shape from the get_my_kpis() function or user_kpis view
interface UserKPIs {
  user_id: string;
  sessions_last_30d: number | null;
  avg_session_duration_last_30d_secs: number | null;
  reads_last_30d: number | null;
  total_read_time_last_30d_secs: number | null;
  favorites_added_last_30d: number | null;
  most_read_category_last_30d: string | null;
}

// Combined data structure returned by the hook
export interface AnalyticsData {
  kpis: UserKPIs | null;
  sessionStats: DailySessionStat[];
  categoryReads: QuoteReadPerCategory[];
  topFavorites: TopFavoriteQuote[];
  // Add more data points as needed
}

export interface UseAnalyticsDataResult {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void; // Function to manually trigger refetch
}

// Helper to format date for Supabase query
const formatDateForSupabase = (date: Date | null): string | null => {
  if (!date) return null;
  // Format as YYYY-MM-DD HH:MI:SS+TZ
  return date.toISOString(); 
};

export const useAnalyticsData = (timeFilter: TimeFilterState): UseAnalyticsDataResult => {
  const { supabaseClient, user } = useAuth(); // Get Supabase client and user
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0); // State to trigger refetch

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!supabaseClient || !user) {
      // Don't fetch if client or user is not available
      // Optionally clear previous data or set specific state
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Fetching analytics data for period:", timeFilter.startDate, "to", timeFilter.endDate);

      try {
        const startDateStr = formatDateForSupabase(timeFilter.startDate);
        const endDateStr = formatDateForSupabase(timeFilter.endDate);

        // --- Fetch KPIs --- 
        // Using the function ensures RLS is handled correctly via SECURITY DEFINER
        const { data: kpisData, error: kpisError } = await supabaseClient
          .rpc("get_my_kpis"); // Assuming the function returns a single row array

        if (kpisError) throw new Error(`KPIs fetch error: ${kpisError.message}`);
        const userKpis: UserKPIs | null = kpisData && kpisData.length > 0 ? kpisData[0] : null;

        // --- Fetch Session Stats (Example: using the view directly, requires SELECT grant) ---
        // Adjust filtering based on view structure and needs
        let sessionQuery = supabaseClient
          .from("daily_session_stats") // Use the view name
          .select("*")
          .order("activity_date", { ascending: false });

        if (startDateStr) {
          sessionQuery = sessionQuery.gte("activity_date", startDateStr.split("T")[0]); // Filter by date part
        }
        if (endDateStr) {
          sessionQuery = sessionQuery.lte("activity_date", endDateStr.split("T")[0]); // Filter by date part
        }

        const { data: sessionData, error: sessionError } = await sessionQuery;
        if (sessionError) throw new Error(`Session stats fetch error: ${sessionError.message}`);

        // --- Fetch Category Reads (Example: filtering user-specific data) ---
        let categoryQuery = supabaseClient
          .from("quote_reads_per_category")
          .select("activity_date, category_id, read_count, total_read_time_seconds")
          .eq("user_id", user.id) // Filter for the current user
          .order("activity_date", { ascending: false });

        if (startDateStr) {
          categoryQuery = categoryQuery.gte("activity_date", startDateStr.split("T")[0]);
        }
        if (endDateStr) {
          categoryQuery = categoryQuery.lte("activity_date", endDateStr.split("T")[0]);
        }

        const { data: categoryData, error: categoryError } = await categoryQuery;
        if (categoryError) throw new Error(`Category reads fetch error: ${categoryError.message}`);

        // --- Fetch Top Favorites (Global, not user/time specific in this example view) ---
        const { data: favoriteData, error: favoriteError } = await supabaseClient
          .from("top_favorite_quotes")
          .select("quote_id, favorite_count")
          .limit(10); // Limit the number of results

        if (favoriteError) throw new Error(`Top favorites fetch error: ${favoriteError.message}`);

        // --- Combine fetched data ---
        setData({
          kpis: userKpis,
          sessionStats: sessionData || [],
          categoryReads: categoryData || [],
          topFavorites: favoriteData || [],
        });

      } catch (err: any) {
        console.error("Failed to fetch analytics data:", err);
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
        setData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Dependency array: refetch when filter, user, client or trigger changes
  }, [timeFilter.startDate, timeFilter.endDate, timeFilter.preset, supabaseClient, user, refreshTrigger]);

  return { data, isLoading, error, refetch };
};


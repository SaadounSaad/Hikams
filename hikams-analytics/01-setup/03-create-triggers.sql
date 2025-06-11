-- ================================================================================
-- 3. RECRÉER LA FONCTION GET_MY_KPIS (SANS PARAMÈTRE)
-- ================================================================================

CREATE OR REPLACE FUNCTION get_my_kpis()
RETURNS TABLE(
  user_id UUID,
  sessions_last_30d INTEGER,
  avg_session_duration_last_30d_secs NUMERIC,
  active_days_last_30d INTEGER,
  total_events_last_30d INTEGER,
  reads_last_30d INTEGER,
  total_read_time_last_30d_secs NUMERIC,
  most_read_category_last_30d TEXT,
  unique_categories_read_last_30d INTEGER,
  favorites_added_last_30d INTEGER,
  favorites_removed_last_30d INTEGER,
  current_favorites_count INTEGER,
  searches_last_30d INTEGER,
  most_searched_terms TEXT,
  navigation_events_last_30d INTEGER,
  event_types_used_last_30d INTEGER,
  most_active_day_last_30d TEXT,
  longest_session_last_30d_secs NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM get_my_kpis_for_user(auth.uid());
END $$ LANGUAGE plpgsql;

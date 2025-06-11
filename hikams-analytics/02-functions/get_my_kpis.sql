
-- ================================================================================
-- 4. CRÉER UNE VERSION SIMPLIFIÉE POUR TESTER
-- ================================================================================

-- Version simple qui fonctionne à coup sûr
CREATE OR REPLACE FUNCTION get_my_kpis_simple()
RETURNS TABLE(
  current_favorites INTEGER,
  total_quotes INTEGER,
  events_last_30d INTEGER,
  sessions_last_30d INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM quotes WHERE is_favorite = true),
    (SELECT COUNT(*)::INTEGER FROM quotes),
    (SELECT COUNT(*)::INTEGER FROM analytics_events WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'),
    (SELECT COUNT(DISTINCT session_id)::INTEGER FROM analytics_events WHERE created_at >= CURRENT_DATE - INTERVAL '30 days');
END $$ LANGUAGE plpgsql;


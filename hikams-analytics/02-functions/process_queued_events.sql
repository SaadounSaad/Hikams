-- ================================================================================
-- 5. FONCTION DE NETTOYAGE RECRÉÉE
-- ================================================================================

CREATE OR REPLACE FUNCTION cleanup_old_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM analytics_events 
  WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END $$ LANGUAGE plpgsql;


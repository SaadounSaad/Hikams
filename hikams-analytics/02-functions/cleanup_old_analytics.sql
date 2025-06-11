-- ================================================================================
-- 6. FONCTION DE TRAITEMENT DES ÉVÉNEMENTS RECRÉÉE
-- ================================================================================

CREATE OR REPLACE FUNCTION process_queued_events()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
BEGIN
  -- Rafraîchir les vues matérialisées si elles existent
  BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW IF EXISTS daily_session_stats_mv';
    processed_count := processed_count + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer si la vue n'existe pas
  END;
  
  BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW IF EXISTS quote_reads_per_category_user_mv';
    processed_count := processed_count + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer si la vue n'existe pas
  END;
  
  BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW IF EXISTS top_favorite_quotes_mv';
    processed_count := processed_count + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorer si la vue n'existe pas
  END;
  
  RETURN processed_count;
END $$ LANGUAGE plpgsql;


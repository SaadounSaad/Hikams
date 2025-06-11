CREATE OR REPLACE FUNCTION get_my_kpis_for_user(p_user_id UUID)
RETURNS TABLE(
  user_id UUID,
  -- Sessions et temps
  sessions_last_30d INTEGER,
  avg_session_duration_last_30d_secs NUMERIC,
  active_days_last_30d INTEGER,
  total_events_last_30d INTEGER,
  
  -- Lectures et contenu
  reads_last_30d INTEGER,
  total_read_time_last_30d_secs NUMERIC,
  most_read_category_last_30d TEXT,
  unique_categories_read_last_30d INTEGER,
  
  -- Favoris et interactions
  favorites_added_last_30d INTEGER,
  favorites_removed_last_30d INTEGER,
  current_favorites_count INTEGER,
  
  -- Recherche et navigation
  searches_last_30d INTEGER,
  most_searched_terms TEXT,
  navigation_events_last_30d INTEGER,
  
  -- Engagement
  event_types_used_last_30d INTEGER,
  most_active_day_last_30d TEXT,
  longest_session_last_30d_secs NUMERIC
) AS $$
DECLARE
  cutoff_date DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  RETURN QUERY
  WITH user_sessions AS (
    -- Calculer les sessions pour cet utilisateur
    SELECT 
      session_id,
      MIN(created_at) as session_start,
      MAX(created_at) as session_end,
      EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds,
      COUNT(*) as events_count
    FROM analytics_events 
    WHERE user_id = p_user_id 
    AND created_at >= cutoff_date
    GROUP BY session_id
  ),
  user_reading_events AS (
    -- Événements de lecture pour cet utilisateur
    SELECT *
    FROM analytics_events 
    WHERE user_id = p_user_id 
    AND type IN ('quote_viewed', 'quote_read', 'content_read')
    AND created_at >= cutoff_date
  ),
  user_search_events AS (
    -- Événements de recherche
    SELECT *
    FROM analytics_events 
    WHERE user_id = p_user_id 
    AND type LIKE '%search%'
    AND created_at >= cutoff_date
  )
  SELECT 
    p_user_id,
    
    -- === SESSIONS ET TEMPS ===
    (SELECT COUNT(DISTINCT session_id)::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id AND created_at >= cutoff_date),
    
    -- Durée moyenne des sessions
    (SELECT COALESCE(AVG(duration_seconds), 300)::NUMERIC 
     FROM user_sessions 
     WHERE events_count > 1),
    
    -- Jours actifs
    (SELECT COUNT(DISTINCT DATE(created_at))::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id AND created_at >= cutoff_date),
    
    -- Total événements
    (SELECT COUNT(*)::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id AND created_at >= cutoff_date),
    
    -- === LECTURES ET CONTENU ===
    (SELECT COUNT(*)::INTEGER FROM user_reading_events),
    
    -- Temps de lecture total
    (SELECT COALESCE(SUM((payload->>'duration')::numeric), COUNT(*) * 30)::NUMERIC
     FROM user_reading_events),
    
    -- Catégorie la plus lue
    (SELECT payload->>'category'
     FROM user_reading_events
     WHERE payload->>'category' IS NOT NULL
     GROUP BY payload->>'category' 
     ORDER BY COUNT(*) DESC 
     LIMIT 1),
    
    -- Catégories uniques consultées
    (SELECT COUNT(DISTINCT payload->>'category')::INTEGER
     FROM user_reading_events
     WHERE payload->>'category' IS NOT NULL),
    
    -- === FAVORIS ET INTERACTIONS ===
    (SELECT COUNT(*)::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id 
     AND type LIKE '%favorite_added%'
     AND created_at >= cutoff_date),
    
    (SELECT COUNT(*)::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id 
     AND type LIKE '%favorite_removed%'
     AND created_at >= cutoff_date),
    
    -- Favoris actuels dans la table quotes
    (SELECT COUNT(*)::INTEGER 
     FROM quotes 
     WHERE user_id = p_user_id 
     AND is_favorite = true),
    
    -- === RECHERCHE ET NAVIGATION ===
    (SELECT COUNT(*)::INTEGER FROM user_search_events),
    
    -- Termes les plus recherchés
    (SELECT payload->>'search_term'
     FROM user_search_events
     WHERE payload->>'search_term' IS NOT NULL
     GROUP BY payload->>'search_term' 
     ORDER BY COUNT(*) DESC 
     LIMIT 1),
    
    -- Événements de navigation
    (SELECT COUNT(*)::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id 
     AND type IN ('category_changed', 'navigation', 'menu_click')
     AND created_at >= cutoff_date),
    
    -- === ENGAGEMENT ===
    (SELECT COUNT(DISTINCT type)::INTEGER 
     FROM analytics_events 
     WHERE user_id = p_user_id 
     AND created_at >= cutoff_date),
    
    -- Jour le plus actif
    (SELECT TO_CHAR(DATE(created_at), 'Day')
     FROM analytics_events 
     WHERE user_id = p_user_id 
     AND created_at >= cutoff_date
     GROUP BY DATE(created_at) 
     ORDER BY COUNT(*) DESC 
     LIMIT 1),
    
    -- Session la plus longue
    (SELECT COALESCE(MAX(duration_seconds), 0)::NUMERIC 
     FROM user_sessions 
     WHERE events_count > 1);
END $$ LANGUAGE plpgsql;
- ================================================================================
-- 8. VÉRIFICATION DE LA SANTÉ DU SYSTÈME
-- ================================================================================

-- Vue de santé recréée
DROP VIEW IF EXISTS analytics_health_dashboard CASCADE;

CREATE VIEW analytics_health_dashboard AS
SELECT 
  NOW() as check_time,
  
  -- Activité générale
  (SELECT COUNT(*) FROM analytics_events WHERE DATE(created_at) = CURRENT_DATE) as events_today,
  (SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE DATE(created_at) = CURRENT_DATE) as active_users_today,
  (SELECT COUNT(DISTINCT type) FROM analytics_events) as total_event_types,
  (SELECT MAX(created_at) FROM analytics_events) as last_event_time,
  
  -- Favoris et contenu
  (SELECT COUNT(*) FROM quotes WHERE is_favorite = true) as total_favorites,
  (SELECT COUNT(*) FROM top_favorite_quotes) as favorites_in_view,
  
  -- Vues analytics
  (SELECT COUNT(*) FROM daily_session_stats WHERE activity_date >= CURRENT_DATE - 7) as active_days_last_week,
  
  -- Statut de santé
  CASE 
    WHEN (SELECT COUNT(*) FROM analytics_events WHERE DATE(created_at) = CURRENT_DATE) > 0 
         AND (SELECT COUNT(*) FROM quotes WHERE is_favorite = true) = 
             (SELECT COUNT(*) FROM top_favorite_quotes)
    THEN '✅ HEALTHY' 
    ELSE '⚠️ NEEDS_ATTENTION' 
  END as overall_health_status;

-- Test de santé
SELECT * FROM analytics_health_dashboard;


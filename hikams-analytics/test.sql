-- ================================================================================
-- 7. TESTS POUR VÉRIFIER QUE TOUT FONCTIONNE
-- ================================================================================

-- Test 1: Version simple (doit marcher)
SELECT 
  '✅ TEST SIMPLE' as test,
  current_favorites,
  total_quotes,
  events_last_30d,
  sessions_last_30d
FROM get_my_kpis_simple();

-- Test 2: Version complète (si pas d'erreur)
SELECT 
  '✅ TEST COMPLET' as test,
  sessions_last_30d,
  current_favorites_count,
  reads_last_30d,
  most_read_category_last_30d
FROM get_my_kpis()
LIMIT 1;

-- Test 3: Vérifier daily_session_stats
SELECT 
  '✅ TEST SESSIONS' as test,
  COUNT(*) as records,
  MAX(activity_date) as latest_date
FROM daily_session_stats;

-- Test 4: Vérifier top_favorite_quotes
SELECT 
  '✅ TEST FAVORITES' as test,
  COUNT(*) as total_favorites,
  COUNT(DISTINCT category) as categories
FROM top_favorite_quotes;

-
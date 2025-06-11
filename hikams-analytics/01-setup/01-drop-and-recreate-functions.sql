- 🔧 FIX - SUPPRIMER ET RECRÉER LES FONCTIONS
-- Résolution de l'erreur: cannot change return type of existing function

-- ================================================================================
-- 1. SUPPRIMER TOUTES LES ANCIENNES FONCTIONS
-- ================================================================================

-- Supprimer toutes les versions existantes des fonctions KPI
DROP FUNCTION IF EXISTS get_my_kpis_for_user(uuid);
DROP FUNCTION IF EXISTS get_my_kpis();
DROP FUNCTION IF EXISTS analyze_user_patterns(uuid);
DROP FUNCTION IF EXISTS sync_favorite_quotes();
DROP FUNCTION IF EXISTS cleanup_old_analytics(integer);
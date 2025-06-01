# Structure de Données Supabase - Hikams Analytics

Ce document définit le schéma de la base de données PostgreSQL dans Supabase pour stocker et agréger les données analytiques de l'application Hikams. Il inclut la définition des tables, des vues pour l'agrégation, les politiques de sécurité au niveau des lignes (RLS), et un script de migration SQL complet.

## 1. Table `user_analytics_events`

Cette table stockera les événements bruts envoyés par l'application via `AnalyticsService`.

**Schéma SQL (Partie de la migration complète ci-dessous) :**

```sql
-- Créer la table principale pour les événements bruts
CREATE TABLE IF NOT EXISTS public.user_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  -- Métadonnées communes
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Référence à l'utilisateur authentifié (peut être NULL si anonyme ou désactivé)
  session_id UUID NOT NULL, -- Identifiant unique de la session client
  event_type TEXT NOT NULL CHECK (char_length(event_type) > 0), -- Type d'événement (ex: 'app_open', 'quote_read')
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL, -- Timestamp de l'enregistrement serveur
  client_timestamp TIMESTAMPTZ NOT NULL, -- Timestamp de l'événement côté client

  -- Données spécifiques à l'événement (payload)
  payload JSONB
);
```

## 2. Vues SQL pour l'Agrégation

Les vues simplifient les requêtes depuis le frontend et encapsulent la logique d'agrégation. Des exemples (`daily_sessions`, `daily_session_stats`, `quote_reads_per_category`, `top_favorite_quotes`, `user_kpis`) sont inclus dans le script de migration complet ci-dessous.

## 3. Politiques de Sécurité au Niveau des Lignes (RLS)

Les politiques RLS sont cruciales pour garantir que les utilisateurs ne puissent accéder qu'à leurs propres données analytiques.

**Politiques pour `user_analytics_events` (Exemples dans le script complet) :**

*   **INSERT**: Utilisateurs authentifiés peuvent insérer leurs propres événements (ou anonymes).
*   **SELECT**: Utilisateurs authentifiés peuvent lire uniquement leurs propres événements.
*   **UPDATE/DELETE**: Non autorisés pour les utilisateurs standards.

**Accès aux Vues**: Les RLS de la table s'appliquent aux vues personnelles. Pour les vues agrégées ou personnelles, l'utilisation de fonctions `SECURITY DEFINER` (comme `get_my_kpis`) est recommandée pour un contrôle d'accès sécurisé.

## 4. Script de Migration SQL Complet

Ce script combine toutes les étapes précédentes pour être exécuté via l'éditeur SQL de Supabase ou un outil de migration.

```sql
-- Hikams Analytics - Supabase Migration Script

BEGIN; -- Start Transaction

-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS public.user_analytics_events DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes vues (ordre inverse des dépendances si nécessaire)
DROP VIEW IF EXISTS public.daily_active_users;
DROP VIEW IF EXISTS public.user_kpis;
DROP VIEW IF EXISTS public.daily_session_stats;
DROP VIEW IF EXISTS public.daily_sessions;
DROP VIEW IF EXISTS public.quote_reads_per_category;
DROP VIEW IF EXISTS public.top_favorite_quotes;

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.get_my_kpis();

-- Supprimer l'ancienne table (Optionnel, pour tests - ATTENTION EN PROD)
-- DROP TABLE IF EXISTS public.user_analytics_events CASCADE;

-- Créer la table principale
CREATE TABLE IF NOT EXISTS public.user_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (char_length(event_type) > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB
);

-- Ajouter les commentaires
COMMENT ON TABLE public.user_analytics_events IS 'Table stockant les événements analytiques bruts générés par les clients Hikams.';
COMMENT ON COLUMN public.user_analytics_events.user_id IS 'ID de l''utilisateur authentifié (peut être NULL).';
COMMENT ON COLUMN public.user_analytics_events.session_id IS 'Identifiant unique de la session client.';
COMMENT ON COLUMN public.user_analytics_events.event_type IS 'Type d''événement (ex: app_open, quote_read).';
COMMENT ON COLUMN public.user_analytics_events.created_at IS 'Timestamp de l''enregistrement côté serveur (UTC).';
COMMENT ON COLUMN public.user_analytics_events.client_timestamp IS 'Timestamp de l''événement côté client (avec fuseau horaire).';
COMMENT ON COLUMN public.user_analytics_events.payload IS 'Données JSON spécifiques à l''événement.';

-- Créer les index
DROP INDEX IF EXISTS idx_user_analytics_events_user_id;
CREATE INDEX idx_user_analytics_events_user_id ON public.user_analytics_events(user_id) WHERE user_id IS NOT NULL;
DROP INDEX IF EXISTS idx_user_analytics_events_event_type;
CREATE INDEX idx_user_analytics_events_event_type ON public.user_analytics_events(event_type);
DROP INDEX IF EXISTS idx_user_analytics_events_created_at;
CREATE INDEX idx_user_analytics_events_created_at ON public.user_analytics_events(created_at);
DROP INDEX IF EXISTS idx_user_analytics_events_client_timestamp;
CREATE INDEX idx_user_analytics_events_client_timestamp ON public.user_analytics_events(client_timestamp);
DROP INDEX IF EXISTS idx_user_analytics_events_session_id;
CREATE INDEX idx_user_analytics_events_session_id ON public.user_analytics_events(session_id);

-- Activer et Forcer RLS sur la table
ALTER TABLE public.user_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics_events FORCE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Allow authenticated users to insert their own events" ON public.user_analytics_events;
DROP POLICY IF EXISTS "Allow users to read their own events" ON public.user_analytics_events;

-- Créer les politiques RLS pour la table
CREATE POLICY "Allow authenticated users to insert their own events"
  ON public.user_analytics_events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND (user_id IS NULL OR auth.uid() = user_id));

CREATE POLICY "Allow users to read their own events"
  ON public.user_analytics_events
  FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Créer les vues d'agrégation
CREATE OR REPLACE VIEW public.daily_sessions AS
SELECT
  date_trunc('day', client_timestamp AT TIME ZONE 'UTC')::date AS activity_date,
  user_id,
  session_id,
  min(client_timestamp) AS session_start,
  max(client_timestamp) AS session_end,
  extract(epoch from (max(client_timestamp) - min(client_timestamp))) AS session_duration_seconds
FROM public.user_analytics_events
GROUP BY activity_date, user_id, session_id;
COMMENT ON VIEW public.daily_sessions IS 'Agrège les événements par session pour chaque utilisateur et jour.';

CREATE OR REPLACE VIEW public.daily_session_stats AS
SELECT
  activity_date,
  count(DISTINCT user_id) AS unique_users,
  count(session_id) AS total_sessions,
  avg(session_duration_seconds) AS avg_session_duration_seconds,
  sum(session_duration_seconds) AS total_session_time_seconds
FROM public.daily_sessions
GROUP BY activity_date;
COMMENT ON VIEW public.daily_session_stats IS 'Statistiques globales sur les sessions par jour (utilisateurs uniques, nombre de sessions, durée moyenne).';

CREATE OR REPLACE VIEW public.daily_active_users AS
SELECT
  activity_date,
  unique_users AS dau_count
FROM public.daily_session_stats;
COMMENT ON VIEW public.daily_active_users IS 'Nombre d''utilisateurs actifs uniques par jour (basé sur les sessions).';

CREATE OR REPLACE VIEW public.quote_reads_per_category AS
SELECT
  date_trunc('day', client_timestamp AT TIME ZONE 'UTC')::date AS activity_date,
  user_id,
  payload ->> 'categoryId' AS category_id,
  count(*) AS read_count,
  sum((payload ->> 'readTime')::numeric) AS total_read_time_seconds
FROM public.user_analytics_events
WHERE event_type = 'quote_read' AND payload ->> 'categoryId' IS NOT NULL AND payload ->> 'readTime' ~ '^[0-9]+(\.[0-9]+)?$'
GROUP BY activity_date, user_id, category_id;
COMMENT ON VIEW public.quote_reads_per_category IS 'Nombre de lectures et temps total passé par catégorie, utilisateur et jour.';

CREATE OR REPLACE VIEW public.top_favorite_quotes AS
SELECT
  payload ->> 'quoteId' AS quote_id,
  count(*) AS favorite_count
FROM public.user_analytics_events
WHERE event_type = 'favorite_interaction' AND payload ->> 'action' = 'add' AND payload ->> 'quoteId' IS NOT NULL
GROUP BY quote_id
ORDER BY favorite_count DESC;
COMMENT ON VIEW public.top_favorite_quotes IS 'Classement des citations les plus ajoutées en favoris.';

-- Créer la vue user_kpis (nécessite que les autres vues existent)
CREATE OR REPLACE VIEW public.user_kpis AS
SELECT
    usr.id as user_id,
    COUNT(DISTINCT evt.session_id) FILTER (WHERE evt.client_timestamp >= now() - interval '30 days') as sessions_last_30d,
    AVG(ds.session_duration_seconds) FILTER (WHERE ds.activity_date >= (now() - interval '30 days')::date) as avg_session_duration_last_30d_secs,
    COUNT(evt.id) FILTER (WHERE evt.event_type = 'quote_read' AND evt.client_timestamp >= now() - interval '30 days') as reads_last_30d,
    SUM((evt.payload ->> 'readTime')::numeric) FILTER (WHERE evt.event_type = 'quote_read' AND evt.client_timestamp >= now() - interval '30 days' AND evt.payload ->> 'readTime' ~ '^[0-9]+(\.[0-9]+)?$') as total_read_time_last_30d_secs,
    COUNT(evt.id) FILTER (WHERE evt.event_type = 'favorite_interaction' AND evt.payload ->> 'action' = 'add' AND evt.client_timestamp >= now() - interval '30 days') as favorites_added_last_30d,
    (SELECT prpc.category_id
     FROM public.quote_reads_per_category prpc
     WHERE prpc.user_id = usr.id AND prpc.activity_date >= (now() - interval '30 days')::date
     GROUP BY prpc.category_id
     ORDER BY SUM(prpc.read_count) DESC
     LIMIT 1) as most_read_category_last_30d
FROM
    auth.users usr
LEFT JOIN
    public.user_analytics_events evt ON usr.id = evt.user_id
LEFT JOIN
    public.daily_sessions ds ON evt.session_id = ds.session_id AND evt.user_id = ds.user_id AND date_trunc('day', evt.client_timestamp AT TIME ZONE 'UTC')::date = ds.activity_date
GROUP BY
    usr.id;
COMMENT ON VIEW public.user_kpis IS 'KPIs agrégés par utilisateur pour affichage dans le dashboard personnel (ex: sur les 30 derniers jours).';

-- Créer la fonction sécurisée pour accéder aux KPIs personnels
CREATE OR REPLACE FUNCTION public.get_my_kpis()
RETURNS SETOF public.user_kpis -- Utilise le type créé par la vue
LANGUAGE sql
STABLE -- Indique que la fonction ne modifie pas la base de données
SECURITY DEFINER
SET search_path = public -- Assure que la fonction trouve les vues dans le bon schéma
AS $$
  SELECT * FROM public.user_kpis WHERE user_id = auth.uid();
$$;

-- Accorder l'exécution de la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_my_kpis() TO authenticated;

-- Accorder SELECT sur les vues globales si nécessaire (à évaluer selon la politique de sécurité)
-- GRANT SELECT ON public.daily_session_stats TO authenticated;
-- GRANT SELECT ON public.top_favorite_quotes TO authenticated;
-- GRANT SELECT ON public.daily_active_users TO authenticated;

COMMIT; -- End Transaction
```

Ce script est conçu pour être idempotent dans la mesure du possible (en utilisant `IF NOT EXISTS` pour la table, `DROP IF EXISTS` pour les index, vues, fonctions et politiques avant de les recréer). Assurez-vous de le tester dans un environnement de développement avant de l'appliquer en production.

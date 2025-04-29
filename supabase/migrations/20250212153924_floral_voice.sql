/*
  # Correction de la table des préférences utilisateur

  1. Modifications
    - Suppression des politiques existantes pour éviter les conflits
    - Recréation de la table avec les bonnes contraintes
    - Ajout de nouvelles politiques RLS optimisées

  2. Sécurité
    - Enable RLS
    - Politique unique pour toutes les opérations
*/

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can read their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert and update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;

-- Suppression et recréation de la table
DROP TABLE IF EXISTS user_preferences;

CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  prayer_city text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Activation de RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Création d'une politique unique pour toutes les opérations
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
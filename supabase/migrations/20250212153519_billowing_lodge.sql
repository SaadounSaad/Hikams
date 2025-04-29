/*
  # Création de la table des préférences utilisateur

  1. Nouvelle Table
    - `user_preferences`
      - `user_id` (uuid, clé primaire)
      - `prayer_city` (text, ville sélectionnée pour les horaires de prière)
      - `updated_at` (timestamp avec fuseau horaire)

  2. Sécurité
    - Active RLS sur la table
    - Ajoute des politiques pour la lecture et l'écriture des préférences utilisateur
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  prayer_city text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture des préférences
CREATE POLICY "Users can read their own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique pour l'insertion et la mise à jour des préférences
CREATE POLICY "Users can insert and update their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
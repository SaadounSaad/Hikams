/*
  # Ajout de la table des préférences utilisateur

  1. Nouvelle Table
    - `user_preferences`
      - `user_id` (uuid, primary key, référence à auth.users)
      - `prayer_city` (text, ville sélectionnée pour les horaires de prière)
      - `updated_at` (timestamptz, date de dernière mise à jour)

  2. Sécurité
    - Enable RLS sur la table `user_preferences`
    - Ajout d'une politique unique pour toutes les opérations
*/

-- Création de la table si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_preferences'
  ) THEN
    CREATE TABLE user_preferences (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id),
      prayer_city text,
      updated_at timestamptz DEFAULT now()
    );

    ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

    -- Une seule politique pour toutes les opérations
    CREATE POLICY "Users can manage their own preferences"
      ON user_preferences
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
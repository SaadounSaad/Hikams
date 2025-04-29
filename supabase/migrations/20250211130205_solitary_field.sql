/*
  # Création de la table des citations

  1. Nouvelle Table
    - `quotes`
      - `id` (uuid, clé primaire)
      - `text` (text, obligatoire)
      - `category` (text, obligatoire)
      - `source` (text)
      - `is_favorite` (boolean)
      - `created_at` (timestamp avec fuseau horaire)
      - `scheduled_date` (timestamp avec fuseau horaire)
      - `user_id` (uuid, clé étrangère vers auth.users)

  2. Sécurité
    - Activation de RLS sur la table `quotes`
    - Ajout de politiques pour permettre aux utilisateurs de gérer leurs propres citations
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  category text NOT NULL,
  source text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  scheduled_date timestamptz,
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture des citations
CREATE POLICY "Users can read their own quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique pour l'insertion de citations
CREATE POLICY "Users can insert their own quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique pour la mise à jour des citations
CREATE POLICY "Users can update their own quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour la suppression des citations
CREATE POLICY "Users can delete their own quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
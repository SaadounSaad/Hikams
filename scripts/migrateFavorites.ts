import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Création du client Supabase avec la clé de service pour accéder à toutes les données
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateFavorites() {
  console.log('Début de la migration des favoris...');

  try {
    // 1. Créer la nouvelle table favorites si elle n'existe pas déjà
    const { error: tableError } = await supabase.rpc('create_favorites_table_if_not_exists', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS favorites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          content_type TEXT NOT NULL,
          content_id UUID NOT NULL,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
          notes TEXT,
          UNIQUE(user_id, content_type, content_id)
        );
      `
    });

    if (tableError) {
      throw new Error(`Erreur lors de la création de la table: ${tableError.message}`);
    }

    // 2. Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
    }

    console.log(`${users.length} utilisateurs trouvés`);

    // 3. Pour chaque utilisateur, migrer ses favoris
    for (const user of users) {
      await migrateUserFavorites(user.id);
    }

    console.log('Migration terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  }
}

async function migrateUserFavorites(userId: string) {
  console.log(`Migration des favoris pour l'utilisateur ${userId}...`);
  
  try {
    // 1. Récupérer toutes les citations favorites
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('user_id', userId)
      .eq('is_favorite', true);

    if (quotesError) {
      throw new Error(`Erreur lors de la récupération des citations: ${quotesError.message}`);
    }

    console.log(`${quotes?.length || 0} citations favorites trouvées`);

    // 2. Récupérer tous les livres favoris
    const { data: bookFavorites, error: bookError } = await supabase
      .from('book_favorites')
      .select('entry_id, notes')
      .eq('user_id', userId);

    if (bookError) {
      throw new Error(`Erreur lors de la récupération des livres favoris: ${bookError.message}`);
    }

    console.log(`${bookFavorites?.length || 0} livres favoris trouvés`);

    // 3. Préparer les données pour insertion
    const favoritesToInsert = [
      ...(quotes || []).map((quote) => ({
        user_id: userId,
        content_type: 'quote',
        content_id: quote.id,
      })),
      ...(bookFavorites || []).map((book) => ({
        user_id: userId,
        content_type: 'book-entry',
        content_id: book.entry_id,
        notes: book.notes,
      })),
    ];

    // 4. Insérer les nouveaux favoris (avec gestion des doublons)
    if (favoritesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('favorites')
        .upsert(favoritesToInsert, { 
          onConflict: 'user_id,content_type,content_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        throw new Error(`Erreur lors de l'insertion des favoris: ${insertError.message}`);
      }

      console.log(`${favoritesToInsert.length} favoris migrés avec succès`);
    } else {
      console.log('Aucun favori à migrer');
    }
  } catch (error) {
    console.error(`Erreur lors de la migration pour l'utilisateur ${userId}:`, error);
  }
}

// Exécuter la migration
migrateFavorites()
  .then(() => {
    console.log('Script de migration terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  });
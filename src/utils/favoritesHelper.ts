// utils/favoritesHelper.ts - Version optimisée avec cache
import { supabase } from '../lib/supabase';
import { Quote } from '../types';

// Système de cache pour éviter les appels excessifs
let cachedFavorites: Quote[] = [];
let cacheExpiry = 0;
const CACHE_DURATION = 10000; // 10 secondes

/**
 * Récupère tous les favoris unifiés (quotes + book_entries) depuis la table favorites
 * avec implémentation de cache pour éviter les appels excessifs
 */
export async function getUnifiedFavorites(userId: string): Promise<Quote[]> {
  try {
    // Vérifier si on a un cache valide
    const now = Date.now();
    if (cachedFavorites.length > 0 && now < cacheExpiry) {
      console.log(`🚀 Utilisation du cache pour les favoris (${cachedFavorites.length} éléments)`);
      return cachedFavorites;
    }
    
    console.log('🔍 Récupération des favoris unifiés pour:', userId);
    
    // Récupérer tous les favoris de l'utilisateur
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des favoris:', error);
      throw error;
    }

    if (!favorites || favorites.length === 0) {
      console.log('📭 Aucun favori trouvé');
      // Mettre à jour le cache même s'il est vide
      cachedFavorites = [];
      cacheExpiry = now + CACHE_DURATION;
      return [];
    }

    console.log(`📊 ${favorites.length} favoris trouvés dans la table favorites`);

    // Transformer chaque favori en objet Quote uniforme
    const unifiedQuotes: Quote[] = favorites.map(favorite => {
      const baseQuote: Quote = {
        id: favorite.content_type === 'book_entry' 
          ? `book-entry-${favorite.content_id}` 
          : favorite.content_id,
        text: favorite.content,
        source: favorite.source,
        category: favorite.content_type === 'book_entry' ? 'book-library' : 'favorites',
        user_id: favorite.user_id,
        createdAt: favorite.createdAt,
        isFavorite: true,
        isBookEntry: favorite.content_type === 'book_entry',
        originalEntryId: favorite.content_type === 'book_entry' 
          ? parseInt(favorite.content_id) 
          : undefined
      };

      return baseQuote;
    });

    console.log(`✅ ${unifiedQuotes.length} favoris transformés avec succès`);
    
    // Log détaillé pour debug
    const quotesCount = unifiedQuotes.filter(q => !q.isBookEntry).length;
    const bookEntriesCount = unifiedQuotes.filter(q => q.isBookEntry).length;
    console.log(`📈 Répartition: ${quotesCount} quotes, ${bookEntriesCount} book entries`);

    // Mettre en cache le résultat
    cachedFavorites = unifiedQuotes;
    cacheExpiry = now + CACHE_DURATION;

    return unifiedQuotes;

  } catch (error) {
    console.error('❌ Erreur dans getUnifiedFavorites:', error);
    return [];
  }
}

/**
 * Fonction pour invalider explicitement le cache
 */
export function invalidateFavoritesCache() {
  console.log('🔄 Invalidation du cache des favoris');
  cachedFavorites = [];
  cacheExpiry = 0;
}

/**
 * Fonction de debug pour vérifier le contenu et la transformation des favoris
 */
export async function debugFavorites(userId: string) {
  try {
    // Invalider le cache pour forcer une récupération fraîche
    invalidateFavoritesCache();
    
    // Récupérer directement les favoris de la base
    const { data: rawFavorites } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);
    
    console.log('🔎 DEBUG: Favoris bruts récupérés:', rawFavorites?.length);
    
    if (rawFavorites && rawFavorites.length > 0) {
      console.log('🔎 DEBUG: Premier favori brut:', JSON.stringify(rawFavorites[0], null, 2));
    }
    
    // Récupérer les favoris transformés
    const transformedFavorites = await getUnifiedFavorites(userId);
    
    console.log('🔎 DEBUG: Favoris transformés:', transformedFavorites.length);
    
    if (transformedFavorites.length > 0) {
      console.log('🔎 DEBUG: Premier favori transformé:', JSON.stringify(transformedFavorites[0], null, 2));
    }
    
    return {
      raw: rawFavorites,
      transformed: transformedFavorites
    };
  } catch (error) {
    console.error('❌ Erreur lors du débogage des favoris:', error);
    return null;
  }
}

/**
 * Migration des anciens favoris vers le nouveau système (optionnel)
 * Utilisez cette fonction une seule fois pour migrer les données existantes
 */
export async function migrateLegacyFavorites(userId: string): Promise<void> {
  try {
    console.log('🔄 Début de la migration des favoris pour:', userId);

    // Migrer les quotes favorites
    const { data: favoriteQuotes } = await supabase
      .from('quotes')
      .select('id, text, source')
      .eq('user_id', userId)
      .eq('isFavorite', true); // Ancienne colonne isFavorite

    if (favoriteQuotes && favoriteQuotes.length > 0) {
      const quotesToMigrate = favoriteQuotes.map(quote => ({
        user_id: userId,
        content: quote.text,
        source: quote.source,
        content_id: quote.id,
        content_type: 'quote' as const
      }));

      const { error: insertError } = await supabase
        .from('favorites')
        .upsert(quotesToMigrate, { 
          onConflict: 'user_id,content_id,content_type' 
        });

      if (insertError) {
        console.error('❌ Erreur migration quotes:', insertError);
      } else {
        console.log(`✅ ${favoriteQuotes.length} quotes migrées`);
      }
    }

    // Migrer les book_entries favorites (si elles existent)
    const { data: favoriteBookEntries } = await supabase
      .from('book_entries')
      .select('id, content, book_title')
      .eq('is_favorite', true); // Nouvelle colonne is_favorite

    if (favoriteBookEntries && favoriteBookEntries.length > 0) {
      const bookEntriesToMigrate = favoriteBookEntries.map(entry => ({
        user_id: userId,
        content: entry.content,
        source: entry.book_title,
        content_id: entry.id.toString(),
        content_type: 'book_entry' as const
      }));

      const { error: insertError } = await supabase
        .from('favorites')
        .upsert(bookEntriesToMigrate, { 
          onConflict: 'user_id,content_id,content_type' 
        });

      if (insertError) {
        console.error('❌ Erreur migration book entries:', insertError);
      } else {
        console.log(`✅ ${favoriteBookEntries.length} book entries migrées`);
      }
    }

    // Invalider le cache après une migration
    invalidateFavoritesCache();
    
    console.log('✅ Migration des favoris terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}
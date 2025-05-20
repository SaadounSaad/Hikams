// favoritesService.ts - Version complète corrigée avec gestion des erreurs robuste
import { supabase } from '../lib/supabase';

export interface FavoriteItem {
  id: string;
  user_id: string;
  content: string;
  source: string;
  content_id: string;
  content_type: 'quote' | 'book_entry';
  createdAt: string;
}

export class FavoritesService {
  // Propriété statique pour suivre l'état de synchronisation
  private static _isSynchronizing = false;

  /**
   * Utilitaire pour exécuter une requête avec retry et timeout
   */
  private static async executeWithRetry<T>(
    operation: () => Promise<T>, 
    maxRetries = 2, 
    timeoutMs = 15000
  ): Promise<T | { error: any }> {
    let retries = 0;
    
    // Création d'une promesse de timeout
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Opération expirée après ' + timeoutMs + 'ms'));
      }, timeoutMs);
    });
    
    while (retries <= maxRetries) {
      try {
        // Race entre l'opération et le timeout
        const result = await Promise.race([operation(), timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
      } catch (error) {
        retries++;
        clearTimeout(timeoutId!);
        
        if (retries > maxRetries) {
          console.error('Échec après plusieurs tentatives:', error);
          return { error };
        }
        
        // Délai exponentiel: 500ms, 1000ms, 2000ms...
        const delay = Math.pow(2, retries - 1) * 500;
        console.log(`Tentative ${retries}/${maxRetries} échouée, nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { error: new Error('Échec inattendu dans executeWithRetry') };
  }

  /**
   * Basculer le statut favori d'une quote
   */
  static async toggleQuoteFavorite(userId: string, quoteId: string): Promise<boolean> {
    try {
      // 1. Vérifier l'état actuel dans la table favorites (source unique de vérité)
      const { data: existingFavorite, error: checkError } = await this.executeWithRetry(() => 
        supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('content_id', quoteId)
          .eq('content_type', 'quote')
          .single()
      ) as any;

      // La contrainte unique empêche les doublons automatiquement
      const isFavorite = !!existingFavorite && !checkError;
      const newFavoriteStatus = !isFavorite;

      if (newFavoriteStatus) {
        // Ajouter aux favoris - récupérer les infos de la quote
        const { data: quote, error: fetchError } = await this.executeWithRetry(() =>
          supabase
            .from('quotes')
            .select('id, text, source')
            .eq('id', quoteId)
            .eq('user_id', userId)
            .single()
        ) as any;

        if (fetchError || !quote) {
          throw new Error('Quote non trouvée');
        }

        // Insérer dans favorites avec contrainte unique
        const { error: insertError } = await this.executeWithRetry(() =>
          supabase
            .from('favorites')
            .insert({
              user_id: userId,
              content: quote.text,
              source: quote.source || '',
              content_id: quoteId,
              content_type: 'quote'
            })
        ) as any;

        // Si erreur due à la contrainte unique, on ignore (pas un vrai problème)
        if (insertError && !insertError.message.includes('unique')) {
          throw insertError;
        }

        // Mettre à jour is_favorite dans la table quotes
        await this.executeWithRetry(() =>
          supabase
            .from('quotes')
            .update({ is_favorite: true })
            .eq('id', quoteId)
            .eq('user_id', userId)
        );

      } else {
        // Supprimer des favoris
        const { error: deleteError } = await this.executeWithRetry(() =>
          supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('content_id', quoteId)
            .eq('content_type', 'quote')
        ) as any;

        if (deleteError) throw deleteError;

        // Mettre à jour is_favorite dans la table quotes
        await this.executeWithRetry(() =>
          supabase
            .from('quotes')
            .update({ is_favorite: false })
            .eq('id', quoteId)
            .eq('user_id', userId)
        );
      }

      console.log(`✅ Quote ${newFavoriteStatus ? 'ajoutée aux' : 'supprimée des'} favoris:`, quoteId);
      return newFavoriteStatus;

    } catch (error) {
      console.error('❌ Erreur lors du basculement du favori (quote):', error);
      throw error;
    }
  }

  /**
   * Basculer le statut favori d'une entrée de livre
   */
  static async toggleBookEntryFavorite(userId: string, bookEntryId: string): Promise<boolean> {
    try {
      // Convertir l'ID si nécessaire (enlever le préfixe book-entry-)
      const cleanId = bookEntryId.replace('book-entry-', '');
      console.log('🔄 Toggle book entry favorite:', cleanId);
      
      // 1. Vérifier l'état actuel dans la table favorites (source de vérité)
      const { data: existingFavorite, error: checkError } = await this.executeWithRetry(() =>
        supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('content_id', cleanId)
          .eq('content_type', 'book_entry')
          .single()
      ) as any;

      const isFavorite = !!existingFavorite && !checkError;
      const newFavoriteStatus = !isFavorite;

      console.log('📊 État actuel:', isFavorite, '→ Nouveau:', newFavoriteStatus);

      if (newFavoriteStatus) {
        // Ajouter aux favoris - récupérer les infos de l'entrée
        const { data: bookEntry, error: fetchError } = await this.executeWithRetry(() =>
          supabase
            .from('book_entries')
            .select('id, content, book_title')
            .eq('id', cleanId)
            .single()
        ) as any;

        if (fetchError || !bookEntry) {
          throw new Error(`Entrée de livre non trouvée: ${cleanId}`);
        }

        // Insérer dans favorites
        const { error: insertError } = await this.executeWithRetry(() =>
          supabase
            .from('favorites')
            .insert({
              user_id: userId,
              content: bookEntry.content,
              source: bookEntry.book_title,
              content_id: cleanId,
              content_type: 'book_entry'
            })
        ) as any;

        if (insertError && !insertError.message.includes('unique')) {
          throw insertError;
        }

        // CRITIQUE: Mettre à jour is_favorite dans book_entries AVEC LOGS
        const { error: updateError } = await this.executeWithRetry(() =>
          supabase
            .from('book_entries')
            .update({ is_favorite: true })
            .eq('id', cleanId)
        ) as any;

        if (updateError) {
          console.error('❌ Erreur mise à jour is_favorite:', updateError);
          throw updateError;
        } else {
          console.log('✅ is_favorite mis à jour à true pour:', cleanId);
        }

      } else {
        // Supprimer des favoris
        const { error: deleteError } = await this.executeWithRetry(() =>
          supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('content_id', cleanId)
            .eq('content_type', 'book_entry')
        ) as any;

        if (deleteError) throw deleteError;

        // CRITIQUE: Mettre à jour is_favorite dans book_entries
        const { error: updateError } = await this.executeWithRetry(() =>
          supabase
            .from('book_entries')
            .update({ is_favorite: false })
            .eq('id', cleanId)
        ) as any;

        if (updateError) {
          console.error('❌ Erreur mise à jour is_favorite:', updateError);
          throw updateError;
        } else {
          console.log('✅ is_favorite mis à jour à false pour:', cleanId);
        }
      }

      // Vérification après mise à jour
      const { data: verification } = await this.executeWithRetry(() =>
        supabase
          .from('book_entries')
          .select('is_favorite')
          .eq('id', cleanId)
          .single()
      ) as any;

      console.log('🔍 Vérification après mise à jour - is_favorite:', verification?.is_favorite);

      console.log(`✅ Entrée de livre ${newFavoriteStatus ? 'ajoutée aux' : 'supprimée des'} favoris:`, cleanId);
      return newFavoriteStatus;

    } catch (error) {
      console.error('❌ Erreur lors du basculement du favori (book_entry):', error);
      throw error;
    }
  }

  /**
   * Supprimer un favori depuis la table favorites
   */
  static async removeFavoriteFromList(userId: string, contentId: string, contentType: 'quote' | 'book_entry'): Promise<void> {
    try {
      // 1. Supprimer de la table favorites
      const { error: deleteError } = await this.executeWithRetry(() =>
        supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId)
          .eq('content_type', contentType)
      ) as any;

      if (deleteError) throw deleteError;

      // 2. Mettre à jour is_favorite dans la table correspondante
      const tableName = contentType === 'quote' ? 'quotes' : 'book_entries';
      let updateQuery = supabase
        .from(tableName)
        .update({ is_favorite: false })
        .eq('id', contentId);

      // Pour les quotes, ajouter le filtre user_id
      if (contentType === 'quote') {
        updateQuery = updateQuery.eq('user_id', userId);
      }

      const { error: updateError } = await this.executeWithRetry(() => updateQuery) as any;
      if (updateError) throw updateError;

      console.log(`✅ Favori supprimé de la liste:`, contentId, contentType);

    } catch (error) {
      console.error('❌ Erreur lors de la suppression du favori:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les favoris d'un utilisateur
   */
  static async getUserFavorites(userId: string): Promise<FavoriteItem[]> {
    try {
      const { data, error } = await this.executeWithRetry(() =>
        supabase
          .from('favorites')
          .select('*')
          .eq('user_id', userId)
          .order('createdAt', { ascending: false })
      ) as any;

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} favoris récupérés (sans doublons):`, userId);
      return data || [];

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des favoris:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les doublons existants (à exécuter une fois)
   */
  static async cleanDuplicateFavorites(userId: string): Promise<void> {
    try {
      console.log('🧹 Démarrage du nettoyage des doublons...');

      // Récupérer tous les favoris de l'utilisateur
      const { data: allFavorites, error } = await this.executeWithRetry(() =>
        supabase
          .from('favorites')
          .select('*')
          .eq('user_id', userId)
          .order('createdAt', { ascending: true }) // Garder le plus ancien
      ) as any;

      if (error) throw error;

      // Grouper par content_id + content_type
      const seen = new Set<string>();
      const duplicates: string[] = [];

      allFavorites?.forEach(fav => {
        const key = `${fav.content_id}_${fav.content_type}`;
        if (seen.has(key)) {
          duplicates.push(fav.id);
        } else {
          seen.add(key);
        }
      });

      // Supprimer les doublons
      if (duplicates.length > 0) {
        const { error: deleteError } = await this.executeWithRetry(() =>
          supabase
            .from('favorites')
            .delete()
            .in('id', duplicates)
        ) as any;

        if (deleteError) throw deleteError;
        console.log(`✅ ${duplicates.length} doublons supprimés`);
      } else {
        console.log('✅ Aucun doublon trouvé');
      }

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }

  /**
   * Synchroniser les favoris avec nettoyage automatique (version simplifiée)
   */
  static async syncFavorites(userId: string): Promise<void> {
    try {
      // Appeler la synchronisation complète
      await this.syncIsFavoriteFields(userId);
      
      // Nettoyer les doublons
      await this.cleanDuplicateFavorites(userId);

      console.log('✅ Synchronisation des favoris terminée');

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      throw error;
    }
  }

  /**
   * Synchroniser les champs is_favorite avec la table favorites
   * Version améliorée avec protection contre les boucles et gestion d'erreurs
   */
  static async syncIsFavoriteFields(userId?: string): Promise<void> {
    try {
      console.log('🔄 Début de la synchronisation des champs is_favorite...');
      
      // Vérifier si une synchronisation est déjà en cours
      if (this._isSynchronizing) {
        console.log('⚠️ Synchronisation déjà en cours, ignorée');
        return;
      }
      
      this._isSynchronizing = true;
      
      try {
        // Définir les types de contenu à synchroniser
        const contentTypes = ['quote', 'book_entry']; // Remarque: 'hadith' aussi si nécessaire
        
        // Fonction utilitaire pour synchroniser un type spécifique
        const syncContentType = async (contentType: string, forUserId?: string) => {
          // Déterminer le bon nom de table selon le type
          let tableName;
          switch(contentType) {
            case 'quote': tableName = 'quotes'; break;
            case 'book_entry': tableName = 'book_entries'; break;
            default: tableName = `${contentType}s`;
          }
          
          console.log(`Synchronisation de la table: ${tableName}${forUserId ? ` pour l'utilisateur ${forUserId}` : ''}`);
          
          // Récupérer les favoris de l'utilisateur pour ce type de contenu
          let favoritesQuery = supabase
            .from('favorites')
            .select('content_id')
            .eq('content_type', contentType);
          
          if (forUserId) {
            favoritesQuery = favoritesQuery.eq('user_id', forUserId);
          }
          
          const { data: favorites, error: favError } = await this.executeWithRetry(() => 
            favoritesQuery
          ) as any;
          
          if (favError) {
            console.error(`Erreur lors de la récupération des favoris pour ${contentType}:`, favError);
            return;
          }
          
          // Extraire les IDs des favoris
          const favoriteIds = favorites?.map(f => f.content_id) || [];
          console.log(`${favoriteIds.length} favoris trouvés pour ${contentType}`);
          
          // APPROCHE MODIFIÉE: Traitement en fonction du nombre de favoris
          if (forUserId) {
            if (contentType === 'quote') {
              // 1. D'abord, réinitialiser TOUS à false
              const { error: resetError } = await this.executeWithRetry(() =>
                supabase
                  .from(tableName)
                  .update({ is_favorite: false })
                  .eq('user_id', forUserId)
              ) as any;
              
              if (resetError) {
                console.error(`Erreur lors de la réinitialisation des ${tableName}:`, resetError);
                
                // Log détaillé pour diagnostiquer les erreurs 500
                if (resetError.status === 500) {
                  console.warn('Erreur 500 détectée - vérifier la requête Supabase');
                  console.warn('Détails de la requête:', 
                    { table: tableName, userId: forUserId, operation: "reset" });
                }
                
                return;  // Sortir de la fonction au lieu de simplement continuer
              } else {
                console.log(`Reset de tous les ${tableName} à is_favorite=false pour user ${forUserId}`);
              }
              
              // 2. Ensuite, mettre à jour les favoris à true (seulement s'il y en a)
              if (favoriteIds.length > 0) {
                const { error: updateError } = await this.executeWithRetry(() =>
                  supabase
                    .from(tableName)
                    .update({ is_favorite: true })
                    .in('id', favoriteIds)
                    .eq('user_id', forUserId)
                ) as any;
                
                if (updateError) {
                  console.error(`Erreur lors de la mise à jour des favoris ${tableName}:`, updateError);
                } else {
                  console.log(`${favoriteIds.length} ${tableName} mis à jour à is_favorite=true`);
                }
              }
            }
            else if (contentType === 'book_entry') {
              // Pour book_entries, d'abord tout réinitialiser
              const { error: resetError } = await this.executeWithRetry(() =>
                supabase
                  .from(tableName)
                  .update({ is_favorite: false })
              ) as any;
              
              if (resetError) {
                console.error(`Erreur lors de la réinitialisation des ${tableName}:`, resetError);
                
                // Log détaillé pour diagnostiquer les erreurs 500
                if (resetError.status === 500) {
                  console.warn('Erreur 500 détectée - vérifier la requête Supabase');
                  console.warn('Détails de la requête:', 
                    { table: tableName, operation: "reset" });
                }
                
                return;  // Sortir de la fonction au lieu de simplement continuer
              } else {
                console.log(`Reset de tous les ${tableName} à is_favorite=false`);
              }
              
              // Ensuite mettre à jour les favoris (seulement s'il y en a)
              if (favoriteIds.length > 0) {
                const { error: updateError } = await this.executeWithRetry(() =>
                  supabase
                    .from(tableName)
                    .update({ is_favorite: true })
                    .in('id', favoriteIds)
                ) as any;
                
                if (updateError) {
                  console.error(`Erreur lors de la mise à jour des favoris ${tableName}:`, updateError);
                } else {
                  console.log(`${favoriteIds.length} ${tableName} mis à jour à is_favorite=true`);
                }
              }
            }
          }
        };
        
        // Synchroniser tous les types de contenu avec timeout global
        for (const contentType of contentTypes) {
          await syncContentType(contentType, userId);
        }
        
        console.log('✅ Synchronisation des champs is_favorite terminée avec succès');
      } finally {
        this._isSynchronizing = false;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des champs is_favorite:', error);
      this._isSynchronizing = false;  // S'assurer de réinitialiser même en cas d'erreur
      throw error;
    }
  }
}

// Hook React amélioré avec gestion des erreurs
export const useFavorites = (userId: string) => {
  const toggleQuoteFavorite = async (quoteId: string) => {
    try {
      return await FavoritesService.toggleQuoteFavorite(userId, quoteId);
    } catch (error) {
      console.error('❌ Erreur lors du toggle quote:', error);
      // Re-throw ou retourner une valeur par défaut selon le besoin
      return false;
    }
  };

  const toggleBookEntryFavorite = async (bookEntryId: string) => {
    try {
      return await FavoritesService.toggleBookEntryFavorite(userId, bookEntryId);
    } catch (error) {
      console.error('❌ Erreur lors du toggle book entry:', error);
      return false;
    }
  };

  const removeFavorite = async (contentId: string, contentType: 'quote' | 'book_entry') => {
    try {
      return await FavoritesService.removeFavoriteFromList(userId, contentId, contentType);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du favori:', error);
    }
  };

  const getFavorites = async () => {
    try {
      return await FavoritesService.getUserFavorites(userId);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des favoris:', error);
      return [];
    }
  };

  const syncFavorites = async () => {
    try {
      return await FavoritesService.syncFavorites(userId);
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des favoris:', error);
    }
  };

  const cleanDuplicates = async () => {
    try {
      return await FavoritesService.cleanDuplicateFavorites(userId);
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des doublons:', error);
    }
  };

  return {
    toggleQuoteFavorite,
    toggleBookEntryFavorite,
    removeFavorite,
    getFavorites,
    syncFavorites,
    cleanDuplicates
  };
};
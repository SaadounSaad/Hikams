// src/context/FavoritesContext.tsx - Contexte corrigé avec les bonnes signatures
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { favoritesService } from '../services/FavoritesServices';
import { FavoritesContextType, BookFavorite, Quote, BookEntry } from '../types';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<BookFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Charger les favoris avec la bonne signature
  const loadFavorites = async (userId: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      console.log('🔄 Chargement des favoris depuis quotes pour:', userId);
     
      // Récupérer uniquement depuis la table quotes
      const { data: favoriteQuotes, error } = await supabase
        .from('quotes')
        .select('id')
        .eq('user_id', userId)
        .eq('is_favorite', true);

      if (error) {
        console.error('❌ Erreur lors du chargement des favoris:', error);
        throw error;
      }

      // Convertir en BookFavorite pour compatibilité
      const bookFavorites: BookFavorite[] = (favoriteQuotes || []).map(quote => ({
        id: quote.id,
        entry_id: 0, // Placeholder
        book_title: '',
        user_id: userId,
        createdAt: new Date().toISOString()
      }));

      setFavorites(bookFavorites);
      console.log(`✅ ${bookFavorites.length} favoris chargés depuis quotes`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
      setFavorites([]);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Ajouter un favori avec la signature correcte
  const addFavorite = async (entryId: number, bookTitle: string): Promise<boolean> => {
    try {
      setError(null);
      // Utiliser la méthode corrigée du service
      const success = await favoritesService.addBookFavorite(entryId, bookTitle);
      if (success) {
        // Recharger les favoris ou mettre à jour l'état local
        const newFavorite: BookFavorite = {
          id: `fav_${Date.now()}_${entryId}`,
          entry_id: entryId,
          book_title: bookTitle,
          user_id: 'current_user',
          createdAt: new Date().toISOString()
        };
        setFavorites(prev => [...prev, newFavorite]);
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du favori';
      setError(errorMessage);
      console.error('❌ Erreur lors de l\'ajout du favori:', error);
      return false;
    }
  };

  // ✅ Supprimer un favori avec la signature correcte
  const removeFavorite = async (favoriteId: string): Promise<boolean> => {
    try {
      setError(null);
      // Utiliser la méthode corrigée du service
      const success = await favoritesService.removeFavorite(favoriteId);
      if (success) {
        setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du favori';
      setError(errorMessage);
      console.error('❌ Erreur lors de la suppression du favori:', error);
      return false;
    }
  };

  // ✅ Vérifier si un élément est favori (synchrone)
  const isFavorite = (entryId: number): boolean => {
    return favorites.some(f => f.entry_id === entryId);
  };

  // ✅ Obtenir l'ID du favori
  const getFavoriteId = (entryId: number): string | null => {
    const favorite = favorites.find(f => f.entry_id === entryId);
    return favorite ? favorite.id : null;
  };

  // ✅ Rafraîchir les favoris
  const refreshFavorites = async (): Promise<void> => {
    // Pour l'instant, on ne fait rien car on n'a pas d'userId ici
    // Cette méthode pourrait être appelée depuis les composants avec l'userId
    console.log('🔄 Rafraîchissement des favoris demandé');
  };

  // ✅ Effacer l'erreur
  const clearError = (): void => {
    setError(null);
  };

  // ✅ Créer des données de compatibilité pour FavoritesPage
  const quotesFromFavorites: Quote[] = favorites.map(fav => ({
    id: fav.id,
    text: fav.content || '',
    category: 'favorites',
    isFavorite: true,
    createdAt: fav.createdAt,
    bookTitle: fav.book_title,
    originalEntryId: fav.entry_id
  }));

  const bookEntriesFromFavorites: BookEntry[] = favorites.map(fav => ({
    id: fav.entry_id,
    content: fav.content || '',
    ordre: fav.ordre || 0,
    book_title: fav.book_title,
    createdAt: fav.createdAt,
    isFavorite: true
  }));

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoriteId,
    refreshFavorites,
    clearError,
    
    // ✅ Propriétés supplémentaires pour compatibilité
    quotes: quotesFromFavorites,
    bookEntries: bookEntriesFromFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};

// Alias pour compatibilité
export const useFavorites = useFavoritesContext;
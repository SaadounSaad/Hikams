// FavoritesContext.tsx - Version sans dépendance useAuth
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

interface FavoritesContextType {
  favorites: string[];
  isLoading: boolean;
  addFavorite: (quoteId: string, userId: string) => Promise<void>;
  removeFavorite: (quoteId: string, userId: string) => Promise<void>;
  isFavorite: (quoteId: string) => boolean;
  loadFavorites: (userId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les favoris depuis la table quotes
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

      const favoriteIds = favoriteQuotes?.map(quote => quote.id) || [];
      setFavorites(favoriteIds);
      console.log(`✅ ${favoriteIds.length} favoris chargés depuis quotes`);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un favori
  const addFavorite = async (quoteId: string, userId: string) => {
    if (!userId) return;

    try {
      // Mettre à jour la table quotes
      const { error } = await supabase
        .from('quotes')
        .update({ is_favorite: true })
        .eq('id', quoteId)
        .eq('user_id', userId);

      if (error) throw error;

      // Mettre à jour l'état local
      setFavorites(prev => [...prev, quoteId]);
      console.log('✅ Favori ajouté:', quoteId);

    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du favori:', error);
      throw error;
    }
  };

  // Supprimer un favori
  const removeFavorite = async (quoteId: string, userId: string) => {
    if (!userId) return;

    try {
      // Mettre à jour la table quotes
      const { error } = await supabase
        .from('quotes')
        .update({ is_favorite: false })
        .eq('id', quoteId)
        .eq('user_id', userId);

      if (error) throw error;

      // Mettre à jour l'état local
      setFavorites(prev => prev.filter(id => id !== quoteId));
      console.log('✅ Favori supprimé:', quoteId);

    } catch (error) {
      console.error('❌ Erreur lors de la suppression du favori:', error);
      throw error;
    }
  };

  // Vérifier si un élément est favori
  const isFavorite = (quoteId: string): boolean => {
    return favorites.includes(quoteId);
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    loadFavorites
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
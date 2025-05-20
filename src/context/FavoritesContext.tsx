// src/context/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Types
interface Favorite {
  id: string;
  entry_id: number;
  book_title: string;
  user_id: string;
  createdAt: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  addFavorite: (entryId: number, bookTitle: string) => Promise<boolean>;
  removeFavorite: (favoriteId: string) => Promise<boolean>;
  isFavorite: (entryId: number) => boolean;
  getFavoriteId: (entryId: number) => string | null;
  refreshFavorites: () => Promise<void>;
  clearError: () => void;
}

interface FavoritesProviderProps {
  children: ReactNode;
}

// Création du contexte
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

// Provider du contexte
export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fonction pour effacer l'erreur
  const clearError = () => setError(null);

  // Obtenir l'ID utilisateur et écouter les changements d'auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (user) {
          setUserId(user.id);
          console.log('🔐 Utilisateur connecté:', user.id);
        } else {
          console.log('👤 Aucun utilisateur connecté');
        }
      } catch (err) {
        console.error('❌ Erreur lors de l\'obtention de l\'utilisateur:', err);
        setError('Impossible de récupérer les informations utilisateur');
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Changement d\'auth:', event, session?.user?.id);
      
      if (session?.user) {
        setUserId(session.user.id);
        setError(null);
      } else {
        setUserId(null);
        setFavorites([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Charger les favoris quand l'utilisateur change
  useEffect(() => {
    if (userId) {
      loadFavorites();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  // Fonction pour charger tous les favoris
  const loadFavorites = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📥 Chargement des favoris pour l\'utilisateur:', userId);

      const { data, error: loadError } = await supabase
        .from('book_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('createdAt', { ascending: false });

      if (loadError) throw loadError;

      setFavorites(data || []);
      console.log('✅ Favoris chargés:', data?.length || 0, 'éléments');
    } catch (err) {
      console.error('❌ Erreur lors du chargement des favoris:', err);
      setError('Impossible de charger les favoris');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour ajouter un favori avec optimisme
  const addFavorite = async (entryId: number, bookTitle: string): Promise<boolean> => {
    if (!userId) {
      setError('Utilisateur non connecté');
      return false;
    }

    // Vérifier si déjà favori
    if (isFavorite(entryId)) {
      console.log('⚠️ Entrée déjà dans les favoris:', entryId);
      return true;
    }

    console.log('💖 Ajout aux favoris:', entryId, bookTitle);

    try {
      // Mise à jour optimiste
      const optimisticFavorite: Favorite = {
        id: `temp-${Date.now()}`, // ID temporaire
        entry_id: entryId,
        book_title: bookTitle,
        user_id: userId,
        createdAt: new Date().toISOString()
      };

      setFavorites(prev => [optimisticFavorite, ...prev]);
      setError(null);

      // Insertion dans la base de données
      const { data, error: insertError } = await supabase
        .from('book_favorites')
        .insert({
          entry_id: entryId,
          book_title: bookTitle,
          user_id: userId,
          createdAt: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Remplacer l'optimistic update par les données réelles
      setFavorites(prev => 
        prev.map(fav => 
          fav.id === optimisticFavorite.id ? data : fav
        )
      );

      console.log('✅ Favori ajouté avec succès:', data.id);
      return true;
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du favori:', err);
      setError('Impossible d\'ajouter le favori');
      
      // Annuler la mise à jour optimiste
      setFavorites(prev => prev.filter(fav => fav.entry_id !== entryId));
      return false;
    }
  };

  // Fonction pour supprimer un favori avec optimisme
  const removeFavorite = async (favoriteId: string): Promise<boolean> => {
    if (!userId) {
      setError('Utilisateur non connecté');
      return false;
    }

    console.log('💔 Suppression du favori:', favoriteId);

    try {
      // Mise à jour optimiste
      const favoriteToRemove = favorites.find(fav => fav.id === favoriteId);
      if (!favoriteToRemove) {
        console.log('⚠️ Favori introuvable:', favoriteId);
        return false;
      }

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      setError(null);

      // Suppression dans la base de données
      const { error: deleteError } = await supabase
        .from('book_favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      console.log('✅ Favori supprimé avec succès:', favoriteId);
      return true;
    } catch (err) {
      console.error('❌ Erreur lors de la suppression du favori:', err);
      setError('Impossible de supprimer le favori');
      
      // Annuler la mise à jour optimiste
      await loadFavorites(); // Recharger pour restaurer l'état correct
      return false;
    }
  };

  // Vérifier si une entrée est dans les favoris
  const isFavorite = (entryId: number): boolean => {
    const result = favorites.some(fav => fav.entry_id === entryId);
    return result;
  };

  // Obtenir l'ID d'un favori par entry_id
  const getFavoriteId = (entryId: number): string | null => {
    const favorite = favorites.find(fav => fav.entry_id === entryId);
    return favorite ? favorite.id : null;
  };

  // Fonction pour rafraîchir les favoris
  const refreshFavorites = async (): Promise<void> => {
    await loadFavorites();
  };

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoriteId,
    refreshFavorites,
    clearError
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
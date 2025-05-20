// src/context/BookmarksContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Types
interface Bookmark {
  id: string;
  user_id: string;
  category_id: string;
  index: number;
  createdAt?: string;
  updated_at?: string;
}

interface BookmarksContextType {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  setBookmark: (categoryId: string, index: number) => Promise<boolean>;
  getBookmark: (categoryId: string) => Bookmark | null;
  isBookmarked: (categoryId: string, index: number) => boolean;
  refreshBookmarks: () => Promise<void>;
}

interface BookmarksProviderProps {
  children: ReactNode;
}

// Création du contexte
const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useBookmarks = (): BookmarksContextType => {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
};

// Provider du contexte
export const BookmarksProvider: React.FC<BookmarksProviderProps> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Obtenir l'ID utilisateur
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error('Erreur lors de l\'obtention de l\'utilisateur:', err);
        setError('Impossible de récupérer les informations utilisateur');
      }
    };

    getUserId();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setBookmarks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Charger les signets quand l'utilisateur change
  useEffect(() => {
    if (userId) {
      loadBookmarks();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  // Fonction pour charger les signets
  const loadBookmarks = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setBookmarks(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des signets:', err);
      setError('Impossible de charger les signets');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour définir/mettre à jour un signet
  const setBookmark = async (categoryId: string, index: number): Promise<boolean> => {
    if (!userId) {
      setError('Utilisateur non connecté');
      return false;
    }

    try {
      // Vérifier si un signet existe déjà pour cette catégorie
      const existingBookmark = bookmarks.find(b => b.category_id === categoryId);

      if (existingBookmark) {
        // Mettre à jour le signet existant
        const { data, error } = await supabase
          .from('bookmarks')
          .update({ 
            index: index, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingBookmark.id)
          .select()
          .single();

        if (error) throw error;

        // Mise à jour optimiste
        setBookmarks(prev => prev.map(b => 
          b.id === existingBookmark.id ? data : b
        ));
      } else {
        // Créer un nouveau signet
        const { data, error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: userId,
            category_id: categoryId,
            index: index,
            createdAt: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        // Mise à jour optimiste
        setBookmarks(prev => [...prev, data]);
      }

      setError(null);
      return true;
    } catch (err) {
      console.error('Erreur lors de la définition du signet:', err);
      setError('Impossible de définir le signet');
      return false;
    }
  };

  // Obtenir un signet par catégorie
  const getBookmark = (categoryId: string): Bookmark | null => {
    return bookmarks.find(b => b.category_id === categoryId) || null;
  };

  // Vérifier si une position est marquée
  const isBookmarked = (categoryId: string, index: number): boolean => {
    const bookmark = getBookmark(categoryId);
    return bookmark ? bookmark.index === index : false;
  };

  // Fonction pour rafraîchir les signets
  const refreshBookmarks = async (): Promise<void> => {
    await loadBookmarks();
  };

  const value: BookmarksContextType = {
    bookmarks,
    isLoading,
    error,
    setBookmark,
    getBookmark,
    isBookmarked,
    refreshBookmarks
  };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
};
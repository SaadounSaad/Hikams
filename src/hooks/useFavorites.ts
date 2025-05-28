import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { favoritesService, ContentType } from '../services/FavoritesServices';

interface UseFavoriteProps {
  contentId: string;
  contentType: ContentType;
  initialIsFavorite?: boolean;
}

interface UseFavoriteReturn {
  isFavorite: boolean;
  isLoading: boolean;
  toggleFavorite: (category?: string, index?: number, callback?: () => void, notes?: string) => Promise<void>;
  addToFavorites: (category?: string, index?: number, notes?: string) => Promise<void>;
  removeFromFavorites: () => Promise<void>;
  error: string | null;
}

export function useFavorite({
  contentId,
  contentType,
  initialIsFavorite = false,
}: UseFavoriteProps): UseFavoriteReturn {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState<boolean>(initialIsFavorite);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier le statut favori au chargement
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // CORRECTION: Adapter selon la signature réelle de votre service
        const isFav = await favoritesService.isFavorite(contentType, contentId);
        setIsFavorite(isFav);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    checkFavoriteStatus();
  }, [user, contentId, contentType]);

  // Ajouter aux favoris
  const addToFavorites = useCallback(
    async (category?: string, index?: number, notes?: string) => {
      if (!user) return;

      setIsLoading(true);
      try {
        // CORRECTION: Simplifier l'appel selon la signature du service
        await favoritesService.addToFavorites(
          contentType,
          { id: contentId } as any,
          user.id
        );
        
        setIsFavorite(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    },
    [user, contentId, contentType]
  );

  // Supprimer des favoris
  const removeFromFavorites = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // CORRECTION: Simplifier l'appel
      await favoritesService.removeFromFavorites(user.id, contentType, contentId);
      setIsFavorite(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [user, contentId, contentType]);

  // Basculer l'état favori
  const toggleFavorite = useCallback(
    async (category?: string, index?: number, callback?: () => void, notes?: string) => {
      if (!user) return;

      setIsLoading(true);
      try {
        // CORRECTION: Vérifier d'abord si c'est un favori, puis basculer
        const currentIsFavorite = await favoritesService.isFavorite(contentType, contentId);
        
        if (currentIsFavorite) {
          await favoritesService.removeFromFavorites(user.id, contentType, contentId);
          setIsFavorite(false);
        } else {
          await favoritesService.addToFavorites(
            contentType,
            { id: contentId } as any,
            user.id
          );
          setIsFavorite(true);
        }
        
        // Exécuter le callback si fourni
        if (callback) {
          callback();
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    },
    [user, contentId, contentType]
  );

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    error,
  };
}

// Hook pour charger tous les favoris
export function useFavorites() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<{
    quotes: any[];
    bookEntries: any[];
  }>({
    quotes: [],
    bookEntries: [],
  });

  // Charger tous les favoris
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // CORRECTION: Adapter selon la signature réelle de getFavorites
      const result = await favoritesService.getFavorites();
      setFavorites(result || { quotes: [], bookEntries: [] });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des favoris');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les favoris au chargement
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setIsLoading(false);
    }
  }, [user, loadFavorites]);

  return {
    favorites,
    isLoading,
    error,
    refresh: loadFavorites,
  };
}
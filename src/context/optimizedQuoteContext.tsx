// optimizedQuoteContext.tsx - Version améliorée avec chargement progressif
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Quote } from '../types';
import { useAuth } from '../context/AuthContext'; // Chemin corrigé
import OptimizedQuoteService from '../services/optimizedQuoteService';

interface QuoteContextType {
  quotes: Quote[];
  dailyQuotes: Quote[];
  isLoading: boolean;
  loadingProgress: number;
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'isFavorite'>) => Promise<Quote>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  deleteAllQuotes: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  refreshQuotes: () => Promise<void>;
}

// Valeurs par défaut
const defaultContext: QuoteContextType = {
  quotes: [],
  dailyQuotes: [],
  isLoading: true,
  loadingProgress: 0,
  addQuote: async () => ({ id: '', text: '', category: '', isFavorite: false, createdAt: '' }),
  updateQuote: async () => {},
  deleteQuote: async () => {},
  deleteAllQuotes: async () => {},
  toggleFavorite: async () => {},
  refreshQuotes: async () => {},
};

const QuoteContext = createContext<QuoteContextType>(defaultContext);

export const useQuotes = () => useContext(QuoteContext);

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuotes, setDailyQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Chargement des quotes avec progression
  const loadQuotes = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setLoadingProgress(10);
      
      // Utiliser le service optimisé
      const { quotes: allQuotes, dailyQuotes: daily } = await OptimizedQuoteService.getQuotes(user.id);
      
      setLoadingProgress(90);
      
      // Mettre à jour l'état
      setQuotes(allQuotes || []);
      setDailyQuotes(daily || []);
      
      setLoadingProgress(100);
    } catch (error) {
      console.error('Erreur lors du chargement des quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Charger les quotes au démarrage
  useEffect(() => {
    if (user?.id) {
      loadQuotes();
    } else {
      setQuotes([]);
      setDailyQuotes([]);
    }
  }, [user?.id, loadQuotes]);

  // Ajouter une quote
  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'createdAt' | 'isFavorite'>) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        text: quote.text,
        category: quote.category,
        source: quote.source || '',
        user_id: user.id,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) throw error;

    const newQuote: Quote = {
      id: data.id,
      text: data.text,
      category: data.category,
      isFavorite: data.is_favorite,
      createdAt: data.createdAt,
      source: data.source,
    };

    // Mise à jour optimiste du state
    setQuotes(prev => [newQuote, ...prev]);
    
    // Mise à jour des daily quotes si nécessaire
    if (quote.category === 'daily') {
      setDailyQuotes(prev => [newQuote, ...prev]);
    }
    
    // Réinitialiser le cache
    OptimizedQuoteService.resetCache();

    return newQuote;
  }, [user?.id]);

  // Mettre à jour une quote
  const updateQuote = useCallback(async (id: string, updates: Partial<Quote>) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    // Préparer les mises à jour pour Supabase (convertir isFavorite en is_favorite)
    const dbUpdates: any = {
      ...updates,
      is_favorite: updates.isFavorite,
    };
    
    // Supprimer les propriétés qui n'existent pas dans la table
    delete dbUpdates.isFavorite;
    delete dbUpdates.id;
    delete dbUpdates.createdAt;

    const { error } = await supabase
      .from('quotes')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Mise à jour optimiste du state
    setQuotes(prev => 
      prev.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    );
    
    setDailyQuotes(prev => 
      prev.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    );
    
    // Réinitialiser le cache
    OptimizedQuoteService.resetCache();
  }, [user?.id]);

  // Supprimer une quote
  const deleteQuote = useCallback(async (id: string) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Mise à jour optimiste du state
    setQuotes(prev => prev.filter(q => q.id !== id));
    setDailyQuotes(prev => prev.filter(q => q.id !== id));
    
    // Réinitialiser le cache
    OptimizedQuoteService.resetCache();
  }, [user?.id]);

  // Supprimer toutes les quotes
  const deleteAllQuotes = useCallback(async () => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    // Mise à jour du state
    setQuotes([]);
    setDailyQuotes([]);
    
    // Réinitialiser le cache
    OptimizedQuoteService.resetCache();
  }, [user?.id]);

  // Basculer le statut favori
  const toggleFavorite = useCallback(async (id: string) => {
    if (!user?.id) throw new Error('Utilisateur non connecté');

    // Trouver la quote et son état actuel de favori
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    const newIsFavorite = !quote.isFavorite;

    // Mise à jour optimiste du state
    setQuotes(prev => 
      prev.map(q => 
        q.id === id ? { ...q, isFavorite: newIsFavorite } : q
      )
    );
    
    setDailyQuotes(prev => 
      prev.map(q => 
        q.id === id ? { ...q, isFavorite: newIsFavorite } : q
      )
    );

    // Mise à jour dans la base de données
    const { error } = await supabase
      .from('quotes')
      .update({ is_favorite: newIsFavorite })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      // Annuler la mise à jour optimiste en cas d'erreur
      setQuotes(prev => 
        prev.map(q => 
          q.id === id ? { ...q, isFavorite: quote.isFavorite } : q
        )
      );
      
      setDailyQuotes(prev => 
        prev.map(q => 
          q.id === id ? { ...q, isFavorite: quote.isFavorite } : q
        )
      );
      
      throw error;
    }
    
    // Pas besoin de réinitialiser le cache ici car c'est juste un changement d'état
  }, [user?.id, quotes]);

  // Rafraîchir les quotes
  const refreshQuotes = useCallback(async () => {
    // Réinitialiser le cache avant de recharger
    OptimizedQuoteService.resetCache();
    return loadQuotes();
  }, [loadQuotes]);

  const value = {
    quotes,
    dailyQuotes,
    isLoading,
    loadingProgress,
    addQuote,
    updateQuote,
    deleteQuote,
    deleteAllQuotes,
    toggleFavorite,
    refreshQuotes,
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};
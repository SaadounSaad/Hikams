// QuoteContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Quote } from '../types';
import { storage } from "../utils/storage";
import { updateBookmark } from "../utils/bookmarkService"; // Ajouté pour la fonctionnalité de bookmark

type SortOrder = 'newest' | 'oldest' | 'scheduled' | 'random';

interface QuoteContextType {
  quotes: Quote[];
  dailyQuotes: Quote[];
  isLoading: boolean;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  addQuote: (quote: Quote) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  toggleFavorite: (id: string, categoryId?: string, quoteIndex?: number, onSuccess?: () => void) => Promise<void>; // Modifié pour accepter un callback
  deleteAllQuotes: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuotes, setDailyQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('scheduled');
  const [totalCount, setTotalCount] = useState(0);

  const loadQuotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedQuotes, count, dailyQuotes] = await Promise.all([
        storage.getQuotes(sortOrder),
        storage.getQuotesCount(),
        storage.getDailyQuotes()
      ]);
      
      let processedQuotes = storedQuotes;
      if (sortOrder === 'random') {
        processedQuotes = [...storedQuotes].sort(() => Math.random() - 0.5);
      }
      
      setQuotes(processedQuotes);
      setTotalCount(count);
      setDailyQuotes(dailyQuotes);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const addQuote = async (quote: Quote) => {
    await storage.saveQuote(quote);
    await loadQuotes();
  };

  const updateQuote = async (quote: Quote) => {
    await storage.updateQuote(quote);
    await loadQuotes();
  };

  const deleteQuote = async (id: string) => {
    await storage.deleteQuote(id);
    await loadQuotes();
  };

  // Fonction toggleFavorite modifiée pour intégrer la logique de bookmark et le callback
  const toggleFavorite = async (id: string, categoryId?: string, quoteIndex?: number, onSuccess?: () => void) => {
    try {
      // Trouver la citation pour connaître son état actuel
      const quote = quotes.find(q => q.id === id);
      const currentIsFavorite = quote?.isFavorite || false;
      
      // Appeler l'API pour basculer l'état favori
      await storage.toggleFavorite(id);
      
      // Mettre à jour l'état local des citations
      const updatedQuotes = quotes.map(quote =>
        quote.id === id ? { ...quote, isFavorite: !quote.isFavorite } : quote
      );
      setQuotes(updatedQuotes);
      
      // Également mettre à jour les citations quotidiennes si nécessaire
      setDailyQuotes(prevDailyQuotes => 
        prevDailyQuotes.map(quote => 
          quote.id === id ? { ...quote, isFavorite: !quote.isFavorite } : quote
        )
      );
      
      // Si les paramètres optionnels sont fournis et qu'on active le favori, mettre à jour le bookmark
      if (categoryId && quoteIndex !== undefined && !currentIsFavorite) {
        await updateBookmark(categoryId, quoteIndex);
        console.log(`Citation marquée comme favori et bookmarkée à l'index ${quoteIndex}`);
      }
      
      // Appeler le callback de succès après un court délai pour laisser React terminer ses mises à jour
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 50);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteAllQuotes = async () => {
    await storage.clearAllQuotes();
    await loadQuotes();
  };

  return (
    <QuoteContext.Provider
      value={{
        quotes,
        dailyQuotes,
        isLoading,
        sortOrder,
        setSortOrder,
        addQuote,
        updateQuote,
        deleteQuote,
        toggleFavorite,
        deleteAllQuotes,
        refresh: loadQuotes,
        totalCount
      }}
    >
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuotes = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};
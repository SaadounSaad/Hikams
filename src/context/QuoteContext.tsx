// QuoteContext.tsx - Version optimisée pour la performance
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Quote } from '../types';
import { storage } from "../utils/storage";
import { updateBookmark } from "../utils/bookmarkService";

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
  toggleFavorite: (id: string, categoryId?: string, quoteIndex?: number, onSuccess?: () => void) => Promise<void>;
  deleteAllQuotes: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);
const safeTimer = {
  time: (label: string) => {
    try {
      console.time(label);
    } catch (e) {
      // Timer existe déjà, l'ignorer
    }
  },
  timeEnd: (label: string) => {
    try {
      console.timeEnd(label);
    } catch (e) {
      // Timer n'existe pas, l'ignorer
    }
  }
};

export const QuoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  safeTimer.time(`Quote Context Initialization-${Date.now()}`);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuotes, setDailyQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('scheduled');
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Fonction optimisée de chargement des quotes
  const loadQuotes = useCallback(async () => {
    safeTimer.time('Load Quotes Operation');
    setIsLoading(true);
    
    try {
      // Chargement prioritaire des daily quotes pour affichage rapide
      if (!initialLoadComplete) {
        safeTimer.time('Daily Quotes Load');
        const dailyQuotesData = await storage.getDailyQuotes();
        setDailyQuotes(dailyQuotesData);
        safeTimer.timeEnd('Daily Quotes Load');
        console.log('📊 Daily quotes chargées:', dailyQuotesData.length);
        
        // Permettre l'affichage immédiat des daily quotes
        setIsLoading(false);
        
        // Charger le reste en arrière-plan
        setTimeout(async () => {
          safeTimer.time('All Quotes Load');
          const [storedQuotes, count] = await Promise.all([
            storage.getQuotes(sortOrder),
            storage.getQuotesCount()
          ]);
          
          let processedQuotes = storedQuotes;
          if (sortOrder === 'random') {
            processedQuotes = [...storedQuotes].sort(() => Math.random() - 0.5);
          }
          
          setQuotes(processedQuotes);
          setTotalCount(count);
          setInitialLoadComplete(true);
          
          safeTimer.timeEnd('All Quotes Load');
          console.log('📊 Toutes les quotes chargées:', processedQuotes.length);
        }, 100);
        
      } else {
        // Chargement normal pour les updates suivants
        const [storedQuotes, count, dailyQuotesData] = await Promise.all([
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
        setDailyQuotes(dailyQuotesData);
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Error loading quotes:', error);
      setIsLoading(false);
    }
    
    safeTimer.timeEnd('Load Quotes Operation');
  }, [sortOrder, initialLoadComplete]);

  // Chargement initial optimisé
  useEffect(() => {
    safeTimer.time('Quote Context Load');
    loadQuotes().then(() => {
      safeTimer.timeEnd('Quote Context Load');
      safeTimer.time(`Quote Context Initialization-${Date.now()}`);
    });
  }, [loadQuotes]);

  // Fonction addQuote optimisée
  const addQuote = useCallback(async (quote: Quote) => {
    safeTimer.time('Add Quote');
    try {
      await storage.saveQuote(quote);
      await loadQuotes();
      console.log('✅ Quote ajoutée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de quote:', error);
    } finally {
      safeTimer.timeEnd('Add Quote');
    }
  }, [loadQuotes]);

  // Fonction updateQuote optimisée
  const updateQuote = useCallback(async (quote: Quote) => {
    safeTimer.time('Update Quote');
    try {
      await storage.updateQuote(quote);
      await loadQuotes();
      console.log('✅ Quote mise à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de quote:', error);
    } finally {
      safeTimer.timeEnd('Update Quote');
    }
  }, [loadQuotes]);

  // Fonction deleteQuote optimisée
  const deleteQuote = useCallback(async (id: string) => {
    safeTimer.time('Delete Quote');
    try {
      await storage.deleteQuote(id);
      await loadQuotes();
      console.log('✅ Quote supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de quote:', error);
    } finally {
      safeTimer.timeEnd('Delete Quote');
    }
  }, [loadQuotes]);

  // Fonction toggleFavorite optimisée avec mise à jour locale immédiate
  const toggleFavorite = useCallback(async (
    id: string, 
    categoryId?: string, 
    quoteIndex?: number, 
    onSuccess?: () => void
  ) => {
    safeTimer.time('Toggle Favorite');
    
    try {
      // Trouver la citation pour connaître son état actuel
      const quote = quotes.find(q => q.id === id) || dailyQuotes.find(q => q.id === id);
      const currentIsFavorite = quote?.isFavorite || false;
      
      // Mise à jour optimiste de l'UI (avant l'API)
      const updateQuoteInList = (quoteList: Quote[]) =>
        quoteList.map(q => q.id === id ? { ...q, isFavorite: !q.isFavorite } : q);
      
      setQuotes(prevQuotes => updateQuoteInList(prevQuotes));
      setDailyQuotes(prevDailyQuotes => updateQuoteInList(prevDailyQuotes));
      
      // Appeler l'API en arrière-plan
      await storage.toggleFavorite(id);
      
      // Si les paramètres optionnels sont fournis et qu'on active le favori, mettre à jour le bookmark
      if (categoryId && quoteIndex !== undefined && !currentIsFavorite) {
        await updateBookmark(categoryId, quoteIndex);
        console.log(`📖 Citation marquée comme favori et bookmarkée à l'index ${quoteIndex}`);
      }
      
      // Callback de succès
      if (onSuccess) {
        setTimeout(onSuccess, 50);
      }
      
      console.log('✅ Favori basculé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors du toggle favori:', error);
      
      // En cas d'erreur, annuler la mise à jour optimiste
      const revertQuoteInList = (quoteList: Quote[]) =>
        quoteList.map(q => q.id === id ? { ...q, isFavorite: !q.isFavorite } : q);
      
      setQuotes(prevQuotes => revertQuoteInList(prevQuotes));
      setDailyQuotes(prevDailyQuotes => revertQuoteInList(prevDailyQuotes));
    } finally {
      safeTimer.timeEnd('Toggle Favorite');
    }
  }, [quotes, dailyQuotes]);

  // Fonction deleteAllQuotes optimisée
  const deleteAllQuotes = useCallback(async () => {
    safeTimer.time('Delete All Quotes');
    try {
      await storage.clearAllQuotes();
      await loadQuotes();
      console.log('✅ Toutes les quotes supprimées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de toutes les quotes:', error);
    } finally {
      safeTimer.timeEnd('Delete All Quotes');
    }
  }, [loadQuotes]);

  // Fonction refresh optimisée avec cache invalidation
  const refresh = useCallback(async () => {
    safeTimer.time('Refresh Quotes');
    setInitialLoadComplete(false); // Forcer un rechargement complet
    await loadQuotes();
    safeTimer.timeEnd('Refresh Quotes');
  }, [loadQuotes]);

  const contextValue = {
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
    refresh,
    totalCount
  };

  return (
    <QuoteContext.Provider value={contextValue}>
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
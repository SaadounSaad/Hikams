// src/components/QuoteViewer.tsx - VERSION CORRIGÉE SANS renderExtraControls
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Library, Bookmark } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';
import { updateBookmark, getSavedPageIndex } from '../utils/bookmarkService';
import { useAuth } from '../context/AuthContext';
// ✅ NOUVEAU: Import du service batch analytics
import { useBatchAnalytics } from '../services/batchAnalyticsService';

interface QuoteViewerProps {
  quotes: Quote[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  selectedCategory: string;
  onToggleFavorite: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  searchTerm?: string;
  // ✅ SUPPRIMÉ: renderExtraControls?: () => React.ReactNode;
}

// Hook personnalisé pour la gestion des swipes (inchangé)
const useSwipeNavigation = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  isEnabled: boolean = true
) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [isEnabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isEnabled || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const minSwipeDistance = 50;
    const maxSwipeTime = 500;
    const maxVerticalDeviation = 100;

    const isHorizontalSwipe = Math.abs(deltaX) > minSwipeDistance;
    const isWithinTimeLimit = deltaTime < maxSwipeTime;
    const isNotVerticalScroll = Math.abs(deltaY) < maxVerticalDeviation;
    const isHorizontalDominant = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

    if (isHorizontalSwipe && isWithinTimeLimit && isNotVerticalScroll && isHorizontalDominant) {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }

    touchStartRef.current = null;
  }, [isEnabled, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const container = swipeContainerRef.current;
    if (!container || !isEnabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, isEnabled]);

  return swipeContainerRef;
};

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quotes,
  currentIndex,
  onIndexChange,
  selectedCategory,
  onToggleFavorite,
  onEdit,
  onDelete,
  searchTerm,
  // ✅ SUPPRIMÉ: renderExtraControls,
}) => {
  // ✅ HOOKS - TOUS APPELÉS EN PREMIER
  const { user } = useAuth();
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isQuoteInReadingMode, setIsQuoteInReadingMode] = useState(false);

  // ✅ NOUVEAU: Service analytics batch complet
  const {
    trackQuoteRead,
    trackFavorite,
    trackBookmark,
    trackSearch,
    trackNavigation,
    getSessionStats,
    getDebugInfo
  } = useBatchAnalytics({
    userId: user?.id || '',
    category: selectedCategory
  });

  // ✅ Refs pour le tracking du temps de lecture
  const readingTimerRef = useRef<number | null>(null);
  const quoteStartTimeRef = useRef<number>(Date.now());
  const lastTrackedQuoteRef = useRef<string | null>(null);

  // ✅ Fonction pour recevoir l'état de lecture de QuoteCard
  const handleReadingModeChange = useCallback((isReading: boolean) => {
    setIsQuoteInReadingMode(isReading);
  }, []);

  // ✅ BATCH ANALYTICS: Fonction de tracking de lecture
  const handleQuoteView = useCallback((quote: Quote, readingTime?: number) => {
    // Éviter le double tracking de la même citation
    if (lastTrackedQuoteRef.current === quote.id) return;

    // ✅ TRACKING BATCH - Une seule ligne !
    trackQuoteRead(quote.id, readingTime || 3, 'manual');
    lastTrackedQuoteRef.current = quote.id;
    
    console.log(`📖 Citation trackée (batch): ${quote.id} (${readingTime}s)`);
  }, [trackQuoteRead]);

  // ✅ BATCH ANALYTICS: Toggle favori optimisé
  const handleToggleFavoriteWithTracking = useCallback(async (id: string, noteData?: {
    content: string;
    note_category: 'reflexion' | 'action' | 'objectif';
  }) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    const newFavoriteStatus = !quote.isFavorite;
    
    try {
      // ✅ TRACKING BATCH avec support des notes
      trackFavorite(
        quote.id, 
        newFavoriteStatus ? 'add' : 'remove', 
        quote.category,
        newFavoriteStatus ? noteData : undefined
      );
      
      // Appeler la fonction originale
      await onToggleFavorite(id);
      
      if (noteData && newFavoriteStatus) {
        console.log(`✅ Favori ajouté avec note (${noteData.note_category}) - Batch analytics`);
      } else {
        console.log(`✅ Favori ${newFavoriteStatus ? 'ajouté' : 'retiré'} - Batch analytics`);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du toggle favori:', error);
    }
  }, [quotes, trackFavorite, onToggleFavorite]);

  // ✅ Actions avec tracking batch
  const handleEditWithTracking = useCallback((quote: Quote) => {
    // Optionnel: tracker les éditions
    console.log(`✏️ Édition initiée: ${quote.id}`);
    onEdit(quote);
  }, [onEdit]);

  const handleDeleteWithTracking = useCallback((id: string) => {
    console.log(`🗑️ Suppression initiée: ${id}`);
    onDelete(id);
  }, [onDelete]);

  // ✅ BATCH ANALYTICS: Navigation avec tracking
  const handleSwipeLeft = useCallback(() => {
    if (quotes.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
    
    // ✅ TRACKING BATCH
    trackNavigation(currentIndex, newIndex, 'swipe', 'next');
    
    setTimeout(() => {
      onIndexChange(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [quotes.length, currentIndex, onIndexChange, isTransitioning, trackNavigation]);

  const handleSwipeRight = useCallback(() => {
    if (quotes.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
    
    // ✅ TRACKING BATCH
    trackNavigation(currentIndex, newIndex, 'swipe', 'previous');
    
    setTimeout(() => {
      onIndexChange(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [quotes.length, currentIndex, onIndexChange, isTransitioning, trackNavigation]);

  // Hook pour la détection des swipes - DÉSACTIVÉ en mode lecture
  const swipeContainerRef = useSwipeNavigation(
    handleSwipeLeft,
    handleSwipeRight,
    quotes.length > 1 && !isTransitioning && !isQuoteInReadingMode
  );

  // ✅ BATCH ANALYTICS: Navigation avec boutons
  const handleNavigateToFirst = useCallback(() => {
    if (quotes.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      trackNavigation(currentIndex, 0, 'button', 'first');
      
      setTimeout(() => {
        onIndexChange(0);
        setIsTransitioning(false);
      }, 150);
    }
  }, [quotes.length, isTransitioning, currentIndex, trackNavigation, onIndexChange]);

  const handleNavigateToLast = useCallback(() => {
    if (quotes.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const last = quotes.length - 1;
      
      trackNavigation(currentIndex, last, 'button', 'last');
      
      setTimeout(() => {
        onIndexChange(last);
        setIsTransitioning(false);
      }, 150);
    }
  }, [quotes.length, isTransitioning, currentIndex, trackNavigation, onIndexChange]);

  // ✅ BATCH ANALYTICS: Bookmark avec tracking
  const handleManualBookmark = useCallback(async () => {
    if (quotes.length === 0) return;
    
    const currentQuote = quotes[currentIndex];
    if (currentQuote) {
      // ✅ TRACKING BATCH
      trackBookmark(currentQuote.id, currentIndex);
    }
    
    await updateBookmark(selectedCategory, currentIndex);
    setBookmarkIndex(currentIndex);
    
    console.log(`🔖 Bookmark créé - Batch analytics`);
  }, [quotes, currentIndex, selectedCategory, trackBookmark]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleSwipeLeft();
    } else {
      handleSwipeRight();
    }
  }, [handleSwipeLeft, handleSwipeRight]);

  // ✅ BATCH ANALYTICS: Tracking de recherche
  useEffect(() => {
    if (searchTerm && quotes.length >= 0) {
      trackSearch(searchTerm, quotes.length);
      console.log(`🔍 Recherche trackée (batch): "${searchTerm}" (${quotes.length} résultats)`);
    }
  }, [searchTerm, quotes.length, trackSearch]);

  // ✅ Tracking du temps de lecture par citation (optimisé)
  useEffect(() => {
    const currentQuote = quotes[currentIndex];
    if (!currentQuote) return;

    quoteStartTimeRef.current = Date.now();
    
    if (readingTimerRef.current) {
      clearTimeout(readingTimerRef.current);
    }

    // Timer pour tracker automatiquement après 3 secondes
    readingTimerRef.current = window.setTimeout(() => {
      const readingTime = Math.round((Date.now() - quoteStartTimeRef.current) / 1000);
      handleQuoteView(currentQuote, readingTime);
    }, 3000);

    return () => {
      if (readingTimerRef.current) {
        clearTimeout(readingTimerRef.current);
        
        const readingTime = Math.round((Date.now() - quoteStartTimeRef.current) / 1000);
        if (readingTime >= 1) {
          handleQuoteView(currentQuote, readingTime);
        }
      }
    };
  }, [currentIndex, quotes, handleQuoteView]);

  // Correction: S'assurer que currentIndex est dans les limites valides
  useEffect(() => {
    if (quotes.length > 0 && (currentIndex >= quotes.length || currentIndex < 0)) {
      onIndexChange(0);
    }
  }, [quotes, currentIndex, onIndexChange]);

  // Charger bookmark (inchangé)
  useEffect(() => {
    const fetchBookmark = async () => {
      setIsLoading(true);
      try {
        const index = await getSavedPageIndex(selectedCategory);
        setBookmarkIndex(index);
      } catch (error) {
        console.error("Erreur lors du chargement du signet:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmark();
  }, [selectedCategory]);

  // ✅ BATCH ANALYTICS: Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning || isQuoteInReadingMode) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
          e.preventDefault();
          trackNavigation(currentIndex, Math.max(0, currentIndex - 1), 'keyboard', 'previous');
          handleSwipeRight();
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          trackNavigation(currentIndex, Math.min(quotes.length - 1, currentIndex + 1), 'keyboard', 'next');
          handleSwipeLeft();
          break;
        case 'Home':
          e.preventDefault();
          trackNavigation(currentIndex, 0, 'keyboard', 'first');
          handleNavigateToFirst();
          break;
        case 'End':
          e.preventDefault();
          trackNavigation(currentIndex, quotes.length - 1, 'keyboard', 'last');
          handleNavigateToLast();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning, isQuoteInReadingMode, handleSwipeLeft, handleSwipeRight, handleNavigateToFirst, handleNavigateToLast, currentIndex, quotes.length, trackNavigation]);

  // ✅ BATCH ANALYTICS: Debug et session stats
  useEffect(() => {
    const sessionStats = getSessionStats();
    const debugInfo = getDebugInfo();
    
    if (sessionStats) {
      console.log('📊 Stats session courante:', sessionStats);
    }
    
    if (debugInfo.hasCurrentSession) {
      console.log('🔍 Debug analytics:', debugInfo);
    }
  }, [getSessionStats, getDebugInfo, currentIndex]);

  // ✅ RETURNS CONDITIONNELS (après tous les hooks)
  
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm mb-6">
        <div className="text-gray-500 space-y-2">
          <Library className="w-12 h-12 mx-auto text-gray-400" />
          <p className="text-lg font-medium">Aucune citation trouvée</p>
          <p className="text-sm">
            {searchTerm ? 
              `Aucun résultat pour "${searchTerm}"` : 
              'Commencez par ajouter une nouvelle citation'
            }
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm mb-6">
        <div className="text-gray-500 space-y-2">
          <div className="w-12 h-12 mx-auto border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium">Chargement des citations...</p>
        </div>
      </div>
    );
  }

  const isValidIndex = currentIndex >= 0 && currentIndex < quotes.length;
  const currentQuote = isValidIndex ? quotes[currentIndex] : null;

  return (
    <div className="pb-6 mb-6">
      {/* Masquer la barre de navigation si en mode lecture */}
      {!isQuoteInReadingMode && (
        <>
          {/* Affichage du statut de recherche */}
          {searchTerm && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <div className="text-sm">
                  <span className="font-medium">
                    {quotes.length} résultat{quotes.length > 1 ? 's' : ''} trouvé{quotes.length > 1 ? 's' : ''} pour: 
                  </span>
                  <span className="font-bold ml-1">"{searchTerm}"</span>
                </div>
              </div>
            </div>
          )}

          {/* Barre de navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {/* ✅ SUPPRIMÉ: renderExtraControls */}
              
              <button 
                onClick={handleNavigateToFirst} 
                className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quotes.length === 0 || currentIndex === 0 || isTransitioning}
                title="الذهاب إلى البداية"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleSwipe('right')} 
                className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quotes.length === 0 || currentIndex === 0 || isTransitioning}
                title="السابق"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                {currentIndex + 1} / {quotes.length}
              </span>
              
              {bookmarkIndex !== null && bookmarkIndex === currentIndex && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Bookmark className="w-4 h-4 fill-current" />
                  <span className="text-xs font-medium">Signet</span>
                </div>
              )}
              
              <button
                onClick={handleManualBookmark}
                className="p-2 rounded-full hover:bg-white/50 transition-colors"
                title="Créer un signet"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleSwipe('left')} 
                className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quotes.length === 0 || currentIndex === quotes.length - 1 || isTransitioning}
                title="التالي"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNavigateToLast} 
                className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quotes.length === 0 || currentIndex === quotes.length - 1 || isTransitioning}
                title="الذهاب إلى النهاية"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Citation actuelle */}
      <div 
        ref={swipeContainerRef}
        className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
      >
        {currentQuote && (
          <QuoteCard
            quote={currentQuote}
            onToggleFavorite={handleToggleFavoriteWithTracking}
            onEdit={handleEditWithTracking}
            onDelete={handleDeleteWithTracking}
            searchTerm={searchTerm}
            onReadingModeChange={handleReadingModeChange}
          />
        )}
      </div>
    </div>
  );
};


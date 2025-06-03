// src/components/QuoteViewer.tsx - Version avec hooks fixes FINAL
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Library, Bookmark } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';
import { updateBookmark, getSavedPageIndex } from '../utils/bookmarkService';
import { useAnalytics } from '../context/AnalyticsContext';

interface QuoteViewerProps {
  quotes: Quote[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  selectedCategory: string;
  onToggleFavorite: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  searchTerm?: string;
  renderExtraControls?: () => React.ReactNode;
}

// Hook personnalisé pour la gestion des swipes
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

    // Seuils de détection
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;
    const maxVerticalDeviation = 100;

    // Vérifier si c'est un swipe horizontal valide
    const isHorizontalSwipe = Math.abs(deltaX) > minSwipeDistance;
    const isWithinTimeLimit = deltaTime < maxSwipeTime;
    const isNotVerticalScroll = Math.abs(deltaY) < maxVerticalDeviation;
    const isHorizontalDominant = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

    if (isHorizontalSwipe && isWithinTimeLimit && isNotVerticalScroll && isHorizontalDominant) {
      // Feedback haptique sur iOS
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      if (deltaX > 0) {
        onSwipeRight(); // Swipe vers la droite = quote précédente
      } else {
        onSwipeLeft(); // Swipe vers la gauche = quote suivante
      }
    }

    touchStartRef.current = null;
  }, [isEnabled, onSwipeLeft, onSwipeRight]);

  // Gestion des événements
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
  renderExtraControls,
}) => {
  // ✅ CRITIQUE: Tous les hooks DOIVENT être appelés avant tout return conditionnel
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { trackEvent } = useAnalytics();

  // ✅ AMÉLIORATION: Tracking du temps de lecture avec timer
  const readingTimerRef = useRef<number | null>(null);
  const quoteStartTimeRef = useRef<number>(Date.now());
  const lastTrackedQuoteRef = useRef<string | null>(null);

  // ✅ AMÉLIORATION: Fonction de tracking de lecture avec temps réel
  const handleQuoteView = useCallback((quote: Quote, readingTime?: number) => {
    // Éviter le double tracking de la même citation
    if (lastTrackedQuoteRef.current === quote.id) return;

    trackEvent('quote_read', {
      quote_id: quote.id,
      category: quote.category,
      text_length: quote.text?.length || 0,
      is_favorite: quote.isFavorite || false,
      read_duration_seconds: readingTime || 3, // Temps estimé ou réel
      navigation_method: 'manual', // sera modifié selon le contexte
      search_result: !!searchTerm,
      quote_index: currentIndex,
      total_quotes: quotes.length,
      timestamp: new Date().toISOString()
    });

    lastTrackedQuoteRef.current = quote.id;
  }, [trackEvent, searchTerm, currentIndex, quotes.length]);

  // ✅ AMÉLIORATION: Wrapper pour onToggleFavorite avec tracking
  const handleToggleFavoriteWithTracking = useCallback(async (id: string) => {
    const quote = quotes.find(q => q.id === id);
    if (!quote) return;

    const newFavoriteStatus = !quote.isFavorite;
    
    try {
      // ✅ TRACKING AVANT l'action avec plus de détails
      trackEvent('quote_favorite_toggle', {
        quote_id: id,
        category: quote.category,
        action: newFavoriteStatus ? 'add' : 'remove',
        quote_text_preview: quote.text?.substring(0, 50) + '...',
        current_index: currentIndex,
        selected_category: selectedCategory,
        navigation_context: searchTerm ? 'search_results' : 'normal_browse',
        search_term: searchTerm,
        timestamp: new Date().toISOString()
      });

      // Appeler la fonction originale
      await onToggleFavorite(id);
      
      // ✅ TRACKING de succès
      trackEvent('quote_favorite_success', {
        quote_id: id,
        category: quote.category,
        new_status: newFavoriteStatus ? 'favorited' : 'unfavorited',
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Favori ${newFavoriteStatus ? 'ajouté' : 'retiré'} avec succès`);
      
    } catch (error) {
      // ✅ TRACKING des erreurs
      trackEvent('quote_favorite_error', {
        quote_id: id,
        category: quote.category,
        intended_action: newFavoriteStatus ? 'add' : 'remove',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ Erreur lors du toggle favori:', error);
    }
  }, [quotes, currentIndex, selectedCategory, searchTerm, trackEvent, onToggleFavorite]);

  // ✅ AMÉLIORATION: Wrapper pour les actions d'édition/suppression
  const handleEditWithTracking = useCallback((quote: Quote) => {
    trackEvent('quote_edit_initiated', {
      quote_id: quote.id,
      category: quote.category,
      current_index: currentIndex,
      timestamp: new Date().toISOString()
    });
    onEdit(quote);
  }, [trackEvent, currentIndex, onEdit]);

  const handleDeleteWithTracking = useCallback((id: string) => {
    const quote = quotes.find(q => q.id === id);
    trackEvent('quote_delete_initiated', {
      quote_id: id,
      category: quote?.category || selectedCategory,
      current_index: currentIndex,
      timestamp: new Date().toISOString()
    });
    onDelete(id);
  }, [quotes, selectedCategory, currentIndex, trackEvent, onDelete]);

  // ✅ AMÉLIORATION: Gestion du swipe avec tracking de navigation
  const handleSwipeLeft = useCallback(() => {
    if (quotes.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
    
    // Tracker la navigation
    trackEvent('quote_navigation', {
      direction: 'next',
      method: 'swipe',
      from_index: currentIndex,
      to_index: newIndex,
      category: selectedCategory,
      is_wraparound: newIndex === 0 && currentIndex === quotes.length - 1,
      timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
      onIndexChange(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [quotes.length, currentIndex, onIndexChange, isTransitioning, selectedCategory, trackEvent]);

  const handleSwipeRight = useCallback(() => {
    if (quotes.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
    
    // Tracker la navigation
    trackEvent('quote_navigation', {
      direction: 'previous',
      method: 'swipe',
      from_index: currentIndex,
      to_index: newIndex,
      category: selectedCategory,
      is_wraparound: newIndex === quotes.length - 1 && currentIndex === 0,
      timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
      onIndexChange(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [quotes.length, currentIndex, onIndexChange, isTransitioning, selectedCategory, trackEvent]);

  // Hook pour la détection des swipes
  const swipeContainerRef = useSwipeNavigation(
    handleSwipeLeft,
    handleSwipeRight,
    quotes.length > 1 && !isTransitioning
  );

  // ✅ AMÉLIORATION: Navigation avec tracking
  const handleNavigateToFirst = useCallback(() => {
    if (quotes.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      trackEvent('quote_navigation', {
        direction: 'first',
        method: 'button',
        from_index: currentIndex,
        to_index: 0,
        category: selectedCategory,
        timestamp: new Date().toISOString()
      });
      
      setTimeout(() => {
        onIndexChange(0);
        setIsTransitioning(false);
      }, 150);
    }
  }, [quotes.length, isTransitioning, currentIndex, selectedCategory, trackEvent, onIndexChange]);

  const handleNavigateToLast = useCallback(() => {
    if (quotes.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const last = quotes.length - 1;
      
      trackEvent('quote_navigation', {
        direction: 'last',
        method: 'button',
        from_index: currentIndex,
        to_index: last,
        category: selectedCategory,
        timestamp: new Date().toISOString()
      });
      
      setTimeout(() => {
        onIndexChange(last);
        setIsTransitioning(false);
      }, 150);
    }
  }, [quotes.length, isTransitioning, currentIndex, selectedCategory, trackEvent, onIndexChange]);

  // ✅ AMÉLIORATION: Bookmark avec tracking
  const handleManualBookmark = useCallback(async () => {
    if (quotes.length === 0) return;
    
    trackEvent('bookmark_created', {
      quote_id: quotes[currentIndex]?.id,
      category: selectedCategory,
      quote_index: currentIndex,
      bookmark_type: 'manual',
      timestamp: new Date().toISOString()
    });
    
    await updateBookmark(selectedCategory, currentIndex);
    setBookmarkIndex(currentIndex);
  }, [quotes, currentIndex, selectedCategory, trackEvent]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleSwipeLeft();
    } else {
      handleSwipeRight();
    }
  }, [handleSwipeLeft, handleSwipeRight]);

  // ✅ AMÉLIORATION: Tracking session avec plus de détails
  useEffect(() => {
    // Tracker le début de session dans cette catégorie
    trackEvent('quote_session_start', {
      category: selectedCategory,
      total_quotes: quotes.length,
      has_search: !!searchTerm,
      search_term: searchTerm,
      timestamp: new Date().toISOString()
    });

    return () => {
      // Tracker la fin de session
      trackEvent('quote_session_end', {
        category: selectedCategory,
        session_duration_seconds: Math.round((Date.now() - quoteStartTimeRef.current) / 1000),
        quotes_viewed: lastTrackedQuoteRef.current ? 1 : 0
      });
    };
  }, [selectedCategory, quotes.length, searchTerm, trackEvent]);

  // ✅ AMÉLIORATION: Tracking du temps de lecture par citation
  useEffect(() => {
    const currentQuote = quotes[currentIndex];
    if (!currentQuote) return;

    // Démarrer le timer pour cette citation
    quoteStartTimeRef.current = Date.now();
    
    // Nettoyer le timer précédent
    if (readingTimerRef.current) {
      clearTimeout(readingTimerRef.current);
    }

    // Timer pour tracker automatiquement après 3 secondes
    readingTimerRef.current = window.setTimeout(() => {
      const readingTime = Math.round((Date.now() - quoteStartTimeRef.current) / 1000);
      handleQuoteView(currentQuote, readingTime);
    }, 3000);

    // Nettoyage lors du changement de citation
    return () => {
      if (readingTimerRef.current) {
        clearTimeout(readingTimerRef.current);
        
        // Tracker le temps de lecture si la citation a été vue assez longtemps
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

  useEffect(() => {
    // Charger l'index du bookmark pour la catégorie sélectionnée
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

  // ✅ AMÉLIORATION: Navigation clavier avec tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      const trackKeyboardNavigation = (direction: string) => {
        trackEvent('quote_navigation', {
          direction,
          method: 'keyboard',
          key: e.key,
          from_index: currentIndex,
          category: selectedCategory,
          timestamp: new Date().toISOString()
        });
      };

      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
          e.preventDefault();
          trackKeyboardNavigation('previous');
          handleSwipeRight();
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          trackKeyboardNavigation('next');
          handleSwipeLeft();
          break;
        case 'Home':
          e.preventDefault();
          trackKeyboardNavigation('first');
          handleNavigateToFirst();
          break;
        case 'End':
          e.preventDefault();
          trackKeyboardNavigation('last');
          handleNavigateToLast();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning, handleSwipeLeft, handleSwipeRight, handleNavigateToFirst, handleNavigateToLast, currentIndex, selectedCategory, trackEvent]);

  // ✅ AMÉLIORATION: Tracking des recherches
  useEffect(() => {
    if (searchTerm) {
      trackEvent('search_performed', {
        search_term: searchTerm,
        category: selectedCategory,
        results_count: quotes.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [searchTerm, selectedCategory, quotes.length, trackEvent]);

  // ✅ CORRECTION CRITIQUE: Tracker l'état vide AVANT les returns conditionnels
  useEffect(() => {
    if (quotes.length === 0) {
      trackEvent('empty_state_viewed', {
        category: selectedCategory,
        has_search: !!searchTerm,
        search_term: searchTerm,
        timestamp: new Date().toISOString()
      });
    }
  }, [quotes.length, selectedCategory, searchTerm, trackEvent]);

  // ✅ CORRECTION CRITIQUE: Hooks appelés AVANT tous les returns
  // Maintenant nous pouvons faire les returns conditionnels en sécurité

  // Si aucune citation n'est disponible
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

  // Si chargement en cours, afficher un indicateur
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

  // Vérifier si l'index actuel est valide
  const isValidIndex = currentIndex >= 0 && currentIndex < quotes.length;
  const currentQuote = isValidIndex ? quotes[currentIndex] : null;

  return (
    <div className="pb-6 mb-6">
      {/* Affichage du statut de recherche si applicable */}
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

      {/* Barre de navigation avec menu mukhtarat intégré */}
      <div className="flex items-center justify-between mb-4">
        {/* Menu mukhtarat à l'extrême gauche */}
        <div className="flex items-center gap-1">
          {renderExtraControls && (
            <div className="mr-1">
              {renderExtraControls()}
            </div>
          )}
          
          {/* Boutons de navigation gauche */}
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

        {/* Compteur central avec indicateur de progression */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-500 bg-white/50 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {quotes.length}
          </span>
          {quotes.length > 1 && (
            <div className="mt-1 flex gap-1">
              {Array.from({ length: Math.min(quotes.length, 5) }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
              {quotes.length > 5 && (
                <span className="text-xs text-gray-400 ml-1">...</span>
              )}
            </div>
          )}
        </div>

        {/* Boutons de navigation droite */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleSwipe('left')} 
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quotes.length === 0 || currentIndex >= quotes.length - 1 || isTransitioning}
            title="التالي"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNavigateToLast} 
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quotes.length === 0 || currentIndex >= quotes.length - 1 || isTransitioning}
            title="الذهاب إلى النهاية"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
          
          {/* Bouton bookmark */}
          <button
            onClick={handleManualBookmark}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              bookmarkIndex === currentIndex 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="إضافة إشارة مرجعية"
            disabled={quotes.length === 0 || isTransitioning}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Container avec détection de swipe et animation */}
      <div 
        ref={swipeContainerRef}
        className={`transition-all duration-150 ${
          isTransitioning ? 'opacity-80 transform scale-95' : 'opacity-100 transform scale-100'
        }`}
        style={{ 
          touchAction: 'pan-y pinch-zoom', // Permet le scroll vertical mais limite les gestes horizontaux
          userSelect: 'none', // Évite la sélection de texte pendant les swipes
          WebkitUserSelect: 'none'
        }}
      >
        {/* Contenu de la citation avec espacement pour Bottom Navigation */}
        {currentQuote ? (
          <QuoteCard
            quote={currentQuote}
            onToggleFavorite={handleToggleFavoriteWithTracking}
            onEdit={handleEditWithTracking}
            onDelete={handleDeleteWithTracking}
            onSwipe={handleSwipe}
            searchTerm={searchTerm}
          />
        ) : (
          <div className="p-6 rounded-xl bg-white shadow">
            <p className="text-center text-gray-500">Citation non disponible ou en cours de chargement</p>
          </div>
        )}
      </div>
    </div>
  );
};
// src/components/QuoteViewer.tsx - Version avec navigation swipe optimisée
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Library, Bookmark } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';
import { updateBookmark, getSavedPageIndex } from '../utils/bookmarkService';

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
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Gestion de la navigation par swipe
  const handleSwipeLeft = useCallback(() => {
    if (quotes.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
    
    setTimeout(() => {
      onIndexChange(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [quotes.length, currentIndex, onIndexChange, isTransitioning]);

  const handleSwipeRight = useCallback(() => {
    if (quotes.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    const newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
    
    setTimeout(() => {
      onIndexChange(newIndex);
      setIsTransitioning(false);
    }, 150);
  }, [quotes.length, currentIndex, onIndexChange, isTransitioning]);

  // Hook pour la détection des swipes
  const swipeContainerRef = useSwipeNavigation(
    handleSwipeLeft,
    handleSwipeRight,
    quotes.length > 1 && !isTransitioning
  );

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

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleSwipeLeft();
    } else {
      handleSwipeRight();
    }
  };

  const handleNavigateToFirst = () => {
    if (quotes.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        onIndexChange(0);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleNavigateToLast = () => {
    if (quotes.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      const last = quotes.length - 1;
      setTimeout(() => {
        onIndexChange(last);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleManualBookmark = async () => {
    if (quotes.length === 0) return;
    
    await updateBookmark(selectedCategory, currentIndex);
    setBookmarkIndex(currentIndex);
  };

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
          e.preventDefault();
          handleSwipeRight();
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          handleSwipeLeft();
          break;
        case 'Home':
          e.preventDefault();
          handleNavigateToFirst();
          break;
        case 'End':
          e.preventDefault();
          handleNavigateToLast();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isTransitioning, handleSwipeLeft, handleSwipeRight]);

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

      {/* Indicateurs de swipe discrets */}
      {quotes.length > 1 && (
        <div className="flex justify-between items-center mb-2 px-4 opacity-30">
          <div className="text-xs text-gray-400 font-arabic">
            ← اسحب للسابق
          </div>
          <div className="text-xs text-gray-400 font-arabic">
            اسحب للتالي →
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
            onToggleFavorite={onToggleFavorite}
            onEdit={onEdit}
            onDelete={onDelete}
            onSwipe={handleSwipe}
            searchTerm={searchTerm}
          />
        ) : (
          <div className="p-6 rounded-xl bg-white shadow">
            <p className="text-center text-gray-500">Citation non disponible ou en cours de chargement</p>
          </div>
        )}
      </div>

      {/* Instructions de navigation pour utilisateurs novices */}
      {quotes.length > 1 && currentIndex === 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-full">
            📱 اسحب يميناً أو يساراً للتنقل بين النصوص
          </div>
        </div>
      )}
    </div>
  );
};
// src/components/QuoteViewer.tsx - Version mise à jour avec support Bottom Navigation
import React, { useEffect, useState } from 'react';
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
  searchTerm?: string; // Nouveau prop pour passer le terme de recherche
  // Prop pour le menu mukhtarat
  renderExtraControls?: () => React.ReactNode;
}

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quotes,
  currentIndex,
  onIndexChange,
  selectedCategory,
  onToggleFavorite,
  onEdit,
  onDelete,
  searchTerm, // Nouveau prop
  renderExtraControls,
}) => {
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    // Ne pas effectuer de swipe s'il n'y a pas de citations
    if (quotes.length === 0) return;
    
    let newIndex = currentIndex;
    if (direction === 'left') {
      newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
    }
    onIndexChange(newIndex);
  };

  const handleNavigateToFirst = () => {
    if (quotes.length > 0) {
      onIndexChange(0);
    }
  };

  const handleNavigateToLast = () => {
    if (quotes.length > 0) {
      const last = quotes.length - 1;
      onIndexChange(last);
    }
  };

  const handleManualBookmark = async () => {
    if (quotes.length === 0) return;
    
    await updateBookmark(selectedCategory, currentIndex);
    setBookmarkIndex(currentIndex);
  };

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
            disabled={quotes.length === 0 || currentIndex === 0}
            title="الذهاب إلى البداية"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleSwipe('right')} 
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quotes.length === 0 || currentIndex === 0}
            title="السابق"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Compteur central */}
        <span className="text-sm font-medium text-gray-500 bg-white/50 px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {quotes.length}
        </span>

        {/* Boutons de navigation droite */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleSwipe('left')} 
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quotes.length === 0 || currentIndex >= quotes.length - 1}
            title="التالي"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNavigateToLast} 
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quotes.length === 0 || currentIndex >= quotes.length - 1}
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
            disabled={quotes.length === 0}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenu de la citation avec espacement pour Bottom Navigation */}
      {currentQuote ? (
        <QuoteCard
          quote={currentQuote}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
          onSwipe={handleSwipe}
          searchTerm={searchTerm} // Passer le terme de recherche à QuoteCard
        />
      ) : (
        <div className="p-6 rounded-xl bg-white shadow">
          <p className="text-center text-gray-500">Citation non disponible ou en cours de chargement</p>
        </div>
      )}
    </div>
  );
};
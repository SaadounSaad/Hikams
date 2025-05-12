// src/components/QuoteViewer.tsx
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
}

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quotes,
  currentIndex,
  onIndexChange,
  selectedCategory,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (currentIndex >= quotes.length && quotes.length > 0) {
      onIndexChange(0);
    }
  }, [quotes, currentIndex, onIndexChange]);

  useEffect(() => {
    // Charger l'index du bookmark pour la catégorie sélectionnée
    const fetchBookmark = async () => {
      const index = await getSavedPageIndex(selectedCategory);
      setBookmarkIndex(index);
    };
    fetchBookmark();
  }, [selectedCategory]);

  const handleSwipe = (direction: 'left' | 'right') => {
    let newIndex = currentIndex;
    if (direction === 'left') {
      newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
    }
    onIndexChange(newIndex);
  };

  const handleNavigateToFirst = () => {
    onIndexChange(0);
  };

  const handleNavigateToLast = () => {
    const last = quotes.length - 1;
    onIndexChange(last);
  };

  const handleManualBookmark = async () => {
    await updateBookmark(selectedCategory, currentIndex);
    setBookmarkIndex(currentIndex); // mise à jour visuelle
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm">
        <div className="text-gray-500 space-y-2">
          <Library className="w-12 h-12 mx-auto text-gray-400" />
          <p className="text-lg font-medium">Aucune citation trouvée</p>
          <p className="text-sm">Commencez par ajouter une nouvelle citation</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={handleNavigateToFirst} className="p-3 rounded-full hover:bg-white/50">
            <ChevronsLeft className="w-6 h-6" />
          </button>
          <button onClick={() => handleSwipe('right')} className="p-3 rounded-full hover:bg-white/50">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <span className="text-sm font-medium text-gray-500 bg-white/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {quotes.length}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSwipe('left')} className="p-3 rounded-full hover:bg-white/50">
            <ChevronRight className="w-6 h-6" />
          </button>
          <button onClick={handleNavigateToLast} className="p-3 rounded-full hover:bg-white/50">
            <ChevronsRight className="w-6 h-6" />
          </button>
          <button
            onClick={handleManualBookmark}
            className={`p-3 rounded-full transition-colors ${
              bookmarkIndex === currentIndex ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Enregistrer cette page comme marqueur"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      <QuoteCard
        quote={quotes[currentIndex]}
        onToggleFavorite={onToggleFavorite}
        onEdit={onEdit}
        onDelete={onDelete}
        onSwipe={handleSwipe}
      />
    </>
  );
};

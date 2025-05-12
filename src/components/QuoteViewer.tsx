// src/components/QuoteViewer.tsx
import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Library } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';
import { updateBookmark } from '../utils/bookmarkService';

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
  useEffect(() => {
    // Assure qu’on ne dépasse pas la longueur disponible
    if (currentIndex >= quotes.length && quotes.length > 0) {
      onIndexChange(0);
    }
  }, [quotes, currentIndex, onIndexChange]);

  const handleSwipe = (direction: 'left' | 'right') => {
    let newIndex = currentIndex;
    if (direction === 'left') {
      newIndex = currentIndex < quotes.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : quotes.length - 1;
    }
    onIndexChange(newIndex);
    updateBookmark(selectedCategory, newIndex);
  };

  const handleNavigateToFirst = () => {
    onIndexChange(0);
    updateBookmark(selectedCategory, 0);
  };

  const handleNavigateToLast = () => {
    const last = quotes.length - 1;
    onIndexChange(last);
    updateBookmark(selectedCategory, last);
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

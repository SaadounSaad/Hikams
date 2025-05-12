import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Library } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';
import { updateBookmark } from '../utils/bookmarkService';

interface QuoteViewerProps {
  quotes: Quote[];
  selectedCategory: string;
  currentQuoteIndex: number;
  setCurrentQuoteIndex: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
}

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quotes,
  selectedCategory,
  currentQuoteIndex,
  setCurrentQuoteIndex,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  useEffect(() => {
    if (currentQuoteIndex >= quotes.length) {
      setCurrentQuoteIndex(Math.max(0, quotes.length - 1));
    }
  }, [quotes.length, currentQuoteIndex, setCurrentQuoteIndex]);

  const handleSwipe = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left'
      ? (currentQuoteIndex < quotes.length - 1 ? currentQuoteIndex + 1 : 0)
      : (currentQuoteIndex > 0 ? currentQuoteIndex - 1 : quotes.length - 1);

    setCurrentQuoteIndex(newIndex);
    updateBookmark(selectedCategory, newIndex);
  };

  const handleNavigateToFirst = () => {
    setCurrentQuoteIndex(0);
    updateBookmark(selectedCategory, 0);
  };

  const handleNavigateToLast = () => {
    const last = quotes.length - 1;
    setCurrentQuoteIndex(last);
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
          <button onClick={handleNavigateToFirst} className="p-3 rounded-full hover:bg-white/50" title="Première citation">
            <ChevronsLeft className="w-6 h-6" />
          </button>
          <button onClick={() => handleSwipe('right')} className="p-3 rounded-full hover:bg-white/50" title="Citation précédente">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <span className="text-sm font-medium text-gray-500 bg-white/50 px-4 py-2 rounded-full">
          {currentQuoteIndex + 1} / {quotes.length}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSwipe('left')} className="p-3 rounded-full hover:bg-white/50" title="Citation suivante">
            <ChevronRight className="w-6 h-6" />
          </button>
          <button onClick={handleNavigateToLast} className="p-3 rounded-full hover:bg-white/50" title="Dernière citation">
            <ChevronsRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <QuoteCard
        quote={quotes[currentQuoteIndex]}
        onToggleFavorite={onToggleFavorite}
        onEdit={onEdit}
        onDelete={onDelete}
        onSwipe={handleSwipe}
      />
    </>
  );
};

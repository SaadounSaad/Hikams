// QuoteViewer.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Library } from 'lucide-react';
import { Quote } from '../types';
import { QuoteCard } from './QuoteCard';

interface QuoteViewerProps {
  quotes: Quote[];
  onToggleFavorite: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
}

export const QuoteViewer: React.FC<QuoteViewerProps> = ({
  quotes,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(prev => Math.min(prev, Math.max(0, quotes.length - 1)));
  }, [quotes]);

  const handleNavigate = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCurrentIndex(prev => 
        prev < quotes.length - 1 ? prev + 1 : 0
      );
    } else {
      setCurrentIndex(prev => 
        prev > 0 ? prev - 1 : quotes.length - 1
      );
    }
  };

  const handleNavigateToFirst = () => setCurrentIndex(0);
  const handleNavigateToLast = () => setCurrentIndex(quotes.length - 1);

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
          <button
            onClick={handleNavigateToFirst}
            className="p-3 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Première citation"
            title="Première citation"
          >
            <ChevronsLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleNavigate('right')}
            className="p-3 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Citation précédente"
            title="Citation précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <span className="text-sm font-medium text-gray-500 bg-white/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {quotes.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate('left')}
            className="p-3 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Citation suivante"
            title="Citation suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <button
            onClick={handleNavigateToLast}
            className="p-3 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Dernière citation"
            title="Dernière citation"
          >
            <ChevronsRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      <QuoteCard
        quote={quotes[currentIndex]}
        onToggleFavorite={onToggleFavorite}
        onEdit={onEdit}
        onDelete={onDelete}
        onSwipe={handleNavigate}
      />
    </>
  );
};
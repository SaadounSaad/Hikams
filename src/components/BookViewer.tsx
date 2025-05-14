// ✅ Étape 1 : Nouveau composant BookViewer.tsx avec navigation et bookmark
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Bookmark } from 'lucide-react';
import { BookEntry } from '../types';
import BookEntryCard from './BookEntryCard';
import { getSavedPageIndex, updateBookmark } from '../utils/bookmarkService';

interface BookViewerProps {
  entries: BookEntry[];
  bookTitle: string;
  onBack: () => void;
}

const BookViewer: React.FC<BookViewerProps> = ({ entries, bookTitle, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (entries.length > 0) {
      getSavedPageIndex(bookTitle).then((index) => {
        if (index != null && index < entries.length) setCurrentIndex(index);
        setBookmarkIndex(index);
      });
    }
  }, [entries, bookTitle]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (entries.length === 0) return;
    let newIndex = currentIndex;
    if (direction === 'left') {
      newIndex = currentIndex < entries.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : entries.length - 1;
    }
    setCurrentIndex(newIndex);
  };

  const handleBookmark = async () => {
    await updateBookmark(bookTitle, currentIndex);
    setBookmarkIndex(currentIndex);
  };

  if (entries.length === 0) return <div className="text-center py-12 text-gray-500">Aucune entrée trouvée</div>;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentIndex(0)} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button onClick={() => handleSwipe('right')} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {entries.length}
        </span>

        <div className="flex items-center gap-2">
          <button onClick={() => handleSwipe('left')} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentIndex(entries.length - 1)} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronsRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleBookmark}
            title="Marquer cette page"
            className={`p-2 rounded-full ${bookmarkIndex === currentIndex ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'}`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BookEntryCard entry={entries[currentIndex]} />
    </div>
  );
};

export default BookViewer;

import React, { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useFavoritesContext } from '../context/FavoritesContext';
import { Quote, BookEntry } from '../services/FavoritesService';
import FavoriteButton from '../components/FavoriteButton';
import { BookOpen, Quote as QuoteIcon, Star, ArrowLeft, Loader2 } from 'lucide-react';

const FavoritesPage: React.FC = () => {
  const user = useUser();
  const { favorites, isLoading, error, refreshFavorites } = useFavoritesContext();
  const [activeTab, setActiveTab] = useState<'all' | 'quotes' | 'books'>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedBookEntry, setSelectedBookEntry] = useState<BookEntry | null>(null);

  useEffect(() => {
    // Charger les favoris quand la page se monte
    if (user) {
      refreshFavorites();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSelectQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setSelectedBookEntry(null);
  };

  const handleSelectBookEntry = (bookEntry: BookEntry) => {
    setSelectedBookEntry(bookEntry);
    setSelectedQuote(null);
  };

  const handleCloseDetails = () => {
    setSelectedQuote(null);
    setSelectedBookEntry(null);
  };

  const totalFavorites = favorites.quotes.length + favorites.bookEntries.length;

  // Si un élément est sélectionné, afficher ses détails
  if (selectedQuote) {
    return (
      <div className="container mx-auto py-8 px-4" dir="rtl">
        <button 
          onClick={handleCloseDetails}
          className="flex items-center text-primary mb-4"
        >
          <ArrowLeft className="h-5 w-5 ml-1" />
          العودة إلى المفضلة
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedQuote.category}</h2>
              {selectedQuote.source && (
                <p className="text-gray-600">{selectedQuote.source}</p>
              )}
            </div>
            <FavoriteButton 
              contentId={selectedQuote.id}
              contentType="quote"
              initialIsFavorite={selectedQuote.is_favorite}
              size="md"
            />
          </div>
          
          <p className="text-lg my-4">{selectedQuote.text}</p>
          
          {selectedQuote.theme && (
            <div className="mt-4">
              <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {selectedQuote.theme}
              </span>
            </div>
          )}
          
          <div className="mt-6 text-gray-500 text-sm">
            تمت الإضافة: {new Date(selectedQuote.createdAt || '').toLocaleDateString('ar')}
          </div>
        </div>
      </div>
    );
  }

  if (selectedBookEntry) {
    return (
      <div className="container mx-auto py-8 px-4" dir="rtl">
        <button 
          onClick={handleCloseDetails}
          className="flex items-center text-primary mb-4"
        >
          <ArrowLeft className="h-5 w-5 ml-1" />
          العودة إلى المفضلة
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedBookEntry.book_title}</h2>
              <div className="text-gray-600">
                {selectedBookEntry.chapter_title && (
                  <span>{selectedBookEntry.chapter_title} - </span>
                )}
                <span>صفحة {selectedBookEntry.page_number}</span>
              </div>
            </div>
            <FavoriteButton 
              contentId={selectedBookEntry.id}
              contentType="book_entry"
              size="md"
            />
          </div>
          
          <p className="text-lg my-4">{selectedBookEntry.content}</p>
          
          <div className="mt-6 text-gray-500 text-sm">
            تمت الإضافة: {new Date(selectedBookEntry.createdAt || '').toLocaleDateString('ar')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-right">المفضلة</h1>

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : totalFavorites === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-2xl font-medium mb-2">لا توجد عناصر في المفضلة</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            يمكنك إضافة اقتباسات ومقتطفات من الكتب إلى المفضلة لعرضها هنا
          </p>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 mr-2 ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('all')}
            >
              الكل ({totalFavorites})
            </button>
            <button
              className={`flex items-center px-4 py-2 mr-2 ${
                activeTab === 'quotes'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('quotes')}
            >
              <QuoteIcon className="h-4 w-4 ml-1" />
              الاقتباسات ({favorites.quotes.length})
            </button>
            <button
              className={`flex items-center px-4 py-2 ${
                activeTab === 'books'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('books')}
            >
              <BookOpen className="h-4 w-4 ml-1" />
              الكتب ({favorites.bookEntries.length})
            </button>
          </div>

          {/* Content for All tab */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              {[...favorites.quotes.map(q => ({ type: 'quote' as const, item: q })),
                ...favorites.bookEntries.map(b => ({ type: 'book_entry' as const, item: b }))]
                .sort((a, b) => {
                  const dateA = new Date(a.item.createdAt || '');
                  const dateB = new Date(b.item.createdAt || '');
                  return dateB.getTime() - dateA.getTime();
                })
                .map(({ type, item }) => (
                  <FavoriteCard 
                    key={`${type}-${item.id}`} 
                    item={item} 
                    type={type}
                    onSelect={type === 'quote' ? handleSelectQuote : handleSelectBookEntry}
                  />
                ))}
            </div>
          )}

          {/* Content for Quotes tab */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">
              {favorites.quotes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد اقتباسات في المفضلة</p>
              ) : (
                favorites.quotes.map(quote => (
                  <FavoriteCard 
                    key={`quote-${quote.id}`} 
                    item={quote} 
                    type="quote"
                    onSelect={handleSelectQuote}
                  />
                ))
              )}
            </div>
          )}

          {/* Content for Books tab */}
          {activeTab === 'books' && (
            <div className="space-y-6">
              {favorites.bookEntries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد مقتطفات كتب في المفضلة</p>
              ) : (
                favorites.bookEntries.map(bookEntry => (
                  <FavoriteCard 
                    key={`book-${bookEntry.id}`} 
                    item={bookEntry} 
                    type="book_entry"
                    onSelect={handleSelectBookEntry}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

// Composant pour une carte de favori
interface FavoriteCardProps {
  item: Quote | BookEntry;
  type: 'quote' | 'book_entry';
  onSelect: (item: any) => void;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ item, type, onSelect }) => {
  const { refreshFavorites } = useFavoritesContext();
  
  // Déterminer le contenu en fonction du type
  const isQuote = type === 'quote';
  const quote = isQuote ? item as Quote : null;
  const bookEntry = !isQuote ? item as BookEntry : null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center">
            {isQuote ? (
              <QuoteIcon className="h-5 w-5 text-primary ml-2" />
            ) : (
              <BookOpen className="h-5 w-5 text-primary ml-2" />
            )}
            <h3 className="text-lg font-semibold">
              {isQuote ? quote?.category : bookEntry?.book_title}
            </h3>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {isQuote 
              ? quote?.source 
              : bookEntry?.chapter_title && `الفصل: ${bookEntry?.chapter_title}, الصفحة: ${bookEntry?.page_number}`}
          </div>
        </div>
        <FavoriteButton 
          contentId={item.id}
          contentType={type}
          initialIsFavorite={isQuote ? quote?.is_favorite : undefined}
          onToggleComplete={() => refreshFavorites()}
          size="sm"
        />
      </div>
      
      <p className="text-gray-700 my-3 line-clamp-3">
        {isQuote ? quote?.text : bookEntry?.content}
      </p>
      
      {isQuote && quote?.theme && (
        <div className="mt-2 mb-3">
          <span className="inline-block bg-gray-100 px-2 py-1 rounded text-sm">
            {quote.theme}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {new Date(item.createdAt || '').toLocaleDateString('ar')}
        </span>
        <button
          onClick={() => onSelect(item)}
          className="text-sm text-primary hover:underline"
        >
          عرض التفاصيل
        </button>
      </div>
    </div>
  );
};

export default FavoritesPage;
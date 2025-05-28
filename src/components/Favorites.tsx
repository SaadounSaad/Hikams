import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { FavoritesService, FavoritesResult, Quote, BookEntry } from '../services/FavoritesService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Quote as QuoteIcon, Star, StarOff, Trash } from 'lucide-react';

interface FavoritesProps {
  onSelectItem?: (item: Quote | BookEntry, type: 'quote' | 'book-entry') => void;
}

const Favorites: React.FC<FavoritesProps> = ({ onSelectItem }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [favorites, setFavorites] = useState<FavoritesResult>({ quotes: [], bookEntries: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'quotes' | 'books'>('all');

  // Initialiser le service des favoris
  const favoritesService = new FavoritesService(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Charger les favoris
  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await favoritesService.getFavorites(user.id);
      setFavorites(result);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un favori
  const removeFavorite = async (type: 'quote' | 'book-entry', id: string) => {
    if (!user) return;
    
    try {
      await favoritesService.removeFromFavorites(user.id, type, id);
      
      // Mettre à jour l'état local
      if (type === 'quote') {
        setFavorites(prev => ({
          ...prev,
          quotes: prev.quotes.filter(quote => quote.id !== id)
        }));
      } else {
        setFavorites(prev => ({
          ...prev,
          bookEntries: prev.bookEntries.filter(entry => entry.id !== id)
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    }
  };

  // Charger les favoris au chargement du composant
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  // Afficher un message de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Obtenir le nombre total de favoris
  const totalFavorites = favorites.quotes.length + favorites.bookEntries.length;

  return (
    <div className="w-full max-w-4xl mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-right">المفضلة</h2>
      
      {totalFavorites === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">⭐</div>
          <h3 className="text-xl font-medium mb-2">لا توجد عناصر في المفضلة</h3>
          <p className="text-gray-600">أضف بعض الاقتباسات أو مقتطفات الكتب إلى المفضلة لتظهر هنا</p>
        </div>
      ) : (
        <>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                الكل ({totalFavorites})
              </TabsTrigger>
              <TabsTrigger value="quotes">
                <QuoteIcon className="h-4 w-4 mr-2" />
                الاقتباسات ({favorites.quotes.length})
              </TabsTrigger>
              <TabsTrigger value="books">
                <BookOpen className="h-4 w-4 mr-2" />
                الكتب ({favorites.bookEntries.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {/* Afficher les citations et les livres ensemble */}
              {[...favorites.quotes.map(quote => ({ item: quote, type: 'quote' as const })),
                ...favorites.bookEntries.map(entry => ({ item: entry, type: 'book-entry' as const }))]
                .sort((a, b) => {
                  const dateA = new Date(a.item.createdAt || '');
                  const dateB = new Date(b.item.createdAt || '');
                  return dateB.getTime() - dateA.getTime();
                })
                .map(({ item, type }) => (
                  <FavoriteCard 
                    key={`${type}-${item.id}`}
                    item={item}
                    type={type}
                    onRemove={() => removeFavorite(type, item.id)}
                    onSelect={() => onSelectItem?.(item, type)}
                  />
                ))
              }
            </TabsContent>

            <TabsContent value="quotes" className="space-y-4">
              {/* Afficher uniquement les citations */}
              {favorites.quotes.map(quote => (
                <FavoriteCard 
                  key={`quote-${quote.id}`}
                  item={quote}
                  type="quote"
                  onRemove={() => removeFavorite('quote', quote.id)}
                  onSelect={() => onSelectItem?.(quote, 'quote')}
                />
              ))}
            </TabsContent>

            <TabsContent value="books" className="space-y-4">
              {/* Afficher uniquement les livres */}
              {favorites.bookEntries.map(entry => (
                <FavoriteCard 
                  key={`book-${entry.id}`}
                  item={entry}
                  type="book-entry"
                  onRemove={() => removeFavorite('book-entry', entry.id)}
                  onSelect={() => onSelectItem?.(entry, 'book-entry')}
                />
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

// Composant pour une carte de favori
interface FavoriteCardProps {
  item: Quote | BookEntry;
  type: 'quote' | 'book-entry';
  onRemove: () => void;
  onSelect: () => void;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ item, type, onRemove, onSelect }) => {
  // Déterminer le contenu en fonction du type
  const isQuote = type === 'quote';
  const quote = isQuote ? item as Quote : null;
  const bookEntry = !isQuote ? item as BookEntry : null;

  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {isQuote ? (
              <QuoteIcon className="h-5 w-5 text-primary" />
            ) : (
              <BookOpen className="h-5 w-5 text-primary" />
            )}
            <CardTitle className="text-lg">
              {isQuote ? quote?.category : bookEntry?.book_title}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
            <StarOff className="h-5 w-5 text-red-500" />
          </Button>
        </div>
        <CardDescription>
          {isQuote 
            ? quote?.source 
            : bookEntry?.chapter_title && `الفصل: ${bookEntry?.chapter_title}, الصفحة: ${bookEntry?.page_number}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-gray-700">
          {isQuote ? quote?.text : bookEntry?.content}
        </p>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <div className="text-sm text-gray-500">
          {new Date(item.createdAt || '').toLocaleDateString('ar')}
        </div>
        <Button onClick={onSelect} variant="ghost" size="sm">
          عرض التفاصيل
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Favorites;
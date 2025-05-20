// 📚 Page : Mes Favoris (book_favorites)
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import BookEntryCard from './BookEntryCard';

interface BookEntry {
  id: number;
  content: string;
  ordre: number;
  book_title: string;
}

const BookFavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('book_favorites')
        .select('entry_id, book_title')
        .order('createdAt', { ascending: false });

      if (error || !data) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const ids = data.map(fav => fav.entry_id);
      const { data: entries, error: entryError } = await supabase
        .from('book_entries')
        .select('*')
        .in('id', ids);

      if (!entryError && entries) {
        // Tri dans le même ordre que les favoris récupérés
        const sorted = ids.map(id => entries.find(e => e.id === id)).filter(Boolean) as BookEntry[];
        setFavorites(sorted);
      }

      setLoading(false);
    };

    fetchFavorites();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center text-sky-700 font-arabic">📖 مقتطفاتي المفضلة</h1>
      {loading ? (
        <p className="text-center text-gray-500">جاري التحميل...</p>
      ) : favorites.length === 0 ? (
        <p className="text-center text-gray-500">لا يوجد أي مفضلات حاليًا</p>
      ) : (
        <div className="space-y-6">
          {favorites.map(entry => (
            <BookEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookFavoritesPage;

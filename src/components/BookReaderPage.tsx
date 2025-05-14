// ✅ BookReaderPage.tsx avec batching pour dépasser les 1000 résultats
import React, { useEffect, useState } from 'react';
import BookViewer from './BookViewer';
import { supabase } from '../lib/supabase';

interface BookReaderPageProps {
  bookTitle: string; // identifiant ex: Tadabbor2
  onBack: () => void;
}

interface BookEntry {
  id: number;
  content: string;
  ordre: number;
  book_name: string;
}

const BookReaderPage: React.FC<BookReaderPageProps> = ({ bookTitle, onBack }) => {
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookLabel, setBookLabel] = useState<string>('');

  useEffect(() => {
    const fetchEntries = async () => {
      console.log("🔎 Titre envoyé à Supabase :", bookTitle);
      let allEntries: BookEntry[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('book_entries')
          .select('*')
          .eq('book_name', bookTitle)
          .order('ordre', { ascending: true })
          .range(from, from + step - 1);

        if (error) {
          console.error('Erreur de chargement des entrées :', error);
          break;
        }

        if (data && data.length > 0) {
          allEntries = allEntries.concat(data);
          from += step;
          hasMore = data.length === step;
        } else {
          hasMore = false;
        }
      }

      console.log("📦 Total entrées récupérées :", allEntries.length);
      setEntries(allEntries);
      setLoading(false);
    };

    const fetchLabel = async () => {
      const { data, error } = await supabase
        .from('book_titles')
        .select('book_title')
        .eq('book_name', bookTitle)
        .single();

      if (error) {
        console.warn('Titre lisible non trouvé pour :', bookTitle);
        setBookLabel(bookTitle); // fallback
      } else {
        setBookLabel(data?.book_title || bookTitle);
      }
    };

    fetchEntries();
    fetchLabel();
  }, [bookTitle]);

  return (
    <div className="h-full bg-white">
      <header className="py-4 px-6 flex items-center justify-between border-b bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          ←
        </button>
        <h1 className="text-2xl font-bold font-arabic flex-1 text-center" dir="rtl">
          {bookLabel}
        </h1>
        <div className="w-5" />
      </header>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <BookViewer entries={entries} bookTitle={bookTitle} onBack={onBack} />
      )}
    </div>
  );
};

export default BookReaderPage;

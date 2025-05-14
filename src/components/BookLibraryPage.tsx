// src/components/BookLibraryPage.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface BookMetadata {
  book_title: string;
  book_name: string;
  ordre: number;
}

interface BookLibraryPageProps {
  onSelectBook: (bookTitle: string) => void;
}

const BookLibraryPage: React.FC<BookLibraryPageProps> = ({ onSelectBook }) => {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('book_titles') // nom de la table des métadonnées
        .select('book_title, book_name, ordre')
        .order('ordre', { ascending: true });

      if (error) {
        console.error('Erreur Supabase :', error);
        setBooks([]);
      } else {
        setBooks(data || []);
      }

      setLoading(false);
    };

    fetchBooks();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-6 text-sky-700 font-arabic text-center">
        مكتبة الكتب
      </h2>

      {loading ? (
        <div className="text-center text-gray-500 font-arabic">جاري التحميل...</div>
      ) : books.length === 0 ? (
        <div className="text-center text-gray-500 font-arabic">لا توجد كتب متاحة</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {books.map((book, index) => (
            <button
              key={index}
              onClick={() => onSelectBook(book.book_name)} // 🟢 utiliser book_name ici !
              className="w-full bg-white shadow-md rounded-lg p-4 hover:bg-sky-50 transition-colors text-right"
            >
              <span className="font-arabic text-lg">{book.book_title}</span> {/* Affichage humain */}
            </button>

          ))}
        </div>

      )}
    </div>
  );
};

export default BookLibraryPage;

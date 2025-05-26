// MukhtaratPage.tsx - Page avec grille de boutons dynamiques
import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { categoryManager } from '../utils/categories';

interface MukhtaratPageProps {
  onClose: () => void;
  onSelectCategory?: (bookName: string) => void;
}

interface BookTitle {
  id: number;
  book_title: string;
  book_name: string;
  ordre: number | null;
}

const MukhtaratPage: React.FC<MukhtaratPageProps> = ({ onClose, onSelectCategory }) => {
  const [bookTitles, setBookTitles] = useState<BookTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookTitles();
  }, []);

  const loadBookTitles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('book_titles')
        .select('*')
        .order('ordre', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Erreur lors du chargement des titres:', error);
        setError('Impossible de charger les catégories');
        setBookTitles([]);
      } else {
        setBookTitles(data || []);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Une erreur est survenue');
      setBookTitles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (bookName: string) => {
    if (onSelectCategory) {
      onSelectCategory(bookName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header avec bouton X */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold font-arabic">مختارات</h1>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors shadow-sm"
          aria-label="إغلاق الصفحة"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-12 h-12 mx-auto text-sky-600 animate-spin" />
              <p className="mt-4 text-gray-600 font-arabic">جاري التحميل...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 font-arabic">{error}</p>
              <button
                onClick={loadBookTitles}
                className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : bookTitles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-arabic">لا توجد مختارات متاحة حالياً</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookTitles.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleCategoryClick(book.book_name)}
                  className="group relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-sky-400 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold font-arabic text-gray-800 group-hover:text-sky-600 transition-colors" dir="rtl">
                        {book.book_title}
                      </h3>
                    </div>
                    <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-sky-600 transition-colors ml-3" />
                  </div>
                  
                  {/* Indicateur visuel au survol */}
                  <div className="absolute inset-0 rounded-xl bg-sky-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MukhtaratPage;
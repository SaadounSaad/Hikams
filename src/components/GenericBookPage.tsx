// src/components/GenericBookPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface GenericBookPageProps {
  bookTitle: string;
  onBack: () => void;
}

interface BookEntry {
  id: number;
  titre: string;
  contenu: string;
}

const GenericBookPage: React.FC<GenericBookPageProps> = ({ bookTitle, onBack }) => {
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBookEntries = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('books') // nom de la table
        .select('*')
        .eq('titre', bookTitle)
        .order('id', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération du livre:', error);
      } else {
        setBookEntries(data);
      }

      setLoading(false);
    };

    fetchBookEntries();
  }, [bookTitle]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="py-4 px-6 flex items-center justify-between border-b shadow-sm bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold font-arabic text-center flex-1" dir="rtl">
          {bookTitle}
        </h1>
        <div className="w-5" />
      </header>

      <div ref={contentRef} className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-gray-500 font-arabic">جاري التحميل...</div>
        ) : bookEntries.length > 0 ? (
          <div className="space-y-8 max-w-3xl mx-auto font-arabic text-right" dir="rtl">
            {bookEntries.map((entry) => (
              <div key={entry.id} className="whitespace-pre-wrap text-xl leading-relaxed">
                {entry.contenu}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 font-arabic">لا يوجد محتوى لهذا الكتاب</div>
        )}
      </div>
    </div>
  );
};

export default GenericBookPage;

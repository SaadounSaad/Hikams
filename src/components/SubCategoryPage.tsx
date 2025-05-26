// src/pages/SubCategoryPage.tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SubCategoryPage() {
  const { subCategory } = useParams();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote') // table Supabase
        .select('*')
        .eq('category', subCategory);

      if (error) console.error(error);
      else setQuotes(data);

      setLoading(false);
    };

    fetchQuotes();
  }, [subCategory]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-6">مختارات: {subCategory}</h1>
      {loading ? (
        <p>تحميل...</p>
      ) : (
        quotes.map((q, i) => (
          <div key={i} className="mb-4 p-4 border rounded-lg shadow">
            <p className="text-lg">{q.content}</p>
          </div>
        ))
      )}
    </div>
  );
}

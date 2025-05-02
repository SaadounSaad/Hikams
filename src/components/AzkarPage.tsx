import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ajustez le chemin selon votre structure

interface Azkar {
  id: string;
  texte: string;
  periode: 'takbir' | 'tahlil' | 'hamd' | 'tasbih';
  ordre: number;
}

const AzkarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'takbir' | 'tahlil' | 'hamd' | 'tasbih'> ('tasbih');
  const [azkarList, setAzkarList] = useState<Azkar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadAzkar() {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('thikr')
          .select('*')
          .eq('periode', activeTab)
          .order('ordre', { ascending: true });

        if (error) {
          console.error('Erreur Supabase:', error);
          setAzkarList([]);
        } else {
          setAzkarList(data || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setAzkarList([]);
      } finally {
        setLoading(false);
      }
    }

    loadAzkar();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="py-4 px-6 flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold font-arabic " dir="rtl">
          الباقيات الصالحات
        </h1>
      </header>

      {/* Onglets pour basculer entre baqiat */}
      <div className="flex border-b">
        <button
            onClick={() => setActiveTab('takbir')}
            className={`flex-1 py-3 font-arabic text-lg ${
              activeTab === 'takbir'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            تكبير
          </button>
        
        <button
          onClick={() => setActiveTab('tahlil')}
          className={`flex-1 py-3 font-arabic text-lg ${
            activeTab === 'tahlil'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          تهليل
        </button>

        <button
          onClick={() => setActiveTab('hamd')}
          className={`flex-1 py-3 font-arabic text-lg ${
            activeTab === 'hamd'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          الحمد
        </button>
        <button
          onClick={() => setActiveTab('tasbih')}
          className={`flex-1 py-3 font-arabic text-lg ${
            activeTab === 'tasbih'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          تسبيحات
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : azkarList.length > 0 ? (
          <div className="space-y-8">
            {azkarList.map((zikr, index) => (
              <div key={zikr.id} className="border-b pb-6 last:border-0 last:pb-0">
                <div 
                  className="text-xl leading-relaxed whitespace-pre-wrap font-arabic" 
                  dir="rtl"
                >
                  {zikr.texte}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 font-arabic">
            لا توجد أذكار متاحة
          </div>
        )}
      </div>
    </div>
  );
};

export default AzkarPage;
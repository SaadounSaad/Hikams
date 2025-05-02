// GenericContentPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface ContentItem {
  id: string;
  titre: string;
  texte: string;
  categorie: string;
}

// Interface pour les props
interface GenericContentPageProps {
  contentId: string;
  onBack: () => void;
}

// Table des correspondances entre les identifiants de route et les titres d'affichage
const contentTitles: Record<string, string> = {
  'baqiyat': 'الباقيات الصالحات',
  'wird-nawawi': 'ورد الإمام النووي',
  'dua-ibrahim': 'دعاء إبراهيم بن أدهم يوم جمعة',
  'dua-ahmad': 'دعاء أحمد بن حمد سليمان الخليلي',
  'adiya-mukhtara': 'أدعية مختارة',
  'kashf-ahzan': 'كشف الأحزان - فريد الأنصاري',
  'dua-atharat': 'دعاء العشرات',
  'ayat-mafatiha': 'آيات مفاتحة',
  'muntakhab-dua': 'المنتخب من الدعاء صباحا ومساء',
  'azkar-nabi': 'أذكار النبي صلى الله عليه و سلم',
};

// Modifié pour accepter contentId et onBack via les props
const GenericContentPage: React.FC<GenericContentPageProps> = ({ contentId, onBack }) => {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadContent() {
      if (!contentId) return;
     
      setLoading(true);
     
      try {
        const { data, error } = await supabase
          .from('MirajContent')
          .select('*')
          .eq('categorie', contentId)
          .single();

        if (error) {
          console.error('Erreur Supabase:', error);
          setContent(null);
        } else {
          setContent(data);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [contentId]);

  // Obtenir le titre d'affichage à partir de l'identifiant de route
  const displayTitle = contentId ? contentTitles[contentId] || 'محتوى' : 'محتوى';

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="py-4 px-6 flex items-center justify-between border-b">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold font-arabic" dir="rtl">
          {displayTitle}
        </h1>
        <div className="w-5"></div> {/* Spacer pour centrer le titre */}
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : content ? (
          <div className="max-w-3xl mx-auto">
            {content.titre && (
              <h2 className="text-xl font-bold mb-4 font-arabic text-center" dir="rtl">
                {content.titre}
              </h2>
            )}
            <div
              className="text-xl leading-relaxed whitespace-pre-wrap font-arabic"
              dir="rtl"
            >
              {content.texte}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 font-arabic">
            لا يوجد محتوى متاح
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericContentPage;
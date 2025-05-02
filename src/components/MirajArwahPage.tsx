// MirajArwahPage.tsx
import React from 'react';

interface ButtonItem {
  id: string;
  name: string;
}

interface MirajArwahPageProps {
  onSelectSubcategory: (subcategory: string) => void;
}

const MirajArwahPage: React.FC<MirajArwahPageProps> = ({ onSelectSubcategory }) => {
  // Liste des boutons à afficher
  const buttons: ButtonItem[] = [
    { id: 'baqiyat', name: 'الباقيات الصالحات' },
    { id: 'wird', name: 'الورد اليومي' },
    { id: 'wird-nawawi', name: 'ورد الإمام النووي' },
    { id: 'azkar', name: 'أذكار الصباح و المساء' },
    
    { id: 'dua-ibrahim', name: 'دعاء إبراهيم بن أدهم يوم جمعة' },
    { id: 'dua-ahmad', name: 'دعاء أحمد بن حنبل سليمان الخليلي' },
    { id: 'adiya-mukhtara', name: 'أدعية مختارة' },
    { id: 'kashf-ahzan', name: 'كشف الأحزان - فريد الأنصاري' },
    { id: 'dua-atharat', name: 'دعاء العثرات' },
    { id: 'ayat-mafatiha', name: 'آيات مفاتحة' },
    { id: 'muntakhab-dua', name: 'المنتخب من الدعاء صباحا ومساء' },
    { id: 'azkar-nabi', name: 'أذكار النبي صلى الله عليه و سلم' },
  ];

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => onSelectSubcategory(button.id)}
            className="bg-white shadow-md rounded-lg p-4 hover:bg-gray-50 transition-colors text-center"
          >
            <span className="font-arabic text-lg" dir="rtl">{button.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MirajArwahPage;
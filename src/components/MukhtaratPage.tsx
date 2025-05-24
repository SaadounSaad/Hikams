// MukhtaratPage.tsx - Page blanche pour مختارات
import React from 'react';
import { X } from 'lucide-react';

interface MukhtaratPageProps {
  onClose: () => void;
}

const MukhtaratPage: React.FC<MukhtaratPageProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Bouton X en haut à droite */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors shadow-sm"
          aria-label="إغلاق الصفحة"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Contenu de la page (vide pour le moment) */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <h1 className="text-2xl font-arabic mb-2">صفحة مختارات</h1>
          <p className="text-sm">المحتوى قادم قريباً...</p>
        </div>
      </div>
    </div>
  );
};

export default MukhtaratPage;
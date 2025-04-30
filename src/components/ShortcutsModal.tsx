// ShortcutsModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold font-arabic">Raccourcis clavier</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { key: '←', description: 'Citation précédente' },
              { key: '→', description: 'Citation suivante' },
              { key: 'f', description: 'Ajouter/retirer des favoris' },
              { key: 'n', description: 'Nouvelle citation' },
              { key: 's', description: 'Paramètres' },
              { key: '1', description: 'حكمة اليوم' },
              { key: '2', description: 'Collection' },
              { key: '3', description: 'Coups de cœur' },
              { key: 'Échap', description: 'Fermer la fenêtre active' }
            ].map(({ key, description }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-600">{description}</span>
                <kbd className="px-2 py-1 text-sm font-bold font-arabic bg-white rounded-lg shadow-sm border border-gray-200">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
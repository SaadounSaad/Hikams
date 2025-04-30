// SettingsModal.tsx corrigé
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Keyboard, Type, Sun } from 'lucide-react';
import { FileImport } from './FileImport';
import { useQuotes } from '../contexts/QuoteContext';
import { useAppearanceSettings } from '../contexts/AppearanceContext';

interface SettingsModalProps {
  onClose: () => void;
  onNewQuote: () => void;
  onShowShortcuts: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onNewQuote,
  onShowShortcuts
}) => {
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const { deleteAllQuotes, refresh } = useQuotes();
  const { fontSize, setFontSize, isSepiaMode, setIsSepiaMode } = useAppearanceSettings();

  // Pour vérifier que la valeur de fontSize est correcte
  useEffect(() => {
    console.log("Current font size in SettingsModal:", fontSize);
  }, [fontSize]);

  const handleDeleteAll = async () => {
    await deleteAllQuotes();
    setShowDeleteAllConfirmation(false);
  };

  const increaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 10, 150);
      console.log("Increasing font size to:", newSize);
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 10, 70);
      console.log("Decreasing font size to:", newSize);
      return newSize;
    });
  };

  // Force une mise à jour de la taille du texte dans la page
  const forceTextUpdate = () => {
    const currentValue = document.documentElement.style.getPropertyValue('--app-font-size-factor');
    console.log("Current CSS variable value:", currentValue);
    
    // Forcer le rafraîchissement de la variable CSS
    document.documentElement.style.setProperty('--app-font-size-factor', `${fontSize}%`);
    
    // Vérifier que la mise à jour a bien été appliquée
    setTimeout(() => {
      const newValue = document.documentElement.style.getPropertyValue('--app-font-size-factor');
      console.log("Updated CSS variable value:", newValue);
    }, 100);
  };

  // Effet pour s'assurer que la variable CSS est correctement appliquée
  useEffect(() => {
    forceTextUpdate();
  }, [fontSize]);

  return (
    <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Préférences d'affichage */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Préférences d'affichage</h3>
            
            {/* Contrôle de la taille du texte */}
            <div className="bg-gray-50 p-3 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Taille du texte</span>
                </div>
                <span className="text-sm text-gray-500">{fontSize}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 70}
                  className="w-1/2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Réduire
                </button>
                <button 
                  onClick={increaseFontSize}
                  disabled={fontSize >= 150}
                  className="w-1/2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Agrandir
                </button>
              </div>
            </div>
            
            {/* Mode sépia */}
            <div className="bg-gray-50 p-3 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700">Mode sépia</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isSepiaMode}
                    onChange={() => setIsSepiaMode(prev => !prev)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Gestion du recueil</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  onNewQuote();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter une citation / une catégorie
              </button>
              <FileImport onImport={refresh} />
              <button
                onClick={() => setShowDeleteAllConfirmation(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Vider le recueil
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Raccourcis clavier</h3>
            <button
              onClick={onShowShortcuts}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 rounded-xl transition-colors"
            >
              <Keyboard className="w-5 h-5" />
              Voir les raccourcis
            </button>
          </div>
        </div>
        
        {showDeleteAllConfirmation && (
          <div className="mt-6 p-4 bg-red-50 rounded-xl">
            <p className="text-red-700 mb-4">
              Êtes-vous sûr de vouloir supprimer toutes les citations ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllConfirmation(false)}
                className="px-4 py-2 text-sm font-arabic text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 text-sm font-arabic text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Supprimer tout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
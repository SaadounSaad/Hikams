// Sidebar.tsx - Version avec recherche vocale en arabe
import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Heart, SortDesc, Settings, LogOut, Star, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VoiceSearchButton } from './VoiceSearchButton';

interface SidebarProps {
  selectedCategory: string;
  currentCategoryFilter: string;
  onCategoryChange: (category: string) => void;
  onSearch: (searchTerm: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onShowSettings: () => void;
  searchResultsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onCategoryChange,
  isOpen,
  onClose,
  onShowSettings,
  onSearch,
  searchResultsCount
}) => {
  const { logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [voiceSearchActive, setVoiceSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Vérifier si on est dans une catégorie qui supporte la recherche
  const isSearchEnabled: boolean = selectedCategory === 'mukhtarat' || 
    (!!selectedCategory && selectedCategory.includes('mukhtarat'));

  // Recherche en temps réel avec debounce
  useEffect(() => {
    if (!isSearchEnabled) {
      // Réinitialiser la recherche si on n'est pas dans une catégorie supportée
      if (searchTerm) {
        setSearchTerm('');
        onSearch('');
      }
      return;
    }

    setIsSearching(true);
    
    // Utiliser un délai pour éviter trop d'appels pendant la frappe
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
      setIsSearching(false);
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [searchTerm, onSearch, isSearchEnabled]);

  // Effacer la recherche
  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setVoiceSearchActive(false);
    // Focus sur l'input après effacement
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Gérer le changement dans l'input de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!isSearchEnabled && !!value) {
      // Empêcher la saisie si la recherche n'est pas activée
      return;
    }
    
    setSearchTerm(value);
    setVoiceSearchActive(false); // Désactiver l'indicateur vocal si on tape
  };

  // Gérer le résultat de la recherche vocale
  const handleVoiceResult = (transcript: string) => {
    console.log('🎤 Transcription reçue dans Sidebar:', transcript);
    setSearchTerm(transcript);
    setVoiceSearchActive(true);
    
    // Animation feedback
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      // Effet visuel pour montrer que la recherche vocale a fonctionné
      searchInputRef.current.style.borderColor = '#10B981';
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.style.borderColor = '';
        }
      }, 1000);
    }
  };

  // Catégories principales
  const mainCategories = [
    { id: 'daily', name: 'حكمة اليوم', icon: <Calendar className="w-5 h-5" /> },
    { id: 'mukhtarat', name: 'عٌدَّة المريد', icon: <Star className="w-5 h-5" />, searchable: true },
    { id: 'favorites', name: 'المفضلة', icon: <Heart className="w-5 h-5" /> },
    { id: 'separator', type: 'separator' },
    { id: 'miraj-arwah', name: 'معراج الأرواح', icon: <Star className="w-5 h-5" /> }
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 z-30 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          {/* Section de recherche - Affichée uniquement dans عدة المريد */}
          {isSearchEnabled && (
            <div className="mb-6">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="بحث في عدة المريد..."
                  dir="rtl"
                  className={`w-full pl-12 pr-4 py-2 bg-gray-50/80 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm font-arabic transition-all duration-200 ${
                    voiceSearchActive ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  }`}
                />
                
                {/* Icône de recherche ou spinner */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin"></div>
                  ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {/* Bouton de recherche vocale */}
                <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
                  <VoiceSearchButton 
                    onVoiceResult={handleVoiceResult}
                    disabled={!isSearchEnabled}
                    className="scale-90"
                  />
                </div>
                
                {/* Bouton X pour effacer la recherche */}
                {!!searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Indicateur de recherche vocale active */}
                {voiceSearchActive && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <div className="flex items-center gap-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-arabic">صوتي</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Affichage du nombre de résultats */}
              {!!searchTerm && typeof searchResultsCount !== 'undefined' && (
                <div className="mt-2 text-center text-xs font-arabic">
                  {searchResultsCount > 0 ? (
                    <span className={`px-2 py-1 rounded-full ${
                      voiceSearchActive 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-blue-600 bg-blue-50'
                    }`}>
                      {searchResultsCount} نتيجة
                      {voiceSearchActive && ' 🎤'}
                    </span>
                  ) : (
                    <span className="text-red-500 bg-red-50 px-2 py-1 rounded-full">
                      لا توجد نتائج
                    </span>
                  )}
                </div>
              )}

              {/* Conseil pour la recherche vocale */}
              {!searchTerm && (
                <div className="mt-2 text-xs text-gray-500 font-arabic text-center">
                  💡 يمكنك استخدام البحث الصوتي
                </div>
              )}
            </div>
          )}
          
          {/* Séparateur */}
          <div className="my-4 border-t border-gray-300"></div>
          
          {/* Catégories principales */}
          <div className="space-y-3">
            {mainCategories.map((category) => (
              category.type === 'separator' ? (
                <div key={category.id} className="border-t border-gray-300 my-2"></div>
              ) : (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-colors relative ${
                    selectedCategory === category.id
                      ? 'bg-sky-50 text-sky-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 font-arabic">
                    <div className="text-gray-500">{category.icon}</div>
                    <span>{category.name}</span>
                  </div>
                  
                  {/* Indicateur de recherche active */}
                  {category.id === 'mukhtarat' && !!searchTerm && (
                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                      voiceSearchActive ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  )}
                </button>
              )
            ))}
          </div>

          {/* Section de tri */}
          <div className="mt-6">
            <div className="border-t border-gray-300 pt-4">
              <button
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                disabled={!!searchTerm}
                title={!!searchTerm ? "Tri non disponible pendant la recherche" : "Trier par date"}
              >
                <div className="flex items-center gap-3">
                  <SortDesc className={`w-5 h-5 ${!!searchTerm ? 'text-gray-300' : 'text-gray-500'}`} />
                  <span className={`font-arabic ${!!searchTerm ? 'text-gray-400' : ''}`}>
                    Par date
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bas de la sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onShowSettings}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="text-gray-500 w-5 h-5" />
              <span className="font-arabic">Paramètres</span>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-red-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span className="font-arabic">Déconnexion</span>
            </div>
          </button>
        </div>
      </nav>
    </>
  );
};
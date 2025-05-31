// BottomNavigation.tsx - Menu de navigation en bas auto-masqué avec modal de recherche
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Calendar, Heart, Star, Settings, LogOut, X, ChevronUp, HandHelping, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Composant indicateur d'aide
const MenuHintIndicator: React.FC<{
  isMenuVisible: boolean;
  onTrigger: () => void;
}> = ({ isMenuVisible, onTrigger }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenTriggered, setHasBeenTriggered] = useState(false);

  useEffect(() => {
    if (isMenuVisible && !hasBeenTriggered) {
      setHasBeenTriggered(true);
      setTimeout(() => setIsVisible(false), 2000);
    }
  }, [isMenuVisible, hasBeenTriggered]);

  useEffect(() => {
    const hasInteracted = localStorage.getItem('menu-hint-seen');
    if (hasInteracted) {
      setIsVisible(false);
      setHasBeenTriggered(true);
    }
  }, []);

  const handleTrigger = () => {
    localStorage.setItem('menu-hint-seen', 'true');
    setIsVisible(false);
    setHasBeenTriggered(true);
    onTrigger();
  };

  if (!isVisible || isMenuVisible || hasBeenTriggered) {
    return null;
  }

  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div 
        className="flex flex-col items-center pointer-events-auto cursor-pointer"
        onClick={handleTrigger}
      >
        <div className="bg-gray-800/90 text-white text-xs px-3 py-1 rounded-full mb-1 font-arabic animate-pulse">
          اسحب لأعلى للقائمة
        </div>
        <div className="bg-sky-500 text-white p-2 rounded-full shadow-lg animate-bounce">
          <ChevronUp className="w-4 h-4" />
        </div>
        <div className="w-px h-6 bg-gradient-to-t from-sky-500 to-transparent opacity-50"></div>
      </div>
    </div>
  );
};

// Composant Modal de Recherche
const SearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSearch: (searchTerm: string) => void;
  searchResultsCount?: number;
  selectedCategory: string;
}> = ({ isOpen, onClose, onSearch, searchResultsCount, selectedCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastCategory, setLastCategory] = useState(selectedCategory);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Effacer la recherche si changement de catégorie
  useEffect(() => {
    if (selectedCategory !== lastCategory) {
      console.log('🔄 Changement de catégorie - Effacement recherche');
      setSearchTerm('');
      setHasSearched(false);
      onSearch('');
      setLastCategory(selectedCategory);
    }
  }, [selectedCategory, lastCategory, onSearch]);

  // Focus automatique et relance de recherche si terme existant
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        // Relancer automatiquement la recherche si terme existant
        if (searchTerm && !hasSearched) {
          console.log('🔍 Relance automatique de la recherche:', searchTerm);
          setIsSearching(true);
          setTimeout(() => {
            onSearch(searchTerm);
            setHasSearched(true);
            setIsSearching(false);
          }, 300);
        }
      }, 100);
    }
  }, [isOpen, searchTerm, hasSearched, onSearch]);

  // Gérer la fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Gérer la fermeture avec persistance du terme
  const handleClose = () => {
    console.log('🔒 Fermeture modal - Conservation du terme:', searchTerm);
    setHasSearched(false); // Reset pour relance auto à la prochaine ouverture
    onClose();
  };

  // Gérer le changement dans l'input de recherche avec debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHasSearched(false);
    
    // Debounce intégré pour la recherche
    setIsSearching(true);
    setTimeout(() => {
      onSearch(value);
      setHasSearched(true);
      setIsSearching(false);
    }, 300);
  };

  // Effacer complètement et recommencer
  const handleClearAndRestart = () => {
    console.log('🆕 Nouvelle recherche - Effacement complet');
    setSearchTerm('');
    setHasSearched(false);
    onSearch('');
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Effacer seulement le champ (garde l'historique)
  const handleClearField = () => {
    setSearchTerm('');
    setHasSearched(false);
    onSearch('');
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-20 bg-white rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold font-arabic text-gray-800">
            بحث في عدة المريد
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="إغلاق البحث"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Champ de recherche */}
        <div className="p-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="ابحث عن النصوص والأدعية..."
              dir="rtl"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-base font-arabic transition-all"
            />
            
            {/* Icône de recherche ou spinner */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin"></div>
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
            </div>
            
            {/* Bouton X pour effacer le champ */}
            {!!searchTerm && (
              <button
                onClick={handleClearField}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="مسح النص"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions de recherche */}
          {hasSearched && searchTerm && (
            <div className="mt-3 flex gap-2 justify-center">
              <button
                onClick={handleClearAndRestart}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-arabic transition-colors"
              >
                <X className="w-4 h-4" />
                بحث جديد
              </button>
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-sm font-arabic transition-colors"
              >
                إغلاق وحفظ النتائج
              </button>
            </div>
          )}
          
          {/* Affichage du nombre de résultats */}
          {!!searchTerm && typeof searchResultsCount !== 'undefined' && hasSearched && (
            <div className="mt-4 text-center">
              {searchResultsCount > 0 ? (
                <span className="inline-flex items-center gap-2 text-sm font-arabic text-green-700 bg-green-50 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {searchResultsCount} نتيجة بحث
                </span>
              ) : (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-arabic text-red-600 bg-red-50 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    لا توجد نتائج
                  </span>
                  <div className="text-xs text-gray-500 font-arabic">
                    جرب كلمات أخرى أو تحقق من الإملاء
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions d'aide */}
          {!searchTerm && (
            <div className="mt-4 text-center space-y-2">
              <div className="text-sm text-gray-500 font-arabic">
                اكتب كلمة أو عبارة للبحث في المكتبة
              </div>
              <div className="text-xs text-gray-400 font-arabic">
                💡 نصيحة: استخدم كلمات بسيطة للحصول على نتائج أفضل
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

interface BottomNavigationProps {
  selectedCategory: string;
  currentCategoryFilter: string;
  onCategoryChange: (category: string) => void;
  onSearch: (searchTerm: string) => void;
  onShowSettings: () => void;
  searchResultsCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  selectedCategory,
  onCategoryChange,
  onShowSettings,
  onSearch,
  searchResultsCount
}) => {
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Masqué par défaut
  const [userInteracted, setUserInteracted] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Vérifier si on doit afficher le bouton de recherche
  const shouldShowSearchButton = selectedCategory === 'mukhtarat';

  console.log('🔍 DEBUG COMPLET:', {
    selectedCategory,
    shouldShowSearchButton,
    isSearchOpen,
    isExpanded,
    isHidden
  });

  // Fonction centralisée pour gérer l'affichage temporaire du menu
  const showMenuTemporarily = useCallback(() => {
    console.log('🔍 showMenuTemporarily called - isExpanded:', isExpanded);
    
    setIsHidden(false);
    setUserInteracted(true);
    
    // Nettoyer le timer précédent
    if (hideTimeoutRef.current) {
      console.log('⏰ Clearing existing timer');
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Démarrer un nouveau timer seulement si le menu n'est pas étendu
    if (!isExpanded) {
      console.log('⏱️ Starting new hide timer (3s)');
      hideTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Timer expired - hiding menu');
        setIsHidden(true);
        hideTimeoutRef.current = null;
      }, 3000);
    } else {
      console.log('🚫 Menu expanded - no timer started');
    }
  }, [isExpanded]);

  // Fonction pour annuler le timer de masquage
  const cancelHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      console.log('❌ Canceling hide timer');
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Fonction pour démarrer le timer de masquage
  const startHideTimer = useCallback(() => {
    cancelHideTimer();
    if (!isExpanded) {
      console.log('🔄 Starting delayed hide timer (3s)');
      hideTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Delayed timer expired - hiding menu');
        setIsHidden(true);
        hideTimeoutRef.current = null;
      }, 3000);
    }
  }, [isExpanded, cancelHideTimer]);

    // Catégories principales pour navigation rapide
  const quickCategories = [
    { id: 'miraj-arwah', name: 'الورد', icon: <HandHelping className="w-5 h-5" /> },
    { id: 'favorites', name: 'المفضلة', icon: <Heart className="w-5 h-5" /> },
    { id: 'mukhtarat', name: 'المكتبة', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'daily', name: 'اليومية', icon: <Calendar className="w-5 h-5" /> }
];
  // Gestion du menu étendu
  useEffect(() => {
    if (isExpanded) {
      setIsHidden(false);
      cancelHideTimer();
    } else {
      if (userInteracted && !isHidden) {
        startHideTimer();
      }
    }
  }, [isExpanded, userInteracted, isHidden, cancelHideTimer, startHideTimer]);

  // Gestion des touches de navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation directe avec les touches numériques
      if (!isExpanded && !isSearchOpen && e.target === document.body) {
        switch (e.key) {
          case '1':
            console.log('⌨️ Touche 1 - Navigation vers daily');
            onCategoryChange('daily');
            setIsHidden(true);
            cancelHideTimer();
            break;
          case '2':
            console.log('⌨️ Touche 2 - Navigation vers mukhtarat');
            onCategoryChange('mukhtarat');
            setIsHidden(true);
            cancelHideTimer();
            break;
          case '3':
            console.log('⌨️ Touche 3 - Navigation vers favorites');
            onCategoryChange('favorites');
            setIsHidden(true);
            cancelHideTimer();
            break;
          case '4':
            console.log('⌨️ Touche 4 - Navigation vers miraj-arwah');
            onCategoryChange('miraj-arwah');
            setIsHidden(true);
            cancelHideTimer();
            break;
          case ' ':
            e.preventDefault();
            console.log('⌨️ Espace - Toggle menu étendu');
            setIsExpanded(!isExpanded);
            break;
          case 'm':
          case 'M':
            console.log('⌨️ Touche M - Toggle menu étendu');
            setIsExpanded(!isExpanded);
            break;
          case '/':
            e.preventDefault();
            if (shouldShowSearchButton) {
              console.log('⌨️ Touche / - Ouvrir recherche');
              setIsSearchOpen(true);
            }
            break;
        }
      }
      
      // Fermer les menus avec Escape
      if (e.key === 'Escape') {
        if (isExpanded) {
          console.log('⌨️ Escape - Fermeture menu général');
          setIsExpanded(false);
        }
        if (isSearchOpen) {
          console.log('⌨️ Escape - Fermeture recherche');
          setIsSearchOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isSearchOpen, shouldShowSearchButton, onCategoryChange, cancelHideTimer]);

  // Nettoyage des timers au démontage
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Bouton transparent discret en bas à gauche pour révéler le menu */}
      {isHidden && (
        <div className="fixed bottom-4 left-4 z-40">
          <button
            onClick={() => {
              console.log('🔘 Bouton + cliqué - Révélation du menu');
              showMenuTemporarily();
            }}
            onTouchEnd={() => {
              console.log('🔘 Bouton + touché - Révélation du menu');
              showMenuTemporarily();
            }}
            className="w-6 h-6 bg-white/10 backdrop-blur-sm rounded-full
                       hover:bg-white/20 active:bg-white/30 active:scale-95 
                       transition-all duration-200 shadow-lg border border-white/20
                       flex items-center justify-center"
            aria-label="إظهار القائمة"
            style={{
              // Zone de sécurité pour iPhone
              marginBottom: 'max(8px, env(safe-area-inset-bottom))',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              // Zone de touch élargie pour petite taille
              minHeight: '33px',
              minWidth: '33px',
              padding: '9px' // Centre le petit bouton dans la zone de touch
            }}
          >
            {/* Icône + */}
            <div className="text-black/60 text-xm font-bold leading-none">+</div>
          </button>
        </div>
      )}

      {/* BOUTON DE RECHERCHE - Ouvre DIRECTEMENT la modal */}
      {shouldShowSearchButton && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔍 BOUTON RECHERCHE CLIQUÉ - OUVERTURE MODAL');
              setIsSearchOpen(true);
            }}
            className="w-6 h-6 bg-sky-200 rounded-full
                       hover:bg-gray-2600 active:bg-gray-700 active:scale-95 
                       transition-all duration-200 shadow-xl border-2 border-white
                       flex items-center justify-center"
            aria-label="بحث مباشر في المكتبة"
            style={{
              marginBottom: 'max(2px, env(safe-area-inset-bottom))',
              touchAction: 'manipulation',
              minHeight: '33px',
              minWidth: '33px',
              zIndex: 9999
            }}
          >
            <Search className="w-7 h-7 text-white" />
          </button>
        </div>
      )}

      {/* Modal de Recherche */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={onSearch}
        searchResultsCount={searchResultsCount}
        selectedCategory={selectedCategory}
      />

      {/* Overlay pour le menu étendu */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Menu principal en bas */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Navigation rapide */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Bouton المزيد à gauche */}
          <button
            onClick={() => {
              console.log('📋 Bouton المزيد cliqué - Ouverture menu étendu');
              setIsExpanded(!isExpanded);
            }}
            className="nav-button flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-95"
            aria-label={isExpanded ? 'إخفاء القائمة' : 'إظهار المزيد'}
            aria-expanded={isExpanded}
          >
            <ChevronUp 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            />
            <span className="text-[9px] font-arabic leading-tight">المزيد</span>
          </button>

          {/* Catégories principales à droite */}
          <div className="flex items-center gap-1">
            {quickCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  console.log(`🎯 Catégorie sélectionnée: ${category.id}`);
                  onCategoryChange(category.id);
                  setIsHidden(true);
                  cancelHideTimer();
                }}
                className={`nav-button flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                }`}
                aria-label={`التنقل إلى ${category.name}`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {React.cloneElement(category.icon, { className: 'w-4 h-4' })}
                </div>
                <span className="text-[9px] font-arabic leading-tight">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu étendu - UNIQUEMENT paramètres et déconnexion */}
      {isExpanded && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50">
          <div className="p-4">
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  console.log('⚙️ Paramètres sélectionnés - Fermeture du menu');
                  onShowSettings();
                  setIsExpanded(false);
                  setIsHidden(true);
                  cancelHideTimer();
                }}
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="font-arabic">الإعدادات</span>
              </button>
              
              <button
                onClick={() => {
                  console.log('🚪 Déconnexion sélectionnée - Fermeture du menu');
                  logout();
                  setIsExpanded(false);
                  setIsHidden(true);
                  cancelHideTimer();
                }}
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-arabic">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
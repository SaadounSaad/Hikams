// BottomNavigation.tsx - Menu de navigation en bas auto-masqué avec indicateur
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Calendar, Heart, Star, Settings, LogOut, X, ChevronUp } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(true); // Masqué par défaut
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Vérifier si on est dans une catégorie qui supporte la recherche
  const isSearchEnabled: boolean = selectedCategory === 'mukhtarat' || 
    (!!selectedCategory && selectedCategory.includes('mukhtarat'));

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

  // Recherche en temps réel avec debounce
  useEffect(() => {
    if (!isSearchEnabled) {
      if (searchTerm) {
        setSearchTerm('');
        onSearch('');
      }
      return;
    }

    setIsSearching(true);
    
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
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Gérer le changement dans l'input de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isSearchEnabled && !!value) {
      return;
    }
    setSearchTerm(value);
  };

  // Catégories principales pour navigation rapide
  const quickCategories = [
    { id: 'daily', name: 'اليوم', icon: <Calendar className="w-5 h-5" /> },
    { id: 'mukhtarat', name: 'المريد', icon: <Star className="w-5 h-5" /> },
    { id: 'favorites', name: 'المفضلة', icon: <Heart className="w-5 h-5" /> },
    { id: 'miraj-arwah', name: 'الأرواح', icon: <Star className="w-5 h-5" /> }
  ];

  // Auto-masquage lors du scroll
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Afficher le menu si on scroll vers le haut ou si on est en haut de page
          if (currentScrollY < lastScrollY || currentScrollY < 10) {
            showMenuTemporarily();
          } 
          // Masquer le menu si on scroll vers le bas (sauf si menu étendu ouvert)
          else if (currentScrollY > lastScrollY && currentScrollY > 50 && !isExpanded) {
            setIsHidden(true);
            cancelHideTimer();
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isExpanded, showMenuTemporarily, cancelHideTimer]);

  // Détection des interactions tactiles/souris
  useEffect(() => {
    if (userInteracted) return;
    
    const handleInteraction = () => {
      showMenuTemporarily();
    };

    const events = ['touchstart', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [userInteracted, showMenuTemporarily]);

  // Afficher le menu quand on survole la zone en bas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      
      if (mouseY > windowHeight - 80) {
        showMenuTemporarily();
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showMenuTemporarily]);

  // Afficher le menu lors du toucher en bas d'écran
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const windowHeight = window.innerHeight;
      const touchY = e.touches[0].clientY;
      
      if (touchY > windowHeight - 100) {
        showMenuTemporarily();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [showMenuTemporarily]);

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
      if (['1', '2', '3', '4', ' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        showMenuTemporarily();
      }
      
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
      
      if (!isExpanded && e.target === document.body) {
        switch (e.key) {
          case '1':
            onCategoryChange('daily');
            break;
          case '2':
            onCategoryChange('mukhtarat');
            break;
          case '3':
            onCategoryChange('favorites');
            break;
          case '4':
            onCategoryChange('miraj-arwah');
            break;
          case ' ':
            e.preventDefault();
            setIsExpanded(!isExpanded);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onCategoryChange, showMenuTemporarily]);

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
      {/* Bouton transparent permanent pour révéler le menu */}
      {isHidden && (
        <div className="fixed bottom-1 left-0 right-0 z-40 flex justify-center">
          <button
            onClick={() => showMenuTemporarily()}
            className="w-32 h-1 bg-gray-900/30 rounded-full
                       hover:bg-gray-900/40 hover:h-1.5 hover:w-36
                       active:scale-95 transition-all duration-200"
            aria-label="إظهار القائمة"
            style={{
              // Zone de sécurité pour iPhone
              marginBottom: 'max(4px, env(safe-area-inset-bottom))'
            }}
          />
        </div>
      )}

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
        onMouseEnter={() => showMenuTemporarily()}
      >
        {/* Navigation rapide */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Bouton المزيد à l'extrême gauche */}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              showMenuTemporarily();
            }}
            className="nav-button flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-200 active:scale-95"
            aria-label={isExpanded ? 'إخفاء القائمة' : 'إظهار المزيد'}
            aria-expanded={isExpanded}
          >
            <ChevronUp 
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            />
            <span className="text-[10px] font-arabic leading-tight">المزيد</span>
          </button>

          {/* Catégories principales */}
          <div className="flex items-center gap-2">
            {quickCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onCategoryChange(category.id);
                  showMenuTemporarily();
                }}
                className={`nav-button flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'nav-button active bg-sky-50 text-sky-600'
                    : 'text-gray-600 hover:bg-gray-50 active:scale-95'
                }`}
                aria-label={`التنقل إلى ${category.name}`}
              >
                <div className="relative">
                  {category.icon}
                  {/* Indicateur de recherche active */}
                  {category.id === 'mukhtarat' && !!searchTerm && (
                    <div className="search-indicator"></div>
                  )}
                </div>
                <span className="text-[10px] font-arabic leading-tight">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu étendu */}
      {isExpanded && (
        <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 max-h-80 overflow-y-auto">
          <div className="p-4">
            {/* Section de recherche */}
            {isSearchEnabled && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="بحث في عدة المريد..."
                    dir="rtl"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm font-arabic transition-colors"
                  />
                  
                  {/* Icône de recherche ou spinner */}
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin"></div>
                    ) : (
                      <Search className="w-5 h-5 text-gray-400" />
                    )}
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
                </div>
                
                {/* Affichage du nombre de résultats */}
                {!!searchTerm && typeof searchResultsCount !== 'undefined' && (
                  <div className="mt-2 text-center text-xs font-arabic">
                    {searchResultsCount > 0 ? (
                      <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        {searchResultsCount} نتيجة
                      </span>
                    ) : (
                      <span className="text-red-500 bg-red-50 px-3 py-1 rounded-full">
                        لا توجد نتائج
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions principales */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  onShowSettings();
                  setIsExpanded(false);
                }}
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="font-arabic">الإعدادات</span>
              </button>
              
              <button
                onClick={() => {
                  logout();
                  setIsExpanded(false);
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
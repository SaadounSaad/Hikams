// App.tsx - Version optimisée avec analytics minimal
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu, X, ChevronDown, Search, Home } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuoteProvider, useQuotes } from './context/QuoteContext';
import { AppearanceProvider, useAppearanceSettings } from './context/AppearanceContext';
import { AnalyticsProvider, useAnalytics } from './context/AnalyticsContext';
import { BottomNavigation } from './components/BottomNavigation';
import { QuoteViewer } from './components/QuoteViewer';
import { QuoteForm } from './components/QuoteForm';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { AuthForm } from './components/AuthForm';
import { Quote } from './types';
import { categoryManager } from './utils/categories';
import WirdPage from './components/WirdPage';
import AlbaqiatPage from './components/AlbaqiatPage';
import GenericThikrPage from './components/GenericThikrPage';
import MirajArwahPage from './components/MirajArwahPage';
import MukhtaratPage from './components/MukhtaratPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { getSavedPageIndex, updateBookmark } from './utils/bookmarkService';
import { arabicTextContains } from './utils/arabic-search-utils';
import ErrorBoundary from './components/ErrorBoundary';
import { Bookmark } from 'lucide-react';
// Composant Menu Déroulant Mukhtarat (inchangé)
const MukhtaratDropdownMenu = ({ 
  onShowAll, 
  onShowMukhtaratPage,
  onGoToLastPage
}: {
  onShowAll: () => void;
  onShowMukhtaratPage: () => void;
  onGoToLastPage: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown-menu]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOptionClick = useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  return (
    <div className="relative" data-dropdown-menu>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors shadow-sm"
        title="خيارات المختارات"
      >
        <Menu className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => handleOptionClick(onShowMukhtaratPage)}
            className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Search className="w-4 h-4 text-sky-600" />
            <span className="font-arabic text-gray-700">اختر كتابا</span>
          </button>

          <button
            onClick={() => handleOptionClick(onShowAll)}
            className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4 text-blue-600" />
            <span className="font-arabic text-gray-700">الكل</span>
          </button>
        </div>
      )}
    </div>
  );
};

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { quotes, dailyQuotes, toggleFavorite, deleteQuote, deleteAllQuotes } = useQuotes();
  const { isSepiaMode } = useAppearanceSettings();
  // ✅ Analytics optimisé - juste trackEvent et trackFavorite
  const { trackEvent, trackFavorite } = useAnalytics();

  // États (inchangés)
  const [selectedCategory, setSelectedCategory] = useState<string>('daily');
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [mirajSubcategory, setMirajSubcategory] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [showMukhtaratPage, setShowMukhtaratPage] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [selectedBookTitle, setSelectedBookTitle] = useState<string>('');
  const [mukhtaratBookNames, setMukhtaratBookNames] = useState<string[]>([]);
  const [mukhtaratViewMode, setMukhtaratViewMode] = useState<'all' | 'subcategory'>('all');
  const [bookNamesLoaded, setBookNamesLoaded] = useState(false);
  const [bookmarkCache, setBookmarkCache] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
const goToBookmark = useCallback(async () => {
  try {
    const savedIndex = await getSavedPageIndex(selectedCategory);
    if (savedIndex !== null && savedIndex < filteredQuotes.length) {
      setCurrentQuoteIndex(savedIndex);
      console.log(`🔖 Aller au signet: page ${savedIndex + 1}`);
      
      // Optionnel : Afficher une notification
      // toast.success(`Signet chargé: page ${savedIndex + 1}`);
    } else {
      console.log('❌ Aucun signet trouvé');
      // Optionnel : Afficher un message
      // toast.info('Aucun signet sauvegardé');
    }
  } catch (error) {
    console.error('❌ Erreur chargement signet:', error);
  }
}, [selectedCategory, filteredQuotes.length]);
  const isSearchContext: boolean = selectedCategory === 'mukhtarat' || 
    (!!selectedCategory && mukhtaratBookNames.includes(selectedCategory));

  // Fonctions callback (majoritairement inchangées)
  const isMukhtaratContext = useCallback(() => {
    return selectedCategory === 'mukhtarat' || mukhtaratBookNames.includes(selectedCategory);
  }, [selectedCategory, mukhtaratBookNames]);

  const saveMukhtaratState = useCallback(() => {
    if (isMukhtaratContext()) {
      localStorage.setItem('lastMukhtaratCategory', selectedCategory);
      localStorage.setItem('lastMukhtaratViewMode', mukhtaratViewMode);
      localStorage.setItem('lastMukhtaratIndex', currentQuoteIndex.toString());
      localStorage.setItem('lastMukhtaratBookTitle', selectedBookTitle);
    }
  }, [selectedCategory, mukhtaratViewMode, currentQuoteIndex, selectedBookTitle, isMukhtaratContext]);

  const restoreMukhtaratState = useCallback(async () => {
    const savedCategory = localStorage.getItem('lastMukhtaratCategory') || 'mukhtarat';
    const savedViewMode = localStorage.getItem('lastMukhtaratViewMode') as 'all' | 'subcategory' || 'all';
    const savedIndex = parseInt(localStorage.getItem('lastMukhtaratIndex') || '0');
    const savedBookTitle = localStorage.getItem('lastMukhtaratBookTitle') || '';
    
    if (mukhtaratBookNames.includes(savedCategory)) {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error } = await supabase
          .from('book_titles')
          .select('book_title')
          .eq('book_name', savedCategory)
          .single();

        if (!error && data) {
          setSelectedBookTitle(data.book_title);
        }
      } catch (error) {
        console.error('Erreur titre:', error);
      }
    } else {
      setSelectedBookTitle(savedBookTitle);
    }
    
    setSelectedCategory(savedCategory);
    setMukhtaratViewMode(savedViewMode);
    setCurrentQuoteIndex(savedIndex);
  }, [mukhtaratBookNames]);

  const handleCategoryChange = useCallback((category: string) => {
    // ✅ Tracking simplifié du changement de catégorie
    trackEvent('category_switched', {
      from: selectedCategory,
      to: category,
      method: 'navigation'
    });
    
    setSearchTerm('');
    setIsSearchActive(false);
    
    if (selectedCategory === 'all') {
      setCurrentCategoryFilter(category);
    } else {
      if (category === 'mukhtarat') {
        restoreMukhtaratState();
      } else {
        setSelectedCategory(category);
        setCurrentCategoryFilter('');
        setSelectedBookTitle('');
        setMukhtaratViewMode('all');
      }
    }
    setShowMukhtaratPage(false);
  }, [selectedCategory, restoreMukhtaratState, trackEvent]);

  // ✅ Gestionnaire de recherche optimisé
  const handleSearch = useCallback((term: string) => {
    if (term.trim() !== '') {
      // ✅ Tracking search simplifié
      trackEvent('search_performed', {
        term: term.trim(),
        category: selectedCategory,
        context: isSearchContext ? 'mukhtarat' : 'general'
      });
    }
    
    setSearchTerm(term);
    setIsSearchActive(term.trim() !== '');
    
    if (term.trim() !== '') {
      setCurrentQuoteIndex(0);
    }
  }, [selectedCategory, isSearchContext, trackEvent]);

  // ✅ Toggle favori ULTRA-SIMPLIFIÉ
  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      const quote = filteredQuotes.find(q => q.id === id);
      if (!quote) return;
      
      const newFavoriteStatus = !quote.isFavorite;
      
      // ✅ Faire l'action principale
      await toggleFavorite(id);
      
      // ✅ Tracking favori simplifié
      await trackFavorite(newFavoriteStatus ? 'add' : 'remove', {
        id: quote.id,
        category: quote.category
      });
      
      // ✅ Bookmark automatique (logique préservée)
      if (newFavoriteStatus) {
        const quoteIndex = filteredQuotes.findIndex(q => q.id === id);
        if (quoteIndex !== -1) {
          await updateBookmark(selectedCategory, quoteIndex);
          setCurrentQuoteIndex(quoteIndex);
        }
      }
    } catch (error) {
      console.error('❌ Erreur toggle favori:', error);
    }
  }, [filteredQuotes, selectedCategory, toggleFavorite, trackFavorite, setCurrentQuoteIndex]);

  const handleMukhtaratCategorySelect = useCallback(async (bookName: string) => {
    try {
      const { supabase } = await import('./lib/supabase');
      const { data, error } = await supabase
        .from('book_titles')
        .select('book_title')
        .eq('book_name', bookName)
        .single();

      if (!error && data) {
        setSelectedBookTitle(data.book_title);
      } else {
        setSelectedBookTitle('');
      }

      setSearchTerm('');
      setIsSearchActive(false);

      localStorage.setItem('lastMukhtaratCategory', bookName);
      localStorage.setItem('lastMukhtaratViewMode', 'subcategory');

      setSelectedCategory(bookName);
      setMukhtaratViewMode('subcategory');
      setCurrentCategoryFilter('');
      setShowMukhtaratPage(false);
    } catch (error) {
      console.error('Erreur récupération titre:', error);
      setSelectedBookTitle('');
    }
  }, []);

  const showAllMukhtarat = useCallback(() => {
    setSelectedCategory('mukhtarat');
    setMukhtaratViewMode('all');
    setSelectedBookTitle('');
    setCurrentQuoteIndex(0);
    setSearchTerm('');
    setIsSearchActive(false);
    
    localStorage.setItem('lastMukhtaratCategory', 'mukhtarat');
    localStorage.setItem('lastMukhtaratViewMode', 'all');
    localStorage.setItem('lastMukhtaratIndex', '0');
    localStorage.setItem('lastMukhtaratBookTitle', '');
  }, []);

  const goToLastVisitedPage = useCallback(() => {
    const lastPage = localStorage.getItem('lastMukhtaratIndex');
    if (lastPage) {
      const pageNumber = parseInt(lastPage);
      setCurrentQuoteIndex(pageNumber);
    }
  }, []);

  const openMukhtaratPage = useCallback(() => {
    setShowMukhtaratPage(true);
  }, []);

  const getCategoryTitle = useCallback((categoryId: string): string => {
    switch (categoryId) {
      case 'daily':
        return 'حكمة اليوم';
      case 'analytics':
        return 'الإحصائيات';
      case 'all':
        return '';
      case 'favorites':
        return `المفضلة (${quotes.filter(quote => quote.isFavorite).length})`;
      case 'verses':
        return 'آيات مِفتاحية';
      case 'hadiths':
        return 'هَدْي نَبَوي';
      case 'thoughts':
        return 'دُرَرْ';
      case 'miraj-arwah':
        return 'معراج الأرواح';
      case 'mukhtarat':
        const mukhtaratCount = quotes.filter(quote => mukhtaratBookNames.includes(quote.category)).length;
        return `عٌدَّة المريد (${mukhtaratCount})`;
      default:
        if (mukhtaratBookNames.includes(categoryId) && selectedBookTitle) {
          return selectedBookTitle;
        }
        
        const categories = categoryManager.getCategories();
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'حكم الموردين';
    }
  }, [quotes, mukhtaratBookNames, selectedBookTitle]);

  const renderHeader = useCallback(() => (
  <div className={`${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm shadow-sm h-16 z-30`}>
    <div className="h-full flex items-center gap-4 px-4">
      <div className="flex-1 flex items-center gap-4 overflow-hidden">
        <h1 className="text-xl md:text-2xl font-bold font-arabic text-blue-600 whitespace-nowrap">
          {isSearchActive && searchTerm ? `نتيجة البحث: "${searchTerm}"` : getCategoryTitle(selectedCategory)}
        </h1>
        
        {/* Compteur existant */}
        {categoryManager.isMukhtaratSubCategory && categoryManager.isMukhtaratSubCategory(selectedCategory) && (
          <div className="flex items-center">
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-100 text-green-600">
              {filteredQuotes.length}
            </span>
          </div>
        )}
      </div>
      
      {/* 🔖 NOUVEAU : Bouton Aller au Signet */}
      {(selectedCategory === 'daily' || isMukhtaratContext()) && (
        <button
          onClick={goToBookmark}
          className="flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-md transition-colors text-sm"
          title="aller au signet"
        >
          <Bookmark className="w-3 h-3" />
          <span className="font-arabic hidden sm:inline">سِجِل</span>
        </button>
      )}
      
      {/* Menu Mukhtarat existant */}
      {isMukhtaratContext() && (
        <div className="flex items-center gap-2">
          <button
            onClick={openMukhtaratPage}
            className="flex items-center gap-1 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors text-sm"
            title="اختر كتابا"
          >
            <Search className="w-3 h-3" />
            <span className="font-arabic">اختر كتابا</span>
          </button>
          
          <button
            onClick={showAllMukhtarat}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors text-sm"
            title="الكل"
          >
            <Home className="w-3 h-3" />
            <span className="font-arabic">الكل</span>
          </button>
        </div>
      )}
    </div>
  </div>
), [
  isSepiaMode, 
  isSearchActive, 
  searchTerm, 
  getCategoryTitle, 
  selectedCategory, 
  filteredQuotes.length,
  isMukhtaratContext,
  goToBookmark,        // ✅ AJOUT
  openMukhtaratPage,
  showAllMukhtarat
]);


  // ✅ UseEffects SIMPLIFIÉS

  // Raccourcis clavier (inchangé)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        switch (e.key) {
          case 'n':
            if (!showForm) setShowForm(true);
            break;
          case 's':
            if (!showSettings) setShowSettings(true);
            break;
          case 'Escape':
            if (showForm) {
              setShowForm(false);
              setEditingQuote(undefined);
            } else if (showSettings) {
              setShowSettings(false);
            } else if (deleteConfirmation || showDeleteAllConfirmation) {
              setDeleteConfirmation('');
              setShowDeleteAllConfirmation(false);
            }
            break;
          case '1':
            handleCategoryChange('daily');
            break;
          case '2':
            handleCategoryChange('all');
            break;
          case '3':
            handleCategoryChange('favorites');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showForm, showSettings, deleteConfirmation, showDeleteAllConfirmation, handleCategoryChange]);

  // Filtrage des citations (logique préservée)
  const filteredQuotesMemo = useMemo(() => {
    let newFilteredQuotes: Quote[] = [];

    if (selectedCategory === 'daily') {
      newFilteredQuotes = [...dailyQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    } 
    else if (selectedCategory === 'all') {
      const baseQuotes = currentCategoryFilter 
        ? quotes.filter(quote => quote.category === currentCategoryFilter)
        : quotes;
      newFilteredQuotes = [...baseQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    } 
    else if (selectedCategory === 'favorites') {
      const favoriteQuotes = quotes.filter(quote => quote.isFavorite);
      newFilteredQuotes = [...favoriteQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }
    else if (selectedCategory === 'mukhtarat') {
      const mukhtaratQuotes = quotes.filter(quote => mukhtaratBookNames.includes(quote.category));
      newFilteredQuotes = [...mukhtaratQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }
    else if (mukhtaratBookNames.includes(selectedCategory)) {
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }
    else {
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }

    // Filtrage par recherche
    if (isSearchActive && searchTerm.trim() !== '') {
      if (isSearchContext) {
        newFilteredQuotes = newFilteredQuotes.filter(quote => 
          arabicTextContains(quote.text || '', searchTerm)
        );
      }
    }

    return newFilteredQuotes;
  }, [
    selectedCategory, 
    currentCategoryFilter, 
    quotes, 
    dailyQuotes, 
    mukhtaratBookNames, 
    searchTerm,
    isSearchActive,
    isSearchContext
  ]);

  useEffect(() => {
    setFilteredQuotes(filteredQuotesMemo);
  }, [filteredQuotesMemo]);

  useEffect(() => {
    if (filteredQuotes.length > 0 && currentQuoteIndex >= filteredQuotes.length) {
      setCurrentQuoteIndex(0);
    }
  }, [filteredQuotes, currentQuoteIndex]);

  // Charger book names (inchangé)
  useEffect(() => {
    if (bookNamesLoaded) return;
    
    async function loadMukhtaratBookNames() {
      try {
        const { supabase } = await import('./lib/supabase');
        const { data, error } = await supabase
          .from('book_titles')
          .select('book_name')
          .order('ordre', { ascending: true });

        if (!error && data) {
          const bookNames = data.map(item => item.book_name);
          setMukhtaratBookNames(bookNames);
          setBookNamesLoaded(true);
        }
      } catch (error) {
        console.error('Erreur chargement book_names:', error);
      }
    }

    loadMukhtaratBookNames();
  }, [bookNamesLoaded]);

  // Sauvegarder état mukhtarat (inchangé)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveMukhtaratState();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [saveMukhtaratState]);

  // ✅ Version simplifiée
useEffect(() => {
  async function loadBookmarkIndex() {
    if (selectedCategory && selectedCategory !== 'analytics') {  // ✅ Supprimé !== 'daily'
      try {
        const index = await getSavedPageIndex(selectedCategory);
        const validIndex = index ?? 0;
        
        console.log(`🔖 Bookmark chargé pour ${selectedCategory}:`, validIndex);
        setCurrentQuoteIndex(validIndex);
      } catch (error) {
        console.error('❌ Erreur chargement bookmark:', error);
        setCurrentQuoteIndex(0);
      }
    }
  }

  if (filteredQuotes.length > 0) {
    loadBookmarkIndex();
  }
}, [selectedCategory, filteredQuotes.length]);

  // ✅ LOADING/AUTH (inchangé)
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isSepiaMode ? 'bg-gradient-to-br from-amber-50/50 to-amber-50' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${isSepiaMode ? 'bg-gradient-to-br from-amber-50/50 to-amber-50' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
        <AuthForm />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isSepiaMode ? 'bg-gradient-to-br from-amber-50/50 to-amber-50' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
      <div className="flex flex-col min-h-screen">
        <header>
          {renderHeader()}
        </header>

        <main className="flex-1 p-6 pb-20">
          <div className="max-w-3xl mx-auto relative">
            {/* Messages informatifs (inchangés) */}
            {selectedCategory === 'favorites' && filteredQuotes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-arabic">لا توجد مفضلة بعد</h3>
                <p className="text-gray-500 mb-4 font-arabic">ابدأ بإضافة بعض الحكم المفضلة</p>
              </div>
            )}

            {isSearchActive && filteredQuotes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-arabic">لا توجد نتائج</h3>
                <p className="text-gray-500 mb-4 font-arabic">جرب كلمات أخرى للبحث</p>
              </div>
            )}

            {quotesLoading && (
              <div className="fixed inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-40">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-600"></div>
                <span className="ml-3 text-sky-600 font-medium">Chargement...</span>
              </div>
            )}

            {/* Contenu selon catégorie (inchangé) */}
            {showMukhtaratPage ? (
              <MukhtaratPage 
                onClose={() => setShowMukhtaratPage(false)}
                onSelectCategory={handleMukhtaratCategorySelect}
              />
            ) : selectedCategory === 'analytics' ? (
              <AnalyticsPage />
            ) : selectedCategory === 'miraj-arwah' ? (
              mirajSubcategory ? (
                mirajSubcategory === 'wird' ? (
                  <WirdPage onBack={() => setMirajSubcategory(null)} />
                ) : mirajSubcategory === 'baqiyat' ? (
                  <AlbaqiatPage onBack={() => setMirajSubcategory(null)} />
                ) : (
                  <GenericThikrPage
                    contentId={mirajSubcategory}
                    onBack={() => setMirajSubcategory(null)}
                  />
                )
              ) : (
                <MirajArwahPage onSelectSubcategory={setMirajSubcategory} />
              )
            ) : (
              <QuoteViewer
                quotes={filteredQuotes}
                currentIndex={currentQuoteIndex}
                onIndexChange={setCurrentQuoteIndex}
                selectedCategory={selectedCategory}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(quote) => {
                  setEditingQuote(quote);
                  setShowForm(true);
                }}
                onDelete={(id) => {
                  setDeleteConfirmation(id);
                }}
                searchTerm={isSearchActive ? searchTerm : undefined}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNavigation 
        selectedCategory={selectedCategory}
        currentCategoryFilter={currentCategoryFilter}
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        onShowSettings={() => setShowSettings(true)}
        searchResultsCount={isSearchActive ? filteredQuotes.length : undefined}
      />

      {/* Modals (inchangés) */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <QuoteForm
            editQuote={editingQuote}
            onSubmit={() => {
              setShowForm(false);
              setEditingQuote(undefined);
            }}
            onClose={() => {
              setShowForm(false);
              setEditingQuote(undefined);
            }}
          />
        </div>
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onNewQuote={() => setShowForm(true)}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {(deleteConfirmation || showDeleteAllConfirmation) && (
        <DeleteConfirmationModal
          quoteId={deleteConfirmation}
          isDeleteAll={showDeleteAllConfirmation}
          onDelete={deleteQuote}
          onDeleteAll={deleteAllQuotes}
          onCancel={() => {
            setDeleteConfirmation('');
            setShowDeleteAllConfirmation(false);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppearanceProvider>
        <AuthProvider>
          <AnalyticsProvider>
            <QuoteProvider>
              <AppContent />
            </QuoteProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </AppearanceProvider>
    </ErrorBoundary>
  );
}

export default App;
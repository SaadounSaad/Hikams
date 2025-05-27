// App.tsx - Version optimisée avec corrections de performance
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu, X, ChevronDown, Search, Home } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuoteProvider, useQuotes } from './context/QuoteContext';
import { AppearanceProvider, useAppearanceSettings } from './context/AppearanceContext';
import { Sidebar } from './components/Sidebar';
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
import { getSavedPageIndex, updateBookmark } from './utils/bookmarkService';

// Composant Menu Déroulant Mukhtarat
const MukhtaratDropdownMenu = ({ 
  onShowAll, 
  onShowMukhtaratPage
}: {
  onShowAll: () => void;
  onShowMukhtaratPage: () => void;
  onGoToLastPage: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fermer le menu quand on clique à l'extérieur
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
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors shadow-sm"
        title="خيارات المختارات"
      >
        <Menu className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Option 1: آخر تصفح */}


          {/* Option 2: اختر كتابا */}
          <button
            onClick={() => handleOptionClick(onShowMukhtaratPage)}
            className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Search className="w-4 h-4 text-sky-600" />
            <span className="font-arabic text-gray-700">اختر كتابا</span>
          </button>

          {/* Option 3: الكل */}
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
  console.time('App Component Render');
  
  const { isAuthenticated, isLoading } = useAuth();
  const { quotes, dailyQuotes, toggleFavorite, deleteQuote, deleteAllQuotes } = useQuotes();
  const { isSepiaMode } = useAppearanceSettings();
  
  // États de base
  const [selectedCategory, setSelectedCategory] = useState<string>('daily');
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchResults, setSearchResults] = useState<Quote[]>([]);
  const [mirajSubcategory, setMirajSubcategory] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [showMukhtaratPage, setShowMukhtaratPage] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  
  // États spécifiques pour mukhtarat avec optimisations
  const [selectedBookTitle, setSelectedBookTitle] = useState<string>('');
  const [mukhtaratBookNames, setMukhtaratBookNames] = useState<string[]>([]);
  const [mukhtaratViewMode, setMukhtaratViewMode] = useState<'all' | 'subcategory'>('all');
  const [bookNamesLoaded, setBookNamesLoaded] = useState(false);
  const [bookmarkCache, setBookmarkCache] = useState<Map<string, number>>(new Map());

  // Fonction améliorée pour basculer les favoris avec bookmark automatique
  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      console.log('🔄 Toggle favori pour:', id);
      
      await toggleFavorite(id);
      
      const quote = filteredQuotes.find(q => q.id === id);
      if (quote) {
        const quoteIndex = filteredQuotes.findIndex(q => q.id === id);
        const newFavoriteStatus = !quote.isFavorite;
        
        if (newFavoriteStatus && quoteIndex !== -1) {
          console.log('📖 Mise à jour du bookmark pour quote likée:', {
            category: selectedCategory,
            index: quoteIndex,
            quoteId: id
          });
          
          await updateBookmark(selectedCategory, quoteIndex);
          setCurrentQuoteIndex(quoteIndex);
          console.log('✅ Quote marquée comme bookmark automatiquement');
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du toggle favori:', error);
    }
  }, [filteredQuotes, selectedCategory, toggleFavorite]);

  // Fonction pour gérer la sélection depuis MukhtaratPage
  const handleMukhtaratCategorySelect = useCallback(async (bookName: string) => {
    try {
      console.time('Mukhtarat Category Selection');
      
      // Récupérer le titre du livre
      const { supabase } = await import('./lib/supabase');
      const { data, error } = await supabase
        .from('book_titles')
        .select('book_title')
        .eq('book_name', bookName)
        .single();

      if (!error && data) {
        setSelectedBookTitle(data.book_title);
        console.log(`📚 Titre récupéré pour ${bookName}: ${data.book_title}`);
      } else {
        setSelectedBookTitle('');
      }

      // Sauvegarder le dernier état mukhtarat
      localStorage.setItem('lastMukhtaratCategory', bookName);
      localStorage.setItem('lastMukhtaratViewMode', 'subcategory');

      // Changer vers la sous-catégorie
      setSelectedCategory(bookName);
      setMukhtaratViewMode('subcategory');
      setCurrentCategoryFilter('');
      setShowMukhtaratPage(false);
      
      console.timeEnd('Mukhtarat Category Selection');
      console.log(`🎯 Mukhtarat: Sélection de ${bookName} en mode sous-catégorie`);
    } catch (error) {
      console.error('Erreur lors de la récupération du titre:', error);
      setSelectedBookTitle('');
    }
  }, []);

  // Fonction pour vérifier si on est dans mukhtarat
  const isMukhtaratContext = useCallback(() => {
    return selectedCategory === 'mukhtarat' || mukhtaratBookNames.includes(selectedCategory);
  }, [selectedCategory, mukhtaratBookNames]);

  // Fonction optimisée pour sauvegarder l'état mukhtarat
  const saveMukhtaratState = useCallback(() => {
    if (isMukhtaratContext()) {
      const currentState = {
        category: selectedCategory,
        viewMode: mukhtaratViewMode,
        index: currentQuoteIndex,
        bookTitle: selectedBookTitle
      };
      
      localStorage.setItem('lastMukhtaratCategory', selectedCategory);
      localStorage.setItem('lastMukhtaratViewMode', mukhtaratViewMode);
      localStorage.setItem('lastMukhtaratIndex', currentQuoteIndex.toString());
      localStorage.setItem('lastMukhtaratBookTitle', selectedBookTitle);
      
      console.log('💾 État mukhtarat sauvé:', currentState);
    }
  }, [selectedCategory, mukhtaratViewMode, currentQuoteIndex, selectedBookTitle, isMukhtaratContext]);

  // Fonction pour restaurer l'état mukhtarat
  const restoreMukhtaratState = useCallback(async () => {
    console.time('Mukhtarat State Restoration');
    
    const savedCategory = localStorage.getItem('lastMukhtaratCategory') || 'mukhtarat';
    const savedViewMode = localStorage.getItem('lastMukhtaratViewMode') as 'all' | 'subcategory' || 'all';
    const savedIndex = parseInt(localStorage.getItem('lastMukhtaratIndex') || '0');
    const savedBookTitle = localStorage.getItem('lastMukhtaratBookTitle') || '';
    
    console.log(`🔄 Restauration mukhtarat: ${savedCategory}, mode: ${savedViewMode}, index: ${savedIndex}`);
    
    // Si c'est une sous-catégorie, récupérer son titre
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
    
    console.timeEnd('Mukhtarat State Restoration');
  }, [mukhtaratBookNames]);

  // Fonction pour afficher toutes les mukhtarat (menu option "الكل")
  const showAllMukhtarat = useCallback(() => {
    console.log('🏠 Retour à toutes les mukhtarat');
    setSelectedCategory('mukhtarat');
    setMukhtaratViewMode('all');
    setSelectedBookTitle('');
    setCurrentQuoteIndex(0);
    
    // Sauvegarder le nouvel état
    localStorage.setItem('lastMukhtaratCategory', 'mukhtarat');
    localStorage.setItem('lastMukhtaratViewMode', 'all');
    localStorage.setItem('lastMukhtaratIndex', '0');
    localStorage.setItem('lastMukhtaratBookTitle', '');
  }, []);

  // Fonction pour aller à la dernière page consultée (menu option "آخر تصفح")
  const goToLastVisitedPage = useCallback(() => {
    const lastPage = localStorage.getItem('lastMukhtaratIndex');
    if (lastPage) {
      const pageNumber = parseInt(lastPage);
      setCurrentQuoteIndex(pageNumber);
      console.log(`🔖 Navigation vers la page ${pageNumber}`);
    }
  }, []);

  // Fonction pour ouvrir MukhtaratPage (menu option "اختر كتابا")
  const openMukhtaratPage = useCallback(() => {
    setShowMukhtaratPage(true);
    console.log('🔍 Ouverture de MukhtaratPage');
  }, []);

  // Charger dynamiquement les book_names au démarrage (optimisé)
  useEffect(() => {
    if (bookNamesLoaded) return; // Éviter les rechargements multiples
    
    async function loadMukhtaratBookNames() {
      try {
        console.time('Loading Book Names');
        const { supabase } = await import('./lib/supabase');
        const { data, error } = await supabase
          .from('book_titles')
          .select('book_name')
          .order('ordre', { ascending: true });

        if (!error && data) {
          const bookNames = data.map(item => item.book_name);
          setMukhtaratBookNames(bookNames);
          setBookNamesLoaded(true); // Marquer comme chargé
          console.timeEnd('Loading Book Names');
          console.log('📚 Book names chargés:', bookNames.length, 'items');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des book_names:', error);
      }
    }

    loadMukhtaratBookNames();
  }, [bookNamesLoaded]);

  // Sauvegarder l'état mukhtarat de manière optimisée
  useEffect(() => {
    // Débounce pour éviter les sauvegardes trop fréquentes
    const timeoutId = setTimeout(() => {
      saveMukhtaratState();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [saveMukhtaratState]);

  // Charger l'index de bookmark avec cache optimisé
  useEffect(() => {
    async function loadBookmarkIndex() {
      // Vérifier le cache d'abord
      if (bookmarkCache.has(selectedCategory)) {
        const cachedIndex = bookmarkCache.get(selectedCategory)!;
        setCurrentQuoteIndex(cachedIndex);
        console.log(`📖 Bookmark depuis cache pour ${selectedCategory}: index ${cachedIndex}`);
        return;
      }
      
      console.time(`Bookmark Load ${selectedCategory}`);
      const index = await getSavedPageIndex(selectedCategory);
      const validIndex = index ?? 0;
      
      // Mettre en cache
      setBookmarkCache(prev => new Map(prev.set(selectedCategory, validIndex)));
      setCurrentQuoteIndex(validIndex);
      
      console.timeEnd(`Bookmark Load ${selectedCategory}`);
      console.log(`📖 Bookmark chargé pour ${selectedCategory}: index ${validIndex}`);
    }

    loadBookmarkIndex();
  }, [selectedCategory]);

  // Effet pour les raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

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
          } else if (isMenuOpen) {
            setIsMenuOpen(false);
          }
          break;
        case '1':
          setSelectedCategory('daily');
          setCurrentCategoryFilter('');
          break;
        case '2':
          setSelectedCategory('all');
          setCurrentCategoryFilter('');
          break;
        case '3':
          setSelectedCategory('favorites');
          setCurrentCategoryFilter('');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showForm, showSettings, deleteConfirmation, showDeleteAllConfirmation, isMenuOpen]);

  // Effet optimisé pour filtrer les citations avec memoization
  const filteredQuotesMemo = useMemo(() => {
    console.time('Filter Quotes Calculation');
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
      console.log(`📊 Favoris trouvés: ${newFilteredQuotes.length} (triés par ordre)`);
    }
    else if (selectedCategory === 'mukhtarat') {
      // Afficher TOUTES les mukhtarat mélangées (mode 'all')
      const mukhtaratQuotes = quotes.filter(quote => mukhtaratBookNames.includes(quote.category));
      newFilteredQuotes = [...mukhtaratQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      console.log(`📚 Toutes les mukhtarat: ${newFilteredQuotes.length} quotes`);
    }
    else if (mukhtaratBookNames.includes(selectedCategory)) {
      // Afficher une sous-catégorie spécifique (mode 'subcategory')
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      console.log(`📖 Sous-catégorie ${selectedCategory}: ${newFilteredQuotes.length} quotes`);
    }
    else {
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }

    console.timeEnd('Filter Quotes Calculation');
    console.log(`🔍 Filtrage terminé pour ${selectedCategory}, mode: ${mukhtaratViewMode}, résultat: ${newFilteredQuotes.length} quotes`);
    
    return newFilteredQuotes;
  }, [selectedCategory, mukhtaratViewMode, currentCategoryFilter, quotes, dailyQuotes, mukhtaratBookNames]);

  // Utiliser le résultat mémorisé
  useEffect(() => {
    setFilteredQuotes(filteredQuotesMemo);
  }, [filteredQuotesMemo]);

  // Gestionnaire optimisé pour la recherche
  const handleSearch = useCallback((results: Quote[]) => {
    console.time('Search Results Processing');
    setQuotesLoading(true);
    
    setSearchResults(results);
    if (results.length > 0) {
      const sortedResults = [...results].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      setFilteredQuotes(sortedResults);
    } else {
      // Restaurer les quotes selon le contexte actuel
      setFilteredQuotes(filteredQuotesMemo);
    }
    
    setTimeout(() => {
      setQuotesLoading(false);
      console.timeEnd('Search Results Processing');
    }, 100);
  }, [filteredQuotesMemo]);

  // Gestionnaire optimisé pour le changement de catégorie
  const handleCategoryChange = useCallback((category: string) => {
    console.time('Category Change');
    
    if (selectedCategory === 'all') {
      setCurrentCategoryFilter(category);
    } else {
      // Si on clique sur mukhtarat, restaurer le dernier état
      if (category === 'mukhtarat') {
        restoreMukhtaratState();
      } else {
        setSelectedCategory(category);
        setCurrentCategoryFilter('');
        setSelectedBookTitle('');
        setMukhtaratViewMode('all');
      }
    }
    setSearchResults([]);
    setIsMenuOpen(false);
    setShowMukhtaratPage(false);
    
    console.timeEnd('Category Change');
  }, [selectedCategory, restoreMukhtaratState]);

  // Titre de la catégorie avec gestion dynamique mukhtarat
  const getCategoryTitle = useCallback((categoryId: string): string => {
    switch (categoryId) {
      case 'daily':
        return 'حكمة اليوم';
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
        return ` عٌدَّة المريد (${mukhtaratCount})`;
      default:
        // Afficher le titre du livre sélectionné pour les sous-catégories mukhtarat
        if (mukhtaratBookNames.includes(categoryId) && selectedBookTitle) {
          return selectedBookTitle;
        }
        
        const categories = categoryManager.getCategories();
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'حكم الموردين';
    }
  }, [quotes, mukhtaratBookNames, selectedBookTitle]);

  // Header optimisé pour toutes les catégories
  const renderHeader = useCallback(() => (
    <div className={`${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm shadow-sm h-16 z-30 md:shadow-none`}>
      <div className="h-full flex items-center gap-4 px-4">
        {/* Bouton menu mobile */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        <div className="flex-1 flex items-center gap-4 overflow-hidden">
          <h1 className="text-xl md:text-2xl font-bold font-arabic text-sky-600 whitespace-nowrap">
            {searchResults.length > 0 ? 'نتيجة البحث' : getCategoryTitle(selectedCategory)}
          </h1>
          
          {categoryManager.isMukhtaratSubCategory(selectedCategory) && (
            <div className="flex items-center">
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-sky-100 text-sky-600">
                {filteredQuotes.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  ), [isSepiaMode, isMenuOpen, searchResults.length, getCategoryTitle, selectedCategory, filteredQuotes.length]);

  console.timeEnd('App Component Render');

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
      <div className="flex min-h-screen">
        {/* Sidebar latérale permanente - toujours visible sur desktop */}
        <div className="hidden md:block">
          <Sidebar 
            selectedCategory={selectedCategory}
            currentCategoryFilter={currentCategoryFilter}
            onCategoryChange={handleCategoryChange}
            onSearch={handleSearch}
            isOpen={true}
            onClose={() => {}}
            onShowSettings={() => setShowSettings(true)}
          />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          {/* Header unifié */}
          <header>
            {renderHeader()}
          </header>

          {/* Contenu principal */}
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto relative">
              {/* Message informatif pour la section favoris vide */}
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

              {/* Indicateur de chargement global */}
              {quotesLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-100 border-t-sky-600"></div>
                  <span className="ml-3 text-sky-600 font-medium">Chargement...</span>
                </div>
              )}

              {/* Contenu selon la catégorie sélectionnée */}
              {showMukhtaratPage ? (
                <MukhtaratPage 
                  onClose={() => setShowMukhtaratPage(false)}
                  onSelectCategory={handleMukhtaratCategorySelect}
                />
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
                  // Passer le menu mukhtarat au QuoteViewer pour l'intégrer dans la navigation
                  renderExtraControls={isMukhtaratContext() ? () => (
                    <MukhtaratDropdownMenu
                      onShowAll={showAllMukhtarat}
                      onShowMukhtaratPage={openMukhtaratPage}
                      onGoToLastPage={goToLastVisitedPage}
                    />
                  ) : undefined}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Sidebar mobile (overlay) */}
      <Sidebar 
        selectedCategory={selectedCategory}
        currentCategoryFilter={currentCategoryFilter}
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Modals */}
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

// Composant principal App wrapper
function App() {
  console.time('App Wrapper Load');
  
  useEffect(() => {
    console.timeEnd('App Wrapper Load');
  }, []);

  return (
    <AppearanceProvider>
      <AuthProvider>
        <QuoteProvider>
          <AppContent />
        </QuoteProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}

export default App;
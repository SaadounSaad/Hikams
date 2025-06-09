// App.tsx - Version complète mise à jour avec corrections analytics
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


// Composant Menu Déroulant Mukhtarat
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
  console.time('App Component Render');
  
  const { isAuthenticated, isLoading } = useAuth();
  const { quotes, dailyQuotes, toggleFavorite, deleteQuote, deleteAllQuotes } = useQuotes();
  const { isSepiaMode } = useAppearanceSettings();
  const { trackEvent } = useAnalytics();

  // ✅ 1. TOUS LES ÉTATS EN PREMIER
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
  
  // État pour le debug analytics
  const [showAnalyticsDebug, setShowAnalyticsDebug] = useState(
    process.env.NODE_ENV === 'development'
  );

  // Vérifier si on est dans une catégorie qui supporte la recherche
  const isSearchContext: boolean = selectedCategory === 'mukhtarat' || 
    (!!selectedCategory && mukhtaratBookNames.includes(selectedCategory));

  // ✅ 2. FONCTIONS CALLBACK EN SECOND (avant les useEffect qui les utilisent)

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

  // Gestionnaire optimisé pour le changement de catégorie
  const handleCategoryChange = useCallback((category: string) => {
    console.time('Category Change');
    
    // Réinitialiser la recherche lors du changement de catégorie
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
    
    console.timeEnd('Category Change');
  }, [selectedCategory, restoreMukhtaratState]);

  // Gestionnaire pour la recherche
  const handleSearch = useCallback((term: string) => {
    console.log('🔍 Recherche pour:', term);
    
    // ✅ TRACKING de la recherche
    if (term.trim() !== '') {
      trackEvent('search_performed', {
        search_term: term,
        category: selectedCategory,
        search_context: isSearchContext ? 'mukhtarat' : 'general',
        timestamp: new Date().toISOString()
      });
    } else {
      trackEvent('search_cleared', {
        category: selectedCategory,
        timestamp: new Date().toISOString()
      });
    }
    
    setSearchTerm(term);
    setIsSearchActive(term.trim() !== '');
    
    if (term.trim() !== '') {
      setCurrentQuoteIndex(0);
    }
  }, [selectedCategory, isSearchContext, trackEvent]);

  // Fonction pour basculer les favoris avec bookmark automatique (SANS double tracking)
  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      console.log('🔄 Toggle favori pour:', id);
      
      const quote = filteredQuotes.find(q => q.id === id);
      if (!quote) return;
      
      const newFavoriteStatus = !quote.isFavorite;
      
      // ❌ PAS DE TRACKING ICI - Le QuoteViewer s'en charge déjà
      
      // Faire l'action principale
      await toggleFavorite(id);
      
      // ✅ BOOKMARK AUTOMATIQUE (garde cette logique)
      if (newFavoriteStatus) {
        const quoteIndex = filteredQuotes.findIndex(q => q.id === id);
        if (quoteIndex !== -1) {
          await updateBookmark(selectedCategory, quoteIndex);
          setCurrentQuoteIndex(quoteIndex);
          
          // ✅ TRACKING du bookmark automatique uniquement
          trackEvent('bookmark_created', {
            quote_id: id,
            category: selectedCategory,
            quote_index: quoteIndex,
            bookmark_type: 'auto_favorite',
            trigger: 'favorite_added',
            timestamp: new Date().toISOString()
          });
          
          console.log('✅ Quote marquée comme bookmark automatiquement');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du toggle favori:', error);
      
      // ✅ TRACKING des erreurs de bookmark seulement
      trackEvent('bookmark_error', {
        quote_id: id,
        category: selectedCategory,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        operation: 'auto_bookmark_on_favorite',
        timestamp: new Date().toISOString()
      });
    }
  }, [filteredQuotes, selectedCategory, toggleFavorite, trackEvent, setCurrentQuoteIndex]);

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

      // Réinitialiser la recherche lors du changement de catégorie
      setSearchTerm('');
      setIsSearchActive(false);

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

  // Fonction pour afficher toutes les mukhtarat
  const showAllMukhtarat = useCallback(() => {
    console.log('🏠 Retour à toutes les mukhtarat');
    setSelectedCategory('mukhtarat');
    setMukhtaratViewMode('all');
    setSelectedBookTitle('');
    setCurrentQuoteIndex(0);
    
    // Réinitialiser la recherche
    setSearchTerm('');
    setIsSearchActive(false);
    
    // Sauvegarder le nouvel état
    localStorage.setItem('lastMukhtaratCategory', 'mukhtarat');
    localStorage.setItem('lastMukhtaratViewMode', 'all');
    localStorage.setItem('lastMukhtaratIndex', '0');
    localStorage.setItem('lastMukhtaratBookTitle', '');
  }, []);

  // Fonction pour aller à la dernière page consultée
  const goToLastVisitedPage = useCallback(() => {
    const lastPage = localStorage.getItem('lastMukhtaratIndex');
    if (lastPage) {
      const pageNumber = parseInt(lastPage);
      setCurrentQuoteIndex(pageNumber);
      console.log(`🔖 Navigation vers la page ${pageNumber}`);
    }
  }, []);

  // Fonction pour ouvrir MukhtaratPage
  const openMukhtaratPage = useCallback(() => {
    setShowMukhtaratPage(true);
    console.log('🔍 Ouverture de MukhtaratPage');
  }, []);

  // Titre de la catégorie avec gestion dynamique mukhtarat
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

  // Header simplifié (sans bouton menu mobile)
  const renderHeader = useCallback(() => (
    <div className={`${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm shadow-sm h-16 z-30`}>
      <div className="h-full flex items-center gap-4 px-4">
        <div className="flex-1 flex items-center gap-4 overflow-hidden">
          <h1 className="text-xl md:text-2xl font-bold font-arabic text-sky-600 whitespace-nowrap">
            {isSearchActive && searchTerm ? `نتيجة البحث: "${searchTerm}"` : getCategoryTitle(selectedCategory)}
          </h1>
          
          {categoryManager.isMukhtaratSubCategory && categoryManager.isMukhtaratSubCategory(selectedCategory) && (
            <div className="flex items-center">
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-sky-100 text-sky-600">
                {filteredQuotes.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  ), [isSepiaMode, isSearchActive, searchTerm, getCategoryTitle, selectedCategory, filteredQuotes.length]);

  // ✅ 3. USE EFFECTS EN DERNIER (maintenant que toutes les fonctions sont déclarées)

  // Effet pour les raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si on tape dans un input ou textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Debug toggle avec Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowAnalyticsDebug(prev => !prev);
        console.log('🔧 Analytics debug toggled');
        return;
      }

      // Raccourcis normaux (sans modificateurs)
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
  }, [
    showForm, 
    showSettings, 
    deleteConfirmation, 
    showDeleteAllConfirmation, 
    handleCategoryChange
  ]);

  // Effet pour tracker l'ouverture de l'app
  useEffect(() => {
    trackEvent('app_opened');
  }, [trackEvent]);

  // Effet pour tracker les changements de catégorie
  useEffect(() => {
    trackEvent('category_changed', {
      category: selectedCategory,
      previous_category: localStorage.getItem('lastCategory') || 'unknown',
      category_filter: currentCategoryFilter,
      mukhtarat_view_mode: mukhtaratViewMode,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('lastCategory', selectedCategory);
  }, [selectedCategory, currentCategoryFilter, mukhtaratViewMode, trackEvent]);

  // Effet OPTIMISÉ pour filtrer les citations avec recherche
  const filteredQuotesMemo = useMemo(() => {
    console.time('Filter Quotes Calculation');
    let newFilteredQuotes: Quote[] = [];

    // Étape 1: Filtrage par catégorie (LOGIQUE ORIGINALE PRÉSERVÉE)
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
      // Mode 'all' - toutes les mukhtarat mélangées
      const mukhtaratQuotes = quotes.filter(quote => mukhtaratBookNames.includes(quote.category));
      newFilteredQuotes = [...mukhtaratQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }
    else if (mukhtaratBookNames.includes(selectedCategory)) {
      // Mode 'subcategory' - une sous-catégorie spécifique
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }
    else {
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }

    // Étape 2: Filtrage par recherche UNIQUEMENT si on a un terme de recherche
    if (isSearchActive && searchTerm.trim() !== '') {
      // RESTRICTION: Recherche seulement dans les catégories mukhtarat
      if (isSearchContext) {
        newFilteredQuotes = newFilteredQuotes.filter(quote => 
          arabicTextContains(quote.text || '', searchTerm)
        );
        console.log(`🔍 Recherche "${searchTerm}" dans ${selectedCategory}: ${newFilteredQuotes.length} résultats`);
      } else {
        console.log(`🚫 Recherche limitée aux catégories mukhtarat uniquement`);
      }
    }

    console.timeEnd('Filter Quotes Calculation');
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

  // Mettre à jour les citations filtrées
  useEffect(() => {
    setFilteredQuotes(filteredQuotesMemo);
  }, [filteredQuotesMemo]);

  // Ajuster l'index si nécessaire
  useEffect(() => {
    if (filteredQuotes.length > 0 && currentQuoteIndex >= filteredQuotes.length) {
      setCurrentQuoteIndex(0);
    }
  }, [filteredQuotes, currentQuoteIndex]);

  // Charger dynamiquement les book_names au démarrage
  useEffect(() => {
    if (bookNamesLoaded) return;
    
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
          setBookNamesLoaded(true);
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
    const timeoutId = setTimeout(() => {
      saveMukhtaratState();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [saveMukhtaratState]);

  // Charger l'index de bookmark avec cache optimisé
  useEffect(() => {
    async function loadBookmarkIndex() {
      if (bookmarkCache.has(selectedCategory)) {
        const cachedIndex = bookmarkCache.get(selectedCategory)!;
        setCurrentQuoteIndex(cachedIndex);
        return;
      }
      
      console.time(`Bookmark Load ${selectedCategory}`);
      const index = await getSavedPageIndex(selectedCategory);
      const validIndex = index ?? 0;
      
      setBookmarkCache(prev => new Map(prev.set(selectedCategory, validIndex)));
      setCurrentQuoteIndex(validIndex);
      
      console.timeEnd(`Bookmark Load ${selectedCategory}`);
    }

    loadBookmarkIndex();
  }, [selectedCategory, bookmarkCache]);

  // Tracking des résultats de recherche
  useEffect(() => {
    if (isSearchActive && searchTerm) {
      trackEvent('search_results', {
        search_term: searchTerm,
        category: selectedCategory,
        results_count: filteredQuotes.length,
        has_results: filteredQuotes.length > 0,
        timestamp: new Date().toISOString()
      });
    }
  }, [isSearchActive, searchTerm, selectedCategory, filteredQuotes.length, trackEvent]);

  // Tracking des sessions par catégorie
  useEffect(() => {
    trackEvent('category_session_start', {
      category: selectedCategory,
      quotes_available: filteredQuotes.length,
      user_action: 'category_enter',
      timestamp: new Date().toISOString()
    });
    
    return () => {
      trackEvent('category_session_end', {
        category: selectedCategory,
        session_duration_seconds: Math.round((Date.now() - Date.now()) / 1000),
        quotes_viewed: currentQuoteIndex + 1,
        timestamp: new Date().toISOString()
      });
    };
  }, [selectedCategory, filteredQuotes.length, trackEvent]);

  // Tracking des états d'application
  useEffect(() => {
    trackEvent('app_state_change', {
      quotes_loaded: quotes.length,
      daily_quotes_loaded: dailyQuotes.length,
      current_category: selectedCategory,
      has_search: isSearchActive,
      search_term: searchTerm,
      timestamp: new Date().toISOString()
    });
  }, [quotes.length, dailyQuotes.length, selectedCategory, isSearchActive, searchTerm, trackEvent]);

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
      <div className="flex flex-col min-h-screen">
        {/* Header simplifié */}
        <header>
          {renderHeader()}
        </header>

        {/* Contenu principal avec padding bottom pour le menu */}
        <main className="flex-1 p-6 pb-20">
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

            {/* Message pour recherche sans résultats */}
            {isSearchActive && filteredQuotes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-arabic">لا توجد نتائج</h3>
                <p className="text-gray-500 mb-4 font-arabic">جرب كلمات أخرى للبحث</p>
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
                // Passer le menu mukhtarat au QuoteViewer
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

      {/* Bottom Navigation - Remplace la Sidebar */}
      <BottomNavigation 
        selectedCategory={selectedCategory}
        currentCategoryFilter={currentCategoryFilter}
        onCategoryChange={handleCategoryChange}
        onSearch={handleSearch}
        onShowSettings={() => setShowSettings(true)}
        searchResultsCount={isSearchActive ? filteredQuotes.length : undefined}
      />



      {/* Modals - restent identiques */}
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

// App.tsx - Version finale avec Error Boundary
function App() {
  const [loadTime] = useState(() => Date.now()); // Temps unique pour les timers
  
  useEffect(() => {
    console.timeEnd(`App-${loadTime}`);
  }, [loadTime]);

  useEffect(() => {
    console.time(`App-${loadTime}`);
  }, []);

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
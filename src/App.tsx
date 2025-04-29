import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote } from './types';
import { storage } from './utils/storage';
import { QuoteCard } from './components/QuoteCard';
import { QuoteForm } from './components/QuoteForm';
import { FileImport } from './components/FileImport';
import { SearchBar, SearchBarRef } from './components/SearchBar';
import { Plus, Library, Sun, Menu, X, ChevronLeft, ChevronRight, Heart, Trash2, SortAsc, Settings, LogOut, Keyboard, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { categoryManager } from './utils/categories';

function App() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('daily');
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [dailyQuotes, setDailyQuotes] = useState<Quote[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [, setTotalQuotes] = useState(0);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'scheduled' | 'random'>('scheduled');
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [searchResults, setSearchResults] = useState<Quote[]>([]);
  const searchBarRef = useRef<SearchBarRef>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getCategoryTitle = (categoryId: string): string => {
    switch (categoryId) {
      case 'daily':
        return 'حكمة اليوم';
      case 'all':
        return '';
      case 'favorites':
        return 'المفضلة';
      case 'verses':
        return 'آيات';
      case 'hadiths':
        return 'هدي نبوي';
      case 'thoughts':
        return 'دُرَر';
      default:
        const category = categoryManager.getCategories().find(c => c.id === categoryId);
        return category ? category.name : 'حكم الموردين';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (event instanceof MouseEvent) {
        console.log("🖱 Événement souris détecté");
      } else if (event instanceof TouchEvent) {
        console.log("📱 Événement tactile détecté");
      }
    
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside as EventListener);


    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        handleLogoutCleanup();
      }
      setIsAuthenticated(!!session);
      setIsAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          handleSwipe('right');
          break;
        case 'ArrowRight':
          handleSwipe('left');
          break;
        case 'f':
          if (filteredQuotes[currentQuoteIndex]) {
            handleToggleFavorite(filteredQuotes[currentQuoteIndex].id);
          }
          break;
        case 'n':
          if (!showForm) {
            setShowForm(true);
          }
          break;
        case 's':
          if (!showSettings) {
            setShowSettings(true);
          }
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
  }, [currentQuoteIndex, filteredQuotes, showForm, showSettings, deleteConfirmation, showDeleteAllConfirmation]);

  const handleLogoutCleanup = useCallback(() => {
    setIsAuthenticated(false);
    setQuotes([]);
    setDailyQuotes([]);
    setTotalQuotes(0);
    setCurrentQuoteIndex(0);
    setFilteredQuotes([]);
    setShowForm(false);
    setShowSettings(false);
    setEditingQuote(undefined);
    setDeleteConfirmation('');
    setShowDeleteAllConfirmation(false);
    setIsLoggingOut(false);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);

    try {
      handleLogoutCleanup();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      window.location.href = '/';
    }
  };

  const loadQuotes = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [storedQuotes, count, dailyQuotes] = await Promise.all([
        storage.getQuotes(sortOrder),
        storage.getQuotesCount(),
        storage.getDailyQuotes()
      ]);

      let processedQuotes = storedQuotes;
      if (sortOrder === 'random') {
        processedQuotes = [...storedQuotes].sort(() => Math.random() - 0.5);
      }

      setQuotes(processedQuotes);
      setTotalQuotes(count);
      setDailyQuotes(dailyQuotes);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  }, [sortOrder, isAuthenticated]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    const newFilteredQuotes = selectedCategory === 'daily' 
      ? dailyQuotes 
      : selectedCategory === 'all'
      ? currentCategoryFilter
        ? quotes.filter(quote => quote.category === currentCategoryFilter)
        : quotes
      : selectedCategory === 'favorites'
      ? quotes.filter(quote => quote.isFavorite)
      : quotes.filter(quote => quote.category === selectedCategory);
    
    setFilteredQuotes(newFilteredQuotes);
    setCurrentQuoteIndex(prev => Math.min(prev, Math.max(0, newFilteredQuotes.length - 1)));
  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes]);

  const handleSearch = useCallback((results: Quote[]) => {
    setSearchResults(results);
    if (results.length > 0) {
      setFilteredQuotes(results);
      setCurrentQuoteIndex(0);
    } else {
      const categoryQuotes = selectedCategory === 'daily' 
        ? dailyQuotes 
        : selectedCategory === 'all'
        ? currentCategoryFilter
          ? quotes.filter(quote => quote.category === currentCategoryFilter)
          : quotes
        : selectedCategory === 'favorites'
        ? quotes.filter(quote => quote.isFavorite)
        : quotes.filter(quote => quote.category === selectedCategory);
      setFilteredQuotes(categoryQuotes);
      setCurrentQuoteIndex(prev => Math.min(prev, Math.max(0, categoryQuotes.length - 1)));
    }
  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes]);

  const handleToggleFavorite = async (id: string) => {
    try {
      await storage.toggleFavorite(id);
      const updatedQuotes = quotes.map(quote => 
        quote.id === id ? { ...quote, isFavorite: !quote.isFavorite } : quote
      );
      setQuotes(updatedQuotes);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      await storage.deleteQuote(id);
      await loadQuotes();
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await storage.clearAllQuotes();
      await loadQuotes();
      setShowDeleteAllConfirmation(false);
    } catch (error) {
      console.error('Error clearing all quotes:', error);
    }
  };

  const closeMenu = () => {
    if (window.innerWidth < 768) {
      setIsMenuOpen(false);
    }
  };

  const handleCategoryChange = useCallback((category: string) => {
    if (selectedCategory === 'all') {
      setCurrentCategoryFilter(category);
    } else {
      setSelectedCategory(category);
      setCurrentCategoryFilter('');
    }
    if (searchBarRef.current?.hasSearchTerm()) {
      searchBarRef.current.clear();
    }
    closeMenu();
  }, [selectedCategory]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as typeof sortOrder);
    closeMenu();
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllConfirmation(true);
    closeMenu();
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCurrentQuoteIndex(prev => 
        prev < filteredQuotes.length - 1 ? prev + 1 : 0
      );
    } else {
      setCurrentQuoteIndex(prev => 
        prev > 0 ? prev - 1 : filteredQuotes.length - 1
      );
    }
  };

  const handleNavigateToFirst = () => {
    setCurrentQuoteIndex(0);
  };

  const handleNavigateToLast = () => {
    setCurrentQuoteIndex(filteredQuotes.length - 1);
  };

  const getCategoryCount = (categoryId: string): number => {
    if (categoryId === 'daily') return dailyQuotes.length;
    if (categoryId === 'all') return quotes.length;
    if (categoryId === 'favorites') return quotes.filter(q => q.isFavorite).length;
    return quotes.filter(q => q.category === categoryId).length;
  };

  const shouldShowCounter = (categoryId: string): boolean => {
    return ['daily', 'all', 'favorites'].includes(categoryId);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8">
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 h-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex-1 flex items-center gap-4 overflow-hidden">
            <h1 className="text-14xl font-bold font-arabic text-sky-600 whitespace-nowrap">
              {searchResults.length > 0 ? 'نتيجة البحث' : getCategoryTitle(selectedCategory)}
            </h1>

            {selectedCategory === 'all' && (
              <div className="overflow-x-auto">
                <div className="flex items-center gap-2">
                  {categoryManager.getCategories().map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`px-4 py-2 text-sm font-arabic rounded-xl whitespace-nowrap transition-colors ${
                        category.id === currentCategoryFilter
                          ? 'text-sky-600 font-bold underline underline-offset-4'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <nav 
          ref={menuRef}
          className={`fixed md:static top-16 bottom-0 left-0 w-72 bg-white/80 backdrop-blur-sm shadow-lg transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} z-20 flex flex-col`}
        >
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="mb-2">
              <SearchBar ref={searchBarRef} quotes={quotes} onSearch={handleSearch} />
            </div>

            {[
              { id: 'daily', icon: Sun, label: 'حكمة اليوم' },
              { id: 'all', icon: Library, label: 'مختارات' },
              { id: 'favorites', icon: Heart, label: 'المفضلة' },
              { id: 'favorites', icon: Heart, label: 'الورد اليومي' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedCategory(id);
                  setCurrentCategoryFilter('');
                  closeMenu();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-arabic rounded-xl transition-all duration-200 ${
                  selectedCategory === id 
                    ? 'text-sky-600 bg-sky-50/80 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{label}</span>
                {shouldShowCounter(id) && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                    {getCategoryCount(id)}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200/50 space-y-3 bg-gray-50/50">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/70">
              <SortAsc className="w-5 h-5 text-gray-500" />
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="flex-1 text-sm bg-transparent border-none focus:ring-0"
              >
                <option value="scheduled">Par date</option>
                <option value="newest">Plus récentes</option>
                <option value="oldest">Plus anciennes</option>
                <option value="random">Aléatoire</option>
              </select>
            </div>
            
            <button
              onClick={() => {
                setShowSettings(true);
                closeMenu();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="flex-1">Paramètres</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-5 h-5" />
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </button>
          </div>
        </nav>

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto relative">
            {filteredQuotes.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNavigateToFirst}
                      className="p-3 rounded-full hover:bg-white/50 transition-colors"
                      aria-label="Première citation"
                      title="Première citation"
                    >
                      <ChevronsLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleSwipe('right')}
                      className="p-3 rounded-full hover:bg-white/50 transition-colors"
                      aria-label="Citation précédente"
                      title="Citation précédente"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-gray-500 bg-white/50 px-4 py-2 rounded-full">
                    {currentQuoteIndex + 1} / {filteredQuotes.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSwipe('left')}
                      className="p-3 rounded-full hover:bg-white/50 transition-colors"
                      aria-label="Citation suivante"
                      title="Citation suivante"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNavigateToLast}
                      className="p-3 rounded-full hover:bg-white/50 transition-colors"
                      aria-label="Dernière citation"
                      title="Dernière citation"
                    >
                      <ChevronsRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <QuoteCard
                  quote={filteredQuotes[currentQuoteIndex]}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(quote) => {
                    setEditingQuote(quote);
                    setShowForm(true);
                    closeMenu();
                  }}
                  onDelete={(id) => {
                    setDeleteConfirmation(id);
                    closeMenu();
                  }}
                  onSwipe={handleSwipe}
                />
              </>
            ) : (
              <div className="text-center py-12 px-4 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm">
                <div className="text-gray-500 space-y-2">
                  <Library className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-lg font-medium">Aucune citation trouvée</p>
                  <p className="text-sm">
                    {searchResults.length === 0 
                      ? "Commencez par ajouter une nouvelle citation"
                      : "Aucun résultat ne correspond à votre recherche"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <QuoteForm
            editQuote={editingQuote}
            onSubmit={async () => {
              setShowForm(false);
              setEditingQuote(undefined);
              await loadQuotes();
            }}
            onClose={() => {
              setShowForm(false);
              setEditingQuote(undefined);
            }}
          />
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Configuration</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Gestion du recueil</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setShowSettings(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter une citation / une catégorie
                  </button>
                  <FileImport onImport={loadQuotes} />
                  <button
                    onClick={handleDeleteAllClick}
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
                  onClick={() => setShowShortcuts(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100/50 hover:bg-gray-200/50 rounded-xl transition-colors"
                >
                  <Keyboard className="w-5 h-5" />
                  Voir les raccourcis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold font-arabic">Raccourcis clavier</h2>
              <button
                onClick={() => setShowShortcuts(false)}
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
      )}

      {(deleteConfirmation || showDeleteAllConfirmation) && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-medium mb-4">Confirmer la suppression</h2>
            <p className="text-gray-500 mb-6">
              {showDeleteAllConfirmation 
                ? "Êtes-vous sûr de vouloir supprimer toutes les citations ? Cette action est irréversible."
                : "Êtes-vous sûr de vouloir supprimer cette citation ?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmation('');
                  setShowDeleteAllConfirmation(false);
                }}
                className="px-4 py-2 text-sm font-arabic text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (showDeleteAllConfirmation) {
                    handleDeleteAll();
                  } else {
                    handleDelete(deleteConfirmation);
                  }
                }}
                className="px-4 py-2 text-sm font-arabic text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                {showDeleteAllConfirmation ? 'Supprimer tout' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
<div style={{ backgroundColor: "rgb(88,139,162)", minHeight: "100vh" }}>
  <h1>Bienvenue dans mon app</h1>
</div>

export default App;
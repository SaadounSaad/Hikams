// App.tsx - Version finale propre
import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
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

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
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

  // Fonction améliorée pour basculer les favoris avec bookmark automatique
  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      console.log('🔄 Toggle favori pour:', id);
      
      // 1. Basculer le favori
      await toggleFavorite(id);
      
      // 2. Si la quote devient favorite, la marquer comme bookmark
      const quote = filteredQuotes.find(q => q.id === id);
      if (quote) {
        const quoteIndex = filteredQuotes.findIndex(q => q.id === id);
        
        // Vérifier le nouveau statut (après toggle)
        const newFavoriteStatus = !quote.isFavorite;
        
        if (newFavoriteStatus && quoteIndex !== -1) {
          console.log('📖 Mise à jour du bookmark pour quote likée:', {
            category: selectedCategory,
            index: quoteIndex,
            quoteId: id
          });
          
          // Mettre à jour le bookmark pour cette catégorie
          await updateBookmark(selectedCategory, quoteIndex);
          
          // Mettre aussi à jour l'index courant pour naviguer directement
          setCurrentQuoteIndex(quoteIndex);
          
          console.log('✅ Quote marquée comme bookmark automatiquement');
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du toggle favori:', error);
    }
  }, [filteredQuotes, selectedCategory, toggleFavorite]);

  // Fonction pour gérer la sélection depuis MukhtaratPage
  const handleMukhtaratCategorySelect = useCallback((bookName: string) => {
    setSelectedCategory(bookName);
    setCurrentCategoryFilter('');
    setShowMukhtaratPage(false);
  }, []);

  // Charger l'index de bookmark au changement de catégorie
  useEffect(() => {
    async function loadBookmarkIndex() {
      const index = await getSavedPageIndex(selectedCategory);
      const validIndex = index ?? 0;
      setCurrentQuoteIndex(validIndex);
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
  }, [showForm, showSettings, deleteConfirmation, showDeleteAllConfirmation]);

  // Effet pour filtrer les citations (version simple avec tri par ordre)
  useEffect(() => {
    console.log(`🔍 Filtrage des citations pour ${selectedCategory}`);
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
      // Version simple qui marche avec tri par ordre
      const favoriteQuotes = quotes.filter(quote => quote.isFavorite);
      newFilteredQuotes = [...favoriteQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      console.log(`📊 Favoris trouvés: ${newFilteredQuotes.length} (triés par ordre)`);
    }
    else if (selectedCategory === 'mukhtarat') {
      newFilteredQuotes = [];
    }
    else if (categoryManager.isMukhtaratSubCategory(selectedCategory)) {
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }
    else {
      const categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
      newFilteredQuotes = [...categoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    }

    setFilteredQuotes(newFilteredQuotes);
    
    // Charger l'index seulement si on a des quotes
    if (newFilteredQuotes.length > 0) {
      getSavedPageIndex(selectedCategory).then(index => {
        const validIndex = index ?? 0;
        if (validIndex >= 0 && validIndex < newFilteredQuotes.length) {
          setCurrentQuoteIndex(validIndex);
        } else {
          setCurrentQuoteIndex(0);
        }
      }).catch(error => {
        console.error('Erreur lors du chargement de l\'index:', error);
        setCurrentQuoteIndex(0);
      });
    } else {
      setCurrentQuoteIndex(0);
    }

  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes]);

  // Gestionnaire pour la recherche (avec tri par ordre)
  const handleSearch = useCallback((results: Quote[]) => {
    setQuotesLoading(true);
    
    setSearchResults(results);
    if (results.length > 0) {
      // Trier les résultats de recherche par ordre aussi
      const sortedResults = [...results].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      setFilteredQuotes(sortedResults);
    } else {
      let categoryQuotes: Quote[] = [];
      
      if (selectedCategory === 'daily') {
        categoryQuotes = [...dailyQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      } 
      else if (selectedCategory === 'all') {
        const baseQuotes = currentCategoryFilter 
          ? quotes.filter(quote => quote.category === currentCategoryFilter)
          : quotes;
        categoryQuotes = [...baseQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      } 
      else if (selectedCategory === 'favorites') {
        const favoriteQuotes = quotes.filter(quote => quote.isFavorite);
        categoryQuotes = [...favoriteQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      }
      else if (selectedCategory === 'mukhtarat') {
        const subCategories = categoryManager.getMukhtaratSubCategories().map(cat => cat.id);
        const mukhtaratQuotes = quotes.filter(quote => subCategories.includes(quote.category));
        categoryQuotes = [...mukhtaratQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      }
      else if (categoryManager.isMukhtaratSubCategory(selectedCategory)) {
        const subCategoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
        categoryQuotes = [...subCategoryQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      }
      else {
        const categoryFilteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
        categoryQuotes = [...categoryFilteredQuotes].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      }
      
      setFilteredQuotes(categoryQuotes);
    }
    
    setTimeout(() => setQuotesLoading(false), 300);
  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes]);

  // Gestionnaire pour le changement de catégorie
  const handleCategoryChange = useCallback((category: string) => {
    if (selectedCategory === 'all') {
      setCurrentCategoryFilter(category);
    } else {
      setSelectedCategory(category);
      setCurrentCategoryFilter('');
    }
    setSearchResults([]);
    setIsMenuOpen(false);
    
    // Gérer l'affichage de la page مختارات
    if (category === 'mukhtarat') {
      setShowMukhtaratPage(true);
    } else if (categoryManager.isMukhtaratSubCategory(category)) {
      setShowMukhtaratPage(false);
    } else {
      setShowMukhtaratPage(false);
    }
  }, [selectedCategory]);

  // Titre de la catégorie avec compteur de favoris
  const getCategoryTitle = (categoryId: string): string => {
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
        return 'مختارات';
      default:
        const categories = categoryManager.getCategories();
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'حكم الموردين';
    }
  };

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
      {/* Layout avec sidebar latérale permanente */}
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

        {/* Contenu principal avec header réduit */}
        <div className="flex-1 flex flex-col">
          {/* Header réduit - seulement pour mobile et titre */}
          <header className={`${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm shadow-sm h-16 z-30 md:shadow-none`}>
            <div className="h-full flex items-center gap-4 px-4">
              {/* Bouton menu mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              {/* Titre principal */}
              <div className="flex-1 flex items-center gap-4 overflow-hidden">
                <h1 className="text-xl md:text-2xl font-bold font-arabic text-sky-600 whitespace-nowrap">
                  {searchResults.length > 0 ? 'نتيجة البحث' : getCategoryTitle(selectedCategory)}
                </h1>
                
                {/* Compteur pour مختارات - affiché seulement dans les sous-catégories */}
                {categoryManager.isMukhtaratSubCategory(selectedCategory) && (
                  <div className="flex items-center">
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-sky-100 text-sky-600">
                      {filteredQuotes.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>💡 يمكنك إضافة المفضلة من الحكم العادية</p>
                    <p>⌨️ استخدم الرقم "3" للانتقال السريع إلى المفضلة</p>
                  </div>
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
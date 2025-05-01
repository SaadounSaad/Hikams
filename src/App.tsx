// App.tsx refactorisé
import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { QuoteProvider, useQuotes } from './contexts/QuoteContext';
import { AppearanceProvider, useAppearanceSettings } from './contexts/AppearanceContext';
import { Sidebar } from './components/Sidebar';
import { QuoteViewer } from './components/QuoteViewer';
import { QuoteForm } from './components/QuoteForm';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { AuthForm } from './components/AuthForm';
import { Quote } from './types';
import { categoryManager } from './utils/categories';

// Composant App principal qui utilise tous nos nouveaux composants
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { quotes, dailyQuotes, toggleFavorite, deleteQuote, deleteAllQuotes } = useQuotes();
  const { isSepiaMode } = useAppearanceSettings();
  
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

  // Effet pour fermer le menu lors d'un clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (event instanceof MouseEvent) {
        console.log("🖱 Événement souris détecté");
      } else if (event instanceof TouchEvent) {
        console.log("📱 Événement tactile détecté");
      }
    
      if (isMenuOpen && !(event.target as Element)?.closest('nav')) {
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

  // Effet pour filtrer les citations en fonction de la catégorie sélectionnée
  useEffect(() => {
    // Remplacez le contenu de cet useEffect par :
    let newFilteredQuotes: Quote[] = [];
    
    if (selectedCategory === 'daily') {
      newFilteredQuotes = dailyQuotes;
    } 
    else if (selectedCategory === 'all') {
      newFilteredQuotes = currentCategoryFilter 
        ? quotes.filter(quote => quote.category === currentCategoryFilter)
        : quotes;
    } 
    else if (selectedCategory === 'favorites') {
      newFilteredQuotes = quotes.filter(quote => quote.isFavorite);
    }
    // Ajouter cette partie pour gérer "مختارات"
    else if (selectedCategory === 'mukhtarat') {
      // Pour مختارات, inclure toutes les citations de ses sous-catégories
      const subCategories = categoryManager.getMukhtaratSubCategories().map(cat => cat.id);
      newFilteredQuotes = quotes.filter(quote => subCategories.includes(quote.category));
    }
    else if (categoryManager.isMukhtaratSubCategory(selectedCategory)) {
      // Pour une sous-catégorie spécifique de مختارات
      newFilteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    else {
      // Pour toutes les autres catégories
      newFilteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    
    setFilteredQuotes(newFilteredQuotes);
  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes]);

    // Gestionnaire pour la recherche
    const handleSearch = useCallback((results: Quote[]) => {
      setSearchResults(results);
      if (results.length > 0) {
        setFilteredQuotes(results);
      } else {
        // Voici la partie à modifier - Remplacez le contenu ci-dessous par :
        let categoryQuotes: Quote[] = [];
        
        if (selectedCategory === 'daily') {
          categoryQuotes = dailyQuotes;
        } 
        else if (selectedCategory === 'all') {
          categoryQuotes = currentCategoryFilter 
            ? quotes.filter(quote => quote.category === currentCategoryFilter)
            : quotes;
        } 
        else if (selectedCategory === 'favorites') {
          categoryQuotes = quotes.filter(quote => quote.isFavorite);
        }
        // Ajouter cette partie pour gérer "مختارات"
        else if (selectedCategory === 'mukhtarat') {
          const subCategories = categoryManager.getMukhtaratSubCategories().map(cat => cat.id);
          categoryQuotes = quotes.filter(quote => subCategories.includes(quote.category));
        }
        else if (categoryManager.isMukhtaratSubCategory(selectedCategory)) {
          categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
        }
        else {
          categoryQuotes = quotes.filter(quote => quote.category === selectedCategory);
        }
        
        setFilteredQuotes(categoryQuotes);
      }
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
  }, [selectedCategory]);

  // Titre de la catégorie
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
        const category = categoryManager.getCategories().find((c: {id: string, name: string}) => c.id === categoryId);
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
      <div className={`min-h-screen flex items-center justify-center ${isSepiaMode ? 'bg-gradient-to-br from-amber-50/50 to-amber-50' : 'bg-gradient-to-br from-slate-50 to-white'} p-4`}>
        <div className={`w-full max-w-md ${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm rounded-2xl shadow-sm p-8`}>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isSepiaMode ? 'bg-gradient-to-br from-amber-50/50 to-amber-50' : 'bg-gradient-to-br from-slate-50 to-white'}`}>
      <header className={`${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 h-16 z-30`}>
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
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <Sidebar 
          selectedCategory={selectedCategory}
          currentCategoryFilter={currentCategoryFilter}
          onCategoryChange={handleCategoryChange}
          onSearch={handleSearch}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onShowSettings={() => setShowSettings(true)}
        />

        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto relative">
            <QuoteViewer
              quotes={filteredQuotes}
              onToggleFavorite={toggleFavorite}
              onEdit={(quote) => {
                setEditingQuote(quote);
                setShowForm(true);
              }}
              onDelete={(id) => setDeleteConfirmation(id)}
            />
          </div>
        </main>
      </div>

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

// Composant principal qui fournit les contextes
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
// App.tsx - Version complète avec toutes les corrections TypeScript
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
import { categoryManager, getIconComponent } from './utils/categories';
import WirdPage from './components/WirdPage';
import AlbaqiatPage from './components/AlbaqiatPage';
import GenericThikrPage from './components/GenericThikrPage';
import MirajArwahPage from './components/MirajArwahPage';
import { getSavedPageIndex, updateBookmark } from './utils/bookmarkService';
import BookReaderPage from './components/BookReaderPage';
import BookLibraryPage from './components/BookLibraryPage';
import { getUnifiedFavorites } from './utils/favoritesHelper';
import { useFavorites, FavoritesService } from './services/FavoritesServices';
import { supabase } from './lib/supabase';

// Interface pour les catégories - alignée avec celle de categories.ts
interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  isDefault?: boolean;
  parentId?: string;
  hasSubCategories?: boolean;
  count?: number;
}

// Suppression de ExtendedCategory car elle n'est pas utilisée
// On utilisera directement CategoryItem partout

// Composant App principal qui utilise tous nos contextes
function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
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
  const [mirajSubcategory, setMirajSubcategory] = useState<string | null>(null);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [selectedBookTitle, setSelectedBookTitle] = useState<string | null>(null);
  
  // États pour les favoris unifiés
  const [unifiedFavorites, setUnifiedFavorites] = useState<Quote[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Hook pour gérer les favoris avec le nouveau service
  const favoritesService = useFavorites(user?.id || '');

  // Obtenir les sous-catégories مختارات
  const totalMukhtarat = quotes.filter(q => categoryManager.isMukhtaratSubCategory(q.category)).length;

  // Fonction pour charger les favoris unifiés - avec debouncing
  const loadUnifiedFavorites = useCallback(async () => {
    if (!user?.id || favoritesLoading) return;
    
    setFavoritesLoading(true);
    try {
      // Charger les favoris unifiés avec le helper existant
      const favorites = await getUnifiedFavorites(user.id);
      
      // Éviter de mettre à jour si les données n'ont pas changé
      setUnifiedFavorites(prevFavorites => {
        if (JSON.stringify(prevFavorites) === JSON.stringify(favorites)) {
          return prevFavorites; // Pas de changement, éviter le re-render
        }
        return favorites;
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des favoris:', error);
    } finally {
      setFavoritesLoading(false);
    }
  }, [user?.id, favoritesLoading]);

  // Fonction pour synchroniser les favoris au démarrage - adaptée au nouveau service
  const syncFavoritesOnStart = useCallback(async () => {
    if (user?.id) {
      try {
        // Utiliser les méthodes statiques du service
        await FavoritesService.syncIsFavoriteFields(user.id);
        console.log('✅ Synchronisation des favoris terminée');
      } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
      }
    }
  }, [user?.id]);

  // Charger les favoris quand l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      // Synchroniser puis charger les favoris
      syncFavoritesOnStart().then(() => {
        loadUnifiedFavorites();
      });
    }
  }, [user?.id]); // ⚠️ Retiré les dépendances qui causent les boucles

  // Debug useEffect pour surveiller l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔄 User state changed:');
      console.log('  - user:', user);
      console.log('  - user?.id:', user?.id);
      console.log('  - isAuthenticated:', isAuthenticated);
      console.log('  - isLoading:', isLoading);
      
      // Vérification supplémentaire de la session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('  - supabase session:', session?.user?.id);
    };
    checkAuth();
  }, [user, isAuthenticated, isLoading]);

  // Fonction améliorée pour basculer les favoris - adaptée au nouveau service
  const handleToggleFavorite = useCallback(async (id: string, contentType?: 'quote' | 'book_entry') => {
    if (!user?.id) {
      alert('Vous devez être connecté pour ajouter des favoris');
      return;
    }

    try {
      // Éviter les appels multiples simultanés
      if (favoritesLoading) return;
      
      setFavoritesLoading(true);

      // Détecter automatiquement le type si non spécifié
      let detectedType = contentType;
      if (!detectedType) {
        const quote = filteredQuotes.find(q => q.id === id);
        if (quote) {
          detectedType = quote.isBookEntry ? 'book_entry' : 'quote';
        }
      }

      if (!detectedType) {
        console.error('❌ Impossible de déterminer le type de contenu pour:', id);
        return;
      }

      let newStatus: boolean;
      
      if (detectedType === 'quote') {
        // Utiliser le hook (pas besoin de passer userId)
        newStatus = await favoritesService.toggleQuoteFavorite(id);
        // Mettre à jour l'ancien système (Context) pour les quotes
        await toggleFavorite(id);
      } else {
        const realId = id.startsWith('book-entry-') ? id.replace('book-entry-', '') : id;
        // Utiliser le hook (pas besoin de passer userId)
        newStatus = await favoritesService.toggleBookEntryFavorite(realId);
      }
      
      // Recharger les favoris unifiés seulement si on est dans la section favoris
      if (selectedCategory === 'favorites') {
        await loadUnifiedFavorites();
      }

      // Mettre à jour le bookmark pour la quote actuelle
      if (detectedType === 'quote' && newStatus) {
        const quoteIndex = filteredQuotes.findIndex(q => q.id === id);
        if (quoteIndex !== -1) {
          await updateBookmark(selectedCategory, quoteIndex);
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du basculement du favori:', error);
      alert('Erreur lors de l\'ajout aux favoris. Vérifiez votre connexion.');
    } finally {
      setFavoritesLoading(false);
    }
  }, [user?.id, favoritesLoading, filteredQuotes, selectedCategory, toggleFavorite, loadUnifiedFavorites, favoritesService]);

  // Fonction spécifique pour supprimer depuis la liste des favoris - adaptée au nouveau service
  const handleRemoveFromFavorites = useCallback(async (id: string) => {
    try {
      if (!user?.id) return;

      const quote = filteredQuotes.find(q => q.id === id);
      if (!quote) return;

      const contentType = quote.isBookEntry ? 'book_entry' : 'quote';
      const realId = quote.isBookEntry && quote.originalEntryId 
        ? quote.originalEntryId.toString() 
        : id.replace('book-entry-', '');

      console.log('🗑️ Suppression du favori:', realId, 'Type:', contentType);

      // Utiliser le hook (pas besoin de passer userId)
      await favoritesService.removeFavorite(realId, contentType);
      
      // Recharger la liste des favoris
      await loadUnifiedFavorites();
      
      console.log('✅ Favori supprimé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la suppression du favori:', error);
    }
  }, [user?.id, filteredQuotes, favoritesService, loadUnifiedFavorites]);

  // Fonction unifiée pour gérer les favoris selon le contexte
  const handleUnifiedToggleFavorite = useCallback(async (id: string) => {
    if (selectedCategory === 'favorites') {
      // Dans la section favoris, on supprime directement
      await handleRemoveFromFavorites(id);
    } else {
      // Dans les autres sections, on bascule normalement
      await handleToggleFavorite(id);
    }
  }, [selectedCategory, handleRemoveFromFavorites, handleToggleFavorite]);

  // Charger l'index de bookmark au changement de catégorie
  useEffect(() => {
    async function loadBookmarkIndex() {
      const index = await getSavedPageIndex(selectedCategory);
      const validIndex = index ?? 0;
      setCurrentQuoteIndex(validIndex);
    }

    loadBookmarkIndex();
  }, [selectedCategory]);

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

  // Effet pour filtrer les citations avec favoris unifiés - optimisé
  useEffect(() => {
    let isMounted = true; // Éviter les mises à jour si le composant est démonté
    
    const filterQuotes = async () => {
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
        // Utiliser les favoris unifiés
        newFilteredQuotes = unifiedFavorites;
      }
      else if (selectedCategory === 'mukhtarat') {
        const subCategories = categoryManager.getMukhtaratSubCategories().map(cat => cat.id);
        newFilteredQuotes = quotes.filter(quote => subCategories.includes(quote.category));
      }
      else if (categoryManager.isMukhtaratSubCategory(selectedCategory)) {
        newFilteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
      }
      else {
        newFilteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
      }

      if (isMounted) {
        setFilteredQuotes(newFilteredQuotes);

        // Charger l'index de la dernière page pour cette catégorie
        try {
          const index = await getSavedPageIndex(selectedCategory);
          const validIndex = index ?? 0;
          if (validIndex >= 0 && validIndex < newFilteredQuotes.length) {
            setCurrentQuoteIndex(validIndex);
          } else {
            setCurrentQuoteIndex(0);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'index:', error);
          setCurrentQuoteIndex(0);
        }
      }
    };

    filterQuotes();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes, unifiedFavorites]);

  // Gestionnaire pour la recherche avec favoris unifiés
  const handleSearch = useCallback((results: Quote[]) => {
    setSearchResults(results);
    if (results.length > 0) {
      setFilteredQuotes(results);
    } else {
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
        // Utiliser les favoris unifiés pour la recherche aussi
        categoryQuotes = unifiedFavorites;
      }
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
  }, [selectedCategory, currentCategoryFilter, quotes, dailyQuotes, unifiedFavorites]);

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
  }, [selectedCategory]);

  // Vérifie si on doit afficher la sous-navigation pour مختارات
  const shouldShowMukhtaratSubNav = selectedCategory === 'mukhtarat' || 
                                   categoryManager.isMukhtaratSubCategory(selectedCategory);

  // Titre de la catégorie avec compteur de favoris unifié
  const getCategoryTitle = (categoryId: string): string => {
    switch (categoryId) {
      case 'daily':
        return 'حكمة اليوم';
      case 'all':
        return '';
      case 'favorites':
        if (favoritesLoading) {
          return 'المفضلة (تحميل...)';
        }
        return `المفضلة (${unifiedFavorites.length})`;
      case 'verses':
        return 'آيات مِفتاحية';
      case 'hadiths':
        return 'هَدْي نَبَوي';
      case 'thoughts':
        return 'دُرَرْ';
      case 'miraj-arwah':
        return 'معراج الأرواح';
      default:
        const categories = categoryManager.getCategories();
        const category = categories.find((c) => c.id === categoryId);
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

  // Obtenir les sous-catégories مختارات avec le bon type
  const mukhtaratSubCategories = categoryManager.getMukhtaratSubCategories();

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
            
            {/* Affichage du compteur de citations uniquement pour مختارات et ses sous-catégories */}
            {shouldShowMukhtaratSubNav && (
              <div className="flex items-center">
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-sky-100 text-sky-600">
                  {selectedCategory === 'mukhtarat' 
                    ? `${filteredQuotes.length}/${totalMukhtarat}` 
                    : `${filteredQuotes.length}/${totalMukhtarat}`}
                </span>
              </div>
            )}

            {/* Indicateur de chargement pour les favoris */}
            {selectedCategory === 'favorites' && favoritesLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
            )}
          </div>
        </div>
      </header>

      {/* Sous-navigation pour مختارات */}
      {shouldShowMukhtaratSubNav && (
        <div className={`fixed top-16 left-0 right-0 h-12 ${isSepiaMode ? 'bg-amber-50/80' : 'bg-white/80'} backdrop-blur-sm border-b border-gray-200 z-20`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center md:justify-start gap-2">
            <button
              onClick={() => {
                handleCategoryChange('mukhtarat');
                setIsMenuOpen(false);
              }}
              className={`px-3 py-1 rounded-lg text-sm font-arabic transition-colors ${
                selectedCategory === 'mukhtarat'
                  ? 'bg-sky-100 text-sky-600'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              مختارات
            </button>
            
            {mukhtaratSubCategories.map((subCategory: CategoryItem) => {
              const IconComponent = getIconComponent(subCategory.icon || '');
              return (
                <button
                  key={subCategory.id}
                  onClick={() => {
                    handleCategoryChange(subCategory.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-arabic transition-colors ${
                    selectedCategory === subCategory.id
                      ? 'bg-sky-100 text-sky-600'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{subCategory.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={`flex min-h-screen ${shouldShowMukhtaratSubNav ? 'pt-28' : 'pt-16'}`}>
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
            {/* Message informatif pour la section favoris vide */}
            {selectedCategory === 'favorites' && filteredQuotes.length === 0 && !favoritesLoading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-arabic">لا توجد مفضلة بعد</h3>
                <p className="text-gray-500 mb-4 font-arabic">ابدأ بإضافة بعض الحكم أو المقاطع المفضلة</p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>💡 يمكنك إضافة المفضلة من الحكم العادية أو من مكتبة الكتب</p>
                  <p>⌨️ استخدم الرقم "3" للانتقال السريع إلى المفضلة</p>
                </div>
              </div>
            )}

            {selectedCategory === 'miraj-arwah' ? (
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
            ) : selectedCategory === 'book-library' ? (
              selectedBookTitle ? (
                <BookReaderPage
                  bookTitle={selectedBookTitle}
                  onBack={() => setSelectedBookTitle(null)}
                />
              ) : (
                <BookLibraryPage onSelectBook={setSelectedBookTitle} />
              )
            ) : (
              <QuoteViewer
                quotes={filteredQuotes}
                currentIndex={currentQuoteIndex}
                onIndexChange={setCurrentQuoteIndex}
                selectedCategory={selectedCategory}
                onToggleFavorite={handleUnifiedToggleFavorite}
                onEdit={(quote) => {
                  // Ne permettre l'édition que pour les quotes normales
                  if (!quote.isBookEntry) {
                    setEditingQuote(quote);
                    setShowForm(true);
                  }
                }}
                onDelete={(id) => {
                  // Ne permettre la suppression que pour les quotes normales
                  const quote = filteredQuotes.find(q => q.id === id);
                  if (quote && !quote.isBookEntry) {
                    setDeleteConfirmation(id);
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>

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
// components/AdvancedSearch.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Clock, Sparkles, Filter } from 'lucide-react';
import { useArabicSemanticSearch } from '../utils/arabicSearchEngine';
import { Quote } from '../types';
import { useAppearanceSettings } from '../context/AppearanceContext';

interface AdvancedSearchProps {
  quotes: Quote[];
  onSearch: (results: Quote[]) => void;
  onClose?: () => void;
  placeholder?: string;
  className?: string;
}

interface SearchFilters {
  category: string;
  minLength: number;
  maxLength: number;
  favoritesOnly: boolean;
  semanticSearch: boolean;
}

export function AdvancedSearch({ 
  quotes, 
  onSearch, 
  onClose, 
  placeholder = "ابحث في الحكم...",
  className = ""
}: AdvancedSearchProps) {
  const { isSepiaMode } = useAppearanceSettings();
  const { search, getSuggestions, isIndexing, isReady } = useArabicSemanticSearch(quotes);
  
  // États locaux
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filtres avancés
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    minLength: 0,
    maxLength: 1000,
    favoritesOnly: false,
    semanticSearch: true
  });

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Charger l'historique au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('hikams_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur chargement historique:', error);
      }
    }
  }, []);

  // Sauvegarder l'historique
  const saveToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    setSearchHistory(prev => {
      const updated = [searchTerm, ...prev.filter(item => item !== searchTerm)].slice(0, 10);
      localStorage.setItem('hikams_search_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Recherche avec debounce
  const performSearch = useCallback(async (searchTerm: string, immediate = false) => {
    if (!isReady || !searchTerm.trim()) {
      onSearch([]);
      return;
    }

    const executeSearch = () => {
      setIsSearching(true);
      
      try {
        let results = search(searchTerm, {
          maxResults: 100,
          minScore: 1,
          includeExact: true,
          includeSemantic: filters.semanticSearch
        });

        // Appliquer les filtres additionnels
        if (filters.category) {
          results = results.filter((quote: Quote) => quote.category === filters.category);
        }
        
        if (filters.favoritesOnly) {
          results = results.filter((quote: Quote) => quote.isFavorite);
        }
        
        if (filters.minLength > 0 || filters.maxLength < 1000) {
          results = results.filter((quote: Quote) => {
            const textLength = quote.text?.length || 0;
            return textLength >= filters.minLength && textLength <= filters.maxLength;
          });
        }

        onSearch(results);
        
        // Sauvegarder dans l'historique seulement si recherche manuelle
        if (immediate) {
          saveToHistory(searchTerm);
        }
        
        console.log(`🔍 Recherche "${searchTerm}": ${results.length} résultats`);
        
      } catch (error) {
        console.error('Erreur de recherche:', error);
        onSearch([]);
      } finally {
        setIsSearching(false);
      }
    };

    if (immediate) {
      executeSearch();
    } else {
      // Debounce pour la recherche en temps réel
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(executeSearch, 300);
    }
  }, [isReady, search, filters, onSearch, saveToHistory]);

  // Gérer les changements de query
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    
    if (value.length >= 2) {
      // Mettre à jour les suggestions
      const newSuggestions = getSuggestions(value, 5);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      
      // Recherche en temps réel
      performSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      onSearch([]);
    }
  }, [getSuggestions, performSearch, onSearch]);

  // Gérer la sélection d'une suggestion
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion, true);
    inputRef.current?.focus();
  }, [performSearch]);

  // Gérer l'historique
  const handleHistorySelect = useCallback((historyItem: string) => {
    setQuery(historyItem);
    setShowSuggestions(false);
    performSearch(historyItem, true);
  }, [performSearch]);

  // Effacer la recherche
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch([]);
    inputRef.current?.focus();
  }, [onSearch]);

  // Gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else if (query) {
          clearSearch();
        } else if (onClose) {
          onClose();
        }
      }
      
      if (e.key === 'Enter' && query.trim()) {
        setShowSuggestions(false);
        performSearch(query, true);
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [query, showSuggestions, clearSearch, onClose, performSearch]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtenir les catégories uniques pour les filtres
  const availableCategories = React.useMemo(() => {
    const categories = new Set(quotes.map(quote => quote.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [quotes]);

  return (
    <div className={`relative ${className}`}>
      {/* Barre de recherche principale */}
      <div className={`
        relative flex items-center
        ${isSepiaMode ? 'bg-amber-50' : 'bg-white'} 
        border-2 border-gray-200 rounded-xl shadow-sm
        focus-within:border-sky-400 focus-within:shadow-md
        transition-all duration-200
      `}>
        {/* Icône de recherche */}
        <div className="flex items-center pl-4">
          {isSearching || isIndexing ? (
            <div className="animate-spin w-5 h-5 border-2 border-sky-200 border-t-sky-600 rounded-full" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Input de recherche */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={isIndexing ? "Indexation en cours..." : placeholder}
          disabled={isIndexing}
          className={`
            flex-1 px-4 py-3 bg-transparent
            text-right font-arabic text-lg
            placeholder-gray-400 outline-none
            disabled:opacity-50
          `}
          dir="rtl"
        />

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 pr-3">
          {/* Indicateur de recherche sémantique */}
          {filters.semanticSearch && query && (
            <div className="flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-600 rounded-md text-xs">
              <Sparkles className="w-3 h-3" />
              <span>ذكي</span>
            </div>
          )}

          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              p-2 rounded-lg transition-colors
              ${showFilters ? 'bg-sky-100 text-sky-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
            `}
            title="فلاتر البحث"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Bouton effacer */}
          {query && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panneau des filtres */}
      {showFilters && (
        <div className={`
          absolute top-full left-0 right-0 mt-2 p-4 z-50
          ${isSepiaMode ? 'bg-amber-50' : 'bg-white'}
          border border-gray-200 rounded-xl shadow-lg
        `}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre par catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-arabic">
                الفئة
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg text-right font-arabic"
              >
                <option value="">جميع الفئات</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Filtre المفضلة فقط */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-arabic">
                <input
                  type="checkbox"
                  checked={filters.favoritesOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, favoritesOnly: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                المفضلة فقط
              </label>
            </div>

            {/* Filtre longueur النص */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-arabic">
                طول النص
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.minLength}
                  onChange={(e) => setFilters(prev => ({ ...prev, minLength: parseInt(e.target.value) || 0 }))}
                  placeholder="أقل"
                  className="w-20 p-2 border border-gray-300 rounded text-center"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={filters.maxLength}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxLength: parseInt(e.target.value) || 1000 }))}
                  placeholder="أكثر"
                  className="w-20 p-2 border border-gray-300 rounded text-center"
                />
              </div>
            </div>

            {/* Filtre البحث الذكي */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 font-arabic">
                <input
                  type="checkbox"
                  checked={filters.semanticSearch}
                  onChange={(e) => setFilters(prev => ({ ...prev, semanticSearch: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Sparkles className="w-4 h-4 text-sky-500" />
                البحث الذكي (المرادفات)
              </label>
            </div>
          </div>

          {/* Boutons d'action des filtres */}
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setFilters({
                  category: '',
                  minLength: 0,
                  maxLength: 1000,
                  favoritesOnly: false,
                  semanticSearch: true
                });
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-arabic"
            >
              إعادة تعيين
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-arabic"
            >
              تطبيق
            </button>
          </div>
        </div>
      )}

      {/* Suggestions et historique */}
      {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
        <div 
          ref={suggestionsRef}
          className={`
            absolute top-full left-0 right-0 mt-2 py-2 z-50
            ${isSepiaMode ? 'bg-amber-50' : 'bg-white'}
            border border-gray-200 rounded-xl shadow-lg
            max-h-80 overflow-y-auto
          `}
        >
          {/* Suggestions basées sur la saisie */}
          {suggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 font-arabic">
                اقتراحات
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors font-arabic flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Historique des recherches */}
          {searchHistory.length > 0 && (
            <div>
              {suggestions.length > 0 && <div className="border-t border-gray-100" />}
              <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 font-arabic">
                البحثات السابقة
              </div>
              {searchHistory.slice(0, 5).map((historyItem, index) => (
                <button
                  key={`history-${index}`}
                  onClick={() => handleHistorySelect(historyItem)}
                  className="w-full px-4 py-2 text-right hover:bg-gray-50 transition-colors font-arabic flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{historyItem}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* État de chargement/indexation */}
      {isIndexing && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-sky-50 border border-sky-200 rounded-xl">
          <div className="flex items-center gap-2 text-sky-600">
            <div className="animate-spin w-4 h-4 border-2 border-sky-200 border-t-sky-600 rounded-full" />
            <span className="text-sm font-arabic">جاري إنشاء فهرس البحث الذكي...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant de recherche simple pour la sidebar
export function QuickSearch({ 
  quotes, 
  onSearch,
  className = ""
}: {
  quotes: Quote[];
  onSearch: (results: Quote[]) => void;
  className?: string;
}) {
  const { isSepiaMode } = useAppearanceSettings();
  const { search, isReady } = useArabicSemanticSearch(quotes);
  const [query, setQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = useCallback((searchTerm: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!searchTerm.trim() || !isReady) {
        onSearch([]);
        return;
      }

      const results = search(searchTerm, {
        maxResults: 50,
        minScore: 1,
        includeExact: true,
        includeSemantic: true
      });

      onSearch(results);
    }, 300);
  }, [search, isReady, onSearch]);

  const handleChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch([]);
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200
        ${isSepiaMode ? 'bg-amber-50/50' : 'bg-white/50'}
        focus-within:border-sky-400 transition-all
      `}>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="ابحث..."
          className="flex-1 bg-transparent outline-none text-right font-arabic placeholder-gray-400"
          dir="rtl"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
// ===========================================
// 7. Hook pour intégrer toutes les fonctionnalités
// ===========================================

// src/hooks/useAdvancedSearch.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useArabicSemanticSearch } from '../utils/arabicSearchEngine';
import { SearchAnalytics } from '../utils/searchAnalytics';
import { SearchPerformanceMonitor } from '../utils/searchPerformance';
import { Quote } from '../types';

export function useAdvancedSearch(quotes: Quote[]) {
  const { search, getSuggestions, isReady, isIndexing } = useArabicSemanticSearch(quotes);
  const [results, setResults] = useState<Quote[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchTime, setSearchTime] = useState<number>(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (
    query: string,
    options: {
      maxResults?: number;
      minScore?: number;
      immediate?: boolean;
      trackAnalytics?: boolean;
    } = {}
  ) => {
    const {
      maxResults = 50,
      minScore = 1,
      immediate = false,
      trackAnalytics = true
    } = options;

    if (!isReady || !query.trim()) {
      setResults([]);
      setCurrentQuery('');
      return;
    }

    const executeSearch = () => {
      setIsSearching(true);
      setCurrentQuery(query);
      
      const startTime = SearchPerformanceMonitor.startMeasurement();
      
      try {
        const searchResults = search(query, {
          maxResults,
          minScore,
          includeExact: true,
          includeSemantic: true
        });

        const searchDuration = SearchPerformanceMonitor.endMeasurement(
          startTime,
          query,
          searchResults.length
        );

        setResults(searchResults);
        setSearchTime(searchDuration);

        // Analytics
        if (trackAnalytics) {
          SearchAnalytics.trackSearch(query, searchResults.length, searchDuration);
        }

        console.log(`🔍 "${query}": ${searchResults.length} résultats en ${searchDuration.toFixed(2)}ms`);
        
      } catch (error) {
        console.error('Erreur de recherche:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    if (immediate) {
      executeSearch();
    } else {
      // Debounce
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(executeSearch, 300);
    }
  }, [isReady, search]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setCurrentQuery('');
    setSearchTime(0);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const getSuggestionsFor = useCallback((query: string, limit = 5) => {
    if (!isReady) return [];
    return getSuggestions(query, limit);
  }, [isReady, getSuggestions]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // État
    results,
    isSearching,
    isReady,
    isIndexing,
    currentQuery,
    searchTime,
    
    // Actions
    search: performSearch,
    clearSearch,
    getSuggestions: getSuggestionsFor,
    
    // Métriques
    getAnalytics: SearchAnalytics.getMetrics,
    getPerformanceStats: SearchPerformanceMonitor.getPerformanceStats
  };
}
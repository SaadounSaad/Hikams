// ===========================================
// 5. Analytics et métriques de recherche
// ===========================================

// src/utils/searchAnalytics.ts
export interface SearchMetrics {
  totalSearches: number;
  uniqueQueries: number;
  averageResultsPerSearch: number;
  popularQueries: Array<{ query: string; count: number; avgResults: number }>;
  searchesByDay: Array<{ date: string; count: number }>;
  noResultQueries: string[];
}

interface QueryStats {
  count: number;
  totalResults: number;
  firstSearched: string;
  lastSearched: string;
  totalTime: number;
}

interface DayStats {
  searches: number;
  totalResults: number;
}

interface AnalyticsData {
  totalSearches: number;
  queries: Record<string, QueryStats>;
  dailyStats: Record<string, DayStats>;
  noResultQueries: string[];
}

export class SearchAnalytics {
  private static readonly STORAGE_KEY = 'hikams_search_analytics';

  static trackSearch(query: string, resultsCount: number, searchTime?: number) {
    try {
      const data = this.getStoredData();
      
      const today = new Date().toISOString().split('T')[0];
      const normalizedQuery = query.toLowerCase().trim();

      // Mettre à jour les statistiques globales
      data.totalSearches++;
      
      // Ajouter/mettre à jour la requête
      const existingQuery = data.queries[normalizedQuery];
      if (existingQuery) {
        existingQuery.count++;
        existingQuery.totalResults += resultsCount;
        existingQuery.lastSearched = new Date().toISOString();
        if (searchTime) {
          existingQuery.totalTime += searchTime;
        }
      } else {
        data.queries[normalizedQuery] = {
          count: 1,
          totalResults: resultsCount,
          firstSearched: new Date().toISOString(),
          lastSearched: new Date().toISOString(),
          totalTime: searchTime || 0
        };
      }

      // Statistiques par jour
      const dayStats = data.dailyStats[today];
      if (dayStats) {
        dayStats.searches++;
        dayStats.totalResults += resultsCount;
      } else {
        data.dailyStats[today] = {
          searches: 1,
          totalResults: resultsCount
        };
      }

      // Requêtes sans résultats
      if (resultsCount === 0 && !data.noResultQueries.includes(normalizedQuery)) {
        data.noResultQueries.push(normalizedQuery);
      }

      this.saveData(data);
    } catch (error) {
      console.error('Erreur tracking recherche:', error);
    }
  }

  static getMetrics(): SearchMetrics {
    const data = this.getStoredData();
    
    const queryEntries = Object.entries(data.queries);
    const totalResults = queryEntries.reduce((sum, [, stats]) => sum + stats.totalResults, 0);
    
    const popularQueries = queryEntries
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgResults: stats.count > 0 ? stats.totalResults / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const searchesByDay = Object.entries(data.dailyStats)
      .map(([date, stats]) => ({ date, count: stats.searches }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 30 derniers jours

    return {
      totalSearches: data.totalSearches,
      uniqueQueries: queryEntries.length,
      averageResultsPerSearch: data.totalSearches > 0 ? totalResults / data.totalSearches : 0,
      popularQueries,
      searchesByDay,
      noResultQueries: data.noResultQueries.slice(0, 20)
    };
  }

  static clearData() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static getStoredData(): AnalyticsData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur lecture analytics:', error);
    }

    return {
      totalSearches: 0,
      queries: {},
      dailyStats: {},
      noResultQueries: []
    };
  }

  private static saveData(data: AnalyticsData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde analytics:', error);
    }
  }
}
// optimizedQuoteService.ts - Service optimisé pour les quotes
import { supabase } from '../lib/supabase';
import { Quote } from '../types';

// Interface pour le cache
interface QuoteCache {
  quotes: Quote[];
  dailyQuotes: Quote[];
  lastFetchTime: number;
  expiresIn: number; // en millisecondes
}

// Constantes
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 heure
const CACHE_KEY = 'quotes_cache_v1';
const BATCH_SIZE = 50; // Nombre de quotes à charger par lot

class OptimizedQuoteService {
  private static cache: QuoteCache | null = null;

  /**
   * Chargement optimisé de toutes les quotes avec mise en cache
   */
  static async getQuotes(userId: string): Promise<{ quotes: Quote[], dailyQuotes: Quote[] }> {
    console.log('🔄 getQuotes appelé pour:', userId);
    
    // 1. Vérifier le cache
    this.loadCacheFromStorage();
    if (this.isCacheValid()) {
      console.log('✅ Utilisation du cache pour les quotes');
      return { 
        quotes: this.cache!.quotes,
        dailyQuotes: this.cache!.dailyQuotes
      };
    }
    
    // 2. Chargement depuis la DB si cache invalide
    console.log('🌐 Cache expiré, chargement depuis la DB...');
    
    try {
      // 2.1 Récupérer les quotes avec pagination
      const allQuotes: Quote[] = [];
      let lastId = '0';
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('user_id', userId)
          .gt('id', lastId)
          .order('id', { ascending: true })
          .limit(BATCH_SIZE);
          
        if (error) throw error;
        
        if (data.length < BATCH_SIZE) {
          hasMore = false;
        }
        
        if (data.length > 0) {
          // Transformer les données pour correspondre à l'interface Quote
          const transformedQuotes = data.map(quote => ({
            id: quote.id,
            text: quote.text,
            category: quote.category,
            createdAt: quote.createdAt,
            isFavorite: quote.is_favorite || false,
            source: quote.source || '',
            user_id: quote.user_id
          }));
          
          allQuotes.push(...transformedQuotes);
          lastId = data[data.length - 1].id;
        }
      }
      
      // 2.2 Récupérer les quotes quotidiennes
      const { data: dailyData } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'daily')
        .order('createdAt', { ascending: false });
        
      const dailyQuotes = dailyData?.map(quote => ({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        createdAt: quote.createdAt,
        isFavorite: quote.is_favorite || false,
        source: quote.source || '',
        user_id: quote.user_id
      })) || [];
      
      // 3. Mettre à jour le cache
      this.setCache(allQuotes, dailyQuotes);
      
      console.log(`✅ ${allQuotes.length} quotes chargées depuis la DB`);
      return { quotes: allQuotes, dailyQuotes };
    } catch (error) {
      console.error('❌ Erreur lors du chargement des quotes:', error);
      
      // Renvoyer le cache même s'il est expiré (meilleur que rien)
      if (this.cache) {
        console.log('⚠️ Utilisation du cache expiré (fallback)');
        return { 
          quotes: this.cache.quotes,
          dailyQuotes: this.cache.dailyQuotes
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Réinitialiser le cache (à appeler après des modifications)
   */
  static resetCache(): void {
    console.log('🗑️ Réinitialisation du cache de quotes');
    this.cache = null;
    localStorage.removeItem(CACHE_KEY);
  }
  
  /**
   * Vérifier si le cache est valide
   */
  private static isCacheValid(): boolean {
    if (!this.cache) return false;
    
    const now = Date.now();
    const isExpired = now - this.cache.lastFetchTime > this.cache.expiresIn;
    
    return !isExpired;
  }
  
  /**
   * Mettre à jour le cache
   */
  private static setCache(quotes: Quote[], dailyQuotes: Quote[]): void {
    this.cache = {
      quotes,
      dailyQuotes,
      lastFetchTime: Date.now(),
      expiresIn: CACHE_EXPIRY
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('⚠️ Impossible de stocker le cache dans localStorage:', error);
    }
  }
  
  /**
   * Charger le cache depuis le stockage
   */
  private static loadCacheFromStorage(): void {
    if (this.cache) return;
    
    try {
      const storedCache = localStorage.getItem(CACHE_KEY);
      if (storedCache) {
        this.cache = JSON.parse(storedCache);
        console.log('📚 Cache chargé depuis localStorage, quotes:', this.cache.quotes.length);
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement du cache:', error);
      this.cache = null;
    }
  }
}

export default OptimizedQuoteService;
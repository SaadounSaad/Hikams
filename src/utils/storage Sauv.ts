import { supabase } from '../lib/supabase';
import { Quote } from '../types';
import { quotesDB, QuotesDB } from './quotesDB';

// Interface pour les notes de citations
export interface QuoteNote {
  id: string;
  quote_id: string;
  user_id: string;
  content: string;
  category: 'réflexion' | 'action' | 'objectif';
  createdAt: string;
  updated_at: string;
  reminder_date?: string;
  completed: boolean;
}

class Storage {
  // ✅ SYSTÈME HYBRIDE : Cache Mémoire + IndexedDB
  private quotesCache: Quote[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en mémoire
  private cacheUserId: string | null = null;

  private async ensureConnection(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Erreur de session:', error);
        return false; // Mode dégradé au lieu d'exception
      }
      
      if (!session) {
        // Tentative de refresh avec gestion d'erreur
        try {
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          return !!refreshedSession;
        } catch (refreshError) {
          console.warn('Impossible de rafraîchir la session:', refreshError);
          return false; // Continuer en mode non authentifié
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur critique de connexion:', error);
      return false; // Fallback gracieux
    }
  }

  // ✅ INVALIDATION DU CACHE MÉMOIRE
  private invalidateMemoryCache(): void {
    console.log('🗑️ Cache mémoire invalidé');
    this.quotesCache = null;
    this.cacheTimestamp = 0;
    this.cacheUserId = null;
  }

  // ✅ VÉRIFICATION DE LA VALIDITÉ DU CACHE MÉMOIRE
  private async isMemoryCacheValid(): Promise<boolean> {
    if (!this.quotesCache) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== this.cacheUserId) {
      this.invalidateMemoryCache();
      return false;
    }

    const now = Date.now();
    const isExpired = (now - this.cacheTimestamp) > this.CACHE_DURATION;
    
    if (isExpired) {
      console.log('⏰ Cache mémoire expiré');
      this.invalidateMemoryCache();
      return false;
    }

    return true;
  }

  // ✅ APPLICATION DU TRI
  private applySorting(quotes: Quote[], sortOrder: 'newest' | 'oldest' | 'scheduled' | 'random'): Quote[] {
    const sortedQuotes = [...quotes];

    switch (sortOrder) {
      case 'newest':
        return sortedQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sortedQuotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'scheduled':
        return sortedQuotes.sort((a, b) => {
          const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
          const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
          if (dateA === dateB) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return dateA - dateB;
        });
      case 'random':
        return sortedQuotes.sort(() => Math.random() - 0.5);
      default:
        return sortedQuotes;
    }
  }

  // ✅ CHARGEMENT DEPUIS SUPABASE
  private async loadAllQuotesFromSupabase(sortOrder: 'newest' | 'oldest' | 'scheduled' | 'random' = 'scheduled'): Promise<Quote[]> {
    console.time('Chargement citations depuis Supabase');
    console.log('🔄 Chargement de TOUTES les citations depuis Supabase...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 🚀 SOLUTION : Charger par pages pour éviter les limites Supabase
    let allQuotes: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id);

      // Application du tri selon l'ordre demandé
      switch (sortOrder) {
        case 'newest':
          query = query.order('createdAt', { ascending: false });
          break;
        case 'oldest':
          query = query.order('createdAt', { ascending: true });
          break;
        case 'scheduled':
          query = query
            .order('scheduled_date', { ascending: true, nullsFirst: false })
            .order('createdAt', { ascending: true });
          break;
        case 'random':
          query = query.order('createdAt', { ascending: true });
          break;
      }

      // Pagination
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur chargement page', page, ':', error);
        break;
      }

      if (data && data.length > 0) {
        allQuotes = [...allQuotes, ...data];
        console.log(`📄 Page ${page + 1} chargée: ${data.length} citations (Total: ${allQuotes.length})`);
        
        // Si on a moins que pageSize, c'est la dernière page
        hasMore = data.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    console.timeEnd('Chargement citations depuis Supabase');

    // Transformation des données
    const quotes = allQuotes.map(quote => ({
      id: quote.id,
      text: quote.text,
      category: quote.category,
      source: quote.source || '',
      isFavorite: quote.is_favorite,
      createdAt: quote.createdAt,
      scheduledDate: quote.scheduled_date,
      ordre: quote.ordre || 0
    }));

    console.log(`✅ ${quotes.length} citations chargées depuis Supabase`);
    return quotes;
  }

  async getQuotesCount(): Promise<number> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - getQuotesCount');
        // Fallback vers IndexedDB
        try {
          const quotes = await quotesDB.getQuotes();
          return quotes.length;
        } catch {
          return 0;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error counting quotes:', error);
      return 0;
    }
  }

  // ✅ FONCTION PRINCIPALE AVEC INDEXEDDB + CACHE MÉMOIRE
  async getQuotes(sortOrder: 'newest' | 'oldest' | 'scheduled' | 'random' = 'scheduled'): Promise<Quote[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Mode non authentifié : essayer IndexedDB
        try {
          console.log('👤 Mode non authentifié : tentative IndexedDB');
          return await quotesDB.getQuotes();
        } catch {
          return [];
        }
      }

      // ✅ NIVEAU 1 : CACHE MÉMOIRE (ultra-rapide)
      if (await this.isMemoryCacheValid()) {
        console.log('⚡ Utilisation du cache mémoire (ultra-rapide)');
        return this.applySorting(this.quotesCache!, sortOrder);
      }

      // ✅ NIVEAU 2 : INDEXEDDB (rapide + persistant)
      const needsSync = await quotesDB.needsSync(user.id, 24); // 24h
      
      if (!needsSync) {
        console.log('📦 Chargement depuis IndexedDB (rapide + hors-ligne)');
        const quotes = await quotesDB.getQuotes();
        
        // Mettre en cache mémoire pour les prochains accès
        this.quotesCache = quotes;
        this.cacheTimestamp = Date.now();
        this.cacheUserId = user.id;
        
        return this.applySorting(quotes, sortOrder);
      }

      // ✅ NIVEAU 3 : SUPABASE (synchronisation)
      const isConnected = await this.ensureConnection();
      
      if (!isConnected) {
        // Mode hors-ligne : utiliser IndexedDB même si sync nécessaire
        console.log('📡 Mode hors-ligne : utilisation des données IndexedDB');
        try {
          const quotes = await quotesDB.getQuotes();
          return this.applySorting(quotes, sortOrder);
        } catch (error) {
          console.error('❌ Erreur IndexedDB en mode hors-ligne:', error);
          return [];
        }
      }

      // Synchronisation depuis Supabase
      console.log('🔄 Synchronisation depuis Supabase vers IndexedDB...');
      const quotes = await this.loadAllQuotesFromSupabase(sortOrder);
      
      // ✅ STOCKER DANS INDEXEDDB
      try {
        await quotesDB.storeQuotes(quotes, user.id);
        console.log('💾 Données synchronisées dans IndexedDB');
      } catch (error) {
        console.error('❌ Erreur stockage IndexedDB:', error);
        // Continuer même si le stockage échoue
      }
      
      // ✅ METTRE EN CACHE MÉMOIRE
      this.quotesCache = quotes;
      this.cacheTimestamp = Date.now();
      this.cacheUserId = user.id;
      
      return this.applySorting(quotes, sortOrder);

    } catch (error) {
      console.error('Error fetching quotes:', error);
      
      // ✅ FALLBACK ULTIME : INDEXEDDB
      try {
        console.log('🆘 Fallback vers IndexedDB');
        const quotes = await quotesDB.getQuotes();
        return this.applySorting(quotes, sortOrder);
      } catch (dbError) {
        console.error('❌ Erreur fallback IndexedDB:', dbError);
        return [];
      }
    }
  }

  private getSortColumn(sortOrder: string): string {
    switch (sortOrder) {
      case 'newest': return 'createdAt';
      case 'oldest': return 'createdAt';
      case 'scheduled': return 'scheduled_date';
      default: return 'createdAt';
    }
  }

  async updateBookmark(category: string, pageIndex: number): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - updateBookmark');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
    
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('bookmarks')
        .eq('user_id', user.id)
        .single();
    
      const currentBookmarks = data?.bookmarks || {};
      currentBookmarks[category] = pageIndex;
    
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ bookmarks: currentBookmarks })
        .eq('user_id', user.id);
    
      if (updateError) {
        console.error('Erreur mise à jour bookmarks:', updateError);
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  }

  async saveQuote(quote: Quote): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - saveQuote');
        throw new Error('Authentification requise pour sauvegarder');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('quotes').insert({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source,
        is_favorite: quote.isFavorite,
        createdAt: quote.createdAt,
        scheduled_date: quote.scheduledDate,
        user_id: user.id,
      });

      if (error) {
        console.error('Error details:', error);
        throw new Error('Erreur lors de la sauvegarde de la citation');
      }

      // ✅ INVALIDER TOUS LES CACHES APRÈS MODIFICATION
      this.invalidateMemoryCache();
      await quotesDB.forceSync();
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
    }
  }

  async updateQuote(quote: Quote): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - updateQuote');
        throw new Error('Authentification requise pour modifier');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quotes')
        .update({
          text: quote.text,
          category: quote.category,
          source: quote.source,
          is_favorite: quote.isFavorite,
          scheduled_date: quote.scheduledDate,
        })
        .eq('id', quote.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // ✅ INVALIDER TOUS LES CACHES APRÈS MODIFICATION
      this.invalidateMemoryCache();
      await quotesDB.forceSync();
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  }

  async deleteQuote(id: string): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - deleteQuote');
        throw new Error('Authentification requise pour supprimer');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // ✅ INVALIDER TOUS LES CACHES APRÈS MODIFICATION
      this.invalidateMemoryCache();
      await quotesDB.forceSync();
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  }

  async clearAllQuotes(): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - clearAllQuotes');
        throw new Error('Authentification requise pour supprimer');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // ✅ INVALIDER TOUS LES CACHES APRÈS MODIFICATION
      this.invalidateMemoryCache();
      await quotesDB.clearAll();
    } catch (error) {
      console.error('Error clearing quotes:', error);
      throw error;
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - toggleFavorite');
        throw new Error('Authentification requise pour modifier les favoris');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('is_favorite')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('quotes')
        .update({ is_favorite: !data.is_favorite })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // ✅ INVALIDER TOUS LES CACHES APRÈS MODIFICATION
      this.invalidateMemoryCache();
      await quotesDB.forceSync();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  async getDailyQuotes(): Promise<Quote[]> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - getDailyQuotes');
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Obtenir la date du jour à minuit dans le fuseau horaire local
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Obtenir la date de demain à minuit dans le fuseau horaire local
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Ajuster pour le fuseau horaire UTC
      const todayUTC = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const tomorrowUTC = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000));

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', todayUTC.toISOString())
        .lt('scheduled_date', tomorrowUTC.toISOString())
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      return data.map(quote => ({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source || '',
        isFavorite: quote.is_favorite,
        createdAt: quote.createdAt,
        scheduledDate: quote.scheduled_date,
      }));
    } catch (error) {
      console.error('Error fetching daily quotes:', error);
      return [];
    }
  }

  // ✅ NOUVELLES MÉTHODES INDEXEDDB
  
  /**
   * Force une synchronisation complète
   */
  async forceSync(): Promise<void> {
    console.log('🔄 Synchronisation forcée...');
    this.invalidateMemoryCache();
    await quotesDB.forceSync();
    // Recharger immédiatement
    await this.getQuotes();
  }

  /**
   * Obtient les statistiques des caches
   */
  async getCacheStats(): Promise<{
    memoryCache: { isActive: boolean; age: number; size: number };
    indexedDB: any;
  }> {
    const memoryCache = {
      isActive: !!this.quotesCache,
      age: this.quotesCache ? Date.now() - this.cacheTimestamp : 0,
      size: this.quotesCache ? this.quotesCache.length : 0
    };

    const indexedDBStats = await quotesDB.getStats();

    return {
      memoryCache,
      indexedDB: indexedDBStats
    };
  }

  /**
   * Recherche dans les citations (utilise IndexedDB si disponible)
   */
  async searchQuotes(searchTerm: string): Promise<Quote[]> {
    try {
      // Essayer d'abord IndexedDB pour la rapidité
      return await quotesDB.searchQuotes(searchTerm);
    } catch (error) {
      console.error('Erreur recherche IndexedDB:', error);
      // Fallback vers le cache mémoire ou Supabase
      const quotes = await this.getQuotes();
      const term = searchTerm.toLowerCase();
      return quotes.filter(quote => 
        quote.text.toLowerCase().includes(term) ||
        quote.category.toLowerCase().includes(term) ||
        (quote.source && quote.source.toLowerCase().includes(term))
      );
    }
  }

  // ✅ MÉTHODES NOTES (inchangées)
  async getQuoteNotes(quoteId: string): Promise<QuoteNote[]> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - getQuoteNotes');
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('quote_notes')
        .select('*')
        .eq('quote_id', quoteId)
        .eq('user_id', user.id)
        .order('createdAt', { ascending: false });
        
      if (error) {
        console.error('Error fetching quote notes:', error);
        return [];
      }
      
      return data as QuoteNote[];
    } catch (error) {
      console.error('Error fetching quote notes:', error);
      return [];
    }
  }
  
  async saveQuoteNote(note: Omit<QuoteNote, 'id' | 'createdAt' | 'updated_at' | 'user_id'>): Promise<QuoteNote> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - saveQuoteNote');
        throw new Error('Authentification requise pour sauvegarder une note');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('quote_notes')
        .insert({
          ...note,
          user_id: user.id,
          createdAt: now,
          updated_at: now,
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error saving quote note:', error);
        throw new Error('Erreur lors de la sauvegarde de la note');
      }
      
      return data as QuoteNote;
    } catch (error) {
      console.error('Error saving quote note:', error);
      throw error;
    }
  }
  
  async updateQuoteNote(noteId: string, updates: Partial<Omit<QuoteNote, 'id' | 'quote_id' | 'user_id' | 'createdAt'>>): Promise<QuoteNote> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - updateQuoteNote');
        throw new Error('Authentification requise pour modifier une note');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('quote_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating quote note:', error);
        throw new Error('Erreur lors de la mise à jour de la note');
      }
      
      return data as QuoteNote;
    } catch (error) {
      console.error('Error updating quote note:', error);
      throw error;
    }
  }
  
  async deleteQuoteNote(noteId: string): Promise<void> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - deleteQuoteNote');
        throw new Error('Authentification requise pour supprimer une note');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quote_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error deleting quote note:', error);
        throw new Error('Erreur lors de la suppression de la note');
      }
    } catch (error) {
      console.error('Error deleting quote note:', error);
      throw error;
    }
  }
  
  async getDueNoteReminders(): Promise<(QuoteNote & { quote?: Quote })[]> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - getDueNoteReminders');
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Obtenir la date du jour à minuit dans le fuseau horaire local
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Ajuster pour le fuseau horaire UTC
      const todayUTC = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));

      const { data, error } = await supabase
        .from('quote_notes')
        .select(`
          *,
          quotes:quote_id (
            id,
            text,
            category,
            source
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .not('reminder_date', 'is', null)
        .lte('reminder_date', todayUTC.toISOString())
        .order('reminder_date', { ascending: true });
        
      if (error) {
        console.error('Error fetching due note reminders:', error);
        return [];
      }
      
      return data.map(item => ({
        ...item,
        quote: item.quotes ? {
          id: item.quotes.id,
          text: item.quotes.text,
          category: item.quotes.category,
          source: item.quotes.source || '',
          isFavorite: false,
          createdAt: '',
          scheduledDate: null,
        } : undefined
      })) as (QuoteNote & { quote?: Quote })[];
    } catch (error) {
      console.error('Error fetching due note reminders:', error);
      return [];
    }
  }
}

export const storage = new Storage();


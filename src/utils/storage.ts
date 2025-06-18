import { supabase } from '../lib/supabase';
import { Quote } from '../types';

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

  async getQuotesCount(): Promise<number> {
    try {
      const isConnected = await this.ensureConnection();
      if (!isConnected) {
        console.warn('Fonctionnement en mode non authentifié - getQuotesCount');
        return 0;
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

  // Dans votre storage.ts actuel, juste optimiser la requête
// Méthode getQuotes() CORRIGÉE - Version sans erreur TypeScript
async getQuotes(sortOrder: 'newest' | 'oldest' | 'scheduled' | 'random' = 'scheduled'): Promise<Quote[]> {
  try {
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      console.warn('Fonctionnement en mode non authentifié - getQuotes');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    console.time('Chargement citations optimisé');

    // 🚀 UNE SEULE REQUÊTE au lieu de la boucle while
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
        // ✅ CORRIGÉ : nullsFirst au lieu de nullsLast
        query = query
          .order('scheduled_date', { ascending: true, nullsFirst: false })
          .order('createdAt', { ascending: true });
        break;
      case 'random':
        // Pour random, on récupère tout et on mélange côté client
        query = query.order('createdAt', { ascending: true });
        break;
    }

    const { data, error } = await query;
    
    console.timeEnd('Chargement citations optimisé');

    if (error) {
      console.error('Erreur lors du chargement:', error);
      throw error;
    }

    // Transformation des données
    const quotes = (data || []).map(quote => ({
      id: quote.id,
      text: quote.text,
      category: quote.category,
      source: quote.source || '',
      isFavorite: quote.is_favorite,
      createdAt: quote.createdAt,
      scheduledDate: quote.scheduled_date,
    }));

    console.log(`📊 ${quotes.length} citations chargées avec succès`);

    // Mélange aléatoire si demandé
    return sortOrder === 'random' ? 
      quotes.sort(() => Math.random() - 0.5) : quotes;

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
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
          quotes:quote_id (id, text, category, source)
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .lte('reminder_date', todayUTC.toISOString())
        .order('reminder_date', { ascending: true });
        
      if (error) {
        console.error('Error fetching due reminders:', error);
        return [];
      }
      
      return data.map(item => ({
        ...item,
        quote: item.quotes ? {
          id: item.quotes.id,
          text: item.quotes.text,
          category: item.quotes.category,
          source: item.quotes.source || '',
          isFavorite: true, // Cette valeur n'est pas utilisée directement depuis les reminders
          createdAt: '', // Cette valeur n'est pas utilisée directement depuis les reminders
          scheduledDate: '', // Cette valeur n'est pas utilisée directement depuis les reminders
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching due reminders:', error);
      return [];
    }
  }
}

export const storage = new Storage();


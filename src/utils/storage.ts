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
  private async ensureConnection() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Si pas de session, on essaie de rafraîchir
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (!refreshedSession) {
          throw new Error('Session expirée');
        }
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw new Error('Problème de connexion à la base de données');
    }
  }

  async getQuotesCount(): Promise<number> {
    try {
      await this.ensureConnection();
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

  async getQuotes(sortOrder: 'newest' | 'oldest' | 'scheduled' | 'random' = 'scheduled'): Promise<Quote[]> {
    try {
      await this.ensureConnection();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
  
      const pageSize = 1000;
      let page = 0;
      let allData: any[] = [];
      let hasMore = true;
  
      while (hasMore) {
        let query = supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user.id)
          .range(page * pageSize, (page + 1) * pageSize - 1);
  
        switch (sortOrder) {
          case 'newest':
            query = query.order('createdAt', { ascending: false });
            break;
          case 'oldest':
            query = query.order('createdAt', { ascending: true });
            break;
          case 'scheduled':
            query = query
              .order('scheduled_date', { ascending: true, nullsLast: true } as any)
              .order('createdAt', { ascending: true });
            break;
        }
  
        const { data, error } = await query;
        if (error) throw error;
  
        allData = [...allData, ...data];
        hasMore = data.length === pageSize;
        page++;
      }
  
      const quotes = allData.map(quote => ({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source || '',
        isFavorite: quote.is_favorite,
        createdAt: quote.createdAt,
        scheduledDate: quote.scheduled_date,
      }));
  
      return sortOrder === 'random' ? quotes.sort(() => Math.random() - 0.5) : quotes;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  }
  async updateBookmark(category: string, pageIndex: number): Promise<void> {
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
  }
  

  async saveQuote(quote: Quote): Promise<void> {
    try {
      await this.ensureConnection();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('quotes').insert({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source,
        is_favorite: quote.isFavorite,
        createdAt: quote.createdAt,
        scheduled_date: quote.scheduled_date,
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
      await this.ensureConnection();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quotes')
        .update({
          text: quote.text,
          category: quote.category,
          source: quote.source,
          is_favorite: quote.isFavorite,
          scheduled_date: quote.scheduled_date,
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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

      // Dans storage.ts, méthode getDailyQuotes()
      return data.map(quote => ({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source || '',
        isFavorite: quote.is_favorite, // Vérifiez que cette ligne existe et est correcte
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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
      await this.ensureConnection();
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
import { supabase } from '../lib/supabase';
import { Quote } from '../types';

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

      let query = supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id);

      switch (sortOrder) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
          case 'scheduled':
            query = query
              .order('scheduled_date', { ascending: true, nullsLast: true } as any)
              .order('created_at', { ascending: true });
            break;
      }

      const { data, error } = await query;

      if (error) throw error;

      const quotes = data.map(quote => ({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source || '',
        isFavorite: quote.is_favorite,
        createdAt: quote.created_at,
        scheduledDate: quote.scheduled_date,
      }));

      return sortOrder === 'random' ? quotes.sort(() => Math.random() - 0.5) : quotes;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
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
        created_at: quote.createdAt,
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

      return data.map(quote => ({
        id: quote.id,
        text: quote.text,
        category: quote.category,
        source: quote.source || '',
        isFavorite: quote.is_favorite,
        createdAt: quote.created_at,
        scheduledDate: quote.scheduled_date,
      }));
    } catch (error) {
      console.error('Error fetching daily quotes:', error);
      return [];
    }
  }
}

export const storage = new Storage();
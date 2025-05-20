// src/services/quoteNotesService.ts
import { supabase } from '../lib/supabase';

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

export const quoteNotesService = {
  async getNotes(quoteId: string): Promise<QuoteNote[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('quote_notes')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });
      
    if (error) {
      console.error('Erreur lors de la récupération des notes :', error);
      throw error;
    }
    
    return data as QuoteNote[];
  },
  
  async addNote(note: Omit<QuoteNote, 'id' | 'createdAt' | 'updated_at' | 'user_id'>): Promise<QuoteNote> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('quote_notes')
      .insert({
        ...note,
        user_id: userId
      })
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de l\'ajout de la note :', error);
      throw error;
    }
    
    return data as QuoteNote;
  },
  
  async updateNote(id: string, updates: Partial<Omit<QuoteNote, 'id' | 'quote_id' | 'user_id' | 'createdAt'>>): Promise<QuoteNote> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('quote_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la mise à jour de la note :', error);
      throw error;
    }
    
    return data as QuoteNote;
  },
  
  async deleteNote(id: string): Promise<void> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { error } = await supabase
      .from('quote_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Erreur lors de la suppression de la note :', error);
      throw error;
    }
  },
  
  async checkDueReminders(): Promise<QuoteNote[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('quote_notes')
      .select(`
        *,
        quotes:quote_id (id, text, source, category)
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .lte('reminder_date', today.toISOString())
      .order('reminder_date', { ascending: true });
      
    if (error) {
      console.error('Erreur lors de la récupération des rappels :', error);
      return [];
    }
    
    return data as (QuoteNote & { quotes: { id: string; text: string; source: string; category: string } })[];
  }
};
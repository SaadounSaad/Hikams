// bookmarkService.ts - Service pour gérer les signets
import { supabase } from '../lib/supabase';

// Lors de la sauvegarde d'un bookmark, utiliser category_id
export const updateBookmark = async (bookTitle: string, index: number) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return;
    }
    
    if (!authData.user) {
      console.warn('Utilisateur non connecté');
      return;
    }
    
    // Rechercher un bookmark existant
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('category_id', bookTitle) // Utiliser category_id comme indiqué dans votre structure
      .eq('user_id', authData.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la vérification du signet:', error);
      return;
    }
    
    if (data) {
      // Mise à jour d'un signet existant
      const { error: updateError } = await supabase
        .from('bookmarks')
        .update({ 
          index,
          updated_at: new Date().toISOString() // Mettre à jour le timestamp
        })
        .eq('id', data.id);
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour du signet:', updateError);
      }
    } else {
      // Création d'un nouveau signet
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: authData.user.id,
          category_id: bookTitle, // Utiliser category_id pour stocker le titre du livre
          index,
          createdAt: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Erreur lors de la création du signet:', insertError);
      }
    }
  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
};

// Lors de la récupération d'un bookmark
export const getSavedPageIndex = async (bookTitle: string): Promise<number | null> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return null;
    }
    
    if (!authData.user) {
      console.warn('Utilisateur non connecté');
      return null;
    }
    
    const { data, error } = await supabase
      .from('bookmarks')
      .select('index')
      .eq('category_id', bookTitle) // Utiliser category_id comme indiqué dans votre structure
      .eq('user_id', authData.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la récupération du signet:', error);
      return null;
    }
    
    return data ? data.index : null;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return null;
  }
};
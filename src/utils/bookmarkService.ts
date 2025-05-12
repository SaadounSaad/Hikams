// src/utils/bookmarkService.ts
import { supabase } from '../lib/supabase';

const TABLE_NAME = 'bookmarks';

export async function updateBookmark(categoryId: string, index: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Vérifie si un bookmark existe déjà
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      // Mise à jour du bookmark existant
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ index })
        .eq('id', data.id);

      if (updateError) throw updateError;
    } else {
      // Création d’un nouveau bookmark
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert({
          user_id: user.id,
          category_id: categoryId,
          index,
        });

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Erreur updateBookmark:', error);
  }
}

export async function getSavedPageIndex(categoryId: string): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('index')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (error) throw error;

    return data?.index ?? 0;
  } catch (error) {
    console.error('Erreur getSavedPageIndex:', error);
    return 0;
  }
}

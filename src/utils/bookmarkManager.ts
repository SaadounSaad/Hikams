// src/utils/bookmarkManager.ts
import { supabase } from '../lib/supabase';

const TABLE_NAME = 'bookmarks';

export async function saveBookmark(categoryId: string, index: number): Promise<void> {
  try {
    localStorage.setItem(`bookmark_${categoryId}`, index.toString());

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (data) {
      await supabase.from(TABLE_NAME).update({ index }).eq('id', data.id);
    } else {
      await supabase.from(TABLE_NAME).insert({
        user_id: user.id,
        category_id: categoryId,
        index
      });
    }
  } catch (error) {
    console.warn('Erreur saveBookmark (fallback local)', error);
  }
}

export async function getBookmark(categoryId: string): Promise<number> {
  try {
    const local = localStorage.getItem(`bookmark_${categoryId}`);
    if (local) return parseInt(local, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('index')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .maybeSingle();

    if (error) throw error;

    const index = data?.index ?? 0;
    localStorage.setItem(`bookmark_${categoryId}`, index.toString());
    return index;
  } catch (error) {
    console.warn('Erreur getBookmark (fallback local)', error);
    return parseInt(localStorage.getItem(`bookmark_${categoryId}`) || '0', 10);
  }
}

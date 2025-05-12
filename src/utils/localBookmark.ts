// src/utils/localBookmark.ts

const LOCAL_KEY = 'hikams_bookmarks';

interface LocalBookmarks {
  [categoryId: string]: number;
}

export function saveLocalBookmark(categoryId: string, index: number): void {
  try {
    const bookmarksStr = localStorage.getItem(LOCAL_KEY);
    const bookmarks: LocalBookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : {};
    bookmarks[categoryId] = index;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Erreur lors de l’enregistrement du bookmark local :', error);
  }
}

export function getLocalBookmark(categoryId: string): number {
  try {
    const bookmarksStr = localStorage.getItem(LOCAL_KEY);
    const bookmarks: LocalBookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : {};
    return bookmarks[categoryId] ?? 0;
  } catch (error) {
    console.error('Erreur lors de la lecture du bookmark local :', error);
    return 0;
  }
}

export function clearLocalBookmark(categoryId: string): void {
  try {
    const bookmarksStr = localStorage.getItem(LOCAL_KEY);
    if (!bookmarksStr) return;
    const bookmarks: LocalBookmarks = JSON.parse(bookmarksStr);
    delete bookmarks[categoryId];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Erreur lors de la suppression du bookmark local :', error);
  }
}

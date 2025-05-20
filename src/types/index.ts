// src/types/index.ts - Types étendus pour les favoris unifiés

// 🔄 Interface Quote étendue - maintenant cohérente avec la DB
export interface Quote {
  id: string;
  text: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;         // ✅ Maintenant cohérent avec la DB
  source?: string;           // Source de la citation (pour les quotes normales)
  user_id?: string;          // ID de l'utilisateur (pour les quotes stockées en DB)
 
  // Nouvelles propriétés pour les favoris de livre
  isBookEntry?: boolean;     // Indique si c'est un favori de livre
  originalEntryId?: number;  // ID original de l'entrée dans le livre
  bookTitle?: string;        // Titre du livre source
  ordre?: number;            // Ordre/position dans le livre
}

// Interface pour les catégories
export interface Category {
  id: string;
  name: string;
  icon?: string;
  isDefault?: boolean;
}

// Interface pour les favoris de livre - mise à jour
export interface BookFavorite {
  id: string;
  entry_id: number;
  book_title: string;
  user_id: string;
  createdAt: string;         // ✅ Maintenant cohérent avec la DB
  content?: string;          // Contenu de l'entrée
  ordre?: number;            // Ordre de l'entrée
  book_entries?: {           // Relation avec la table book_entries
    content: string;
    ordre: number;
  };
}

// Interface pour les entrées de livre
export interface BookEntry {
  id: number;
  content: string;
  ordre: number;
  book_title: string;
}

// Type pour distinguer les sources de favoris
export type FavoriteSource = 'quote' | 'book-entry';

// Interface pour les props du viewer unifié
export interface UnifiedQuoteViewerProps {
  quotes: Quote[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  selectedCategory: string;
  onToggleFavorite: (id: string) => void;
  onEdit?: (quote: Quote) => void;
  onDelete?: (id: string) => void;
  onNavigateToBook?: (bookTitle: string, ordre: number) => void;
}

// Interface pour le contexte des favoris
export interface FavoritesContextType {
  favorites: BookFavorite[];
  isLoading: boolean;
  error: string | null;
  addFavorite: (entryId: number, bookTitle: string) => Promise<boolean>;
  removeFavorite: (favoriteId: string) => Promise<boolean>;
  isFavorite: (entryId: number) => boolean;
  getFavoriteId: (entryId: number) => string | null;
  refreshFavorites: () => Promise<void>;
  clearError: () => void;
}
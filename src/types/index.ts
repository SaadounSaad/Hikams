// src/types/index.ts - Types étendus pour résoudre toutes les erreurs

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
  
  // Propriétés pour les notifications et autres fonctionnalités
  scheduledDate?: string;    // Date programmée pour les notifications
  scheduled_date?: string;   // Version snake_case pour compatibilité DB
  theme?: string;            // Thème associé à la quote
  is_favorite?: boolean;     // Version snake_case alternative pour isFavorite
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

// Interface pour les entrées de livre - ÉTENDUE
export interface BookEntry {
  id: number | string;       // ✅ Accepte string ou number pour compatibilité
  content: string;
  ordre: number;
  book_title: string;
  createdAt?: string;        // ✅ Ajouté pour compatibilité
  isFavorite?: boolean;      // ✅ Ajouté pour compatibilité
  category?: string;         // ✅ Ajouté pour compatibilité
  
  // Propriétés supplémentaires pour les pages
  chapter_title?: string;    // ✅ Titre du chapitre
  page_number?: number;      // ✅ Numéro de page
}

// Type pour distinguer les sources de favoris - CORRIGÉ
export type FavoriteSource = 'quote' | 'book-entry'; // ✅ Tiret au lieu de underscore
export type ContentType = FavoriteSource; // ✅ Alias pour compatibilité

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

// Interface pour le contexte des favoris - MISE À JOUR
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
  
  // Propriétés supplémentaires pour compatibilité avec les pages
  quotes?: Quote[];          // ✅ Pour FavoritesPage
  bookEntries?: BookEntry[]; // ✅ Pour FavoritesPage
}

// Interface pour les résultats des favoris
export interface FavoritesResult {
  quotes: Quote[];
  bookEntries: BookEntry[];
}

// Interface Theme pour les thèmes - CORRIGÉE
export interface Theme {
  id: string;
  name: string;
  primary: string;           // ✅ Propriété primary requise
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  isDark: boolean;
}

// Types pour les notifications - ÉTENDUS
declare global {
  interface NotificationOptions {
    vibrate?: number[] | number; // ✅ Propriété vibrate ajoutée
    actions?: NotificationAction[];
    data?: any;
    dir?: NotificationDirection;
    image?: string;
    lang?: string;
    sticky?: boolean;
  }

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }


}

// Types pour les services - NOUVEAUX
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isFavorite?: boolean; // ✅ Pour useFavorites
}

// Interface pour les props de FavoriteButton - CORRIGÉE
export interface FavoriteButtonProps {
  contentId: string;         // ✅ Toujours string
  contentType: ContentType;  // ✅ Utilise le bon type
  initialIsFavorite?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

// Types pour la recherche vocale (réexportés)
export * from './speech-recognition-extended';

// Export de types utilitaires
export type ItemType = Quote | BookEntry;
export type ItemWithType = {
  type: 'quote' | 'book-entry';
  item: ItemType;
};

// Export vide pour que ce fichier soit traité comme un module
export {};
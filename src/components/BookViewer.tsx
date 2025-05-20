// BookViewer.tsx avec ajout de contrôles de taille de texte
import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Bookmark, Heart, Plus, Minus } from 'lucide-react';
import BookEntryCard from './BookEntryCard';
import { getSavedPageIndex, updateBookmark } from '../utils/bookmarkService';
import { supabase } from '../lib/supabase';



// Définition directe de l'interface BookEntry
interface BookEntry {
  id: number;
  content: string;
  ordre: number;
  book_title: string;
}

// Constante pour les tailles de texte (déplacée depuis BookEntryCard)
const FONT_SIZES = [
  { name: 'text-xl', size: '1.25rem', lineHeight: '2rem' },
  { name: 'text-2xl', size: '1.5rem', lineHeight: '2.5rem' },
  { name: 'text-3xl', size: '1.875rem', lineHeight: '2.75rem' },
  { name: 'text-4xl', size: '2.25rem', lineHeight: '3rem' },
  { name: 'text-5xl', size: '3rem', lineHeight: '3.5rem' },
];

interface BookViewerProps {
  entries: BookEntry[];
  bookTitle: string;
  onBack: () => void;
}

const BookViewer: React.FC<BookViewerProps> = ({ entries, bookTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarkIndex, setBookmarkIndex] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const isProcessingFavoriteRef = React.useRef(false);
  
  
  // Récupérer la taille sauvegardée ou utiliser la valeur par défaut (2)
  const textSizeKey = `text-size-${bookTitle}`;
  const [textSizeIndex, setTextSizeIndex] = useState(() => {
    const savedSize = localStorage.getItem(textSizeKey);
    return savedSize ? parseInt(savedSize, 10) : 2;
  });
  useEffect(() => {
    if (entries.length > 0) {
      // Important : utiliser bookTitle pour la cohérence avec les autres parties du code
      getSavedPageIndex(bookTitle).then((index) => {
        if (index != null && index < entries.length) setCurrentIndex(index);
        setBookmarkIndex(index);
      });
    }
  }, [entries, bookTitle]);

  // Vérification du statut de favori quand l'entrée change
  useEffect(() => {
    if (entries.length === 0) return;
    
    const checkFavorite = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) return;
        
        const { data, error } = await supabase
          .from('book_favorites')
          .select('id')
          .eq('entry_id', entries[currentIndex].id)
          .eq('user_id', authData.user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Erreur lors de la vérification des favoris:', error);
          return;
        }
        
        setFavoriteId(data?.id || null);
        setIsFavorite(!!data);
      } catch (error) {
        console.error('Erreur inattendue lors de la vérification des favoris:', error);
      }
    };
    
    checkFavorite();
  }, [currentIndex, entries]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (entries.length === 0) return;
    let newIndex = currentIndex;
    if (direction === 'left') {
      newIndex = currentIndex < entries.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : entries.length - 1;
    }
    setCurrentIndex(newIndex);
  };

  

  const handleBookmark = async () => {
    // Important : utiliser bookTitle pour la cohérence
    await updateBookmark(bookTitle, currentIndex);
    setBookmarkIndex(currentIndex);
  };
  

  // Fonctions pour ajuster la taille du texte
const increaseSize = () => {
    const newSize = Math.min(FONT_SIZES.length - 1, textSizeIndex + 1);
    setTextSizeIndex(newSize);
    localStorage.setItem(textSizeKey, newSize.toString());
  };
  
  const decreaseSize = () => {
    const newSize = Math.max(0, textSizeIndex - 1);
    setTextSizeIndex(newSize);
    localStorage.setItem(textSizeKey, newSize.toString());
  };
  // Fonction pour basculer le statut favori
  const toggleFavorite = useCallback(async () => {
    if (entries.length === 0 || isProcessingFavoriteRef.current) return;
    isProcessingFavoriteRef.current = true;
    
    const currentEntry = entries[currentIndex];
    const newState = !isFavorite;
    setIsFavorite(newState);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error('Erreur d\'authentification: ' + authError.message);
      }
      
      if (!authData.user) {
        throw new Error('Utilisateur non connecté');
      }
      
      if (newState) {
        // Ajouter aux favoris
        const { data, error } = await supabase
          .from('book_favorites')
          .insert({
            entry_id: currentEntry.id,
            book_title: bookTitle,
            user_id: authData.user.id,
            createdAt: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (error) {
          throw new Error('Erreur d\'ajout aux favoris: ' + error.message);
        }
        
        setFavoriteId(data.id);
      } else if (favoriteId) {
        // Retirer des favoris
        const { error } = await supabase
          .from('book_favorites')
          .delete()
          .eq('id', favoriteId)
          .eq('user_id', authData.user.id);
          
        if (error) {
          throw new Error('Erreur de suppression des favoris: ' + error.message);
        }
        
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setIsFavorite(!newState);
    } finally {
      isProcessingFavoriteRef.current = false;
    }
  }, [isFavorite, favoriteId, entries, currentIndex, bookTitle]);

  if (entries.length === 0) return <div className="text-center py-12 text-gray-500">Aucune entrée trouvée</div>;

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
         
          <button onClick={() => setCurrentIndex(0)} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button onClick={() => handleSwipe('right')} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {entries.length}
        </span>

        <div className="flex items-center gap-2">
          <button onClick={() => handleSwipe('left')} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentIndex(entries.length - 1)} className="p-2 rounded-full hover:bg-gray-200">
            <ChevronsRight className="w-5 h-5" />
          </button>
          
          {/* Contrôles de taille de texte */}
          <div className="flex items-center border-r border-l border-gray-200 px-2">
            <button onClick={decreaseSize} className="p-2 rounded-full hover:bg-gray-200">
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-1 text-xs font-medium">{FONT_SIZES[textSizeIndex].name.replace('text-', '')}</span>
            <button onClick={increaseSize} className="p-2 rounded-full hover:bg-gray-200">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Bouton Bookmark */}
          <button
            onClick={handleBookmark}
            title="Marquer cette page"
            className={`p-2 rounded-full ${
              bookmarkIndex === currentIndex 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Bookmark className="w-5 h-5" fill={bookmarkIndex === currentIndex ? "currentColor" : "none"} />
          </button>
          
          {/* Bouton Favori */}
          
        </div>
      </div>

      <BookEntryCard 
        entry={entries[currentIndex]} 
      />
    </div>
  );
};

export default BookViewer;
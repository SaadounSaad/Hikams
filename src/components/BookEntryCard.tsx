// BookEntryCard.tsx - Version corrigée avec le nouveau service unifié
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { PlayCircle, PauseCircle, Plus, Minus, X, Heart } from 'lucide-react';
import { useFavorites } from '../services/FavoritesServices'; // ← Utiliser le nouveau service
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext'; // ← Ajouter pour obtenir user


interface BookEntryCardProps {
  entry: {
    id: number;
    content: string;
    ordre: number;
    book_title: string;
    is_favorite?: boolean;
  };
  onFavoriteChange?: () => void; // ✅ nouveau
}

const FONT_SIZES = [
  { name: 'text-xl', size: '1.25rem', lineHeight: '2rem' },
  { name: 'text-2xl', size: '1.5rem', lineHeight: '2.5rem' },
  { name: 'text-3xl', size: '1.875rem', lineHeight: '2.75rem' },
  { name: 'text-4xl', size: '2.25rem', lineHeight: '3rem' },
  { name: 'text-5xl', size: '3rem', lineHeight: '3.5rem' },
] as const;

interface ScrollState {
  isReading: boolean;
  isScrolling: boolean;
  showControls: boolean;
  speed: number;
  progress: number;
}

interface UIState {
  textSizeIndex: number;
  hasScrollbar: boolean;
  hasResume: boolean;
}

interface BookmarkState {
  isBookmarked: boolean;
}
const BookEntryCard: React.FC<BookEntryCardProps> = ({ entry, onFavoriteChange }) => {
  // 🔥 NOUVEAU SERVICE UNIFIÉ
  const { user } = useAuth();
  const favoritesService = useFavorites(user?.id || '');

  // États locaux pour les favoris (synchronisé avec la DB)
  const [isFavorite, setIsFavorite] = useState(entry.is_favorite || false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);

  // États locaux pour les autres fonctionnalités
  const [bookmarkState, setBookmarkState] = useState<BookmarkState>({
    isBookmarked: false,
  });
  
  const [scrollState, setScrollState] = useState<ScrollState>({
    isReading: false,
    isScrolling: false,
    showControls: false,
    speed: 20,
    progress: 0,
  });
  
  const [uiState, setUiState] = useState<UIState>({
    textSizeIndex: 2,
    hasScrollbar: false,
    hasResume: false,
  });

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollSpeedRef = useRef(scrollState.speed);
  const lastTapTimeRef = useRef<number>(0);
  const isTouchActionRef = useRef(false);
  const animationIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Valeurs mémorisées
  const lastPositionKey = useMemo(() => 
    `scroll-pos-${entry.book_title}-${entry.id}`, 
    [entry.book_title, entry.id]
  );

  const textStyle = useMemo(() => ({
    fontSize: FONT_SIZES[uiState.textSizeIndex].size,
    lineHeight: FONT_SIZES[uiState.textSizeIndex].lineHeight,
  }), [uiState.textSizeIndex]);

  // Synchroniser l'état favori avec la prop entry
  useEffect(() => {
    setIsFavorite(entry.is_favorite || false);
  }, [entry.is_favorite]);

  // Vérifier l'état favori au chargement depuis la DB
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user?.id) return;
      
      try {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_id', entry.id.toString())
          .eq('content_type', 'book_entry')
          .single();

        const isInFavorites = !!data;
        setIsFavorite(isInFavorites);

        // Si incohérent avec la DB, mettre à jour
        if (isInFavorites !== entry.is_favorite) {
          await supabase
            .from('book_entries')
            .update({ is_favorite: isInFavorites })
            .eq('id', entry.id);
        }
      } catch (error) {
        // Erreur ignorée si pas de favori trouvé
      }
    };

    checkFavoriteStatus();
  }, [user?.id, entry.id, entry.is_favorite]);

  // Mise à jour de la ref de vitesse
  useEffect(() => {
    scrollSpeedRef.current = scrollState.speed;
  }, [scrollState.speed]);

  // Gestion des signets
  useEffect(() => {
    const checkBookmark = async () => {
      try {
        if (!user?.id) return;
        
        const { data } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('category_id', entry.book_title)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data && data.index === entry.ordre) {
          setBookmarkState({ isBookmarked: true });
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du signet:', error);
      }
    };
    
    checkBookmark();
  }, [entry.book_title, entry.ordre, user?.id]);

  // Restaurer la position sauvegardée
  useEffect(() => {
    const el = scrollRef.current;
    const saved = localStorage.getItem(lastPositionKey);
    if (el && saved) {
      const value = parseFloat(saved);
      el.scrollTop = value;
      if (value > 0) {
        setUiState(prev => ({ ...prev, hasResume: true }));
      }
    }
  }, [lastPositionKey]);

  // Sauvegarde automatique
  useEffect(() => {
    const savePosition = () => {
      const el = scrollRef.current;
      if (el && el.scrollTop > 0) {
        localStorage.setItem(lastPositionKey, el.scrollTop.toString());
      }
    };
    
    let saveInterval: NodeJS.Timeout | undefined;
    if (scrollState.isReading) {
      saveInterval = setInterval(savePosition, 10000);
    }
    
    return () => {
      savePosition();
      if (saveInterval) clearInterval(saveInterval);
    };
  }, [scrollState.isReading, lastPositionKey]);

  // Vérification de la barre de défilement améliorée
  useEffect(() => {
    const checkScrollbar = () => {
      const el = scrollRef.current;
      if (el) {
        requestAnimationFrame(() => {
          const realScroll = el.scrollHeight - el.clientHeight;
          const needsScrollbar = realScroll > 10;
          
          // Mettre à jour l'état et les styles CSS
          setUiState(prev => ({ ...prev, hasScrollbar: needsScrollbar }));
          
          // Appliquer directement les styles pour masquer/afficher la scrollbar
          if (needsScrollbar) {
            el.style.scrollbarWidth = 'thin';
            el.style.setProperty('--scrollbar-display', 'block');
          } else {
            el.style.scrollbarWidth = 'none';
            el.style.setProperty('--scrollbar-display', 'none');
          }
        });
      }
    };
    
    // Vérifier immédiatement et après un court délai pour le rendu
    checkScrollbar();
    const timeoutId = setTimeout(checkScrollbar, 100);
    
    if (scrollRef.current && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(checkScrollbar);
      resizeObserver.observe(scrollRef.current);
      return () => {
        resizeObserver.disconnect();
        clearTimeout(timeoutId);
      };
    } else {
      return () => clearTimeout(timeoutId);
    }
  }, [entry.content, uiState.textSizeIndex]);

  // Animation de défilement
  useEffect(() => {
    const scroll = (currentTime: number) => {
      const el = scrollRef.current;
      if (!scrollState.isScrolling || !el) {
        animationIdRef.current = null;
        lastTimestampRef.current = null;
        return;
      }

      const maxScroll = el.scrollHeight - el.clientHeight;
      
      if (lastTimestampRef.current !== null) {
        const elapsed = currentTime - lastTimestampRef.current;
        const pixelsToScroll = (elapsed * scrollSpeedRef.current) / 1000;

        el.scrollTop = Math.min(el.scrollTop + pixelsToScroll, maxScroll);

        if (maxScroll > 0) {
          setScrollState(prev => ({
            ...prev,
            progress: (el.scrollTop / maxScroll) * 100
          }));
        }

        if (el.scrollTop >= maxScroll) {
          setScrollState(prev => ({ ...prev, isScrolling: false }));
          animationIdRef.current = null;
          lastTimestampRef.current = null;
          return;
        }
      }
      
      lastTimestampRef.current = currentTime;
      animationIdRef.current = requestAnimationFrame(scroll);
    };

    if (scrollState.isScrolling) {
      lastTimestampRef.current = null;
      animationIdRef.current = requestAnimationFrame(scroll);
    }
    
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
        lastTimestampRef.current = null;
      }
    };
  }, [scrollState.isScrolling]);

  // Vérifier que le service est disponible avant de permettre le clic
  const isServiceReady = useMemo(() => {
    return user?.id && favoritesService && typeof favoritesService.toggleBookEntryFavorite === 'function';
  }, [user?.id, favoritesService]);

  // 🚀 GESTION UNIFIÉE DES FAVORIS avec vérifications
  const toggleFavorite = useCallback(async () => {
    if (isProcessingFavorite || !user?.id || !isServiceReady) {
      console.warn('⚠️ Service non prêt:', {
        isProcessingFavorite,
        hasUser: !!user?.id,
        isServiceReady
      });
      return;
    }

    console.log('🔄 Démarrage toggleFavorite pour entry:', entry.id);
    setIsProcessingFavorite(true);

    try {
      setIsFavorite(prevState => !prevState);

      console.log('📞 Appel favoritesService.toggleBookEntryFavorite...');
      const newStatus = await favoritesService.toggleBookEntryFavorite(entry.id.toString());
      setIsFavorite(newStatus);

      console.log(`✅ Favori ${newStatus ? 'ajouté' : 'supprimé'} pour l'entrée:`, entry.id);

      // ✅ Notifier le parent si présent
      if (typeof onFavoriteChange === 'function') {
        onFavoriteChange();
      }

    } catch (error) {
      console.error('❌ Erreur lors de la gestion des favoris:', error);
      setIsFavorite(prevState => !prevState);
      alert('Erreur lors de la gestion du favori');
    } finally {
      setIsProcessingFavorite(false);
    }
  }, [isProcessingFavorite, user?.id, isServiceReady, favoritesService, entry.id, onFavoriteChange]);
  
  // Gestion des signets
  const toggleBookmark = useCallback(async () => {
    try {
      if (!user?.id) throw new Error('Utilisateur non connecté');
      
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('category_id', entry.book_title)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        await supabase
          .from('bookmarks')
          .update({ index: entry.ordre })
          .eq('id', data.id);
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            category_id: entry.book_title,
            index: entry.ordre
          });
      }
      
      setBookmarkState({ isBookmarked: true });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du signet:', error);
    }
  }, [user?.id, entry.book_title, entry.ordre]);

  // Fonctions de contrôle (inchangées)
  const increaseSpeed = useCallback(() => 
    setScrollState(prev => ({ ...prev, speed: Math.min(100, prev.speed + 10) })), []);
  
  const decreaseSpeed = useCallback(() => 
    setScrollState(prev => ({ ...prev, speed: Math.max(10, prev.speed - 10) })), []);
  
  const increaseSize = useCallback(() => 
    setUiState(prev => ({ ...prev, textSizeIndex: Math.min(FONT_SIZES.length - 1, prev.textSizeIndex + 1) })), []);
  
  const decreaseSize = useCallback(() => 
    setUiState(prev => ({ ...prev, textSizeIndex: Math.max(0, prev.textSizeIndex - 1) })), []);
  
  const exitReading = useCallback(() => {
    setScrollState(prev => ({
      ...prev,
      isReading: false,
      isScrolling: false,
      showControls: false
    }));
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapTimeRef.current;
    
    if (isTouchActionRef.current) {
      isTouchActionRef.current = false;
      return;
    }
    
    if (delta < 300) {
      setScrollState(prev => ({
        ...prev,
        isScrolling: true,
        showControls: false
      }));
    } else {
      setScrollState(prev => ({
        ...prev,
        isScrolling: false,
        showControls: true
      }));
    }
    
    lastTapTimeRef.current = now;
  }, []);

  const startReading = useCallback(() => {
    setScrollState(prev => ({
      ...prev,
      isReading: true,
      isScrolling: true
    }));
  }, []);

  const toggleScrolling = useCallback(() => {
    setScrollState(prev => ({
      ...prev,
      isScrolling: !prev.isScrolling
    }));
  }, []);

  return (
    <div className="relative">
      {!scrollState.isReading ? (
        <div className="relative p-6 rounded-xl bg-white shadow max-w-3xl mx-auto">
          {/* 🎯 BOUTON FAVORI FONCTIONNEL - En haut à gauche */}
          <div className="absolute top-2 left-4">
            <button
              onClick={() => {
                console.log('🖱️ Clic sur cœur FONCTIONNEL');
                console.log('🔍 État service:', {
                  hasUser: !!user?.id,
                  hasService: !!favoritesService,
                  isServiceReady
                });
                toggleFavorite();
              }}
              disabled={isProcessingFavorite || !isServiceReady}
              className={`p-2 rounded-full transition-all duration-200 relative ${
                isFavorite
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600'
              } hover:bg-red-200 hover:text-red-700 disabled:opacity-50`}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
              {isProcessingFavorite && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </button>
          </div>

          {/* Contrôles en haut à droite */}
          <div className="absolute top-2 right-4 flex gap-2">
            {uiState.hasScrollbar && (
              <button 
                onClick={startReading}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-400/30 hover:bg-gray-400 text-white backdrop-blur-sm shadow-sm transition-all duration-200"
                aria-label="Commencer la lecture"
              >
                <PlayCircle className="w-4 h-4" /> 
                <span className="hidden sm:inline">Lecture</span>
              </button>
            )}
            
            
          </div>
          
          <div 
            ref={scrollRef} 
            className={`max-h-[calc(100vh-12rem)] overflow-y-auto whitespace-pre-wrap font-arabic transition-all duration-200 ${
              uiState.hasScrollbar 
                ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' 
                : 'scrollbar-none'
            }`}
            dir="rtl"
            style={{
              // CSS personnalisé pour masquer complètement la scrollbar si pas nécessaire
              scrollbarWidth: uiState.hasScrollbar ? 'thin' : 'none',
              msOverflowStyle: uiState.hasScrollbar ? 'auto' : 'none',
            }}
          >
            <p className="relative whitespace-pre-wrap font-arabic max-w-3xl mx-auto" style={textStyle}>
              {uiState.hasResume && (
                <span className="absolute -top-4 left-4 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full shadow-sm animate-pulse z-10">
                  🔄 Reprise auto
                </span>
              )}
              {entry.content}
            </p>
          </div>
        </div>
      ) : (
        // Mode lecture immersive
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto px-6 py-8" 
            onClick={handleTap} 
            dir="rtl"
          >
            <p className="whitespace-pre-wrap font-arabic max-w-3xl mx-auto" style={textStyle}>
              {entry.content}
            </p>
          </div>

          {uiState.hasScrollbar && (
            <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-100" 
                style={{ width: `${scrollState.progress}%` }} 
              />
            </div>
          )}

          {scrollState.showControls && (
            <>
              <button 
                onClick={exitReading} 
                className="fixed top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-gray-100 transition-all duration-200"
                aria-label="Fermer le mode lecture"
              >
                <X className="w-6 h-6" />
              </button>

              {uiState.hasScrollbar && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center z-50">
                  <div className="flex gap-1 px-2 border-r border-gray-200">
                    <button 
                      onClick={decreaseSize} 
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label="Diminuer la taille du texte"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-2 text-sm text-gray-700 flex items-center min-w-[2rem] justify-center">
                      {FONT_SIZES[uiState.textSizeIndex].name.replace('text-', '')}
                    </span>
                    <button 
                      onClick={increaseSize} 
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label="Augmenter la taille du texte"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-1 px-2 border-r border-gray-200">
                    <button 
                      onClick={decreaseSpeed} 
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label="Diminuer la vitesse de défilement"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-2 text-sm text-gray-700 flex items-center min-w-[2rem] justify-center">
                      {scrollState.speed}
                    </span>
                    <button 
                      onClick={increaseSpeed} 
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label="Augmenter la vitesse de défilement"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-1 px-2">
                    <button 
                      onClick={toggleScrolling} 
                      className="p-3 text-gray-600 hover:text-blue-600 transition-colors"
                      aria-label={scrollState.isScrolling ? "Mettre en pause" : "Reprendre la lecture"}
                    >
                      {scrollState.isScrolling ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                    </button>
                    
                    {/* 🗑️ SUPPRIMÉ - Plus de cœur dans les contrôles */}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BookEntryCard;
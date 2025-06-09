// QuoteCard.tsx - Version avec correction du mode lecture
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Heart, Share2, Trash2, Edit, PlayCircle, PauseCircle, Plus, Minus, X, Copy, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { Quote } from '../types';
import QuoteNoteEditor from './QuoteNoteEditor';
import { highlightSearchTerm } from '../utils/arabic-search-utils';

interface QuoteCardProps {
  quote: Quote;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  searchTerm?: string;
  onReadingModeChange?: (isReading: boolean) => void; // NOUVEAU
}

// Définition des tailles de police
const FONT_SIZES = [
  { name: 'text-lg', size: '1.125rem', lineHeight: '1.75rem' },
  { name: 'text-xl', size: '1.25rem', lineHeight: '2rem' },
  { name: 'text-2xl', size: '1.5rem', lineHeight: '2.5rem' },
  { name: 'text-3xl', size: '1.875rem', lineHeight: '3rem' },
  { name: 'text-4xl', size: '2.25rem', lineHeight: '3.5rem' },
];

export const QuoteCard: React.FC<QuoteCardProps> = memo(({ 
  quote, 
  onToggleFavorite, 
  onDelete, 
  onEdit, 
  onSwipe, 
  searchTerm,
  onReadingModeChange // NOUVEAU
}) => {
  // Vérification initiale pour s'assurer que quote est bien défini
  if (!quote || !quote.text) {
    return (
      <div className="relative bg-white rounded-xl shadow transition-all duration-200 p-6">
        <p className="text-gray-500 text-center">Citation non disponible ou en cours de chargement</p>
      </div>
    );
  }

  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(10);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [autoScrollProgress, setAutoScrollProgress] = useState(0);
  const [hasScrollbar, setHasScrollbar] = useState(false);
  
  // État pour l'affichage des notes
  const [showNotes, setShowNotes] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  
  // État pour l'index de taille de texte
  const [textSizeIndex, setTextSizeIndex] = useState(2); // Commence à text-xl
  
  const scrollSpeedRef = useRef(scrollSpeed);
  const controlsTimeoutRef = useRef<number | null>(null);
  
  // Refs pour le contrôle tactile amélioré
  const lastTapTimeRef = useRef<number>(0);
  const isTouchActionRef = useRef<boolean>(false);
  
  // Détection de langue
  const isArabicText = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(quote.text);
  
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  // NOUVEAU: Notifier le changement d'état de lecture au parent
  useEffect(() => {
    onReadingModeChange?.(isReading);
  }, [isReading, onReadingModeChange]);

  // Fonctions pour modifier la taille du texte
  const increaseTextSize = useCallback(() => {
    setTextSizeIndex(prevIndex => 
      prevIndex < FONT_SIZES.length - 1 ? prevIndex + 1 : prevIndex
    );
  }, []);

  const decreaseTextSize = useCallback(() => {
    setTextSizeIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  }, []);

  // Vérifier si une barre de défilement est nécessaire
  useEffect(() => {
    const checkForScrollbar = () => {
      if (contentScrollRef.current) {
        const hasScroll = contentScrollRef.current.scrollHeight > contentScrollRef.current.clientHeight;
        setHasScrollbar(hasScroll);
      }
    };

    checkForScrollbar();
    window.addEventListener('load', checkForScrollbar);
    window.addEventListener('resize', checkForScrollbar);

    return () => {
      window.removeEventListener('load', checkForScrollbar);
      window.removeEventListener('resize', checkForScrollbar);
    };
  }, [quote.text, textSizeIndex]);

  // Gestionnaire de défilement avec tracking de progression
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number | null = null;
    let pixelRemainder = 0;

    const scroll = (currentTime: number) => {
      if (!isScrolling || !contentScrollRef.current) return;

      const el = contentScrollRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;

      if (lastTimestamp !== null) {
        const elapsed = currentTime - lastTimestamp;
        const pixelsPerMs = scrollSpeedRef.current / 1000;
        let pixelsToScroll = elapsed * pixelsPerMs + pixelRemainder;
        const intPixels = Math.floor(pixelsToScroll);
        pixelRemainder = pixelsToScroll - intPixels;

        if (intPixels > 0) {
          el.scrollTop += intPixels;
        }

        if (maxScroll > 0) {
          setAutoScrollProgress((el.scrollTop / maxScroll) * 100);
        }

        if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
          setIsScrolling(false);
          return;
        }
      }

      lastTimestamp = currentTime;
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isScrolling) {
      lastTimestamp = null;
      pixelRemainder = 0;
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isScrolling]);

  // Gestion des contrôles avec contrôle tactile
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isScrolling) {
        setShowControls(false);
      }
      controlsTimeoutRef.current = null;
    }, 5000);
  }, [isScrolling]);

  // Fonction pour gérer le comportement tactile
  const handleContentTap = useCallback(() => {
    if (!isReading) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    if (isTouchActionRef.current) {
      isTouchActionRef.current = false;
      return;
    }
    
    // Double tap (moins de 300ms entre deux taps)
    if (timeSinceLastTap < 300) {
      if (showControls) {
        setIsScrolling(true);
        setShowControls(false);
      }
    } else {
      setIsScrolling(false);
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
    
    lastTapTimeRef.current = now;
  }, [isReading, showControls]);

  // Gestionnaire d'événements pour les boutons de contrôle
  const handleControlButtonClick = useCallback(() => {
    isTouchActionRef.current = true;
  }, []);

  // Actions de contrôle
  const toggleScroll = useCallback(() => {
    handleControlButtonClick();
    setIsScrolling(prev => !prev);
  }, [handleControlButtonClick]);

  const increaseSpeedWithTracking = useCallback(() => {
    handleControlButtonClick();
    setScrollSpeed(s => Math.min(100, s + 10));
  }, [handleControlButtonClick]);

  const decreaseSpeedWithTracking = useCallback(() => {
    handleControlButtonClick();
    setScrollSpeed(s => Math.max(10, s - 10));
  }, [handleControlButtonClick]);

  const increaseTextSizeWithTracking = useCallback(() => {
    handleControlButtonClick();
    increaseTextSize();
  }, [handleControlButtonClick, increaseTextSize]);

  const decreaseTextSizeWithTracking = useCallback(() => {
    handleControlButtonClick();
    decreaseTextSize();
  }, [handleControlButtonClick, decreaseTextSize]);

  const exitReadingWithTracking = useCallback(() => {
    handleControlButtonClick();
    setIsReading(false);
    setIsScrolling(false);
    setShowControls(false);
  }, [handleControlButtonClick]);

  // Partage et copie
  const handleShare = async () => {
    handleControlButtonClick();
    const shareText = `${quote.text}${quote.source ? `\n- ${quote.source}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Citation', text: shareText });
      } catch (error) {
        console.error('Erreur partage :', error);
        await fallbackShare(shareText);
      }
    } else {
      await fallbackShare(shareText);
    }
  };

  const fallbackShare = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Erreur copier dans le presse-papier :', err);
    }
  };

  const handleFavoriteToggle = () => {
    handleControlButtonClick();
    onToggleFavorite(quote.id);
  };

  // Fonction pour gérer les mises à jour des notes
  const handleNotesUpdated = (count: number) => {
    setNotesCount(count);
  };

  // Style de texte avec taille dynamique
  const textStyle = {
    fontSize: FONT_SIZES[textSizeIndex].size,
    lineHeight: FONT_SIZES[textSizeIndex].lineHeight
  };

  // Préparation du texte avec surlignage si un terme de recherche est fourni
  const renderQuoteText = () => {
    const baseClassName = `leading-relaxed whitespace-pre-wrap ${isArabicText ? 'font-arabic' : 'font-sans'}`;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return (
        <p
          className={baseClassName}
          style={textStyle}
          dir={isArabicText ? 'rtl' : 'ltr'}
        >
          {quote.text}
        </p>
      );
    }

    // Utiliser la fonction de surlignage pour diviser le texte en segments
    const segments = highlightSearchTerm(quote.text, searchTerm);

    return (
      <p
        className={baseClassName}
        style={textStyle}
        dir={isArabicText ? 'rtl' : 'ltr'}
      >
        {segments.map((segment, index) => (
          segment.isHighlighted ? (
            <mark 
              key={index} 
              className="bg-yellow-200 text-yellow-900 rounded-sm px-1 py-0.5 font-medium"
            >
              {segment.text}
            </mark>
          ) : (
            <React.Fragment key={index}>{segment.text}</React.Fragment>
          )
        ))}
      </p>
    );
  };

  return (
    <div className="relative bg-white rounded-xl shadow transition-all duration-200">
      {/* Mode de lecture normal */}
      {!isReading ? (
        <div className="p-6">
          {/* Indicateur de recherche si terme trouvé */}
          {searchTerm && (
            <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Résultat de recherche pour: "{searchTerm}"</span>
            </div>
          )}

          {/* Bouton de lecture en haut à droite, visible uniquement s'il y a une barre de défilement */}
          {hasScrollbar && (
            <button
              onClick={() => {
                setIsReading(true);
                setIsScrolling(true);
              }}
              className="absolute top-2 right-4 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full 
              bg-gray-400/30 hover:bg-gray-400 text-white backdrop-blur-sm shadow-sm transition-all duration-200"
              aria-label="Mode lecture"
            >
              <PlayCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Mode lecture</span>
            </button>
          )}

          <div ref={contentScrollRef} className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            {renderQuoteText()}
            {quote.source && (
              <p className="text-gray-500 mt-4 italic">
                — {quote.source}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-3">
              <button 
                onClick={() => onToggleFavorite(quote.id)} 
                title="Favori" 
                className={`p-1 rounded-full transition-colors ${
                  quote.isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Heart fill={quote.isFavorite ? 'currentColor' : 'none'} className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleShare} 
                title="Partager" 
                className="p-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => onEdit(quote)} 
                title="Modifier" 
                className="p-1 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => onDelete(quote.id)} 
                title="Supprimer" 
                className="p-1 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <button 
                onClick={decreaseTextSizeWithTracking} 
                className="p-1 text-gray-600 hover:text-blue-600"
                title="Diminuer la taille du texte"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center px-2">
                <span className="text-sm font-medium text-gray-700">
                  {FONT_SIZES[textSizeIndex].name.replace('text-', '')}
                </span>
              </div>

              <button 
                onClick={increaseTextSizeWithTracking} 
                className="p-1 text-gray-600 hover:text-blue-600"
                title="Augmenter la taille du texte"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
                   
            {showCopiedMessage && (
              <span className="absolute bottom-2 right-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Copié !
              </span>
            )}
          </div>
          
          {/* Système de notes avec bouton */}
          {quote.isFavorite && (
            <div className="mt-4 notes-section">
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center justify-between w-full text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                disabled={isLoadingNotes}
              >
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  <span>Mes notes {notesCount > 0 ? `(${notesCount})` : ''}</span>
                </div>
                {isLoadingNotes ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {showNotes && (
                <div className="mt-3 animate-slide-down">
                  <QuoteNoteEditor 
                    quoteId={quote.id} 
                    onNotesUpdated={handleNotesUpdated}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Mode lecture immersive - STRUCTURE CORRIGÉE POUR AFFICHAGE COMPLET
        <div className="fixed inset-0 bg-white z-40 flex flex-col">
          {/* Container principal pour le contenu scrollable - CORRECTION CRITIQUE */}
          <div 
            ref={contentScrollRef} 
            className="flex-1 overflow-y-auto p-6"
            onClick={handleContentTap}
            style={{ 
              minHeight: '100vh',
              paddingBottom: '120px' // Espace pour les contrôles en bas
            }}
          >
            <div 
              className="whitespace-pre-wrap font-arabic mx-auto max-w-4xl"
              dir={isArabicText ? 'rtl' : 'ltr'}
              style={textStyle}
            >
              {quote.text}
            </div>
            {quote.source && (
              <p className="text-gray-500 mt-8 italic text-center max-w-4xl mx-auto">
                — {quote.source}
              </p>
            )}
          </div>
          
          {/* Barre de progression - EXACTEMENT comme WirdPage */}
          <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-100"
              style={{ width: `${autoScrollProgress}%` }}
            />
          </div>

          {/* Bouton X pour quitter le mode lecture - EXACTEMENT comme WirdPage */}
          <button 
            onClick={exitReadingWithTracking} 
            className="fixed top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-gray-100 transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Contrôles - STRUCTURE EXACTE DE WIRDPAGE */}
          {showControls && (
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center z-50">
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button 
                  onClick={decreaseTextSizeWithTracking} 
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Diminuer la taille du texte"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex items-center px-2">
                  <span className="text-sm font-medium text-gray-700">
                    {FONT_SIZES[textSizeIndex].name.replace('text-', '')}
                  </span>
                </div>
                <button 
                  onClick={increaseTextSizeWithTracking} 
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Augmenter la taille du texte"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button 
                  onClick={decreaseSpeedWithTracking} 
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Ralentir"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex items-center px-2">
                  <span className="text-sm font-medium text-gray-700">
                    {scrollSpeed}
                  </span>
                </div>
                <button 
                  onClick={increaseSpeedWithTracking} 
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Accélérer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button 
                  onClick={toggleScroll} 
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title={isScrolling ? "Pause" : "Lecture"}
                >
                  {isScrolling ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                </button>
              </div>

              {/* Actions spécifiques aux citations - ajoutées à WirdPage structure */}
              <div className="flex gap-1 px-2">
                <button 
                  onClick={handleFavoriteToggle} 
                  className={`p-1 ${quote.isFavorite ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                  title="Favori"
                >
                  <Heart fill={quote.isFavorite ? 'currentColor' : 'none'} className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleShare} 
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Partager"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Pour TypeScript - nom du composant dans les outils de développement
QuoteCard.displayName = 'QuoteCard';

export default QuoteCard;
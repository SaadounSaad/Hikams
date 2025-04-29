import React, { useRef, useEffect, useState, TouchEvent } from 'react';
import { Heart, Share2, Trash2, Edit, Check, Calendar, Maximize2, Minimize2, Image, FolderEdit, X } from 'lucide-react';
import { Quote } from '../types';
import { isArabic, getTextDirection, getTextAlignment } from '../utils/text';
import { categoryManager } from '../utils/categories';
import html2canvas from 'html2canvas';

interface QuoteCardProps {
  quote: Quote;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onSwipe?: (direction: 'left' | 'right') => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  onToggleFavorite,
  onDelete,
  onEdit,
  onSwipe,
}) => {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const cardRef = useRef<HTMLDivElement>(null);
  const isArabicText = isArabic(quote.text);
  const textDirection = getTextDirection(quote.text);
  const textAlignment = getTextAlignment(quote.text);
  
  // Touch handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 50;
  const touchStartTime = useRef<number>(0);
  const maxSwipeTime = 300;

  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(30); // Pixels par seconde

  const [isScrollable, setIsScrollable] = useState(false);
  const scrollSpeedRef = useRef(scrollSpeed);
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);
  useEffect(() => {
    const handleTouchStart = () => {
      if (isScrolling) {
        setIsScrolling(false);
      }
    };
  
    window.addEventListener('touchstart', handleTouchStart);
  
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isScrolling]);
  
  useEffect(() => {
    const checkScroll = () => {
      if (contentScrollRef.current) {
        const el = contentScrollRef.current;
        setIsScrollable(el.scrollHeight > el.clientHeight);
      }
    };
  
    checkScroll();
    window.addEventListener('resize', checkScroll);
  
    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, [quote.text, isFullscreen]);
  
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number | null = null;
    let pixelRemainder = 0; // 🆕 mémoriser les sous-pixels accumulés
  
    const scroll = (currentTime: number) => {
      if (!isScrolling || !contentScrollRef.current) return;
  
      if (lastTimestamp !== null) {
        const elapsed = currentTime - lastTimestamp; // ms depuis la dernière frame
        const pixelsPerMs = scrollSpeedRef.current / 1000; // px/ms
        let pixelsToScroll = elapsed * pixelsPerMs + pixelRemainder; // ajouter la dette accumulée
  
        const integerPixels = Math.floor(pixelsToScroll); // partie entière à scroller
        pixelRemainder = pixelsToScroll - integerPixels; // 🆕 garder le reste
  
        if (integerPixels > 0) {
          contentScrollRef.current.scrollBy({
            top: integerPixels,
            behavior: 'auto' // 🚀 toujours auto
          });
        }
  
        const el = contentScrollRef.current;
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
  
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScrolling]);
  

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen && e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartTime.current = Date.now();
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    if (touchStartY.current !== null && touchEndY.current !== null &&
        touchStartX.current !== null && touchEndX.current !== null) {
      const verticalDistance = Math.abs(touchEndY.current - touchStartY.current);
      const horizontalDistance = Math.abs(touchEndX.current - touchStartX.current);
      
      if (verticalDistance > horizontalDistance) {
        e.stopPropagation();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !onSwipe ||
        !touchStartY.current || !touchEndY.current) return;

    const swipeTime = Date.now() - touchStartTime.current;
    if (swipeTime > maxSwipeTime) return;

    const horizontalDistance = touchEndX.current - touchStartX.current;
    const verticalDistance = touchEndY.current - touchStartY.current;
    
    if (Math.abs(horizontalDistance) > Math.abs(verticalDistance) &&
        Math.abs(horizontalDistance) >= minSwipeDistance) {
      if (horizontalDistance > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isSliding || !onSwipe) return;
    
    setSlideDirection(direction);
    setIsSliding(true);
    
    // Attendre la fin de l'animation avant de changer la citation
    setTimeout(() => {
      onSwipe(direction);
      setIsSliding(false);
    }, 300); // Durée de l'animation
  };

  const handleShare = async () => {
    const shareText = `${quote.text}${quote.source ? `\n- ${quote.source}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'حكمة اليوم',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
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
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (err) {
        console.error('Fallback error:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  const shareAsImage = async () => {
    if (!cardRef.current || isGeneratingImage) return;

    try {
      setIsGeneratingImage(true);

      // Créer un clone de la carte pour la capture
      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.background = 'white';
      clone.style.width = '800px'; // Largeur fixe pour une meilleure qualité
      clone.style.padding = '40px';
      clone.style.borderRadius = '20px';
      clone.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
      
      // Supprimer les boutons d'action
      const actionButtons = clone.querySelector('[data-action-buttons]');
      if (actionButtons) {
        actionButtons.remove();
      }

      document.body.appendChild(clone);

      // Convertir en canvas avec une meilleure qualité
      const canvas = await html2canvas(clone, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('[data-quote-content]');
          if (element) {
            element.classList.add('text-3xl', 'leading-relaxed');
          }
        }
      });

      document.body.removeChild(clone);

      // Convertir le canvas en blob avec une meilleure qualité
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0);
      });

      // Partager l'image
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'citation.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: 'حكمة اليوم',
          files: [new File([blob], 'citation.png', { type: 'image/png' })]
        });
      } else {
        // Télécharger l'image si le partage n'est pas possible
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'citation.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sharing image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={`${
          isSliding ? `slide-${slideDirection === 'left' ? 'exit' : 'exit-reverse'}` : ''
        } transition-all duration-500 ease-in-out transform ${
          isFullscreen 
            ? 'fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8'
            : 'bg-white rounded-3xl shadow-sm hover:shadow-md'
        }`}
      >
        <div 
          className={`relative w-full max-w-3xl mx-auto ${isFullscreen ? 'h-full flex flex-col' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
              ref={contentScrollRef}
              className={`${isFullscreen ? 'flex-1 flex flex-col justify-center' : ''} p-8 max-h-[60vh] overflow-y-auto`}
              data-quote-content
            >
              <p 
                className={`text-2xl mb-8 leading-relaxed ${textAlignment} font-${isArabicText ? 'arabic' : 'normal'} transition-all duration-300`} 
                dir={textDirection}
                lang={isArabicText ? 'ar' : 'fr'}
                style={{
                  fontSize: isFullscreen ? '2.5rem' : '1.5rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {quote.text}
              </p>
              {quote.source && (
                <p 
                  className={`text-gray-600 text-lg mb-8 ${textAlignment} transition-all duration-300`} 
                  dir={textDirection}
                  lang={isArabicText ? 'ar' : 'fr'}
                  style={{ fontSize: isFullscreen ? '1.5rem' : '1.125rem' }}
                >
                  - {quote.source}
                </p>
              )}
            </div>
            
            

            <div
              className={`flex items-center justify-between flex-wrap gap-4 ${isFullscreen ? 'p-8' : 'mt-8 pt-6'} border-t border-gray-100`}
              data-action-buttons
            >
              {/* 📅 Date + Lecture */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-500 flex items-center bg-gray-50 px-4 py-2 rounded-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  {quote.scheduledDate ? formatDate(quote.scheduledDate) : 'Non programmée'}
                </span>

                {isScrollable && (
                  <div className="flex items-center gap-4 bg-gray-100 rounded-full px-4 py-2 shadow-sm">
                    {/* Bouton Play/Pause */}
                    <button
                      onClick={() => setIsScrolling(!isScrolling)}
                      className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all"
                    >
                      {isScrolling ? (
                        <span className="text-2xl font-bold">II</span> // Pause
                      ) : (
                        <span className="text-2xl font-bold">▹</span> // Lecture
                      )}
                    </button>

                    {/* Boutons - et + */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setScrollSpeed(Math.max(scrollSpeedRef.current - 10, 10))}
                        className="px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300 text-sm"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setScrollSpeed(scrollSpeedRef.current + 10)}
                        className="px-3 py-1 bg-gray-200 rounded-full hover:bg-gray-300 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}



              </div>
              
              {/* 🔧 Boutons d'action */}
              <div className="flex items-center gap-2">
                {showCopiedMessage && (
                  <span className="text-green-600 text-sm flex items-center bg-green-50 px-4 py-2 rounded-full mr-2">
                    <Check className="w-4 h-4 mr-1" />
                    Copié !
                  </span>
                )}
                <button onClick={() => onToggleFavorite(quote.id)} className={`p-2 rounded-full hover:bg-gray-50 transition-colors ${quote.isFavorite ? 'text-red-500' : 'text-gray-400'}`} title={quote.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                  <Heart className="w-5 h-5" fill={quote.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400" title="Partager le texte">
                  <Share2 className="w-5 h-5" />
                </button>
                <button onClick={shareAsImage} disabled={isGeneratingImage} className={`p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400 ${isGeneratingImage ? 'opacity-50 cursor-not-allowed' : ''}`} title="Partager comme image">
                  <Image className={`w-5 h-5 ${isGeneratingImage ? 'animate-pulse' : ''}`} />
                </button>
                <button onClick={() => setShowCategoryModal(true)} className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400" title="Changer de catégorie">
                  <FolderEdit className="w-5 h-5" />
                </button>
                <button onClick={() => onEdit(quote)} className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400" title="Modifier">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(quote.id)} className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400" title="Supprimer">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={toggleFullscreen} className="p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-400" title={isFullscreen ? "Quitter le mode plein écran" : "Mode plein écran"}>
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Changer de catégorie</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-2">
              {categoryManager.getCategories().map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    onEdit({ ...quote, category: category.id });
                    setShowCategoryModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                    category.id === quote.category
                      ? 'bg-sky-50 text-sky-600'
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="font-medium">{category.name}</span>
                  {category.id === quote.category && (
                    <Check className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
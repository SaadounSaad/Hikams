// ✨ QuoteCard.tsx — version enrichie avec lecture immersive + favoris, partage, etc.

import React, { useState, useRef, useEffect } from 'react';
import { Heart, Share2, Trash2, Edit } from 'lucide-react';

import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (quote: Quote) => void;
  onSwipe?: (direction: 'left' | 'right') => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onToggleFavorite, onDelete, onEdit }) => {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(30);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const scrollSpeedRef = useRef(scrollSpeed);
  const isArabicText = /[\u0600-\u06FF]/.test(quote.text); // simple détection
  
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number | null = null;
    let pixelRemainder = 0;

    const scroll = (currentTime: number) => {
      if (!isScrolling || !contentScrollRef.current) return;

      const el = contentScrollRef.current;

      if (lastTimestamp !== null) {
        const elapsed = currentTime - lastTimestamp;
        const pixelsPerMs = scrollSpeedRef.current / 1000;
        let pixelsToScroll = elapsed * pixelsPerMs + pixelRemainder;
        const intPixels = Math.floor(pixelsToScroll);
        pixelRemainder = pixelsToScroll - intPixels;

        if (intPixels > 0) {
          el.scrollTop += intPixels;
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

  useEffect(() => {
    const handleTouch = () => {
      if (isReading) {
        setIsScrolling(false);
        setShowControls(true);
        setTimeout(() => setShowControls(false), 5000);
      }
    };

    window.addEventListener('touchstart', handleTouch);
    return () => window.removeEventListener('touchstart', handleTouch);
  }, [isReading]);

  const toggleScroll = () => setIsScrolling((prev) => !prev);
  const increaseSpeed = () => setScrollSpeed((s) => s + 10);
  const decreaseSpeed = () => setScrollSpeed((s) => Math.max(10, s - 10));
  const exitReading = () => {
    setIsReading(false);
    setIsScrolling(false);
    setShowControls(false);
  };

  const handleShare = async () => {
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

  return (
    <div className="relative bg-white rounded-xl shadow p-6">
      {!isReading && (
        <button
          onClick={() => {
            setIsReading(true);
            setIsScrolling(true);
          }}
          className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full shadow"
        >
          ▹ Lire
        </button>
      )}

      <div ref={contentScrollRef} className="max-h-[calc(100vh-6rem)] overflow-y-auto">
        <p 
          className="text-xl leading-relaxed whitespace-pre-wrap">
            {quote.text}
        </p>
        {quote.source && <p className="text-gray-500 mt-4">- {quote.source}</p>}
      </div>

      <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2">
          <button onClick={() => onToggleFavorite(quote.id)} title="Favori" className="text-gray-500 hover:text-red-500">
            <Heart fill={quote.isFavorite ? 'currentColor' : 'none'} className="w-5 h-5" />
          </button>
          <button onClick={handleShare} title="Partager" className="text-gray-500 hover:text-blue-500">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={() => onEdit(quote)} title="Modifier" className="text-gray-500 hover:text-green-500">
            <Edit className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(quote.id)} title="Supprimer" className="text-gray-500 hover:text-black">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        {showCopiedMessage && <span className="text-sm text-green-600">Copié !</span>}
      </div>

      {isReading && showControls && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg px-4 py-2 flex items-center gap-4 z-30">
          <button onClick={toggleScroll} className="text-xl font-bold">
            {isScrolling ? 'II' : '▹'}
          </button>
          <button onClick={decreaseSpeed}>-</button>
          <button onClick={increaseSpeed}>+</button>
          <button onClick={exitReading}>✖</button>
        </div>
      )}
    </div>
  );
};

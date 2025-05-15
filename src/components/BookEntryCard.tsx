// ✅ BookEntryCard.tsx : défilement basé sur scrollHeight - lié à l’ascenseur
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayCircle, PauseCircle, Plus, Minus, X, Heart } from 'lucide-react';

interface BookEntryCardProps {
  entry: {
    id: number;
    content: string;
    ordre: number;
    book_title: string;
  };
}

const FONT_SIZES = [
  { name: 'text-xl', size: '1.25rem', lineHeight: '2rem' },
  { name: 'text-2xl', size: '1.5rem', lineHeight: '2.5rem' },
  { name: 'text-3xl', size: '1.875rem', lineHeight: '2.75rem' },
  { name: 'text-4xl', size: '2.25rem', lineHeight: '3rem' },
  { name: 'text-5xl', size: '3rem', lineHeight: '3.5rem' },
];

const BookEntryCard: React.FC<BookEntryCardProps> = ({ entry }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20);
  const [textSizeIndex, setTextSizeIndex] = useState(2);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const scrollSpeedRef = useRef(scrollSpeed);
  const lastTapTimeRef = useRef<number>(0);
  const isTouchActionRef = useRef(false);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const hasScroll = el.scrollHeight > el.clientHeight;
      setHasScrollbar(hasScroll);
    }
  }, [entry.content, textSizeIndex]);

  useEffect(() => {
    let animationId: number;
    let lastTimestamp: number | null = null;

    const scroll = (currentTime: number) => {
      const el = scrollRef.current;
      if (!isScrolling || !el) return;

      const maxScroll = el.scrollHeight - el.clientHeight;

      if (lastTimestamp !== null) {
        const elapsed = currentTime - lastTimestamp;
        const pixelsToScroll = (elapsed * scrollSpeedRef.current) / 1000; // px/sec

        el.scrollTop = Math.min(el.scrollTop + pixelsToScroll, maxScroll);

        if (maxScroll > 0) {
          setScrollProgress((el.scrollTop / maxScroll) * 100);
        }

        if (el.scrollTop >= maxScroll) {
          setIsScrolling(false);
          return;
        }
      }

      lastTimestamp = currentTime;
      animationId = requestAnimationFrame(scroll);
    };

    if (isScrolling) {
      lastTimestamp = null;
      animationId = requestAnimationFrame(scroll);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling]);

  const toggleFavorite = () => setIsFavorite(!isFavorite);
  const increaseSpeed = () => setScrollSpeed(s => Math.min(100, s + 10));
  const decreaseSpeed = () => setScrollSpeed(s => Math.max(10, s - 10));
  const increaseSize = () => setTextSizeIndex(i => Math.min(FONT_SIZES.length - 1, i + 1));
  const decreaseSize = () => setTextSizeIndex(i => Math.max(0, i - 1));
  const exitReading = () => { setIsReading(false); setIsScrolling(false); setShowControls(false); };

  const handleTap = () => {
    const now = Date.now();
    const delta = now - lastTapTimeRef.current;
    if (isTouchActionRef.current) {
      isTouchActionRef.current = false;
      return;
    }
    if (delta < 300) {
      setIsScrolling(true);
      setShowControls(false);
    } else {
      setIsScrolling(false);
      setShowControls(true);
    }
    lastTapTimeRef.current = now;
  };

  const textStyle = {
    fontSize: FONT_SIZES[textSizeIndex].size,
    lineHeight: FONT_SIZES[textSizeIndex].lineHeight,
  };

  return (
    <div className="relative">
      {!isReading ? (
        <div className="relative p-6 rounded-xl bg-white shadow max-w-3xl mx-auto">
          {hasScrollbar && (
            <button onClick={() => { setIsReading(true); setIsScrolling(true); }}
              className="absolute top-2 right-4 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-400/30 hover:bg-gray-400 text-white backdrop-blur-sm shadow-sm">
              <PlayCircle className="w-4 h-4" /> Lecture
            </button>
          )}
          <div ref={scrollRef} className="max-h-[calc(100vh-12rem)] overflow-y-auto whitespace-pre-wrap font-arabic" dir="rtl">
            <p className="whitespace-pre-wrap font-arabic max-w-3xl mx-auto" style={textStyle}>{entry.content}</p>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8" onClick={handleTap} dir="rtl">
            <p className="whitespace-pre-wrap font-arabic max-w-3xl mx-auto" style={textStyle}>{entry.content}</p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-blue-600 transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
          </div>

          {showControls && (
            <>
              <button onClick={exitReading} className="fixed top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-gray-100">
                <X className="w-6 h-6" />
              </button>
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center z-50">
                <div className="flex gap-1 px-2 border-r border-gray-200">
                  <button onClick={decreaseSize} className="p-3 text-gray-600 hover:text-blue-600">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-2 text-sm text-gray-700">{FONT_SIZES[textSizeIndex].name.replace('text-', '')}</span>
                  <button onClick={increaseSize} className="p-3 text-gray-600 hover:text-blue-600">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-1 px-2 border-r border-gray-200">
                  <button onClick={decreaseSpeed} className="p-3 text-gray-600 hover:text-blue-600">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-2 text-sm text-gray-700">{scrollSpeed}</span>
                  <button onClick={increaseSpeed} className="p-3 text-gray-600 hover:text-blue-600">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-1 px-2">
                  <button onClick={() => setIsScrolling(!isScrolling)} className="p-3 text-gray-600 hover:text-blue-600">
                    {isScrolling ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                  </button>
                  <button onClick={toggleFavorite} className={`p-3 ${isFavorite ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}>
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BookEntryCard;

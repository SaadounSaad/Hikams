// ✅ BookEntryCard.tsx avec ref unifiée pour lecture automatique fiable
import React, { useEffect, useRef, useState } from 'react';
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
  { size: '1.25rem', lineHeight: '2rem' },
  { size: '1.5rem', lineHeight: '2.5rem' },
  { size: '1.875rem', lineHeight: '2.75rem' },
  { size: '2.25rem', lineHeight: '3rem' },
  { size: '3rem', lineHeight: '3.5rem' },
];

const BookEntryCard: React.FC<BookEntryCardProps> = ({ entry }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReading, setIsReading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20);
  const [textSizeIndex, setTextSizeIndex] = useState(2);
  const [showControls, setShowControls] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollSpeedRef = useRef(scrollSpeed);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) setHasScrollbar(el.scrollHeight > el.clientHeight);
  }, [entry.content, textSizeIndex]);

  useEffect(() => {
    let animationId: number;
    let lastTimestamp: number | null = null;
    let pixelRemainder = 0;

    const scroll = (currentTime: number) => {
      const el = scrollRef.current;
      if (!isScrolling || !el) return;

      const maxScroll = el.scrollHeight - el.clientHeight;

      if (lastTimestamp !== null) {
        const elapsed = currentTime - lastTimestamp;
        const pixelsPerMs = scrollSpeedRef.current / 1000;
        let pixelsToScroll = elapsed * pixelsPerMs + pixelRemainder;
        const intPixels = Math.floor(pixelsToScroll);
        pixelRemainder = pixelsToScroll - intPixels;

        if (intPixels > 0) el.scrollTop += intPixels;
        if (maxScroll > 0) setScrollProgress((el.scrollTop / maxScroll) * 100);
        if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const style = {
    fontSize: FONT_SIZES[textSizeIndex].size,
    lineHeight: FONT_SIZES[textSizeIndex].lineHeight,
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`${
          isReading ? 'fixed inset-0 bg-white z-50 flex flex-col' : 'relative p-6 rounded-xl bg-white shadow max-w-3xl mx-auto'
        }`}
        dir="rtl"
        style={style}
        onClick={() => isReading && setShowControls(true)}
      >
        <div className={isReading ? 'flex-1 overflow-y-auto px-6 py-8' : 'max-h-[calc(100vh-12rem)] overflow-y-auto whitespace-pre-wrap font-arabic'}>
          <p className="whitespace-pre-wrap font-arabic max-w-3xl mx-auto">
            {entry.content}
          </p>
        </div>
      </div>

      {!isReading && hasScrollbar && (
        <button
          onClick={() => {
            setIsReading(true);
            setIsScrolling(true);
          }}
          className="absolute top-2 right-4 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-400/30 hover:bg-gray-400 text-white backdrop-blur-sm shadow-sm"
        >
          <PlayCircle className="w-4 h-4" /> Lecture
        </button>
      )}

      {isReading && (
        <>
          <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-blue-600 transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
          </div>

          {showControls && (
            <>
              <button
                onClick={() => {
                  setIsReading(false);
                  setIsScrolling(false);
                }}
                className="fixed top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center z-50">
                <div className="flex gap-1 px-2 border-r border-gray-200">
                  <button onClick={() => setTextSizeIndex(i => Math.max(0, i - 1))} className="p-3 text-gray-600 hover:text-blue-600">
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-2 text-sm text-gray-700">{FONT_SIZES[textSizeIndex].size}</span>
                  <button onClick={() => setTextSizeIndex(i => Math.min(FONT_SIZES.length - 1, i + 1))} className="p-3 text-gray-600 hover:text-blue-600">
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
        </>
      )}
    </div>
  );
};

export default BookEntryCard;

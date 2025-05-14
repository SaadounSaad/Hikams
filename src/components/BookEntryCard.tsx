// ✅ Étape 2 : Nouveau composant BookEntryCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { PlayCircle, PauseCircle, Plus, Minus, X } from 'lucide-react';

interface BookEntryCardProps {
  entry: {
    id: number;
    content: string;
    order: number;
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
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20);
  const [textSizeIndex, setTextSizeIndex] = useState(2);
  const [showControls, setShowControls] = useState(true);
  const scrollSpeedRef = useRef(scrollSpeed);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  useEffect(() => {
    let animationId: number;
    let lastTime: number | null = null;

    const scrollStep = (time: number) => {
      if (!scrollRef.current || !isScrolling) return;
      const el = scrollRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (lastTime != null) {
        const delta = time - lastTime;
        el.scrollTop += delta * (scrollSpeedRef.current / 1000);
        if (el.scrollTop >= maxScroll) setIsScrolling(false);
      }
      lastTime = time;
      animationId = requestAnimationFrame(scrollStep);
    };

    if (isScrolling) {
      lastTime = null;
      animationId = requestAnimationFrame(scrollStep);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling]);

  const style = {
    fontSize: FONT_SIZES[textSizeIndex].size,
    lineHeight: FONT_SIZES[textSizeIndex].lineHeight,
  };

  return (
    <div className="relative bg-white p-6 rounded-xl shadow max-w-3xl mx-auto">
      <div
        ref={scrollRef}
        className="max-h-[calc(100vh-12rem)] overflow-y-auto whitespace-pre-wrap font-arabic"
        dir="rtl"
        style={style}
        onClick={() => setShowControls(true)}
      >
        {entry.content}
      </div>

      {showControls && (
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
            <button onClick={() => setShowControls(false)} className="p-3 text-gray-600 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookEntryCard;

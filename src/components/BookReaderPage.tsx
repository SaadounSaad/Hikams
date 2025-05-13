// src/components/BookReaderPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, PlayCircle, PauseCircle, Plus, Minus, X } from 'lucide-react';

interface BookReaderPageProps {
  bookTitle: string;
  onBack: () => void;
}

interface BookEntry {
  id: number;
  content: string;
  book_title: string;
  order: number;
}

const FONT_SIZES = [
  { name: 'text-xl', size: '1.25rem', lineHeight: '2rem' },
  { name: 'text-2xl', size: '1.5rem', lineHeight: '2.5rem' },
  { name: 'text-3xl', size: '1.875rem', lineHeight: '2.75rem' },
  { name: 'text-4xl', size: '2.25rem', lineHeight: '3rem' },
  { name: 'text-5xl', size: '3rem', lineHeight: '3.5rem' }
];

const BookReaderPage: React.FC<BookReaderPageProps> = ({ bookTitle, onBack }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(20);
  const [textSizeIndex, setTextSizeIndex] = useState(2);
  const [autoScrollProgress, setAutoScrollProgress] = useState(0);

  const scrollSpeedRef = useRef(scrollSpeed);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
      .from('book_entries')
      .select('*')
      .eq('book_title', bookTitle)
      .range(0, 100000)
      .order('id', { ascending: true });
      if (error) console.error(error);
      setEntries(data || []);
      setLoading(false);
    }

    fetchData();
  }, [bookTitle]);

  useEffect(() => {
    let frameId: number;
    let lastTime: number | null = null;
    let pixelRemainder = 0;

    const scrollStep = (now: number) => {
      if (!isScrolling || !contentRef.current) return;

      const el = contentRef.current;
      const maxScroll = el.scrollHeight - el.clientHeight;

      if (lastTime != null) {
        const delta = now - lastTime;
        const pixels = delta * (scrollSpeedRef.current / 1000) + pixelRemainder;
        const scrollAmount = Math.floor(pixels);
        pixelRemainder = pixels - scrollAmount;
        el.scrollTop += scrollAmount;

        if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
          setIsScrolling(false);
        }

        setAutoScrollProgress((el.scrollTop / maxScroll) * 100);
      }

      lastTime = now;
      frameId = requestAnimationFrame(scrollStep);
    };

    if (isScrolling) {
      lastTime = null;
      pixelRemainder = 0;
      frameId = requestAnimationFrame(scrollStep);
    }

    return () => cancelAnimationFrame(frameId);
  }, [isScrolling]);

  const textStyle = {
    fontSize: FONT_SIZES[textSizeIndex].size,
    lineHeight: FONT_SIZES[textSizeIndex].lineHeight
  };

  const toggleScroll = () => {
    setIsScrolling(prev => !prev);
    showControlsTemporarily();
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isScrolling) setShowControls(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {!isReading ? (
        <>
          <header className="py-4 px-6 flex items-center justify-between border-b">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold font-arabic flex-1 text-center" dir="rtl">{bookTitle}</h1>
            <div className="w-5"></div>
          </header>

          <div ref={contentRef} className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin h-12 w-12 border-b-2 border-blue-500 rounded-full"></div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto whitespace-pre-wrap font-arabic" dir="rtl" style={textStyle}>
                {entries.map(entry => entry.content).join('\n\n')}
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => {
                setIsReading(true);
                setIsScrolling(true);
              }}
              className="absolute top-12 left-40 flex items-center gap-2 px-3 py-2 rounded-full bg-gray-400/30 hover:bg-gray-400 text-white backdrop-blur-sm shadow-sm"
            >
              <PlayCircle className="w-6 h-6" /> Lecture
            </button>
          )}
        </>
      ) : (
        <div className="fixed inset-0 bg-white z-40 flex flex-col">
          <header className="py-4 px-6 flex items-center justify-between border-b bg-white sticky top-0 z-10">
            <button onClick={() => {
              setIsReading(false);
              setIsScrolling(false);
              setShowControls(false);
            }} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold font-arabic flex-1 text-center" dir="rtl">{bookTitle}</h1>
            <div className="w-5"></div>
          </header>

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-6 py-8"
            onClick={showControlsTemporarily}
          >
            <div
              className="whitespace-pre-wrap mx-auto max-w-3xl font-arabic"
              dir="rtl"
              style={textStyle}
            >
              {entries.map(entry => entry.content).join('\n\n')}
            </div>
          </div>

          <button
            onClick={() => {
              setIsReading(false);
              setIsScrolling(false);
              setShowControls(false);
            }}
            className="fixed top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-blue-600 transition-all duration-100" style={{ width: `${autoScrollProgress}%` }} />
          </div>

          {showControls && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center z-50">
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button onClick={() => setTextSizeIndex(i => Math.max(0, i - 1))} className="p-3 text-gray-600 hover:text-blue-600">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="px-2 text-sm text-gray-700">{FONT_SIZES[textSizeIndex].name.replace('text-', '')}</span>
                <button onClick={() => setTextSizeIndex(i => Math.min(FONT_SIZES.length - 1, i + 1))} className="p-3 text-gray-600 hover:text-blue-600">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button onClick={() => setScrollSpeed(s => Math.max(10, s - 10))} className="p-3 text-gray-600 hover:text-blue-600">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="px-2 text-sm text-gray-700">{scrollSpeed}</span>
                <button onClick={() => setScrollSpeed(s => Math.min(100, s + 10))} className="p-3 text-gray-600 hover:text-blue-600">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <button onClick={toggleScroll} className="p-3 text-gray-600 hover:text-blue-600">
                {isScrolling ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookReaderPage;

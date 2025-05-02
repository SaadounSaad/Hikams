// AlbaqiatPage.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft, PlayCircle, PauseCircle, Plus, Minus, X } from 'lucide-react';

interface AlbaqiatPageProps {
  onBack: () => void;
}

interface Albaqiyat {
  id: string;
  texte: string;
  qualif: 'tasbih' | 'hamd' | 'tahlil' | 'takbir';
}

// Définition des tailles de police
const FONT_SIZES = [
  { name: 'text-xl', size: '1.25rem', lineHeight: '2rem' },
  { name: 'text-2xl', size: '1.5rem', lineHeight: '3rem' },
  { name: 'text-3xl', size: '1.875rem', lineHeight: '3.5rem' },
  { name: 'text-4xl', size: '2.25rem', lineHeight: '4rem' },
  { name: 'text-5xl', size: '3.25rem', lineHeight: '5rem' },
];

const AlbaqiatPage: React.FC<AlbaqiatPageProps> = ({ onBack }) => {
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'takbir' | 'tahlil' | 'hamd' | 'tasbih'>('tasbih');
  const [albaqiyatList, setAlbaqiyatList] = useState<Albaqiyat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // États pour la lecture automatique
  const [isReading, setIsReading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(10);
  const [autoScrollProgress, setAutoScrollProgress] = useState(0);
  
  // Utiliser un état pour l'index de taille de texte
  const [textSizeIndex, setTextSizeIndex] = useState(2); // Commence à 2 = text-3xl
  
  const scrollSpeedRef = useRef(scrollSpeed);
  const controlsTimeoutRef = useRef<number | null>(null);
  
  // Ajouter des refs pour le contrôle tactile amélioré
  const lastTapTimeRef = useRef<number>(0);
  const isTouchActionRef = useRef<boolean>(false);

  // Mettre à jour la référence du scrollSpeed quand il change
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  // Fonctions simplifiées pour modifier la taille du texte
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

  // Chargement des données
  useEffect(() => {
    async function loadAlbaqiyat() {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('albaqiyat_table')
          .select('*')
          .eq('qualif', activeTab)
          .order('id', { ascending: true });
        
        if (error) {
          console.error('Erreur Supabase:', error);
          setAlbaqiyatList([]);
        } else {
          setAlbaqiyatList(data || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setAlbaqiyatList([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbaqiyat();
    
    // Réinitialiser la position de défilement quand on change d'onglet
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
    setAutoScrollProgress(0);
  }, [activeTab]);

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

        // Mettre à jour la progression
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

  // Gestion des contrôles améliorée avec contrôle tactile
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = window.setTimeout(() => {
      // Ne pas cacher automatiquement les contrôles si on est en pause
      if (isScrolling) {
        setShowControls(false);
      }
      controlsTimeoutRef.current = null;
    }, 5000);
  }, [isScrolling]);

  // Fonction pour gérer le comportement tactile amélioré
  const handleContentTap = useCallback(() => {
    if (!isReading) return;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    // Empêcher les actions secondaires dues à la propagation d'événements
    if (isTouchActionRef.current) {
      isTouchActionRef.current = false;
      return;
    }
    
    // Double tap (moins de 300ms entre deux taps)
    if (timeSinceLastTap < 300) {
      // Second tap - basculer l'état de lecture et cacher les contrôles
      if (showControls) {
        setIsScrolling(true);
        setShowControls(false);
      }
    } else {
      // Premier tap - mettre en pause et montrer les contrôles
      setIsScrolling(false);
      setShowControls(true);
      
      // Ne pas configurer de timeout pour masquer les contrôles - ils resteront
      // visibles jusqu'au second tap
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }
    
    lastTapTimeRef.current = now;
  }, [isReading, showControls]);

  // Gestionnaire d'événements pour les boutons de contrôle
  const handleControlButtonClick = useCallback(() => {
    // Marquer qu'un bouton de contrôle a été cliqué pour éviter le basculement du mode lecture
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

  // Style de texte avec taille dynamique
  const textStyle = {
    fontSize: FONT_SIZES[textSizeIndex].size,
    lineHeight: FONT_SIZES[textSizeIndex].lineHeight
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {!isReading ? (
        <>
          <header className="py-4 px-6 flex items-center justify-between border-b">
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <h1 className="text-2xl font-bold font-arabic flex-1 text-center" dir="rtl">
              الباقيات الصالحات
            </h1>
            
            <div className="w-5"></div> {/* Spacer pour centrer le titre */}
          </header>
          
          {/* Onglets pour basculer entre baqiat */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('takbir')}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'takbir'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              تكبير
            </button>
            
            <button
              onClick={() => setActiveTab('tahlil')}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'tahlil'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              تهليل
            </button>
            
            <button
              onClick={() => setActiveTab('hamd')}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'hamd'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              الحمد
            </button>
            
            <button
              onClick={() => setActiveTab('tasbih')}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'tasbih'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              تسبيحات
            </button>
          </div>

          <div ref={contentScrollRef} className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : albaqiyatList.length > 0 ? (
              <div className="space-y-8">
                {albaqiyatList.map((item) => (
                  <div key={item.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div
                      className="whitespace-pre-wrap font-arabic"
                      dir="rtl"
                      style={{
                        fontSize: FONT_SIZES[textSizeIndex].size,
                        lineHeight: FONT_SIZES[textSizeIndex].lineHeight
                      }}
                    >
                      {item.texte}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 font-arabic">
                لا توجد باقيات متاحة
              </div>
            )}
          </div>

          {/* Bouton de lecture */}
          {!loading && albaqiyatList.length > 0 && (
            <button
              onClick={() => {
                setIsReading(true);
                setIsScrolling(true);
              }}
              className="absolute top-12 left-40 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full 
              bg-gray-400/30 hover:bg-gray-400 text-white backdrop-blur-sm shadow-sm transition-all duration-200"
              aria-label="Mode lecture"
            >
              <PlayCircle className="w-6 h-6" />
            </button>
          )}

        </>
      ) : (
        // Mode lecture immersive avec barres fixes
        <div className="fixed inset-0 bg-white z-40 flex flex-col">
          {/* Barre de navigation fixe */}
          <header className="py-4 px-6 flex items-center justify-between border-b bg-white sticky top-0 z-10">
            <button 
              onClick={exitReadingWithTracking} 
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <h1 className="text-2xl font-bold font-arabic flex-1 text-center" dir="rtl">
              الباقيات الصالحات
            </h1>
            
            <div className="w-5"></div> {/* Spacer pour centrer le titre */}
          </header>
          
          {/* Onglets fixes */}
          <div className="flex border-b bg-white sticky top-16 z-10">
            <button
              onClick={() => {
                setActiveTab('takbir');
                setIsScrolling(false);
                setAutoScrollProgress(0);
              }}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'takbir'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              تكبير
            </button>
            
            <button
              onClick={() => {
                setActiveTab('tahlil');
                setIsScrolling(false);
                setAutoScrollProgress(0);
              }}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'tahlil'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              تهليل
            </button>
            
            <button
              onClick={() => {
                setActiveTab('hamd');
                setIsScrolling(false);
                setAutoScrollProgress(0);
              }}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'hamd'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              الحمد
            </button>
            
            <button
              onClick={() => {
                setActiveTab('tasbih');
                setIsScrolling(false);
                setAutoScrollProgress(0);
              }}
              className={`flex-1 py-3 font-arabic text-lg ${
                activeTab === 'tasbih'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              تسبيحات
            </button>
          </div>

          {/* Zone de contenu défilante */}
          <div 
            ref={contentScrollRef} 
            className="flex-1 overflow-y-auto px-6 py-8"
            onClick={handleContentTap}
            style={{ marginTop: '8px', height: 'calc(100% - 120px)' }} // Ajuster selon la hauteur de vos barres
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : albaqiyatList.length > 0 ? (
              <div className="space-y-8">
                {albaqiyatList.map((item) => (
                  <div key={item.id} className="border-b pb-6 last:border-0 last:pb-0">
                    <div
                      className="whitespace-pre-wrap font-arabic"
                      dir="rtl"
                      style={{
                        fontSize: FONT_SIZES[textSizeIndex].size,
                        lineHeight: FONT_SIZES[textSizeIndex].lineHeight
                      }}
                    >
                      {item.texte}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 font-arabic">
                لا توجد باقيات متاحة
              </div>
            )}
          </div>
          
          {/* Barre de progression */}
          <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-100"
              style={{ width: `${autoScrollProgress}%` }}
            />
          </div>
          {/* Bouton X pour quitter le mode lecture (en haut à droite) */}
            <button 
              onClick={exitReadingWithTracking} 
              className="fixed top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-gray-100 transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>
          {/* Contrôles */}
          {showControls && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center z-50">
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button 
                  onClick={decreaseTextSizeWithTracking} 
                  className="p-3 text-gray-600 hover:text-blue-600"
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
                  className="p-3 text-gray-600 hover:text-blue-600"
                  title="Augmenter la taille du texte"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-1 px-2 border-r border-gray-200">
                <button 
                  onClick={decreaseSpeedWithTracking} 
                  className="p-3 text-gray-600 hover:text-blue-600"
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
                  className="p-3 text-gray-600 hover:text-blue-600"
                  title="Accélérer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-1 px-2">
                <button 
                  onClick={toggleScroll} 
                  className="p-3 text-gray-600 hover:text-blue-600"
                  title={isScrolling ? "Pause" : "Lecture"}
                >
                  {isScrolling ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbaqiatPage;
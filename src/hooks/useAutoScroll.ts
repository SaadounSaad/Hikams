// src/hooks/useAutoScroll.ts
import { useEffect, useRef, useState } from 'react';

interface UseAutoScrollProps {
  speed: number; // pixels par seconde
  isScrolling: boolean;
  onProgress?: (progress: number) => void; // callback pour le pourcentage de progression
  onComplete?: () => void; // callback appelé à la fin du défilement
}

/**
 * Hook personnalisé pour gérer le défilement automatique
 */
export const useAutoScroll = ({
  speed,
  isScrolling,
  onProgress,
  onComplete
}: UseAutoScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const speedRef = useRef(speed);
  
  const [progress, setProgress] = useState(0);
  const [hasScrollable, setHasScrollable] = useState(false);

  // Mettre à jour la ref de vitesse quand la prop change
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Vérifier si l'élément est scrollable
  useEffect(() => {
    const checkScrollable = () => {
      const el = scrollRef.current;
      if (el) {
        const scrollable = el.scrollHeight > el.clientHeight;
        setHasScrollable(scrollable);
        
        // Calculer le progrès initial
        if (scrollable) {
          const maxScroll = el.scrollHeight - el.clientHeight;
          const currentProgress = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0;
          setProgress(currentProgress);
          onProgress?.(currentProgress);
        }
      }
    };

    checkScrollable();

    // Observer les changements de taille
    if (scrollRef.current && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(checkScrollable);
      resizeObserver.observe(scrollRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [onProgress]);

  // Fonction de défilement animé
  useEffect(() => {
    if (!isScrolling || !hasScrollable) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        lastTimestampRef.current = null;
      }
      return;
    }

    const scroll = (currentTime: number) => {
      const el = scrollRef.current;
      if (!el || !isScrolling) {
        animationRef.current = null;
        lastTimestampRef.current = null;
        return;
      }

      const maxScroll = el.scrollHeight - el.clientHeight;

      if (lastTimestampRef.current !== null) {
        const elapsed = currentTime - lastTimestampRef.current;
        const pixelsToScroll = (elapsed * speedRef.current) / 1000;

        const newScrollTop = Math.min(el.scrollTop + pixelsToScroll, maxScroll);
        el.scrollTop = newScrollTop;

        // Calculer et mettre à jour le progrès
        const currentProgress = maxScroll > 0 ? (newScrollTop / maxScroll) * 100 : 100;
        setProgress(currentProgress);
        onProgress?.(currentProgress);

        // Vérifier si on a atteint la fin
        if (newScrollTop >= maxScroll) {
          animationRef.current = null;
          lastTimestampRef.current = null;
          onComplete?.();
          return;
        }
      }

      lastTimestampRef.current = currentTime;
      animationRef.current = requestAnimationFrame(scroll);
    };

    // Réinitialiser le timestamp et commencer l'animation
    lastTimestampRef.current = null;
    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        lastTimestampRef.current = null;
      }
    };
  }, [isScrolling, hasScrollable, onProgress, onComplete]);

  // Fonctions utilitaires
  const scrollToTop = () => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 0;
      setProgress(0);
      onProgress?.(0);
    }
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = maxScroll;
      setProgress(100);
      onProgress?.(100);
    }
  };

  const scrollToPercentage = (percentage: number) => {
    const el = scrollRef.current;
    if (el) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      const targetScroll = (percentage / 100) * maxScroll;
      el.scrollTop = targetScroll;
      setProgress(percentage);
      onProgress?.(percentage);
    }
  };

  return {
    scrollRef,
    progress,
    hasScrollable,
    scrollToTop,
    scrollToBottom,
    scrollToPercentage
  };
};
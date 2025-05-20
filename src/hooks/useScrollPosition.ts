// src/hooks/useScrollPosition.ts
import { useEffect, useRef } from 'react';

interface UseScrollPositionProps {
  storageKey: string;
  isReading: boolean;
  autoSaveInterval?: number; // en millisecondes, défaut: 10000 (10 secondes)
}

/**
 * Hook personnalisé pour gérer la sauvegarde et la restauration
 * de la position de défilement dans localStorage
 */
export const useScrollPosition = ({
  storageKey,
  isReading,
  autoSaveInterval = 10000
}: UseScrollPositionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasRestoredRef = useRef(false);

  // Fonction pour sauvegarder la position
  const savePosition = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop > 0) {
      localStorage.setItem(storageKey, el.scrollTop.toString());
    }
  };

  // Fonction pour restaurer la position
  const restorePosition = () => {
    if (hasRestoredRef.current) return false;
    
    const el = scrollRef.current;
    const saved = localStorage.getItem(storageKey);
    
    if (el && saved) {
      const value = parseFloat(saved);
      if (!isNaN(value) && value > 0) {
        el.scrollTop = value;
        hasRestoredRef.current = true;
        return true;
      }
    }
    return false;
  };

  // Fonction pour effacer la position sauvegardée
  const clearPosition = () => {
    localStorage.removeItem(storageKey);
    hasRestoredRef.current = false;
  };

  // Effet pour la restauration initiale
  useEffect(() => {
    if (scrollRef.current && !hasRestoredRef.current) {
      // Petit délai pour s'assurer que le DOM est rendu
      setTimeout(() => {
        restorePosition();
      }, 100);
    }
  }, [storageKey]);

  // Effet pour la sauvegarde automatique
  useEffect(() => {
    if (!isReading) return;

    // Sauvegarde périodique
    const interval = setInterval(savePosition, autoSaveInterval);

    // Sauvegarde lors de la fermeture/actualisation de la page
    const handleBeforeUnload = () => savePosition();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      savePosition(); // Sauvegarde finale
    };
  }, [isReading, autoSaveInterval]);

  return {
    scrollRef,
    savePosition,
    restorePosition,
    clearPosition,
    hasRestored: hasRestoredRef.current
  };
};
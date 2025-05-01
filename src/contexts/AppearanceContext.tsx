// AppearanceContext.tsx - version améliorée avec force refresh
import React, { createContext, useState, useContext, useEffect } from 'react';

interface AppearanceContextType {
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  isSepiaMode: boolean;
  setIsSepiaMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
}

const defaultContext: AppearanceContextType = {
  fontSize: 100,
  setFontSize: () => {},
  isSepiaMode: false,
  setIsSepiaMode: () => {}
};

const AppearanceContext = createContext<AppearanceContextType>(defaultContext);

export const useAppearanceSettings = () => useContext(AppearanceContext);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialiser avec les valeurs de localStorage ou les valeurs par défaut
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? Number(saved) : 100;
  });
  
  const [isSepiaMode, setSepiaModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('sepiaMode');
    return saved === 'true';
  });

  // Wrapper pour setFontSize qui garantit une valeur numérique valide
  const setFontSize = (value: number | ((prev: number) => number)) => {
    setFontSizeState(prev => {
      const newSize = typeof value === 'function' ? value(prev) : value;
      // Limiter entre 70% et 150%
      return Math.max(70, Math.min(150, newSize));
    });
  };

  // Wrapper pour setIsSepiaMode
  const setIsSepiaMode = (value: boolean | ((prev: boolean) => boolean)) => {
    setSepiaModeState(typeof value === 'function' ? value(isSepiaMode) : value);
  };

  // Fonction pour forcer l'application des styles
  const forceStylesRefresh = () => {
    // Méthode 1: Mettre à jour la variable CSS
    document.documentElement.style.setProperty('--app-font-size-factor', `${fontSize}`);
    
    // Méthode 2: Ajouter/retirer une classe
    document.documentElement.classList.remove('font-size-updated');
    
    // Méthode 3: Forcer un nouveau contexte de formatage
    const tempStyles = document.createElement('style');
    document.head.appendChild(tempStyles);
    document.head.removeChild(tempStyles);
    
    // Méthode 4: Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
    requestAnimationFrame(() => {
      document.documentElement.classList.add('font-size-updated');
      
      // Méthode 5: Appliquer directement aux quotes si elles sont détectables
      const quotes = document.querySelectorAll('[dir="rtl"], .font-arabic, .quote-card p');
      quotes.forEach(quote => {
        if (quote instanceof HTMLElement) {
          quote.style.fontSize = `calc(1.3rem * ${fontSize} / 100)`;
        }
      });
      
      console.log('Font size refreshed to:', fontSize);
    });
  };

  // Appliquer les changements de taille de police
  useEffect(() => {
    // Enregistrer dans localStorage
    localStorage.setItem('fontSize', fontSize.toString());
    
    // Forcer l'application des styles
    forceStylesRefresh();
    
    // Répéter la mise à jour après un délai (pour les navigateurs problématiques)
    const timerId = setTimeout(() => {
      forceStylesRefresh();
    }, 100);
    
    return () => clearTimeout(timerId);
  }, [fontSize]);

  // Appliquer les changements de mode sépia
  useEffect(() => {
    localStorage.setItem('sepiaMode', isSepiaMode.toString());
    if (isSepiaMode) {
      document.documentElement.classList.add('sepia-mode');
    } else {
      document.documentElement.classList.remove('sepia-mode');
    }
  }, [isSepiaMode]);

  return (
    <AppearanceContext.Provider
      value={{
        fontSize,
        setFontSize,
        isSepiaMode,
        setIsSepiaMode
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};
// AppearanceContext.tsx
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
      // Assurer que la taille est entre 70% et 150%
      return Math.max(70, Math.min(150, newSize));
    });
  };

  // Wrapper pour setIsSepiaMode
  const setIsSepiaMode = (value: boolean | ((prev: boolean) => boolean)) => {
    setSepiaModeState(value);
  };

  // Appliquer les changements de taille de police
  useEffect(() => {
    console.log("Applying font size:", fontSize);
    localStorage.setItem('fontSize', fontSize.toString());
    
    // Appliquer directement au document pour s'assurer que ça fonctionne
    document.documentElement.style.setProperty('--app-font-size-factor', `${fontSize}%`);
    
    // Log pour vérifier que la valeur a bien été appliquée
    setTimeout(() => {
      const appliedValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--app-font-size-factor');
      console.log("Applied font size value:", appliedValue);
    }, 100);
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
// TransparentMenuTrigger.tsx - Bouton transparent permanent pour révéler le menu
import React from 'react';
import { ChevronUp } from 'lucide-react';

interface TransparentMenuTriggerProps {
  isMenuVisible: boolean;
  onClick: () => void;
}

export const TransparentMenuTrigger: React.FC<TransparentMenuTriggerProps> = ({
  isMenuVisible,
  onClick
}) => {
  if (isMenuVisible) return null; // Masquer quand le menu est visible

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      {/* Zone de trigger élargie */}
      <div 
        className="w-full h-16 flex items-end justify-center pointer-events-auto"
        onClick={onClick}
      >
        {/* Indicateur visuel discret */}
        <div className="mb-2 px-4 py-2 bg-black/10 backdrop-blur-sm rounded-full transition-all duration-300 hover:bg-black/20 active:scale-95">
          <div className="flex items-center gap-2">
            {/* Ligne indicatrice */}
            <div className="w-8 h-0.5 bg-white/60 rounded-full"></div>
            
            {/* Icône optionnelle */}
            <ChevronUp className="w-4 h-4 text-white/60" />
            
            {/* Ligne indicatrice */}
            <div className="w-8 h-0.5 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Variante encore plus minimale
export const MinimalMenuTrigger: React.FC<TransparentMenuTriggerProps> = ({
  isMenuVisible,
  onClick
}) => {
  if (isMenuVisible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 
                 w-12 h-1 bg-gray-400/50 rounded-full
                 hover:bg-gray-400/70 hover:h-1.5 
                 active:scale-95 transition-all duration-200"
      aria-label="إظهار القائمة"
    />
  );
};

// Variante avec pulse subtil
export const PulsingMenuTrigger: React.FC<TransparentMenuTriggerProps> = ({
  isMenuVisible,
  onClick
}) => {
  if (isMenuVisible) return null;

  return (
    <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-40">
      <button
        onClick={onClick}
        className="relative w-10 h-6 bg-gray-900/20 backdrop-blur-sm rounded-full
                   hover:bg-gray-900/30 active:scale-95 transition-all duration-200
                   flex items-center justify-center group"
        aria-label="إظهار القائمة"
      >
        {/* Indicateur central */}
        <div className="w-6 h-0.5 bg-white/60 rounded-full group-hover:w-7 transition-all duration-200"></div>
        
        {/* Animation pulse subtile */}
        <div className="absolute inset-0 bg-sky-500/20 rounded-full animate-pulse opacity-50"></div>
      </button>
    </div>
  );
};

// Variante style iOS - barre Home Indicator
export const IOSStyleTrigger: React.FC<TransparentMenuTriggerProps> = ({
  isMenuVisible,
  onClick
}) => {
  if (isMenuVisible) return null;

  return (
    <div className="fixed bottom-1 left-0 right-0 z-40 flex justify-center">
      <button
        onClick={onClick}
        className="w-32 h-1 bg-gray-900/30 rounded-full
                   hover:bg-gray-900/40 hover:h-1.5 hover:w-36
                   active:scale-95 transition-all duration-200"
        aria-label="إظهار القائمة"
        style={{
          // Zone de sécurité pour iPhone
          marginBottom: 'max(4px, env(safe-area-inset-bottom))'
        }}
      />
    </div>
  );
};
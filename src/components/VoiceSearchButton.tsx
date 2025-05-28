// components/VoiceSearchButton.tsx - Bouton de recherche vocale
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

interface VoiceSearchButtonProps {
  onVoiceResult: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onVoiceResult,
  disabled = false,
  className = ''
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const {
    isListening,
    transcript,
    error,
    isSupported,
    confidence,
    toggleListening,
    reset
  } = useVoiceSearch({
    onResult: (result) => {
      console.log('🎤 Résultat vocal reçu:', result);
      onVoiceResult(result);
      setShowTranscript(false);
    },
    onError: (errorMsg) => {
      console.error('🎤 Erreur vocale:', errorMsg);
    },
    language: 'ar-SA', // Arabe saoudien
    continuous: false,
    interimResults: true
  });

  // Animation du bouton pendant l'écoute
  useEffect(() => {
    if (isListening) {
      setAnimationClass('animate-pulse');
      setShowTranscript(true);
    } else {
      setAnimationClass('');
      // Garder la transcription visible un moment après l'arrêt
      setTimeout(() => {
        if (!isListening) {
          setShowTranscript(false);
        }
      }, 2000);
    }
  }, [isListening]);

  // Si pas supporté, ne pas afficher le bouton
  if (!isSupported || disabled) {
    return null;
  }

  const handleClick = () => {
    if (error) {
      reset();
    } else {
      toggleListening();
    }
  };

  // Déterminer l'icône et le style
  const getButtonContent = () => {
    if (error) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        className: 'text-red-500 hover:text-red-600 hover:bg-red-50',
        title: 'Erreur - Cliquer pour réessayer'
      };
    }
    
    if (isListening) {
      return {
        icon: <MicOff className="w-5 h-5" />,
        className: 'text-red-500 hover:text-red-600 bg-red-50',
        title: 'Arrêter l\'écoute'
      };
    }
    
    return {
      icon: <Mic className="w-5 h-5" />,
      className: 'text-blue-500 hover:text-blue-600 hover:bg-blue-50',
      title: 'Recherche vocale en arabe'
    };
  };

  const buttonContent = getButtonContent();

  return (
    <div className="relative">
      {/* Bouton principal */}
      <button
        onClick={handleClick}
        className={`
          p-2 rounded-full transition-all duration-200 
          ${buttonContent.className} 
          ${animationClass}
          ${className}
        `}
        title={buttonContent.title}
        aria-label={buttonContent.title}
      >
        {buttonContent.icon}
      </button>

      {/* Indicateur d'écoute active */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping">
          <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Popup de transcription en temps réel */}
      {showTranscript && (transcript || error) && (
        <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          {error ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">خطأ في التعرف على الصوت</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {isListening ? 'جاري الاستماع...' : 'تم الانتهاء'}
                </span>
                {confidence > 0 && (
                  <span className="text-xs text-gray-500">
                    ({Math.round(confidence * 100)}%)
                  </span>
                )}
              </div>
              
              {transcript && (
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800 font-arabic" dir="rtl">
                    {transcript}
                  </p>
                </div>
              )}
              
              {isListening && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-blue-400 rounded animate-pulse"></div>
                    <div className="w-1 h-4 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-2 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1 h-5 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  <span>تحدث الآن...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
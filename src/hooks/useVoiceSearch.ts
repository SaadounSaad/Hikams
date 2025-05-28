// hooks/useVoiceSearch.ts - Hook pour la recherche vocale en arabe
import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceSearchState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  confidence: number;
}

interface UseVoiceSearchOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export const useVoiceSearch = (options: UseVoiceSearchOptions = {}) => {
  const {
    onResult,
    onError,
    language = 'ar-SA', // Arabe saoudien par défaut
    continuous = false,
    interimResults = true,
    maxAlternatives = 3
  } = options;

  const [state, setState] = useState<VoiceSearchState>({
    isListening: false,
    transcript: '',
    error: null,
    isSupported: false,
    confidence: 0
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier le support de la reconnaissance vocale
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;
    
    setState(prev => ({ ...prev, isSupported }));

    if (isSupported) {
      const recognition = new SpeechRecognition();
      
      // Configuration pour l'arabe
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;
      
      // Événements
      recognition.onstart = () => {
        console.log('🎤 Reconnaissance vocale démarrée');
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: null,
          transcript: ''
        }));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        // Traiter tous les résultats
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        
        setState(prev => ({ 
          ...prev, 
          transcript: currentTranscript,
          confidence: maxConfidence || prev.confidence
        }));

        // Si on a un résultat final, l'envoyer au callback
        if (finalTranscript && onResult) {
          console.log('🎯 Transcription finale:', finalTranscript);
          onResult(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Erreur reconnaissance vocale:', event.error);
        
        let errorMessage = 'Erreur de reconnaissance vocale';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Aucune parole détectée. Réessayez.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone non accessible.';
            break;
          case 'not-allowed':
            errorMessage = 'Permission microphone refusée.';
            break;
          case 'network':
            errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Service de reconnaissance non autorisé.';
            break;
          case 'bad-grammar':
            errorMessage = 'Erreur de grammaire de reconnaissance.';
            break;
          case 'language-not-supported':
            errorMessage = 'Langue arabe non supportée par ce navigateur.';
            break;
        }

        setState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isListening: false
        }));

        if (onError) {
          onError(errorMessage);
        }
      };

      recognition.onend = () => {
        console.log('🔇 Reconnaissance vocale terminée');
        setState(prev => ({ ...prev, isListening: false }));
        
        // Nettoyer le timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, continuous, interimResults, maxAlternatives, onResult, onError]);

  // Démarrer la reconnaissance
  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      // Réinitialiser l'état
      setState(prev => ({ 
        ...prev, 
        error: null, 
        transcript: '',
        confidence: 0
      }));

      recognitionRef.current.start();

      // Timeout de sécurité (10 secondes max)
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);

    } catch (error) {
      console.error('Erreur démarrage reconnaissance:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Impossible de démarrer la reconnaissance vocale'
      }));
    }
  }, [state.isListening]);

  // Arrêter la reconnaissance
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [state.isListening]);

  // Basculer l'écoute
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    stopListening();
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      error: null,
      confidence: 0
    }));
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    reset
  };
};

// Types globaux pour TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
// src/types/speech-recognition-extended.d.ts
// Extensions aux types officiels @types/dom-speech-recognition

// Étendre les types officiels avec nos fonctionnalités personnalisées
import 'dom-speech-recognition';

// ===========================================
// EXTENSIONS POUR NOTRE APPLICATION
// ===========================================

// Permissions API (pas dans les types officiels)
declare global {
  interface Navigator {
    permissions?: Permissions;
  }

  interface Permissions {
    query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
  }

  interface PermissionDescriptor {
    name: string;
  }

  interface PermissionStatus extends EventTarget {
    readonly name: string;
    readonly state: PermissionState;
    onchange: ((this: PermissionStatus, ev: Event) => any) | null;
  }

  type PermissionState = "granted" | "denied" | "prompt";
}

// ===========================================
// TYPES SPÉCIFIQUES À NOTRE APPLICATION
// ===========================================

export interface VoiceSearchConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  sensitivity: 'low' | 'medium' | 'high';
  timeout: number;
}

export interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  alternatives: string[];
  isFinal: boolean;
  language: string;
  timestamp: Date;
}

export interface VoiceSearchError {
  code: string;
  message: string;
  timestamp: Date;
  context?: string;
}

export interface VoiceSearchState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  confidence: number;
}

// Dialectes arabes supportés
export const ARABIC_DIALECTS = {
  'ar-SA': { name: 'العربية السعودية', flag: '🇸🇦', region: 'Golfe' },
  'ar-EG': { name: 'العربية المصرية', flag: '🇪🇬', region: 'Égypte' },
  'ar-MA': { name: 'العربية المغربية', flag: '🇲🇦', region: 'Maghreb' },
  'ar-AE': { name: 'العربية الإماراتية', flag: '🇦🇪', region: 'Golfe' },
  'ar-LB': { name: 'العربية اللبنانية', flag: '🇱🇧', region: 'Levant' },
  'ar-SY': { name: 'العربية السورية', flag: '🇸🇾', region: 'Levant' },
  'ar-JO': { name: 'العربية الأردنية', flag: '🇯🇴', region: 'Levant' },
  'ar-IQ': { name: 'العربية العراقية', flag: '🇮🇶', region: 'Mésopotamie' },
  'ar-DZ': { name: 'العربية الجزائرية', flag: '🇩🇿', region: 'Maghreb' },
  'ar-TN': { name: 'العربية التونسية', flag: '🇹🇳', region: 'Maghreb' }
} as const;

export type ArabicDialectCode = keyof typeof ARABIC_DIALECTS;

// ===========================================
// FONCTIONS UTILITAIRES
// ===========================================

// Vérifier le support du navigateur
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
         ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Factory pour créer une instance de SpeechRecognition
export function createSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  
  if ('SpeechRecognition' in window) {
    return new window.SpeechRecognition();
  } else if ('webkitSpeechRecognition' in window) {
    return new window.webkitSpeechRecognition();
  }
  return null;
}

// Vérifier les permissions microphone
export async function checkMicrophonePermission(): Promise<PermissionState> {
  if (typeof window === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }
  
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' });
    return permission.state;
  } catch (error) {
    console.warn('Impossible de vérifier les permissions microphone:', error);
    return 'prompt';
  }
}

// Demander l'accès au microphone
export async function requestMicrophoneAccess(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Accès microphone refusé:', error);
    return false;
  }
}

// Vérifier si HTTPS est actif
export function isHTTPS(): boolean {
  return typeof window !== 'undefined' && 
         (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
}

// Messages d'erreur localisés en arabe
export const ARABIC_ERROR_MESSAGES: Record<string, string> = {
  'no-speech': 'لم يتم سماع صوت واضح. حاول مرة أخرى.',
  'audio-capture': 'لا يمكن الوصول إلى الميكروفون.',
  'not-allowed': 'يرجى السماح بالوصول إلى الميكروفون.',
  'network': 'مشكلة في الاتصال بالإنترنت.',
  'service-not-allowed': 'خدمة التعرف على الصوت غير متاحة.',
  'bad-grammar': 'خطأ في قواعد التعرف على الصوت.',
  'language-not-supported': 'اللغة العربية غير مدعومة في هذا المتصفح.',
  'aborted': 'تم إلغاء التعرف على الصوت.'
};

// Diagnostics complets
export interface VoiceDiagnostics {
  speechRecognitionSupported: boolean;
  microphonePermission: PermissionState;
  httpsRequired: boolean;
  browserCompatible: boolean;
  audioContextSupported: boolean;
  recommendedBrowser: string;
}

export async function runVoiceDiagnostics(): Promise<VoiceDiagnostics> {
  const userAgent = navigator.userAgent;
  let recommendedBrowser = 'Chrome';
  
  if (userAgent.includes('Chrome')) recommendedBrowser = 'Chrome (actuel)';
  else if (userAgent.includes('Edge')) recommendedBrowser = 'Edge (actuel)';
  else if (userAgent.includes('Safari')) recommendedBrowser = 'Safari (support limité)';
  else if (userAgent.includes('Firefox')) recommendedBrowser = 'Chrome (Firefox non supporté)';
  
  return {
    speechRecognitionSupported: isSpeechRecognitionSupported(),
    microphonePermission: await checkMicrophonePermission(),
    httpsRequired: isHTTPS(),
    browserCompatible: /Chrome|Chromium|Edge/.test(userAgent),
    audioContextSupported: 'AudioContext' in window || 'webkitAudioContext' in window,
    recommendedBrowser
  };
}

// Configuration optimale par dialecte
export function getOptimalConfigForDialect(dialect: ArabicDialectCode): Partial<VoiceSearchConfig> {
  const configs: Record<ArabicDialectCode, Partial<VoiceSearchConfig>> = {
    'ar-SA': { sensitivity: 'medium', maxAlternatives: 3 },
    'ar-EG': { sensitivity: 'high', maxAlternatives: 5 },
    'ar-MA': { sensitivity: 'high', maxAlternatives: 4 },
    'ar-AE': { sensitivity: 'medium', maxAlternatives: 3 },
    'ar-LB': { sensitivity: 'high', maxAlternatives: 4 },
    'ar-SY': { sensitivity: 'high', maxAlternatives: 4 },
    'ar-JO': { sensitivity: 'medium', maxAlternatives: 3 },
    'ar-IQ': { sensitivity: 'high', maxAlternatives: 4 },
    'ar-DZ': { sensitivity: 'high', maxAlternatives: 5 },
    'ar-TN': { sensitivity: 'high', maxAlternatives: 5 }
  };
  
  return configs[dialect] || configs['ar-SA'];
}
// utils/voiceSearchEnhanced.ts - Fonctionnalités avancées

// 1. SUPPORT MULTI-DIALECTES ARABES
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
};

// 2. AMÉLIORATION DE LA PRÉCISION AVEC CONTEXTE
export interface VoiceSearchContext {
  expectedTerms?: string[]; // Termes probables dans le contexte
  category: string;
  previousSearches?: string[];
  userPreferences?: {
    preferredDialect: keyof typeof ARABIC_DIALECTS;
    sensitivityLevel: 'low' | 'medium' | 'high';
  };
}

export class ArabicVoiceProcessor {
  private context: VoiceSearchContext;
  private commonTerms: string[] = [
    'الله', 'محمد', 'الإسلام', 'القرآن', 'الحديث', 'النبي', 'الصلاة', 'الزكاة',
    'الحج', 'الصوم', 'الجنة', 'النار', 'الدعاء', 'التوبة', 'الإيمان', 'الأخلاق'
  ];

  constructor(context: VoiceSearchContext) {
    this.context = context;
  }

  // Améliorer la transcription avec le contexte
  enhanceTranscription(rawTranscript: string, alternatives: string[] = []): string {
    let bestTranscript = rawTranscript;
    let bestScore = this.scoreTranscript(rawTranscript);

    // Tester les alternatives
    alternatives.forEach(alt => {
      const score = this.scoreTranscript(alt);
      if (score > bestScore) {
        bestTranscript = alt;
        bestScore = score;
      }
    });

    // Post-traitement contextuel
    return this.postProcessTranscript(bestTranscript);
  }

  private scoreTranscript(transcript: string): number {
    let score = 0;
    const words = transcript.split(' ');

    // Score basé sur les termes communs
    words.forEach(word => {
      if (this.commonTerms.includes(word)) {
        score += 10;
      }
      if (this.context.expectedTerms?.includes(word)) {
        score += 20;
      }
    });

    // Score basé sur les recherches précédentes
    if (this.context.previousSearches) {
      this.context.previousSearches.forEach(prev => {
        const similarity = this.calculateSimilarity(transcript, prev);
        score += similarity * 5;
      });
    }

    return score;
  }

  private postProcessTranscript(transcript: string): string {
    // Corrections communes de reconnaissance vocale en arabe
    const corrections: Record<string, string> = {
      'الا': 'إلا',
      'انشاء الله': 'إن شاء الله',
      'اللة': 'الله',
      'محمد': 'محمد',
      'قران': 'قرآن',
      'صلاة': 'صلاة',
      'زكاة': 'زكاة'
    };

    let corrected = transcript;
    Object.entries(corrections).forEach(([wrong, correct]) => {
      corrected = corrected.replace(new RegExp(wrong, 'g'), correct);
    });

    return corrected.trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Algorithme simple de similarité (Levenshtein distance)
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    return 1 - (distance / Math.max(str1.length, str2.length));
  }
}

// 3. COMPOSANT SÉLECTEUR DE DIALECTE
import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';

interface DialectSelectorProps {
  selectedDialect: keyof typeof ARABIC_DIALECTS;
  onDialectChange: (dialect: keyof typeof ARABIC_DIALECTS) => void;
  className?: string;
}

export const DialectSelector: React.FC<DialectSelectorProps> = ({
  selectedDialect,
  onDialectChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        title="اختر اللهجة"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="font-arabic">
          {ARABIC_DIALECTS[selectedDialect].flag} {ARABIC_DIALECTS[selectedDialect].name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 font-medium px-3 py-2 border-b">
              اختر اللهجة المناسبة لك
            </div>
            
            {Object.entries(ARABIC_DIALECTS).map(([code, info]) => (
              <button
                key={code}
                onClick={() => {
                  onDialectChange(code as keyof typeof ARABIC_DIALECTS);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${
                  selectedDialect === code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{info.flag}</span>
                <div className="flex-1 text-right">
                  <div className="font-arabic font-medium">{info.name}</div>
                  <div className="text-xs text-gray-500">{info.region}</div>
                </div>
                {selectedDialect === code && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. STATISTIQUES ET ANALYTICS VOCALES
export interface VoiceSearchStats {
  totalSearches: number;
  successRate: number;
  averageConfidence: number;
  mostUsedTerms: Array<{ term: string; count: number }>;
  dialectUsage: Record<string, number>;
  errorTypes: Record<string, number>;
}

export class VoiceSearchAnalytics {
  private stats: VoiceSearchStats = {
    totalSearches: 0,
    successRate: 0,
    averageConfidence: 0,
    mostUsedTerms: [],
    dialectUsage: {},
    errorTypes: {}
  };

  recordSearch(result: {
    transcript: string;
    confidence: number;
    dialect: string;
    success: boolean;
    error?: string;
  }) {
    this.stats.totalSearches++;
    
    // Taux de succès
    const successCount = this.stats.successRate * (this.stats.totalSearches - 1) + (result.success ? 1 : 0);
    this.stats.successRate = successCount / this.stats.totalSearches;
    
    // Confiance moyenne
    const totalConfidence = this.stats.averageConfidence * (this.stats.totalSearches - 1) + result.confidence;
    this.stats.averageConfidence = totalConfidence / this.stats.totalSearches;
    
    // Usage des dialectes
    this.stats.dialectUsage[result.dialect] = (this.stats.dialectUsage[result.dialect] || 0) + 1;
    
    // Termes les plus utilisés
    if (result.success) {
      const words = result.transcript.split(' ');
      words.forEach(word => {
        if (word.length > 2) {
          const existing = this.stats.mostUsedTerms.find(t => t.term === word);
          if (existing) {
            existing.count++;
          } else {
            this.stats.mostUsedTerms.push({ term: word, count: 1 });
          }
        }
      });
      
      // Trier par fréquence
      this.stats.mostUsedTerms.sort((a, b) => b.count - a.count);
      this.stats.mostUsedTerms = this.stats.mostUsedTerms.slice(0, 20);
    }
    
    // Types d'erreurs
    if (result.error) {
      this.stats.errorTypes[result.error] = (this.stats.errorTypes[result.error] || 0) + 1;
    }
  }

  getStats(): VoiceSearchStats {
    return { ...this.stats };
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.stats.successRate < 0.7) {
      recommendations.push('حاول التحدث في مكان هادئ لتحسين دقة التعرف');
    }
    
    if (this.stats.averageConfidence < 0.8) {
      recommendations.push('تحدث بوضوح وببطء أكثر');
    }
    
    const mostUsedDialect = Object.entries(this.stats.dialectUsage)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostUsedDialect) {
      recommendations.push(`يبدو أنك تستخدم ${ARABIC_DIALECTS[mostUsedDialect[0] as keyof typeof ARABIC_DIALECTS]?.name} بكثرة`);
    }
    
    return recommendations;
  }
}

// 5. AMÉLIORATION CONTINUE AVEC MACHINE LEARNING
export class VoiceSearchLearner {
  private userCorrections: Array<{
    original: string;
    corrected: string;
    timestamp: Date;
  }> = [];

  recordCorrection(original: string, corrected: string) {
    this.userCorrections.push({
      original,
      corrected,
      timestamp: new Date()
    });
    
    // Garder seulement les 100 dernières corrections
    if (this.userCorrections.length > 100) {
      this.userCorrections = this.userCorrections.slice(-100);
    }
  }

  getPersonalizedCorrections(): Record<string, string> {
    const corrections: Record<string, string> = {};
    
    // Analyser les patterns de correction de l'utilisateur
    this.userCorrections.forEach(({ original, corrected }) => {
      if (original !== corrected) {
        corrections[original] = corrected;
      }
    });
    
    return corrections;
  }

  suggestImprovement(transcript: string): string {
    const personalCorrections = this.getPersonalizedCorrections();
    let improved = transcript;
    
    Object.entries(personalCorrections).forEach(([wrong, correct]) => {
      improved = improved.replace(new RegExp(wrong, 'gi'), correct);
    });
    
    return improved;
  }
}
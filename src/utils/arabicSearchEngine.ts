// utils/arabicSearchEngine.ts
import { Quote } from '../types';

/**
 * Dictionnaire de synonymes arabes de base
 * Peut être étendu selon vos besoins spécifiques
 */
const ARABIC_SYNONYMS: Record<string, string[]> = {
  // Concepts spirituels
  'الله': ['رب', 'خالق', 'المولى', 'الإله', 'الرحمن', 'الرحيم'],
  'رب': ['الله', 'خالق', 'المولى', 'الإله'],
  'دين': ['إسلام', 'عقيدة', 'إيمان', 'شريعة'],
  'إيمان': ['عقيدة', 'تصديق', 'يقين', 'اعتقاد'],
  'تقوى': ['خشية', 'ورع', 'زهد', 'عبادة'],
  
  // Concepts moraux
  'خير': ['نفع', 'صلاح', 'بر', 'إحسان', 'معروف'],
  'شر': ['ضر', 'فساد', 'سوء', 'منكر'],
  'عدل': ['إنصاف', 'قسط', 'حق', 'عدالة'],
  'ظلم': ['جور', 'عدوان', 'بغي', 'اعتداء'],
  'صبر': ['احتمال', 'تحمل', 'مقاومة', 'ثبات'],
  
  // Concepts de sagesse
  'حكمة': ['عقل', 'فهم', 'بصيرة', 'رشد', 'هدى'],
  'علم': ['معرفة', 'فهم', 'إدراك', 'وعي', 'فقه'],
  'جهل': ['غفلة', 'ضلال', 'عمى', 'سفه'],
  'هدى': ['رشد', 'صواب', 'طريق', 'نور'],
  
  // États d'âme
  'سعادة': ['فرح', 'سرور', 'بهجة', 'غبطة'],
  'حزن': ['غم', 'هم', 'كرب', 'أسى'],
  'خوف': ['فزع', 'رهبة', 'وجل', 'قلق'],
  'أمل': ['رجاء', 'تفاؤل', 'طمع', 'توقع'],
  
  // Concepts temporels
  'دنيا': ['حياة', 'عالم', 'أرض'],
  'آخرة': ['قيامة', 'يوم الدين', 'معاد'],
  'موت': ['وفاة', 'منية', 'أجل', 'مصير'],
  'حياة': ['عيش', 'وجود', 'بقاء'],
  
  // Relations humaines
  'محبة': ['حب', 'ود', 'مودة', 'عشق'],
  'صداقة': ['أخوة', 'رفقة', 'صحبة'],
  'عداوة': ['بغض', 'كره', 'شحناء'],
  'كرم': ['جود', 'سخاء', 'عطاء', 'بذل'],
  'بخل': ['شح', 'إمساك', 'ضن']
};

/**
 * Racines arabes communes et leurs dérivés
 * Version simplifiée - peut être étendue avec une vraie base de données de racines
 */
const ARABIC_ROOTS: Record<string, string[]> = {
  'كتب': ['كتب', 'كاتب', 'مكتوب', 'كتابة', 'مكتبة', 'كتاب'],
  'علم': ['علم', 'عالم', 'معلم', 'تعلم', 'تعليم', 'عليم'],
  'حكم': ['حكم', 'حاكم', 'محكوم', 'حكمة', 'حكيم'],
  'صبر': ['صبر', 'صابر', 'مصبور', 'صبور', 'اصطبر'],
  'شكر': ['شكر', 'شاكر', 'مشكور', 'شكور', 'اشتكر'],
  'حمد': ['حمد', 'حامد', 'محمود', 'حميد', 'احتمد'],
  'قرأ': ['قرأ', 'قارئ', 'مقروء', 'قراءة', 'قرآن'],
  'فهم': ['فهم', 'فاهم', 'مفهوم', 'فهيم', 'تفهم'],
  'وعظ': ['وعظ', 'واعظ', 'موعظة', 'وعاظ', 'اتعظ'],
  'نصح': ['نصح', 'ناصح', 'منصوح', 'نصيحة', 'انتصح']
};

/**
 * Fonctions utilitaires pour le traitement de l'arabe
 */
class ArabicTextProcessor {
  
  /**
   * Normalise le texte arabe pour la recherche
   */
  static normalize(text: string): string {
    if (!text) return '';
    
    return text
      // Supprimer les diacritiques (tashkeel)
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      // Normaliser les variantes de alef
      .replace(/[آأإ]/g, 'ا')
      // Normaliser les variantes de ya
      .replace(/[ئى]/g, 'ي')
      // Normaliser les variantes de ta marbouta
      .replace(/ة/g, 'ه')
      // Supprimer les espaces multiples et trimmer
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Extrait les mots arabes d'un texte
   */
  static extractArabicWords(text: string): string[] {
    if (!text) return [];
    
    const normalized = this.normalize(text);
    // Regex pour identifier les mots arabes (au moins 2 caractères)
    const arabicWordRegex = /[\u0600-\u06FF]{2,}/g;
    return normalized.match(arabicWordRegex) || [];
  }

  /**
   * Trouve la racine probable d'un mot (méthode simplifiée)
   */
  static findPossibleRoot(word: string): string[] {
    if (!word) return [];
    
    const roots: string[] = [];
    
    // Recherche directe dans notre dictionnaire de racines
    for (const [root, derivatives] of Object.entries(ARABIC_ROOTS)) {
      if (derivatives.some(der => this.normalize(der) === this.normalize(word))) {
        roots.push(root);
      }
    }
    
    // Si pas trouvé, essayer une extraction basique (3 premières consonnes)
    if (roots.length === 0 && word.length >= 3) {
      const consonants = word.replace(/[اوي]/g, '');
      if (consonants.length >= 3) {
        roots.push(consonants.substring(0, 3));
      }
    }
    
    return roots;
  }

  /**
   * Trouve les synonymes d'un mot
   */
  static findSynonyms(word: string): string[] {
    if (!word) return [];
    
    const normalizedWord = this.normalize(word);
    const synonyms: Set<string> = new Set();
    
    // Recherche directe
    if (ARABIC_SYNONYMS[normalizedWord]) {
      ARABIC_SYNONYMS[normalizedWord].forEach(syn => synonyms.add(syn));
    }
    
    // Recherche inverse (si le mot est synonyme d'un autre)
    for (const [key, syns] of Object.entries(ARABIC_SYNONYMS)) {
      if (syns.some(syn => this.normalize(syn) === normalizedWord)) {
        synonyms.add(key);
        syns.forEach(syn => synonyms.add(syn));
      }
    }
    
    return Array.from(synonyms);
  }
}

/**
 * Moteur de recherche sémantique pour l'arabe
 */
export class ArabicSemanticSearch {
  private quotes: Quote[];
  private searchIndex: Map<string, Set<number>> = new Map();
  
  constructor(quotes: Quote[]) {
    this.quotes = quotes || [];
    this.buildSearchIndex();
  }

  /**
   * Construit l'index de recherche pour optimiser les performances
   */
  private buildSearchIndex(): void {
    if (!this.quotes || this.quotes.length === 0) {
      console.log('⚠️ Aucune quote à indexer');
      return;
    }

    console.time('Building Arabic Search Index');
    
    this.quotes.forEach((quote, index) => {
      if (!quote || !quote.text) return;
      
      const words = ArabicTextProcessor.extractArabicWords(quote.text);
      
      words.forEach(word => {
        // Index le mot lui-même
        this.addToIndex(word, index);
        
        // Index les synonymes
        const synonyms = ArabicTextProcessor.findSynonyms(word);
        synonyms.forEach(synonym => this.addToIndex(synonym, index));
        
        // Index les mots de la même racine
        const roots = ArabicTextProcessor.findPossibleRoot(word);
        roots.forEach(root => {
          if (ARABIC_ROOTS[root]) {
            ARABIC_ROOTS[root].forEach(derivative => 
              this.addToIndex(derivative, index)
            );
          }
        });
      });
    });
    
    console.timeEnd('Building Arabic Search Index');
    console.log(`Index construit: ${this.searchIndex.size} entrées uniques pour ${this.quotes.length} quotes`);
  }

  /**
   * Ajoute une entrée à l'index
   */
  private addToIndex(word: string, quoteIndex: number): void {
    if (!word) return;
    
    const normalizedWord = ArabicTextProcessor.normalize(word);
    if (!this.searchIndex.has(normalizedWord)) {
      this.searchIndex.set(normalizedWord, new Set());
    }
    this.searchIndex.get(normalizedWord)!.add(quoteIndex);
  }

  /**
   * Calcule la pertinence d'une citation pour une requête
   */
  private calculateRelevance(quote: Quote, searchTerms: string[]): number {
    if (!quote || !quote.text || !searchTerms || searchTerms.length === 0) return 0;
    
    const normalizedText = ArabicTextProcessor.normalize(quote.text);
    let score = 0;
    
    searchTerms.forEach(term => {
      const normalizedTerm = ArabicTextProcessor.normalize(term);
      
      // Correspondance exacte (score élevé)
      if (normalizedText.includes(normalizedTerm)) {
        score += 10;
      }
      
      // Correspondance partielle (préfixe/suffixe)
      const words = normalizedText.split(' ');
      words.forEach(word => {
        if (word.startsWith(normalizedTerm) || word.endsWith(normalizedTerm)) {
          score += 5;
        }
      });
      
      // Bonus pour les synonymes trouvés
      const synonyms = ArabicTextProcessor.findSynonyms(normalizedTerm);
      synonyms.forEach(synonym => {
        if (normalizedText.includes(ArabicTextProcessor.normalize(synonym))) {
          score += 7;
        }
      });
    });
    
    // Bonus pour les citations courtes (plus focalisées)
    if (quote.text.length < 100) score += 2;
    if (quote.text.length < 50) score += 3;
    
    return score;
  }

  /**
   * Recherche sémantique principale
   */
  search(query: string, options: {
    maxResults?: number;
    minScore?: number;
    includeExact?: boolean;
    includeSemantic?: boolean;
  } = {}): Quote[] {
    const {
      maxResults = 50,
      minScore = 1,
      includeExact = true,
      includeSemantic = true
    } = options;

    if (!query || !query.trim() || !this.quotes || this.quotes.length === 0) {
      return [];
    }

    console.time('Arabic Semantic Search');
    
    const searchTerms = ArabicTextProcessor.extractArabicWords(query);
    if (searchTerms.length === 0) {
      console.timeEnd('Arabic Semantic Search');
      return [];
    }
    
    const candidateIndices = new Set<number>();
    
    // Collecte des candidats via l'index
    searchTerms.forEach(term => {
      const normalizedTerm = ArabicTextProcessor.normalize(term);
      
      // Recherche exacte
      if (includeExact && this.searchIndex.has(normalizedTerm)) {
        this.searchIndex.get(normalizedTerm)!.forEach(idx => 
          candidateIndices.add(idx)
        );
      }
      
      // Recherche sémantique (synonymes + racines)
      if (includeSemantic) {
        // Synonymes
        const synonyms = ArabicTextProcessor.findSynonyms(normalizedTerm);
        synonyms.forEach(synonym => {
          const normalizedSynonym = ArabicTextProcessor.normalize(synonym);
          if (this.searchIndex.has(normalizedSynonym)) {
            this.searchIndex.get(normalizedSynonym)!.forEach(idx => 
              candidateIndices.add(idx)
            );
          }
        });
        
        // Racines
        const roots = ArabicTextProcessor.findPossibleRoot(normalizedTerm);
        roots.forEach(root => {
          if (ARABIC_ROOTS[root]) {
            ARABIC_ROOTS[root].forEach(derivative => {
              const normalizedDerivative = ArabicTextProcessor.normalize(derivative);
              if (this.searchIndex.has(normalizedDerivative)) {
                this.searchIndex.get(normalizedDerivative)!.forEach(idx => 
                  candidateIndices.add(idx)
                );
              }
            });
          }
        });
      }
    });

    // Calcul des scores et tri
    const results = Array.from(candidateIndices)
      .filter(index => index < this.quotes.length && this.quotes[index]) // Vérification de sécurité
      .map(index => ({
        quote: this.quotes[index],
        score: this.calculateRelevance(this.quotes[index], searchTerms)
      }))
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => result.quote);

    console.timeEnd('Arabic Semantic Search');
    console.log(`Recherche "${query}": ${results.length} résultats trouvés`);
    
    return results;
  }

  /**
   * Suggestions de recherche basées sur l'index
   */
  getSuggestions(partialQuery: string, maxSuggestions: number = 5): string[] {
    if (!partialQuery || partialQuery.length < 2 || this.searchIndex.size === 0) {
      return [];
    }
    
    const normalizedQuery = ArabicTextProcessor.normalize(partialQuery);
    const suggestions: string[] = [];
    
    for (const [word] of this.searchIndex) {
      if (word.startsWith(normalizedQuery) && suggestions.length < maxSuggestions) {
        suggestions.push(word);
      }
    }
    
    return suggestions;
  }

  /**
   * Mise à jour de l'index lors de l'ajout de nouvelles citations
   */
  updateIndex(newQuotes: Quote[]): void {
    this.quotes = newQuotes || [];
    this.searchIndex.clear();
    this.buildSearchIndex();
  }
}

/**
 * Hook personnalisé pour utiliser la recherche sémantique
 */
import { useState, useEffect, useCallback } from 'react';

export function useArabicSemanticSearch(quotes: Quote[]) {
  const [searchEngine, setSearchEngine] = useState<ArabicSemanticSearch | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    // Vérification de sécurité : ne pas indexer si les quotes ne sont pas prêtes
    if (!quotes || quotes.length === 0) {
      console.log('🔍 Quotes non disponibles pour indexation');
      setSearchEngine(null);
      setIsIndexing(false);
      return;
    }
    
    setIsIndexing(true);
    console.log(`🔍 Début indexation de ${quotes.length} quotes`);
    
    // Création asynchrone pour ne pas bloquer l'UI
    const timer = setTimeout(() => {
      try {
        const engine = new ArabicSemanticSearch(quotes);
        setSearchEngine(engine);
        console.log('✅ Indexation terminée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'indexation:', error);
        setSearchEngine(null);
      } finally {
        setIsIndexing(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [quotes]);

  const search = useCallback((query: string, options = {}) => {
    if (!searchEngine) {
      console.log('🔍 Moteur de recherche non initialisé');
      return [];
    }
    return searchEngine.search(query, options);
  }, [searchEngine]);

  const getSuggestions = useCallback((query: string, maxSuggestions = 5) => {
    if (!searchEngine) return [];
    return searchEngine.getSuggestions(query, maxSuggestions);
  }, [searchEngine]);

  return {
    search,
    getSuggestions,
    isIndexing,
    isReady: !!searchEngine && !isIndexing
  };
}
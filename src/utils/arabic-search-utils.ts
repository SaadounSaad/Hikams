/**
 * Utilitaires pour la recherche en arabe optimisés
 * 
 * Ce fichier contient des fonctions pour normaliser et comparer du texte arabe
 * afin d'améliorer la recherche dans l'application Hikams.
 */

/**
 * Normalise le texte arabe en:
 * - Supprimant les diacritiques (tashkeel)
 * - Normalisant les différentes formes d'alif (أ إ آ ا)
 * - Normalisant les différentes formes de yaa (ي ى)
 * - Normalisant les différentes formes de taa (ت ة)
 * - Convertissant en minuscules
 * - Supprimant les espaces multiples
 * 
 * @param text Le texte à normaliser
 * @returns Le texte normalisé
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  return text
    // Convertir en minuscules (pour les caractères non-arabes)
    .toLowerCase()
    
    // Supprimer les diacritiques (tashkeel) - étendu
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    
    // Normaliser toutes les formes d'alif vers alif simple (ا)
    .replace(/[أإآٱ]/g, 'ا')
    
    // Normaliser yaa final (ى) vers yaa standard (ي)
    .replace(/[ىئ]/g, 'ي')
    
    // Normaliser taa marbouta (ة) vers haa (ه) ou taa (ت) selon le contexte
    .replace(/ة/g, 'ه')
    
    // Normaliser waw avec hamza (ؤ) vers waw (و)
    .replace(/ؤ/g, 'و')
    
    // Normaliser les espaces multiples en un seul espace
    .replace(/\s+/g, ' ')
    
    // Supprimer les espaces en début et fin
    .trim();
}

/**
 * Vérifie si un texte contient un terme de recherche, en tenant compte
 * de la normalisation arabe et de la recherche floue.
 * 
 * @param text Le texte dans lequel chercher
 * @param searchTerm Le terme à rechercher
 * @param fuzzy Activer la recherche floue (par défaut: true)
 * @returns true si le terme est trouvé, false sinon
 */
export function arabicTextContains(
  text: string, 
  searchTerm: string, 
  fuzzy: boolean = true
): boolean {
  if (!text || !searchTerm) return false;
  
  const normalizedText = normalizeArabicText(text);
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  
  // Recherche exacte d'abord
  if (normalizedText.includes(normalizedSearchTerm)) {
    return true;
  }
  
  // Si la recherche floue est activée, essayer des variantes
  if (fuzzy && normalizedSearchTerm.length > 2) {
    // Diviser le terme de recherche en mots
    const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 1);
    
    // Vérifier si tous les mots sont présents (dans n'importe quel ordre)
    if (searchWords.length > 1) {
      return searchWords.every(word => normalizedText.includes(word));
    }
    
    // Pour un seul mot, essayer des recherches partielles
    if (searchWords.length === 1) {
      const word = searchWords[0];
      
      // Recherche par préfixe (au moins 3 caractères)
      if (word.length >= 3) {
        const words = normalizedText.split(/\s+/);
        return words.some(textWord => textWord.startsWith(word));
      }
    }
  }
  
  return false;
}

/**
 * Surligne les occurrences d'un terme de recherche dans un texte.
 * Prend en compte la normalisation arabe pour trouver les correspondances,
 * mais préserve le texte original dans le résultat.
 * 
 * @param text Le texte original
 * @param searchTerm Le terme à surligner
 * @returns Un tableau de segments de texte avec des marqueurs pour le surlignage
 */
export function highlightSearchTerm(
  text: string, 
  searchTerm: string
): { text: string, isHighlighted: boolean }[] {
  if (!text || !searchTerm || searchTerm.trim() === '') {
    return [{ text, isHighlighted: false }];
  }
  
  const normalizedText = normalizeArabicText(text);
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  
  if (!normalizedText.includes(normalizedSearchTerm)) {
    return [{ text, isHighlighted: false }];
  }
  
  const result: { text: string, isHighlighted: boolean }[] = [];
  let lastIndex = 0;
  let searchIndex = 0;
  
  // Trouver toutes les occurrences du terme normalisé
  while ((searchIndex = normalizedText.indexOf(normalizedSearchTerm, lastIndex)) !== -1) {
    // Ajouter le texte avant la correspondance
    if (searchIndex > lastIndex) {
      result.push({
        text: text.substring(lastIndex, searchIndex),
        isHighlighted: false
      });
    }
    
    // Trouver la correspondance dans le texte original
    // Ceci est complexe car la normalisation peut changer la longueur
    const matchLength = findOriginalMatchLength(
      text, 
      searchIndex, 
      normalizedSearchTerm.length
    );
    
    result.push({
      text: text.substring(searchIndex, searchIndex + matchLength),
      isHighlighted: true
    });
    
    lastIndex = searchIndex + matchLength;
  }
  
  // Ajouter le reste du texte après la dernière correspondance
  if (lastIndex < text.length) {
    result.push({
      text: text.substring(lastIndex),
      isHighlighted: false
    });
  }
  
  return result;
}

/**
 * Fonction auxiliaire pour trouver la longueur de correspondance dans le texte original
 */
function findOriginalMatchLength(
  originalText: string, 
  startIndex: number, 
  normalizedLength: number
): number {
  // Pour simplifier, on utilise la longueur du terme de recherche original
  // Une implémentation plus sophistiquée pourrait mapper précisément
  // les positions entre le texte original et normalisé
  let length = normalizedLength;
  
  // Ajuster si on dépasse la longueur du texte original
  if (startIndex + length > originalText.length) {
    length = originalText.length - startIndex;
  }
  
  return Math.max(1, length);
}

/**
 * Compte le nombre d'occurrences d'un terme de recherche dans un texte.
 * 
 * @param text Le texte dans lequel chercher
 * @param searchTerm Le terme à compter
 * @returns Le nombre d'occurrences
 */
export function countSearchTermOccurrences(text: string, searchTerm: string): number {
  if (!text || !searchTerm || searchTerm.trim() === '') {
    return 0;
  }
  
  const normalizedText = normalizeArabicText(text);
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  
  let count = 0;
  let position = 0;
  
  while (true) {
    position = normalizedText.indexOf(normalizedSearchTerm, position);
    if (position === -1) break;
    count++;
    position += normalizedSearchTerm.length;
  }
  
  return count;
}

/**
 * Recherche avancée avec scoring pour classer les résultats
 * 
 * @param quotes Liste des citations à rechercher
 * @param searchTerm Terme de recherche
 * @returns Tableau de citations avec score de pertinence
 */
export function searchQuotesWithScoring(
  quotes: any[], 
  searchTerm: string
): Array<{ quote: any, score: number }> {
  if (!searchTerm || searchTerm.trim() === '') {
    return quotes.map(quote => ({ quote, score: 0 }));
  }
  
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  const searchWords = normalizedSearchTerm.split(/\s+/).filter(word => word.length > 1);
  
  return quotes
    .map(quote => {
      const normalizedText = normalizeArabicText(quote.text || '');
      let score = 0;
      
      // Score pour correspondance exacte du terme complet
      if (normalizedText.includes(normalizedSearchTerm)) {
        score += 100;
        
        // Bonus si c'est au début du texte
        if (normalizedText.startsWith(normalizedSearchTerm)) {
          score += 50;
        }
      }
      
      // Score pour correspondances de mots individuels
      searchWords.forEach(word => {
        if (normalizedText.includes(word)) {
          score += 10;
          
          // Bonus pour correspondance de mot complet
          const wordBoundaryRegex = new RegExp(`\\b${word}\\b`);
          if (wordBoundaryRegex.test(normalizedText)) {
            score += 20;
          }
        }
      });
      
      // Score pour correspondances partielles
      if (score === 0 && searchWords.length === 1) {
        const word = searchWords[0];
        if (word.length >= 3) {
          const textWords = normalizedText.split(/\s+/);
          textWords.forEach(textWord => {
            if (textWord.startsWith(word)) {
              score += 5;
            }
          });
        }
      }
      
      return { quote, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score);
}
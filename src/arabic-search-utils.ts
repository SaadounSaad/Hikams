/**
 * Utilitaires pour la recherche en arabe
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
 * 
 * @param text Le texte à normaliser
 * @returns Le texte normalisé
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  return text
    // Convertir en minuscules (pour les caractères non-arabes)
    .toLowerCase()
    
    // Supprimer les diacritiques (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    
    // Normaliser alif avec hamza (أ إ آ) vers alif simple (ا)
    .replace(/[أإآ]/g, 'ا')
    
    // Normaliser yaa final (ى) vers yaa standard (ي)
    .replace(/ى/g, 'ي')
    
    // Normaliser taa marbouta (ة) vers haa (ه)
    .replace(/ة/g, 'ه')
    
    // Normaliser waw avec hamza (ؤ) vers waw (و)
    .replace(/ؤ/g, 'و')
    
    // Normaliser yaa avec hamza (ئ) vers yaa (ي)
    .replace(/ئ/g, 'ي');
}

/**
 * Vérifie si un texte contient un terme de recherche, en tenant compte
 * de la normalisation arabe.
 * 
 * @param text Le texte dans lequel chercher
 * @param searchTerm Le terme à rechercher
 * @returns true si le terme est trouvé, false sinon
 */
export function arabicTextContains(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;
  
  const normalizedText = normalizeArabicText(text);
  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  
  return normalizedText.includes(normalizedSearchTerm);
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
export function highlightSearchTerm(text: string, searchTerm: string): { text: string, isHighlighted: boolean }[] {
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
    
    // Ajouter le texte correspondant (en utilisant le texte original, pas normalisé)
    result.push({
      text: text.substring(searchIndex, searchIndex + searchTerm.length),
      isHighlighted: true
    });
    
    lastIndex = searchIndex + normalizedSearchTerm.length;
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

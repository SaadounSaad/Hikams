// components/SearchResultsHighlighter.tsx
import React from 'react';

/**
 * Normalise le texte arabe pour la comparaison
 */
function normalizeArabic(text: string): string {
  return text
    // Supprimer les diacritiques
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    // Normaliser les variantes de alef
    .replace(/[آأإ]/g, 'ا')
    // Normaliser les variantes de ya
    .replace(/[ئى]/g, 'ي')
    // Normaliser les variantes de ta marbouta
    .replace(/ة/g, 'ه')
    .toLowerCase();
}

/**
 * Extrait les mots arabes d'une requête
 */
function extractSearchTerms(query: string): string[] {
  const normalized = normalizeArabic(query);
  const arabicWordRegex = /[\u0600-\u06FF]{2,}/g;
  return normalized.match(arabicWordRegex) || [];
}

/**
 * Interface pour les props du composant
 */
interface SearchHighlighterProps {
  text: string;
  searchQuery: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Composant pour mettre en évidence les termes de recherche dans le texte
 */
export function SearchHighlighter({ 
  text, 
  searchQuery, 
  className = "",
  highlightClassName = "bg-yellow-200 text-yellow-900 px-1 rounded"
}: SearchHighlighterProps) {
  if (!searchQuery.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const searchTerms = extractSearchTerms(searchQuery);
  if (searchTerms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Créer une regex pour trouver tous les termes de recherche
  const normalizedText = normalizeArabic(text);
  const matches: Array<{ start: number; end: number; term: string }> = [];

  // Trouver toutes les correspondances
  searchTerms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    let match;
    
    while ((match = regex.exec(normalizedText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        term: match[0]
      });
    }
  });

  // Trier les correspondances par position
  matches.sort((a, b) => a.start - b.start);

  // Fusionner les correspondances qui se chevauchent
  const mergedMatches: Array<{ start: number; end: number }> = [];
  matches.forEach(match => {
    const lastMatch = mergedMatches[mergedMatches.length - 1];
    if (lastMatch && match.start <= lastMatch.end) {
      // Fusionner avec la correspondance précédente
      lastMatch.end = Math.max(lastMatch.end, match.end);
    } else {
      mergedMatches.push({ start: match.start, end: match.end });
    }
  });

  if (mergedMatches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Construire le JSX avec les parties mises en évidence
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  mergedMatches.forEach((match, index) => {
    // Ajouter le texte avant la correspondance
    if (match.start > lastIndex) {
      parts.push(
        <span key={`text-${index}`}>
          {text.substring(lastIndex, match.start)}
        </span>
      );
    }

    // Ajouter le texte mis en évidence
    parts.push(
      <mark 
        key={`highlight-${index}`} 
        className={highlightClassName}
      >
        {text.substring(match.start, match.end)}
      </mark>
    );

    lastIndex = match.end;
  });

  // Ajouter le texte restant
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end">
        {text.substring(lastIndex)}
      </span>
    );
  }

  return (
    <span className={className}>
      {parts}
    </span>
  );
}

/**
 * Composant pour afficher un résultat de recherche avec métadonnées
 */
interface SearchResultItemProps {
  quote: {
    id: string;
    text: string;
    author?: string;
    category: string;
    isFavorite?: boolean;
  };
  searchQuery: string;
  onClick?: () => void;
  className?: string;
}

export function SearchResultItem({ 
  quote, 
  searchQuery, 
  onClick,
  className = ""
}: SearchResultItemProps) {
  return (
    <div 
      className={`
        p-4 border border-gray-200 rounded-xl hover:border-sky-300 
        hover:shadow-md transition-all cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      {/* Texte principal avec mise en évidence */}
      <div className="text-lg font-arabic text-gray-800 leading-relaxed mb-3 text-right">
        <SearchHighlighter 
          text={quote.text} 
          searchQuery={searchQuery}
          highlightClassName="bg-sky-100 text-sky-800 px-1 rounded font-medium"
        />
      </div>

      {/* Métadonnées */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          {/* Catégorie */}
          <span className="px-2 py-1 bg-gray-100 rounded-md font-arabic">
            {quote.category}
          </span>
          
          {/* Indicateur favori */}
          {quote.isFavorite && (
            <span className="text-red-500" title="مفضلة">
              ♥
            </span>
          )}
        </div>

        {/* Auteur si disponible */}
        {quote.author && (
          <span className="font-arabic italic">
            — {quote.author}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Composant pour afficher les stats de recherche
 */
interface SearchStatsProps {
  totalResults: number;
  searchQuery: string;
  searchTime?: number;
  className?: string;
}

export function SearchStats({ 
  totalResults, 
  searchQuery, 
  searchTime,
  className = ""
}: SearchStatsProps) {
  return (
    <div className={`text-sm text-gray-600 font-arabic ${className}`}>
      <span>
        {totalResults === 0 
          ? 'لم توجد نتائج' 
          : `${totalResults} نتيجة`
        }
        {searchQuery && (
          <>
            {' '}لـ "<span className="font-medium">{searchQuery}</span>"
          </>
        )}
        {searchTime && (
          <span className="text-gray-500">
            {' '}({searchTime.toFixed(0)} مللي ثانية)
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Hook pour calculer les statistiques de recherche
 */
export function useSearchStats() {
  const [searchTime, setSearchTime] = React.useState<number>(0);
  const [isSearching, setIsSearching] = React.useState(false);

  const startTiming = React.useCallback(() => {
    setIsSearching(true);
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      setSearchTime(endTime - startTime);
      setIsSearching(false);
    };
  }, []);

  return {
    searchTime,
    isSearching,
    startTiming
  };
}
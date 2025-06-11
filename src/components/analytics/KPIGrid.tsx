// /home/ubuntu/src/components/analytics/KPIGrid.tsx - Compatible avec vos types
import React from "react";
import { KPICard } from "./KPICard";
import { UserKPIs } from "./hooks/useAnalyticsData"; // Import du type générique

interface KPIGridProps {
  kpis: UserKPIs | null;
  isLoading: boolean;
}

// Helper function pour formater les durées
const formatDuration = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return "-";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
};

// Helper function pour formater les nombres
const formatNumber = (value: any): string | number => {
  if (value === null || value === undefined) return "-";
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);
  return value;
};

// Helper function pour détecter si une valeur est une durée en secondes
const isDurationField = (key: string): boolean => {
  return key.toLowerCase().includes('duration') && key.toLowerCase().includes('sec');
};

// Helper function pour détecter si une valeur est un temps total en secondes
const isTimeField = (key: string): boolean => {
  return key.toLowerCase().includes('time') && key.toLowerCase().includes('sec');
};

// Helper function pour formater les noms de champs
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Last 30d/i, '(30j)')
    .replace(/Secs/i, '')
    .trim();
};

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, isLoading }) => {
  if (!kpis && !isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4">
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Aucune donnée KPI disponible
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Commencez à utiliser l'application pour voir vos statistiques
          </p>
        </div>
      </div>
    );
  }

  // Si on a des KPIs, créons les cartes dynamiquement
  const kpiEntries = kpis ? Object.entries(kpis) : [];
  
  // Filtrer et organiser les KPIs par importance
  const importantKpis = kpiEntries.filter(([key, value]) => {
    // Exclure les champs système
    if (key === 'user_id' || key === 'id' || key === 'created_at' || key === 'updated_at') {
      return false;
    }
    // Inclure seulement les valeurs non nulles ou les loading
    return value !== null || isLoading;
  });

  // Trier par ordre de priorité (les plus importants en premier)
  const sortedKpis = importantKpis.sort(([keyA], [keyB]) => {
    const priorityOrder = [
      'sessions',
      'reads', 
      'duration',
      'favorites',
      'category',
      'time'
    ];
    
    const getPriority = (key: string) => {
      for (let i = 0; i < priorityOrder.length; i++) {
        if (key.toLowerCase().includes(priorityOrder[i])) {
          return i;
        }
      }
      return priorityOrder.length;
    };
    
    return getPriority(keyA) - getPriority(keyB);
  });

  // Si on n'a pas de KPIs à afficher
  if (sortedKpis.length === 0 && !isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4">
        <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">
            Structure KPI non reconnue
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Vérifiez la fonction get_my_kpis dans Supabase
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm">Debug Info</summary>
              <pre className="mt-2 text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded overflow-auto">
                {JSON.stringify(kpis, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
      {sortedKpis.map(([key, value]) => {
        let displayValue: string | number;
        let unit: string | undefined;

        // Formater selon le type de donnée
        if (isDurationField(key) || isTimeField(key)) {
          displayValue = formatDuration(value);
          unit = undefined; // Déjà inclus dans formatDuration
        } else {
          displayValue = formatNumber(value);
          unit = undefined;
        }

        return (
          <KPICard
            key={key}
            title={formatFieldName(key)}
            value={displayValue}
            unit={unit}
            isLoading={isLoading}
          />
        );
      })}

      {/* Ajouter des cartes de placeholder si on a moins de 6 KPIs */}
      {!isLoading && sortedKpis.length < 6 && (
        Array.from({ length: Math.min(6 - sortedKpis.length, 3) }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[100px]"
          >
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
              Plus de données<br />bientôt disponibles
            </p>
          </div>
        ))
      )}

      {/* Loading placeholders */}
      {isLoading && sortedKpis.length === 0 && (
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`loading-${index}`}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md animate-pulse min-h-[100px]"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))
      )}
    </div>
  );
};
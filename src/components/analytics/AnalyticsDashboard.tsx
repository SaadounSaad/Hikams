// /home/ubuntu/src/components/analytics/AnalyticsDashboard.tsx - Version améliorée
import React from "react";
import { useTimeFilter } from "./hooks/useTimeFilter";
import { useAnalyticsData } from "./hooks/useAnalyticsData";
import { TimeFilter } from "./TimeFilter";
import { KPIGrid } from "./KPIGrid";

// Composant pour afficher le statut de mise à jour
const UpdateStatus: React.FC<{ 
  lastUpdated: string | undefined, 
  isStale: boolean, 
  isLoading: boolean,
  onRefresh: () => void 
}> = ({ lastUpdated, isStale, isLoading, onRefresh }) => {
  if (!lastUpdated) return null;

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg text-sm">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isStale ? 'bg-orange-500' : 'bg-green-500'}`}></div>
        <span className="text-gray-600 dark:text-gray-400">
          Dernière mise à jour: {formatTime(lastUpdated)}
          {isStale && " (mise à jour en cours...)"}
        </span>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "🔄" : "Actualiser"}
      </button>
    </div>
  );
};

// Composant pour afficher les graphiques en placeholder avec plus de détails
const ChartPlaceholder: React.FC<{ 
  title: string, 
  description: string,
  dataCount?: number 
}> = ({ title, description, dataCount }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-h-[300px] flex flex-col">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
        {dataCount !== undefined && (
          <p className="text-sm text-gray-400">
            {dataCount} point{dataCount !== 1 ? 's' : ''} de données disponible{dataCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  </div>
);

export const AnalyticsDashboard: React.FC = () => {
  const timeFilter = useTimeFilter("30d");
  const { data, isLoading, error, refetch, isStale } = useAnalyticsData(timeFilter);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header avec titre et indicateur de statut */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Tableau de Bord Analytique
        </h1>
        
        {data?.lastUpdated && (
          <UpdateStatus 
            lastUpdated={data.lastUpdated}
            isStale={isStale}
            isLoading={isLoading}
            onRefresh={refetch}
          />
        )}
      </div>

      {/* Time Filter */}
      <TimeFilter timeFilter={timeFilter} />

      {/* Loading State */}
      {isLoading && !data && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400">Chargement des données analytiques...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg" role="alert">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <strong className="font-bold">Erreur de chargement!</strong>
              <span className="block sm:inline sm:ml-2">
                Impossible de charger les données: {error.message}
              </span>
            </div>
          </div>
          <button 
            onClick={refetch} 
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && !error && data && (
        <>
          {/* KPI Grid avec indicateur de chargement */}
          <div className="relative">
            {isStale && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  Mise à jour...
                </div>
              </div>
            )}
            <KPIGrid kpis={data.kpis} isLoading={isLoading} />
          </div>

          {/* Charts Section améliorée */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Tendance des Sessions"
              description="Évolution du nombre de sessions au fil du temps"
              dataCount={data.sessionStats.length}
            />

            <ChartPlaceholder
              title="Lectures par Catégorie"
              description="Répartition des lectures selon les catégories"
              dataCount={data.categoryReads.length}
            />

            <ChartPlaceholder
              title="Top Citations Favorites"
              description="Citations les plus ajoutées aux favoris"
              dataCount={data.topFavorites.length}
            />

            <ChartPlaceholder
              title="Activité des Interactions"
              description="Analyse des interactions utilisateur par jour"
            />
          </div>

          {/* Insights Section améliorée */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Insights Personnalisés
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Insight basé sur les KPIs actuels */}
              {data.kpis && (
                <>
                  {data.kpis.sessions_last_30d && data.kpis.sessions_last_30d > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Activité Régulière</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vous avez eu {data.kpis.sessions_last_30d} session{data.kpis.sessions_last_30d > 1 ? 's' : ''} ces 30 derniers jours.
                        {data.kpis.avg_session_duration_last_30d_secs && 
                          ` Durée moyenne: ${Math.round(data.kpis.avg_session_duration_last_30d_secs / 60)} min.`
                        }
                      </p>
                    </div>
                  )}

                  {data.kpis.most_read_category_last_30d && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 1a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Catégorie Préférée</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Votre catégorie la plus consultée: <span className="font-medium">{data.kpis.most_read_category_last_30d}</span>
                      </p>
                    </div>
                  )}

                  {data.kpis.favorites_added_last_30d && data.kpis.favorites_added_last_30d > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Citations Favorites</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {data.kpis.favorites_added_last_30d} citation{data.kpis.favorites_added_last_30d > 1 ? 's' : ''} ajoutée{data.kpis.favorites_added_last_30d > 1 ? 's' : ''} aux favoris ce mois.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Insight par défaut si pas de données */}
              {!data.kpis && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Commencez à utiliser l'application pour voir vos insights personnalisés apparaître ici.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Données mises à jour automatiquement toutes les 30 secondes
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={refetch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {isLoading ? "Actualisation..." : "🔄 Actualiser"}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium">
                📊 Exporter CSV
              </button>
            </div>
          </div>

          {/* Debug Info (en développement seulement) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Debug Info (Dev seulement)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify({
                  timeFilter: {
                    preset: timeFilter.preset,
                    startDate: timeFilter.startDate?.toISOString(),
                    endDate: timeFilter.endDate?.toISOString()
                  },
                  dataStatus: {
                    hasKpis: !!data.kpis,
                    sessionStatsCount: data.sessionStats.length,
                    categoryReadsCount: data.categoryReads.length,
                    topFavoritesCount: data.topFavorites.length,
                    lastUpdated: data.lastUpdated
                  }
                }, null, 2)}
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  );
};
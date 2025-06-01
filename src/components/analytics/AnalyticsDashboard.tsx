// /home/ubuntu/src/components/analytics/AnalyticsDashboard.tsx
import React from "react";
import { useTimeFilter } from "./hooks/useTimeFilter";
import { useAnalyticsData } from "./hooks/useAnalyticsData";
import { TimeFilter } from "./TimeFilter";
import { KPIGrid } from "./KPIGrid";
// Import chart components once they are created
// import { SessionsTrendChart } from "./SessionsTrendChart";
// import { CategoryReadsChart } from "./CategoryReadsChart";
// import { ChartContainer } from "./ChartContainer";

export const AnalyticsDashboard: React.FC = () => {
  const timeFilter = useTimeFilter("30d"); // Default to last 30 days
  const { data, isLoading, error, refetch } = useAnalyticsData(timeFilter);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tableau de Bord Analytique</h1>

      {/* Time Filter */}
      <TimeFilter timeFilter={timeFilter} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 dark:text-gray-400">Chargement des données...</p>
          {/* Add a spinner component here if available */}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> Impossible de charger les données analytiques: {error.message}</span>
          <button onClick={refetch} className="ml-4 px-2 py-1 bg-red-600 text-white rounded text-sm">Réessayer</button>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && !error && data && (
        <>
          {/* KPI Grid */}
          <KPIGrid kpis={data.kpis} isLoading={isLoading} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Placeholder for Sessions Trend Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[300px]">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tendance des Sessions</h3>
              <p className="text-gray-500 dark:text-gray-400">Graphique des sessions à venir...</p>
              {/* <ChartContainer title="Tendance des Sessions">
                <SessionsTrendChart data={data.sessionStats} isLoading={isLoading} />
              </ChartContainer> */}              
            </div>

            {/* Placeholder for Category Reads Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[300px]">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lectures par Catégorie</h3>
              <p className="text-gray-500 dark:text-gray-400">Graphique des catégories à venir...</p>
              {/* <ChartContainer title="Lectures par Catégorie">
                <CategoryReadsChart data={data.categoryReads} isLoading={isLoading} />
              </ChartContainer> */}              
            </div>

            {/* Add placeholders for other charts (Top Quotes, Interactions, Auto Read) */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[300px]">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Citations (Favoris)</h3>
              <p className="text-gray-500 dark:text-gray-400">Graphique des favoris à venir...</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md min-h-[300px]">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Activité des Interactions</h3>
              <p className="text-gray-500 dark:text-gray-400">Graphique des interactions à venir...</p>
            </div>
          </div>

          {/* Placeholder for Personalized Insights */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Insights</h3>
             <p className="text-gray-500 dark:text-gray-400">Insights personnalisés à venir...</p>
          </div>

          {/* Placeholder for Export Button */}
           <div className="flex justify-end pt-4">
             <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
               Exporter les Données (CSV)
             </button>
           </div>
        </>
      )}
    </div>
  );
};


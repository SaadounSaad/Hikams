// /home/ubuntu/src/components/analytics/KPIGrid.tsx
import React from "react";
import { KPICard } from "./KPICard";
import { UserKPIs } from "./hooks/useAnalyticsData"; // Import the KPI data structure

interface KPIGridProps {
  kpis: UserKPIs | null;
  isLoading: boolean;
}

// Helper function to format duration from seconds
const formatDuration = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return "-";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
};

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, isLoading }) => {
  // Define the KPIs to display based on the UserKPIs structure
  // This mapping makes it easy to add/remove/reorder KPIs
  const kpiDefinitions = [
    {
      title: "Sessions (30j)",
      value: kpis?.sessions_last_30d,
    },
    {
      title: "Durée moy. session (30j)",
      value: formatDuration(kpis?.avg_session_duration_last_30d_secs),
    },
    {
      title: "Citations lues (30j)",
      value: kpis?.reads_last_30d,
    },
    {
      title: "Temps lecture total (30j)",
      value: formatDuration(kpis?.total_read_time_last_30d_secs),
    },
    {
      title: "Favoris ajoutés (30j)",
      value: kpis?.favorites_added_last_30d,
    },
    {
      title: "Catégorie préférée (30j)",
      value: kpis?.most_read_category_last_30d || "-", // Handle null category
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-4">
      {kpiDefinitions.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};


// /home/ubuntu/src/components/analytics/KPICard.tsx
import React from "react";

interface KPICardProps {
  title: string;
  value: string | number | null | undefined;
  unit?: string; // Optional unit (e.g., "s" for seconds)
  isLoading?: boolean;
  // Add optional props for trend/icon later if needed
  // trend?: number; // e.g., percentage change
  // icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, unit, isLoading }) => {
  const displayValue = isLoading
    ? "..." // Simple loading indicator
    : value === null || value === undefined
    ? "-" // Display dash for null/undefined values
    : typeof value === "number"
    ? value.toLocaleString() // Format numbers with locale separators
    : value;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between min-h-[100px]">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 truncate" title={title}>
        {title}
      </h3>
      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
        {displayValue}
        {unit && value !== null && value !== undefined && !isLoading && <span className="text-lg ml-1">{unit}</span>}
      </div>
      {/* Placeholder for trend/icon 
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {trend !== undefined && (
          <span className={trend >= 0 ? "text-green-600" : "text-red-600"}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      */}
    </div>
  );
};


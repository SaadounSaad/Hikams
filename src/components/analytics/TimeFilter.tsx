// /home/ubuntu/src/components/analytics/TimeFilter.tsx
import React from "react";
import { useTimeFilter, TimePreset } from "./hooks/useTimeFilter";

// Define the available presets for the UI
const presets: { label: string; value: TimePreset }[] = [
  { label: "Aujourd'hui", value: "today" },
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "Cette année", value: "year" },
  { label: "Tout", value: "all" },
  // Add custom range picker integration later if needed
];

interface TimeFilterProps {
  timeFilter: ReturnType<typeof useTimeFilter>;
}

export const TimeFilter: React.FC<TimeFilterProps> = ({ timeFilter }) => {
  const { preset, setPreset } = timeFilter;

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg justify-center">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => setPreset(p.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
            ${preset === p.value
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
        >
          {p.label}
        </button>
      ))}
      {/* Placeholder for custom date range picker 
      {preset === 'custom' && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
              Plage personnalisée active
          </div>
      )}
      */}
    </div>
  );
};

